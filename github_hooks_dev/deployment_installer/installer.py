#!/usr/bin/python
import sys
import threading
import os
from PyQt5 import QtWidgets, uic,QtGui
import PyQt5.QtCore as QtCore
import updater
import version
from logger import logger, hdlr
import threading
from qt_threads.authenticator import Authenticator
from qt_threads.copierthread import CopierThread
from qt_threads.monitorappisup import MonitorAppIsUp
from qt_threads.monitorinstall import MonitorInstall
from qt_threads.runnerthread import RunnerThread
from ui_controllers.elixyssettings import ElixysSettings
from ui_controllers.webview import ElixysBrowser

class ElixysInstaller(QtWidgets.QMainWindow):

    def __init__(self):
        super(ElixysInstaller, self).__init__()
        self.copier_thread = None
        self.runner_thread = None
        self.monitor_thread = None
        self.selected_upload_version = None
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
        self.no_btn = self.findChild(QtWidgets.QPushButton,"no_btn")
        self.no_btn.clicked.connect(self.no_response)
        self.yes_btn = self.findChild(QtWidgets.QPushButton,"yes_btn")
        self.yes_btn.clicked.connect(self.yes_response)
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
        self.authenticate()
        self.action_connection = self.findChild(QtWidgets.QAction, "actionConnections")
        self.action_show_network = self.findChild(QtWidgets.QAction, "actionOpen_Network")
        self.action_calibration_mgr = self.findChild(QtWidgets.QAction, "actionCalibration_Manager")
        self.action_state_monitor = self.findChild(QtWidgets.QAction, "actionState_Monitor")
        self.action_elixys_app = self.findChild(QtWidgets.QAction, "actionPyelixys_App")
        self.action_elixys_app.triggered.connect(self.open_elixys_app)
        self.action_state_monitor.triggered.connect(self.open_state_monitor)
        self.action_calibration_mgr.triggered.connect(self.open_calibration_mgr)
        self.action_start_simulator = self.findChild(QtWidgets.QAction, "actionStart_Simulator")
        self.action_start_simulator.triggered.connect(self.run_sim)
        self.action_connection.triggered.connect(self.open_settings)
        self.action_show_network.triggered.connect(self.open_network)

    def open_settings(self):
        self.settings.show()

    def run_sim(self):
        t = threading.Thread(target=os.system, args=("run_pyelixys_server\\run_pyelixys_server.exe sim",))
        t.start()

    def open_network(self):
        self.network_browser = ElixysBrowser()
        self.network_browser.show()

    def open_calibration_mgr(self):
        self.network_browser = ElixysBrowser()
        self.network_browser.show()
        self.network_browser.view.load("http://%s:5000/calibration_manager" % self.updater.hostname)

    def open_elixys_app(self):
        self.network_browser = ElixysBrowser()
        self.network_browser.show()
        self.network_browser.view.load("http://%s:5000/static/index.html" % self.updater.hostname)

    def open_state_monitor(self):
        self.network_browser = ElixysBrowser()
        self.network_browser.show()
        self.network_browser.view.load("http://%s:5000/state_monitor.html" % self.updater.hostname)

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
        self.yes_btn.setVisible(do_show)
        self.no_btn.setVisible(do_show)

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

        if file_name and file_name[0] != "":
            file_version = file_name[0]
            try:
                zip, zip_io = self.updater.decrypt_zip(file_version)
                ver = version.determine_elixys_version(zip)
                self.selected_upload_version = file_version
                logger.info("Are you sure you would like to upload %s" % ver)
                self.show_buttons(True)
            except Exception as e:
                logger.error("Failed to recognize this zip as a Pyelixys version")
        else:
            logger.info("Cancelling Upload")

    def upload_elixys_version(self):
        file_name = self.selected_upload_version
        t_update = threading.Thread(target=self.updater.do_install, args=(file_name,))
        t_update.start()
        self.dialog_btn.hide()

        self.monitor_thread = MonitorInstall(t_update)
        self.monitor_thread.show_buttons.connect(self.show_buttons)
        self.monitor_thread.finished_updating.connect(self.finished_updating)
        self.monitor_thread.start()

    def log_message(self, log_level, message):
        self.status_label.append(message)
        self.status_label.moveCursor(QtGui.QTextCursor.End)

    def yes_response(self):
        if self.monitor_thread and self.monitor_thread.isRunning():
            updater.overwrite_prompt.clear()
        elif self.selected_upload_version:
            self.show_buttons(False)
            self.upload_elixys_version()

    def no_response(self):
        if self.monitor_thread and self.monitor_thread.isRunning():
            updater.abort.set()
        elif self.selected_upload_version:
            logger.info("Cancelling install")
            self.selected_upload_version = None
            self.show_buttons(False)

def main():
    app = QtWidgets.QApplication(sys.argv)
    ex = ElixysInstaller()
    app.exec_()
    sys.exit(0)


if __name__ == '__main__':
    main()
