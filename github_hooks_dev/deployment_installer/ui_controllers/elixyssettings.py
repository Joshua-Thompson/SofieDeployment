from PyQt4 import QtGui, QtCore,uic
import updater
from configobj import ConfigObj
import os
from logger import logger

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
