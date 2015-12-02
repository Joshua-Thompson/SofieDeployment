from PyQt5.QtCore import pyqtSignal,QThread
import updater
from logger import logger

class Authenticator(QThread):
    box_is_up = pyqtSignal(bool)

    def __init__(self, updater):
        QThread.__init__(self)
        self.updater = updater


    def run(self):
        logger.info("Authenticating...")
        updater.load_config()
        try:
            updater.do_authentication(self.updater)
            self.box_is_up.emit(True)
        except:
            logger.error("Failed to Authenticate")
            self.box_is_up.emit(False)
