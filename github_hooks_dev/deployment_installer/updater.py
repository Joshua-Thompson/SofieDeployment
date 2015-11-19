import httplib
import socket
import time
import sys
import logging

import paramiko
import time
from threading import Event
from paramiko.py3compat import input
from decrypt import decrypt_zip
import version
from configobj import ConfigObj



ELIXYS_HOST_IP = "192.168.100.101"
DECRYPTION_KEY = '1234567890123456'
Port = 22

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

    def authenticate(self, username, password):
        self.connection = paramiko.Transport((self.hostname, self.port))
        self.ssh_client = paramiko.SSHClient()
        self.ssh_client.load_system_host_keys()
        self.ssh_client.set_missing_host_key_policy(paramiko.WarningPolicy())
        self.connection.connect(None, username, password, gss_host=socket.getfqdn(self.hostname),
                  gss_auth=False, gss_kex=False)
        self.sftp = paramiko.SFTPClient.from_transport(self.connection)
        self.ssh_client.connect(self.hostname, self.port, username, password,gss_auth=False,gss_kex=False)

    def get_elixys_connection(self, possible_connections):
        try:
            if len(possible_connections) > 0:
                username, password = possible_connections.pop()
                self.authenticate(username, password)
            else:
                raise "Failed to authenticate"
        except paramiko.ssh_exception.AuthenticationException:
            return get_elixys_connection(possible_connections)

    def copy_elixys_to_machine(self, version_to_copy_path):
        self.sftp.chdir('./Desktop/elixys')
        dirs = self.sftp.getcwd().split('/')
        home_dir_len = len(dirs) - 2
        home_dir = '/'.join(dirs[:home_dir_len]) + '/'

        elixys_dir = self.sftp.listdir()
        old_latest_version = version.find_latest(elixys_dir)
        old_version_path = "%s/pyelixys_v%s" % (self.sftp.getcwd(),str(old_latest_version))

        zip = decrypt_zip(DECRYPTION_KEY, version_to_copy_path)

        try:
            app_name, newest_elixys_version = self.determine_elixys_version(zip)
            current_directory = self.sftp.getcwd()
            newest_elixys_version_path =  "%s/%s_v%s" % (current_directory, app_name, newest_elixys_version)
            logger.info("Installing Elixys version %s" % newest_elixys_version )
            self.sftp.mkdir(newest_elixys_version)
        except:
            logger.warn("This version already exists.  Would you like to reinstall it?")
            overwrite_prompt.set()
            while overwrite_prompt.isSet() and not abort.isSet():
                time.sleep(.5)

            if abort.isSet():
                logger.info("Cancelling the install.")
                abort.clear()
                overwrite_prompt.clear()
                return False
            else:
                logger.info("Over-writing version %s." % newest_elixys_version)
                old_version_new_name = home_dir + str(time.time()) + newest_elixys_version
                self.sftp.rename(newest_elixys_version, old_version_new_name)
                self.sftp.mkdir(newest_elixys_version)

        self.sftp.chdir(newest_elixys_version)

        for file_name in zip.namelist()[1:]:
            application_name = '/'.join(file_name.split('/')[1:])
            if application_name.endswith("/"):
                logger.info("Creating folder %s" % application_name)
                self.sftp.mkdir(application_name)
            else:
                logger.info("Creating file %s" % application_name)
                zip_file_ext = zip.open(file_name)
                self.sftp.putfo(zip_file_ext, application_name)

        if old_latest_version:
            logger.info("Copying the inherited files from previous version")
            self.copy_important_legacy_data_to_new_version(old_version_path, newest_elixys_version_path)
        return True

    def determine_elixys_version(self, zip):
        root_dir = zip.namelist()[0]
        try:
            file = zip.open("%ssrc/pyelixys/hal/templates/hwconf_hardware.ini" % root_dir)
        except KeyError as e:
            file = zip.open("%spyelixys/hal/templates/hwconf_hardware.ini" % root_dir)

        config = ConfigObj(file)
        app_name = config["Version"]["name"]
        ver = config["Version"]["version"]
        return app_name, ver

    def copy_important_legacy_data_to_new_version(self, old_version_path, new_version_path):
        hwconf_old_path = "%s/%s" % (old_version_path,"pyelixys/hal/hwconf.ini")
        hwconf_new_path = "%s/%s" % (new_version_path,"pyelixys/hal/hwconf.ini")
        self.ssh_client.exec_command("cp %s %s" % (hwconf_old_path, hwconf_new_path))
        
        db_old_path = "%s/%s" % (old_version_path,"elixys.db")
        db_new_path = "%s/%s" % (new_version_path,"elixys.db")
        self.ssh_client.exec_command("cp %s %s" % (db_old_path, db_new_path))

def validate_elixys_is_up():
    elixys_connection = httplib.HTTPConnection(ELIXYS_HOST_IP, 5000, timeout=30)
    elixys_connection.connect()
    elixys_connection.close()

def do_install(file_path):
    try:
        logger.info("Installing from %s" % file_path)
        validate_elixys_is_up()
        possible_username_passwords = [("sofiebio","sofiebio"),
                                       ("sofiebio", "ThorsHammer42!"),
                                       ("sofie", "sofiebio"),
                                       ("sofie", "ThorsHammer42!")]
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
            logger.error("Failed to update Elixys.\nPlease contact SofieBio Sciences to resolve the problem.")
        finally:
            updater.connection.close()
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
        logger.error("Failed to authenticate Elixys.\nPlease contact SofieBio Sciences to resolve the problem")

if __name__ == "__main__":
    downloaded_link_url = "/home/jcatterson/Downloads/download.zip"
    usr_zip_path = input("Type the path the Elixys zip file")
    downloaded_link_url = usr_zip_path if usr_zip_path != "" else downloaded_link_url
    do_install(downloaded_link_url)
