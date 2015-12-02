from PyQt5.QtCore import pyqtSignal,QThread
import updater
import time

class MonitorInstall(QThread):
    show_buttons = pyqtSignal(bool)
    finished_updating = pyqtSignal()

    def __init__(self,update_thread):
        QThread.__init__(self)
        self.update_thread = update_thread

    def run(self):
        while self.update_thread.isAlive():
            self.show_buttons.emit(updater.overwrite_prompt.isSet())
            time.sleep(.4)
        self.finished_updating.emit()
