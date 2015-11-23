#!/usr/bin/python
import sys
import logging
import threading
import time
import os
from PyQt4 import QtGui, QtCore,uic
import updater

logger = logging.getLogger("installer")
logger.setLevel(logging.DEBUG)

class InstallHandler(QtCore.QObject,logging.Handler):
    def __init__(self,level=logging.NOTSET):
        QtCore.QObject.__init__(self)
        logging.Handler.__init__(self,level)
        self.qtText = None

    def handle(self, record):
        self.emit( QtCore.SIGNAL('log_message(QString, QString)'), record.levelname, record.msg)

hdlr = InstallHandler()
logger.addHandler(hdlr)

class ElixysInstaller(QtGui.QMainWindow):
    
    def __init__(self):
        super(ElixysInstaller, self).__init__()
        self.initUI()
        self.show()

    def initUI(self):
        ui_path = os.path.join('ui', 'elixys_uploader.ui')
        uic.loadUi(ui_path, self)
        self.connect(hdlr, QtCore.SIGNAL("log_message(QString, QString)"), self.log_message)
        self.dialog_btn = self.findChild(QtGui.QPushButton,"upload_btn")
        self.dialog_btn.clicked.connect(self.install_elixys_version)
        self.cancel_install = self.findChild(QtGui.QPushButton,"no_btn")
        self.cancel_install.clicked.connect(self.abort_update)
        self.overwrite_copy = self.findChild(QtGui.QPushButton,"yes_btn")
        self.overwrite_copy.clicked.connect(self.overwrite_install)
        self.status_label = self.findChild(QtGui.QTextEdit, "status_txt")
        self.app_is_up = self.findChild(QtGui.QToolButton, "app_is_up")
        self.app_is_up.hide()
        self.box_is_up = self.findChild(QtGui.QToolButton, "box_is_up")
        #self.box_is_up.hide()
        self.show_buttons(False)
        self.monitor_is_up = MonitorAppIsUp()
        self.monitor_is_up.start()
        self.connect(self.monitor_is_up, QtCore.SIGNAL("elixys_is_up(bool)"), self.elixys_is_up)

    def show_buttons(self, do_show):
        self.overwrite_copy.setVisible(do_show)
        self.cancel_install.setVisible(do_show)

    def elixys_is_up(self, is_up):
        self.app_is_up.setVisible(is_up)

    def finished_updating(self):
        self.dialog_btn.show()
        self.show_buttons(False)
        
    def install_elixys_version(self):
        file_name = QtGui.QFileDialog.getOpenFileName(self, 'Install',
                '.')

        if file_name:
            t_update = threading.Thread(target=updater.do_install, args=(file_name,))
            t_update.start()
            self.dialog_btn.hide()

            self.monitor_thread = MonitorInstall(t_update)
            self.connect( self.monitor_thread, QtCore.SIGNAL("show_buttons(bool)"), self.show_buttons )
            self.connect( self.monitor_thread, QtCore.SIGNAL("finished_updating()"), self.finished_updating )
            self.monitor_thread.start()

    def log_message(self, log_level, message):
        self.status_label.append(message)
        self.status_label.moveCursor(QtGui.QTextCursor.End)

    def overwrite_install(self):
        updater.overwrite_prompt.clear()

    def abort_update(self):
        updater.abort.set()
        
class MonitorAppIsUp(QtCore.QThread):
    def __init__(self):
        QtCore.QThread.__init__(self)

    def run(self):
        while True:
            try:
                updater.validate_elixys_is_up()
                self.emit(QtCore.SIGNAL('elixys_is_up(bool)'), True)
            except:
                self.emit(QtCore.SIGNAL('elixys_is_up(bool)'), False)
            time.sleep(3)

class MonitorInstall(QtCore.QThread):
    def __init__(self,update_thread):
        QtCore.QThread.__init__(self)
        self.update_thread = update_thread

    def run(self):
        while self.update_thread.isAlive():
            self.emit( QtCore.SIGNAL('show_buttons(bool)'), updater.overwrite_prompt.isSet() )
            time.sleep(.4)
        self.emit( QtCore.SIGNAL('finished_updating()') )


def main():
    app = QtGui.QApplication(sys.argv)
    ex = ElixysInstaller()
    app.exec_()
    sys.exit(0)


if __name__ == '__main__':
    main()
