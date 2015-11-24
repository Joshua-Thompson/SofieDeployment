import httplib
import socket
import sys
import logging
import copy
import paramiko
import time
import os
import json
from configobj import ConfigObj
from threading import Event
from paramiko.py3compat import input
from decrypt import decrypt_zip,encrypt_passcodes,decrypt_passcodes
import version

ELIXYS_HOST_IP = None
DECRYPTION_KEY = None
ELIXYS_INSTALL_DIR = None

PASSCODES = None
Port = None
settings = None

def load_config():
    global ELIXYS_HOST_IP, DECRYPTION_KEY,ELIXYS_INSTALL_DIR,PASSCODES,Port,settings
    settings = ConfigObj(os.path.join("dependencies","settings.ini"))

    ELIXYS_HOST_IP = settings['ip']
    DECRYPTION_KEY = settings['decryption_key']
    ELIXYS_INSTALL_DIR = settings['install_dir']

    PASSCODES = json.loads(settings['passcodes'])
    Port = int(settings['port'])

load_config()

logger = logging.getLogger("installer")
logger.setLevel(logging.DEBUG)
std_out = logging.StreamHandler(sys.stdout)
logger.addHandler(std_out)

abort = Event()
overwrite_prompt = Event()

class Updater(object):
    def __init__(self, hostname, port):
        self.hostname = hostname
        self.port = port
        self.connection = None
        self.ssh_client = None
        self.sftp = None
        self.updating_to_version = None
        self.updating_from_version = None
        self.home_dir = None

    def authenticate(self, username, password):
        self.connection = paramiko.Transport((self.hostname, self.port))
        self.ssh_client = paramiko.SSHClient()
        self.ssh_client.load_system_host_keys()
        self.ssh_client.set_missing_host_key_policy(paramiko.WarningPolicy())
        self.connection.connect(None, username, password, gss_host=socket.getfqdn(self.hostname),
                  gss_auth=False, gss_kex=False)
        self.sftp = paramiko.SFTPClient.from_transport(self.connection)
        logger.info("Authenticated SFTP")
        self.ssh_client.connect(self.hostname, self.port, username, password,gss_auth=False,gss_kex=False)
        logger.info("Authenticated SSH")

    def close_connections(self):
        self.connection.close()
        self.ssh_client.close()
        logger.info("Disconnected")

    def get_elixys_connection(self, possible_connections):
        try:
            if len(possible_connections) > 0:
                username, password = possible_connections.pop()
                self.authenticate(username, password)
            else:
                raise Exception("Failed to authenticate")
        except paramiko.ssh_exception.AuthenticationException:
            return self.get_elixys_connection(possible_connections)

    def make_backup(self):
        ver = self.get_latest()
        hw_path = ver.get_hardware_config_path()
        logger.info("Backing up: %s" % hw_path)
        db_path = ver.get_db_path()
        logger.info("Backing up: %s" % db_path)
        try:
            os.mkdir("backups")
        except OSError:
            pass
        local_hw_conf = open(os.path.join("backups", str(time.time()) + "hwconf.ini"), 'w')
        local_db = open(os.path.join("backups", str(time.time()) + "elixys.db"), 'w')
        self.sftp.getfo(hw_path, local_hw_conf)
        self.sftp.getfo(db_path, local_db)

    def prompt_reinstall(self):
        logger.warn("This version already exists.  Would you like to reinstall it?")
        overwrite_prompt.set()
        while overwrite_prompt.isSet() and not abort.isSet():
            time.sleep(.5)

        if abort.isSet():
            logger.info("Cancelling the install.")
            abort.clear()
            overwrite_prompt.clear()
            raise Exception("Cancelling install")
        abort.clear()
        logger.info("Over-writing version %s." % str(self.updating_from_version))
        old_version_new_name = self.home_dir + str(time.time()) + str(self.updating_to_version)
        self.sftp.rename(self.updating_from_version.path, old_version_new_name)
        self.updating_from_version.path = old_version_new_name

    def go_app_home_dir(self):
        if self.home_dir:
            self.sftp.chdir(self.home_dir)
        self.sftp.chdir(ELIXYS_INSTALL_DIR)
        dirs = self.sftp.getcwd().split('/')
        home_dir_len = len(dirs) - 2
        self.home_dir = '/'.join(dirs[:home_dir_len]) + '/'

    def get_latest(self):
        self.go_app_home_dir()
        elixys_dir = self.sftp.listdir()
        latest = version.find_latest(elixys_dir)
        if latest:
            latest.path = "%s/%s" % (self.sftp.getcwd(),str(latest))
        return latest

    def copy_elixys_to_machine(self, version_to_copy_path):
        self.go_app_home_dir()

        self.updating_from_version = self.get_latest()

        zip,zip_io = decrypt_zip(DECRYPTION_KEY, version_to_copy_path)
        self.updating_to_version = version.determine_elixys_version(zip)
        if self.updating_to_version == self.updating_from_version:
            try:
                self.prompt_reinstall()
            except:
                return False

        zip_io.seek(0,os.SEEK_END)
        file_size = zip_io.tell()
        zip_io.seek(0)
        path = self.sftp.getcwd()

        zip_root_dir = zip.namelist()[0]
        zip_name = path + "/" + zip_root_dir[:len(zip_root_dir)-1] + ".zip"

        ### If a file already exists with this name that is not a zip we will get an issue
        try:
            self.sftp.putfo(zip_io,zip_name,file_size=file_size,callback=self.monitor_status,confirm=True)
        except:
            logger.error("A bad file exists where the zip file was to be uploaded(%s).  Please remove it first" % zip_name)
            return False

        logger.debug("Unzipping %s to %s" % (zip_name,path))
        input,output,errs = self.ssh_client.exec_command("unzip %s -d %s" % (zip_name,path),timeout=60)

        try:
            logger.info(output.read())
            logger.error(errs.read())
        except Exception as e:
            ###The only unhandled case
            logger.error(str(e))
            logger.error("This version was already unzipped, but was never moved to the version name.")
            return False

        new_version_name = str(self.updating_to_version)
        self.updating_to_version.path = "%s/%s" % (self.sftp.getcwd(), new_version_name)
        try:
            self.sftp.rename(zip_root_dir,new_version_name)
        except:
            logger.error("This version of Elixys already exists.  If you would like to re-install this version; please remove it and try again")

        if self.updating_from_version:
            logger.info("Copying the inherited files from previous version")
            self.copy_important_legacy_data_to_new_version()
        return True

    def monitor_status(self,bits_sent,total_bits):
        logger.info("Uploaded %d/%d" % (bits_sent,total_bits))

    def do_install(self,file_path):
        try:
            updated = self.copy_elixys_to_machine(file_path)
            if updated:
                logger.info("You may restart your Elixys machine now")
            else:
                logger.info("Install has been cancelled")
        except Exception as e:
            logger.error("Error: " + str(e))
            logger.error("Failed to update Elixys.\nPlease contact SofieBio Sciences to resolve the problem.")

    def copy_important_legacy_data_to_new_version(self):
        hwconf_old_path = self.updating_from_version.get_hardware_config_path()
        hwconf_new_path = self.updating_to_version.get_hardware_config_path()

        logger.info("Copying %s to %s" % (hwconf_old_path,hwconf_new_path))
        input,output,errs = self.ssh_client.exec_command("cp %s %s" % (hwconf_old_path, hwconf_new_path),timeout=20)
        logger.info(output.read())
        logger.info(errs.read())

        db_old_path = self.updating_from_version.get_db_path()
        db_new_path = self.updating_to_version.get_db_path()
        logger.info("Copying %s to %s" % (db_old_path, db_new_path))
        input,output,errs = self.ssh_client.exec_command("cp %s %s" % (db_old_path, db_new_path),timeout=20)
        logger.info(output.read())
        logger.info(errs.read())

