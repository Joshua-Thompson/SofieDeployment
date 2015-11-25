from PyQt4 import QtCore
import updater
import time

class MonitorAppIsUp(QtCore.QThread):
    def __init__(self):
        QtCore.QThread.__init__(self)

    def run(self):
        while True:
            try:
                updater.validate_elixys_is_up()
                self.emit(QtCore.SIGNAL('pyelixys_is_up(bool)'), True)
            except:
                self.emit(QtCore.SIGNAL('pyelixys_is_up(bool)'), False)
            time.sleep(3)
