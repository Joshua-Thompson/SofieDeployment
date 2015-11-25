from PyQt4 import QtCore
import updater
from logger import logger

class Authenticator(QtCore.QThread):
    def __init__(self, updater):
        QtCore.QThread.__init__(self)
        self.updater = updater

    def run(self):
        logger.info("Authenticating...")
        updater.load_config()
        try:
            updater.do_authentication(self.updater)
            self.emit(QtCore.SIGNAL('box_is_up(bool)'), True)
        except:
            logger.error("Failed to Authenticate")
            self.emit(QtCore.SIGNAL('box_is_up(bool)'), False)
