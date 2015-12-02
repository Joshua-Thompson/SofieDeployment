from PyQt5.QtCore import QThread
import updater
from logger import logger

class RunnerThread(QThread):
    def __init__(self, updater):
        QThread.__init__(self)
        self.updater = updater

    def run(self):
        try:
            updater.restart_processes(self.updater)
        except Exception as e:
            logger.error(str(e))
