#!/usr/bin/python
import sys
import logging
import threading
import time
from PyQt4 import QtGui, QtCore
import updater

logger = logging.getLogger("installer")
logger.setLevel(logging.DEBUG)

class InstallHandler(logging.Handler):
    def __init__(self,level=logging.NOTSET):
        logging.Handler.__init__(self,level)
        self.qtText = None

    def handle(self, record):
        if self.qtText:
            self.qtText.setText(record.msg)

    def setLoggerText(self, qtText):
        self.qtText = qtText

hdlr = InstallHandler()
logger.addHandler(hdlr)

class ElixysInstaller(QtGui.QMainWindow):
    
    def __init__(self):
        super(ElixysInstaller, self).__init__()
        self.initUI()
        hdlr.setLoggerText(self.status_label)
        self.show()

    def initUI(self):
        self.setWindowTitle('Elixys Installer')
        self.mainWidget=QtGui.QWidget(self)
        layout = QtGui.QVBoxLayout()

        self.dialog_button = QtGui.QPushButton('Select Elixys Install',self)
        self.overwrite_copy = QtGui.QPushButton('Yes',self)
        self.cancel_install = QtGui.QPushButton('No',self)
        self.show_buttons(False)

        self.status_label = QtGui.QLabel("", self)

        layout.addWidget(self.dialog_button)
        layout.addWidget(self.status_label)
        layout.addWidget(self.overwrite_copy)
        layout.addWidget(self.cancel_install)
        self.dialog_button.clicked.connect(self.install_elixys_version)
        self.overwrite_copy.clicked.connect(self.overwrite_install)
        self.cancel_install.clicked.connect(self.abort_update)
        widget = QtGui.QWidget()
        widget.setLayout(layout)
        self.setCentralWidget(widget)

    def show_buttons(self, do_show):
        self.overwrite_copy.setVisible(do_show)
        self.cancel_install.setVisible(do_show)

    def finished_updating(self):
        self.dialog_button.show()
        self.show_buttons(False)
        
    def install_elixys_version(self):
        file_name = QtGui.QFileDialog.getOpenFileName(self, 'Install',
                '.')

        if file_name:
            t_update = threading.Thread(target=updater.do_install, args=(file_name,))
            t_update.start()
            self.dialog_button.hide()

            self.monitor_thread = MonitorInstall(t_update)
            self.connect( self.monitor_thread, QtCore.SIGNAL("show_buttons(bool)"), self.show_buttons )
            self.connect( self.monitor_thread, QtCore.SIGNAL("finished_updating()"), self.finished_updating )
            self.monitor_thread.start()

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
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
