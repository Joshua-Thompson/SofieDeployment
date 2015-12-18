#!/usr/bin/python
import sys
import logging
import threading
import time
import os
from PyQt4 import QtGui, QtCore,uic
import updater
from logger import logger, hdlr
from qt_threads.authenticator import Authenticator
from qt_threads.copierthread import CopierThread
from qt_threads.monitorappisup import MonitorAppIsUp
from qt_threads.monitorinstall import MonitorInstall
from qt_threads.runnerthread import RunnerThread
from ui_controllers.elixyssettings import ElixysSettings

class ElixysInstaller(QtGui.QMainWindow):
    
    def __init__(self):
        super(ElixysInstaller, self).__init__()
        self.copier_thread = None
        self.runner_thread = None
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
        self.backup_btn = self.findChild(QtGui.QPushButton, "backup_btn")
        self.backup_btn.hide()
        self.backup_btn.clicked.connect(self.make_backup)
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

        if self.runner_thread:
            self.runner_thread.terminate()
            self.runner_thread.wait()

        self.runner_thread = RunnerThread(self.updater)
        self.runner_thread.start()
        return 0

    def reconnect(self, pos):
        if self.box_is_up.isChecked():
            self.updater.close_connections()
            self.elixys_box_is_up(False)
        elif self.authenticator.isFinished():
            self.box_is_up.hide()
            self.authenticate()
        return 0

    def make_backup(self):
        logger.info("Backing up")
        self.backup_btn.setDisabled(True)
        def unblock_btn():
            self.backup_btn.setDisabled(False)
        self.copier_thread = CopierThread(self.updater)
        self.connect(self.copier_thread, QtCore.SIGNAL("backup_complete()"), unblock_btn)
        self.copier_thread.start()

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
        self.backup_btn.setVisible(is_up)
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

def main():
    app = QtGui.QApplication(sys.argv)
    ex = ElixysInstaller()
    app.exec_()
    sys.exit(0)


if __name__ == '__main__':
    main()
