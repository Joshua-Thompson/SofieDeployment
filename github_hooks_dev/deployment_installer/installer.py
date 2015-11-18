#!/usr/bin/python

import sys
from PyQt4 import QtGui, QtCore
import updater

class ElixysInstaller(QtGui.QMainWindow):
    
    def __init__(self):
        super(ElixysInstaller, self).__init__()
        self.initUI()
        
    def initUI(self):
        self.setWindowTitle('Elixys Installer')
        self.mainWidget=QtGui.QWidget(self)
        self.setCentralWidget(self.mainWidget)
        self.button = QtGui.QPushButton('Select Elixys Install',self.mainWidget)
        self.button.clicked.connect(self.install_elixys_version)
        self.show()
        
    def install_elixys_version(self):
        fname = QtGui.QFileDialog.getOpenFileName(self, 'Install',
                '.')
        if fname:
            updater.do_install(fname)

def main():
    app = QtGui.QApplication(sys.argv)
    ex = ElixysInstaller()
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
