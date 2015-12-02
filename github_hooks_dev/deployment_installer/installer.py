#!/usr/bin/python
import sys
import threading
import os
from PyQt5 import QtWidgets, uic,QtGui
import PyQt5.QtCore as QtCore
import updater
from logger import logger, hdlr
from qt_threads.authenticator import Authenticator
from qt_threads.copierthread import CopierThread
from qt_threads.monitorappisup import MonitorAppIsUp
from qt_threads.monitorinstall import MonitorInstall
from qt_threads.runnerthread import RunnerThread
from ui_controllers.elixyssettings import ElixysSettings
from ui_controllers.webview import NetworkApp

class ElixysInstaller(QtWidgets.QMainWindow):

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
        hdlr.log_message.connect(self.log_message)

        self.dialog_btn = self.findChild(QtWidgets.QPushButton,"upload_btn")
        self.dialog_btn.hide()
        self.dialog_btn.clicked.connect(self.install_elixys_version)
        self.cancel_install = self.findChild(QtWidgets.QPushButton,"no_btn")
        self.cancel_install.clicked.connect(self.abort_update)
        self.overwrite_copy = self.findChild(QtWidgets.QPushButton,"yes_btn")
        self.overwrite_copy.clicked.connect(self.overwrite_install)
        self.status_label = self.findChild(QtWidgets.QTextEdit, "status_txt")
        self.app_is_up = self.findChild(QtWidgets.QToolButton, "app_is_up")
        self.box_is_up = self.findChild(QtWidgets.QToolButton, "box_is_up")
        self.backup_btn = self.findChild(QtWidgets.QPushButton, "backup_btn")
        self.backup_btn.hide()
        self.backup_btn.clicked.connect(self.make_backup)
        self.app_is_up.hitButton = self.restart_server
        self.box_is_up.hitButton = self.reconnect
        self.show_buttons(False)
        self.monitor_is_up = MonitorAppIsUp()
        self.monitor_is_up.start()
        self.updater = updater.get_updater()
        self.monitor_is_up.pyelixys_is_up.connect(self.pyelixys_is_up)
        self.settings = ElixysSettings()
        self.settings.setModal(True)
        self.network = NetworkApp()
        self.authenticate()
        self.action_connection = self.findChild(QtWidgets.QAction, "actionConnections")
        self.action_show_network = self.findChild(QtWidgets.QAction, "actionOpen_Network")
        self.action_connection.triggered.connect(self.open_settings)
        self.action_show_network.triggered.connect(self.open_network)

    def open_settings(self):
        self.settings.show()

    def open_network(self):
        self.network.load_home_page()
        self.network.show()

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
        self.copier_thread.backup_complete.connect(unblock_btn)
        self.copier_thread.start()

    def authenticate(self):
        self.authenticator = Authenticator(self.updater)
        self.authenticator.box_is_up.connect(self.elixys_box_is_up)
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
        file_name = QtWidgets.QFileDialog.getOpenFileName(self, 'Install',
                '.')

        if type(file_name) == str:
            t_update = threading.Thread(target=self.updater.do_install, args=(file_name,))
            t_update.start()
            self.dialog_btn.hide()

            self.monitor_thread = MonitorInstall(t_update)
            self.monitor_thread.show_buttons.connect(self.show_buttons)
            self.monitor_thread.finished_updating.connect(self.finished_updating())
            self.monitor_thread.start()
        else:
            logger.info("Cancelling Upload")

    def log_message(self, log_level, message):
        self.status_label.append(message)
        self.status_label.moveCursor(QtGui.QTextCursor.End)

    def overwrite_install(self):
        updater.overwrite_prompt.clear()

    def abort_update(self):
        updater.abort.set()

def main():
    app = QtWidgets.QApplication(sys.argv)
    ex = ElixysInstaller()
    app.exec_()
    sys.exit(0)


if __name__ == '__main__':
    main()
