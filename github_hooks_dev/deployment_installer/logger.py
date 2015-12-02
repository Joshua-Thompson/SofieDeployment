import os
import sys
import logging
from PyQt5.QtCore import pyqtSignal,QObject

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

class InstallHandler(QObject,logging.Handler):
    log_message = pyqtSignal('QString','QString')

    def __init__(self,level=logging.NOTSET):
        QObject.__init__(self)
        logging.Handler.__init__(self,level)
        self.qtText = None

    def handle(self, record):
        self.log_message.emit(record.levelname, record.msg)

hdlr = InstallHandler()
logger.addHandler(hdlr)
