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
from configobj import ConfigObj
class ElixysSettings(QtGui.QDialog):
    def __init__(self,parent=None):
        super(ElixysSettings,self).__init__(parent)
        self.ui = self.initUI()
        self.settings = ConfigObj(os.path.join("dependencies","settings.ini"))
        self.load_settings()
        
    def initUI(self):
        ui_path = os.path.join('dependencies','ui', 'elixys_settings.ui')
        self.ui = uic.loadUi(ui_path,self)
        self.save_btn = self.findChild(QtGui.QPushButton, 'save_btn')
        self.cancel_btn = self.findChild(QtGui.QPushButton, 'cancel_btn')
        self.username = self.findChild(QtGui.QLineEdit,'username_txt')
        self.password = self.findChild(QtGui.QLineEdit,'password_txt')
        self.ip = self.findChild(QtGui.QLineEdit,'ip_txt')
        self.port = self.findChild(QtGui.QLineEdit,'port_txt')
        self.save_btn.clicked.connect(self.save)
        self.cancel_btn.clicked.connect(self.close)

    def close(self):
        self.load_settings()
        super(ElixysSettings,self).close()

    def load_settings(self):
        ip = self.settings['ip']
        port = self.settings['port']
        self.ip.setText(ip)
        self.port.setText(port)

    def save(self):
        ip = self.ip.text()
        port = self.port.text()
        username = str(self.username.text())
        password = str(self.password.text())
        updater.set_passcodes(ip, port,[(username,password)])
        logger.info("Settings Saved")
        updater.load_config()
        QtGui.QDialog.close(self)

class ElixysInstaller(QtGui.QMainWindow):
    
    def __init__(self):
        super(ElixysInstaller, self).__init__()
        self.initUI()
        self.move(400,100)
        self.show()

    def initUI(self):
        ui_path = os.path.join('dependencies','ui', 'elixys_uploader.ui')
        uic.loadUi(ui_path, self)
        self.connect(hdlr, QtCore.SIGNAL("log_message(QString, QString)"), self.log_message)
        self.dialog_btn = self.findChild(QtGui.QPushButton,"upload_btn")
        self.dialog_btn.hide()
        self.dialog_btn.clicked.connect(self.install_elixys_version)
        self.cancel_install = self.findChild(QtGui.QPushButton,"no_btn")
        self.cancel_install.clicked.connect(self.abort_update)
        self.overwrite_copy = self.findChild(QtGui.QPushButton,"yes_btn")
        self.overwrite_copy.clicked.connect(self.overwrite_install)
        self.status_label = self.findChild(QtGui.QTextEdit, "status_txt")
        self.app_is_up = self.findChild(QtGui.QToolButton, "app_is_up")
        self.box_is_up = self.findChild(QtGui.QToolButton, "box_is_up")
        self.app_is_up.hitButton = self.restart_server
        self.box_is_up.hitButton = self.reconnect
        self.show_buttons(False)
        self.monitor_is_up = MonitorAppIsUp()
        self.monitor_is_up.start()
        self.updater = updater.get_updater()
        self.connect(self.monitor_is_up, QtCore.SIGNAL("pyelixys_is_up(bool)"), self.pyelixys_is_up)
        self.settings = ElixysSettings()
        self.settings.setModal(True)
        self.authenticate()
        self.action_connection = self.findChild(QtGui.QAction, "actionConnections")
        self.action_connection.triggered.connect(self.open_settings)
        
    def open_settings(self):
        self.settings.show()

    def restart_server(self, pos):
        self.app_is_up.hide()
        logger.info("Restarting")
        if self.app_is_up.isChecked():
            logger.info("Restarting need to write")

    def reconnect(self, pos):
        if self.box_is_up.isChecked():
            self.updater.close_connections()
            self.box_is_up.setChecked(False)
        elif self.authenticator.isFinished():
            self.box_is_up.hide()
            self.authenticate()
        return 0

    def authenticate(self):
        self.authenticator = Authenticator(self.updater)
        self.connect(self.authenticator, QtCore.SIGNAL("box_is_up(bool)"), self.elixys_box_is_up)
        self.authenticator.start()

    def show_buttons(self, do_show):
        self.overwrite_copy.setVisible(do_show)
        self.cancel_install.setVisible(do_show)

    def pyelixys_is_up(self, is_up):
        self.app_is_up.setChecked(is_up)
        self.app_is_up.show()

    def elixys_box_is_up(self, is_up):
        self.box_is_up.setChecked(is_up)
        self.dialog_btn.setVisible(is_up)
        self.box_is_up.show()

    def finished_updating(self):
        self.dialog_btn.show()
        self.show_buttons(False)
        
    def install_elixys_version(self):
        file_name = QtGui.QFileDialog.getOpenFileName(self, 'Install',
                '.')

        if file_name:
            t_update = threading.Thread(target=self.updater.do_install, args=(file_name,))
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

class Authenticator(QtCore.QThread):
    def __init__(self, updater):
        QtCore.QThread.__init__(self)
        self.updater = updater

    def run(self):
        logger.info("Authenticating...")
        updater.load_config()
        try:
            updater.do_authentication(self.updater)
            self.emit(QtCore.SIGNAL('box_is_up(bool)'), True)
        except:
            logger.error("Failed to Authenticate")
            self.emit(QtCore.SIGNAL('box_is_up(bool)'), False)

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
