from PyQt5.QtCore import pyqtSignal,QThread
from logger import logger

class CopierThread(QThread):
    backup_complete = pyqtSignal()
    def __init__(self, updater):
        QThread.__init__(self)
        self.updater = updater

    def run(self):
        try:
            self.updater.make_backup()
        except Exception as e:
            logger.error(str(e))
        self.backup_complete.emit()
