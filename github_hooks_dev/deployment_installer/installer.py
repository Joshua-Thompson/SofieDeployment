#!/usr/bin/python
import sys
import logging
import threading
import time
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
        uic.loadUi('elixys_uploader.ui', self)
        self.connect(hdlr, QtCore.SIGNAL("log_message(QString, QString)"), self.log_message)
        self.dialog_btn = self.findChild(QtGui.QPushButton,"upload_btn")
        self.dialog_btn.clicked.connect(self.install_elixys_version)
        self.cancel_install = self.findChild(QtGui.QPushButton,"no_btn")
        self.cancel_install.clicked.connect(self.abort_update)
        self.overwrite_copy = self.findChild(QtGui.QPushButton,"yes_btn")
        self.overwrite_copy.clicked.connect(self.overwrite_install)
        self.status_label = self.findChild(QtGui.QTextEdit, "status_txt")
        self.show_buttons(False)

    def show_buttons(self, do_show):
        self.overwrite_copy.setVisible(do_show)
        self.cancel_install.setVisible(do_show)

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
