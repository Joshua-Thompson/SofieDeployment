from PyQt4 import QtCore
import updater
import time

class MonitorInstall(QtCore.QThread):
    def __init__(self,update_thread):
        QtCore.QThread.__init__(self)
        self.update_thread = update_thread

    def run(self):
        while self.update_thread.isAlive():
            self.emit( QtCore.SIGNAL('show_buttons(bool)'), updater.overwrite_prompt.isSet() )
            time.sleep(.4)
        self.emit( QtCore.SIGNAL('finished_updating()') )
