import httplib
import socket
import time
import sys
import logging

import paramiko
import time
import os
import json
from threading import Event
from paramiko.py3compat import input
from decrypt import decrypt_zip
import version

ELIXYS_HOST_IP = "192.168.100.101"
DECRYPTION_KEY = '1234567890123456'
ELIXYS_INSTALL_DIR = './Desktop/elixys'

__passcodes = os.getenv("elixys_passcodes")
PASSCODES = json.loads(__passcodes)
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
        self.updating_to_version = None
        self.updating_from_version = None

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

    def get_elixys_connection(self, possible_connections):
        try:
            if len(possible_connections) > 0:
                username, password = possible_connections.pop()
                self.authenticate(username, password)
            else:
                raise "Failed to authenticate"
        except paramiko.ssh_exception.AuthenticationException:
            return self.get_elixys_connection(possible_connections)

    def copy_elixys_to_machine(self, version_to_copy_path):
        self.sftp.chdir(ELIXYS_INSTALL_DIR)
        dirs = self.sftp.getcwd().split('/')
        home_dir_len = len(dirs) - 2
        home_dir = '/'.join(dirs[:home_dir_len]) + '/'

        elixys_dir = self.sftp.listdir()
        self.updating_from_version = version.find_latest(elixys_dir)
        if self.updating_from_version:
            self.updating_from_version.path = "%s/pyelixys_v%s" % (self.sftp.getcwd(),str(self.updating_from_version))

        zip = decrypt_zip(DECRYPTION_KEY, version_to_copy_path)

        try:
            app_name, self.updating_to_version = version.determine_elixys_version(zip)
            current_directory = self.sftp.getcwd()
            self.updating_to_version.path =  "%s/%s_v%s" % (current_directory, app_name, str(self.updating_to_version))
            logger.info("Installing at %s" % self.updating_to_version.path)
            logger.info("Installing Elixys version %s" % str(self.updating_to_version) )
            self.sftp.mkdir(self.updating_to_version.path)
        except KeyError as e:
            logger.error("Corrupted Copy of Elixys.  Please re-download a copy")
            return False
        except IOError:
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
                logger.info("Over-writing version %s." % str(self.updating_from_version))
                old_version_new_name = home_dir + str(time.time()) + app_name + "_v" + str(self.updating_to_version)
                self.sftp.rename(self.updating_from_version.path, old_version_new_name)
                self.sftp.mkdir(self.updating_to_version.path)

        self.sftp.chdir(self.updating_to_version.path)

        for file_name in zip.namelist()[1:]:
            application_name = '/'.join(file_name.split('/')[1:])
            if application_name.endswith("/"):
                logger.info("Creating folder %s" % application_name)
                self.sftp.mkdir(application_name)
            else:
                logger.info("Creating file %s" % application_name)
                zip_file_ext = zip.open(file_name)
                self.sftp.putfo(zip_file_ext, application_name)

        if self.updating_from_version:
            logger.info("Copying the inherited files from previous version")
            self.copy_important_legacy_data_to_new_version()
        return True

    def copy_important_legacy_data_to_new_version(self):
        hwconf_old_path = self.updating_from_version.get_hardware_config_path()
        hwconf_new_path = self.updating_to_version.get_hardware_config_path()

        logger.info("Copying %s to %s" % (hwconf_old_path,hwconf_new_path))
        self.ssh_client.exec_command("cp %s %s" % (hwconf_old_path, hwconf_new_path))

        db_old_path = self.updating_from_version.get_db_path()
        db_new_path = self.updating_to_version.get_db_path()
        logger.info("Copying %s to %s" % (db_old_path, db_new_path))
        self.ssh_client.exec_command("cp %s %s" % (db_old_path, db_new_path))

def validate_elixys_is_up():
    elixys_connection = httplib.HTTPConnection(ELIXYS_HOST_IP, 5000, timeout=30)
    elixys_connection.connect()
    logger.debug("Elixys is up")
    elixys_connection.close()

def do_install(file_path):
    try:
        logger.info("Installing from %s" % file_path)
        validate_elixys_is_up()
        possible_username_passwords = PASSCODES
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
            logger.error("Error %s" % str(e))
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
        logger.error("Error: %s" % str(e))
        logger.error("Failed to authenticate Elixys.\nPlease contact SofieBio Sciences to resolve the problem")

if __name__ == "__main__":
    downloaded_link_url = 'C:\\Users\\Justin\\Downloads\\download'#"/home/jcatterson/Downloads/download.zip"
    usr_zip_path = input("Type the path the Elixys zip file")
    downloaded_link_url = usr_zip_path if usr_zip_path != "" else downloaded_link_url
    do_install(downloaded_link_url)
    time.sleep(30)
