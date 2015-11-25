from PyQt4 import QtCore

class CopierThread(QtCore.QThread):
    def __init__(self, updater):
        QtCore.QThread.__init__(self)
        self.updater = updater

    def run(self):
        try:
            self.updater.make_backup()
        except Exception as e:
            logger.error(str(e))
        self.emit(QtCore.SIGNAL('backup_complete()'))
