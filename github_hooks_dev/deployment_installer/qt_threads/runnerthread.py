from PyQt4 import QtCore
import updater
from logger import logger

class RunnerThread(QtCore.QThread):
    def __init__(self, updater):
        QtCore.QThread.__init__(self)
        self.updater = updater

    def run(self):
        try:
            updater.restart_processes(self.updater)
        except Exception as e:
            logger.error(str(e))
