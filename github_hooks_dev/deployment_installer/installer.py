#!/usr/bin/python
import sys
import logging
import threading

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
        self.button = QtGui.QPushButton('Select Elixys Install',self)
        self.status_label = QtGui.QLabel("", self)

        layout.addWidget(self.button)
        layout.addWidget(self.status_label)
        self.button.clicked.connect(self.install_elixys_version)
        widget = QtGui.QWidget()
        widget.setLayout(layout)
        self.setCentralWidget(widget)

        
    def install_elixys_version(self):
        fname = QtGui.QFileDialog.getOpenFileName(self, 'Install',
                '.')

        if fname:
            t = threading.Thread(target=updater.do_install, args=(fname,))
            t.start()

def main():
    app = QtGui.QApplication(sys.argv)
    ex = ElixysInstaller()
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
