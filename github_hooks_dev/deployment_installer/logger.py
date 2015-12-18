import os
import sys
import logging
from PyQt4 import QtCore

try:
    os.mkdir('logs')
except OSError:
    pass

std_out = logging.StreamHandler(sys.stdout)
logger = logging.getLogger("installer")
logger.setLevel(logging.DEBUG)
logger.addHandler(std_out)

pyelixys_log = logging.getLogger("pyelixys_log")
pyelixys_log.setLevel(logging.DEBUG)
pyelixys_log_file = logging.FileHandler(os.path.join('logs', 'pyelixys.log'))
pyelixys_log.addHandler(pyelixys_log_file)

class InstallHandler(QtCore.QObject,logging.Handler):
    def __init__(self,level=logging.NOTSET):
        QtCore.QObject.__init__(self)
        logging.Handler.__init__(self,level)
        self.qtText = None

    def handle(self, record):
        self.emit( QtCore.SIGNAL('log_message(QString, QString)'), record.levelname, record.msg)

hdlr = InstallHandler()
logger.addHandler(hdlr)
