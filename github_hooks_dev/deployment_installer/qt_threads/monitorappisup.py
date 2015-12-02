from PyQt5.QtCore import pyqtSignal,QThread
import updater
import time

class MonitorAppIsUp(QThread):
    pyelixys_is_up = pyqtSignal(bool)
    def __init__(self):
        QThread.__init__(self)


    def run(self):
        while True:
            try:
                updater.validate_elixys_is_up()
                self.pyelixys_is_up.emit(True)
            except:
                self.pyelixys_is_up.emit(False)
            time.sleep(3)