def validate_elixys_is_up():
    elixys_connection = httplib.HTTPConnection(ELIXYS_HOST_IP, 5000, timeout=30)
    elixys_connection.connect()
    elixys_connection.close()

def do_authentication(updater):
    possible_username_passwords = copy.deepcopy(PASSCODES)
    possible_username_passwords = decrypt_passcodes(possible_username_passwords)
    updater.get_elixys_connection(possible_username_passwords)

def get_updater():
    return Updater(ELIXYS_HOST_IP, Port)

def do_install(file_path):
    try:
        logger.info("Installing from %s" % file_path)
        validate_elixys_is_up()
        possible_username_passwords = copy.deepcopy(PASSCODES)
        possible_username_passwords = decrypt_passcodes(possible_username_passwords)
        updater = Updater(ELIXYS_HOST_IP, Port)
        logger.info("Authenticating into the CBOX")
        updater.get_elixys_connection(possible_username_passwords)
        logger.info("Successfully authenticated")
        try:
            updated = updater.copy_elixys_to_machine(file_path)
            if updated:
                logger.info("You may restart your Elixys machine now")
            else:
                logger.info("Install has been cancelled")
        except Exception as e:
            logger.error("Error: " + str(e))
            logger.error("Failed to update Elixys.\nPlease contact SofieBio Sciences to resolve the problem.")
        finally:
            updater.connection.close()
            updater.ssh_client.close()
    except socket.timeout:
        msg = "Could not validate Elixys connection.\n" + \
              "You are most likely not on the same network.\n" + \
              "Ensure you are connected to the Elixys router.\n" + \
              "If you are connected via WIFI, it might be worth connecting to it via Ethernet.\n" + \
              "If problems continue to persist please contact SofieBio Sciences."
        logger.error(msg)
    except socket.error:
        msg = "Could not validate Elixys connection.\n" + \
              "Is Elixys up and running?\n" + \
              "If you just turned Elixys on please give it time(2 minutes) to boot up before trying this again.\n" + \
              "You can validate the Elixys is up by opening the Elixys app and viewing the login screen.  Please try again once you can see the Elixys app.\n\n" + \
              "If problems continue to persist please contact SofieBio Sciences."
        logger.error(msg)
    except Exception as e:
        logger.error("Error: " + str(e))
        logger.error("Failed to authenticate Elixys.\nPlease contact SofieBio Sciences to resolve the problem")

def set_passcodes(ip, port, passcodes):
    codes = encrypt_passcodes(passcodes)
    settings['ip'] = ip
    settings['port'] = port
    settings["passcodes"] = json.dumps(codes)
    settings.write()

if __name__ == "__main__":
    downloaded_link_url = 'C:\\Users\\Justin\\Downloads\\download'
    usr_zip_path = input("Type the path the Elixys zip file")
    downloaded_link_url = usr_zip_path if usr_zip_path != "" else downloaded_link_url
    do_install(downloaded_link_url)
    time.sleep(30)
