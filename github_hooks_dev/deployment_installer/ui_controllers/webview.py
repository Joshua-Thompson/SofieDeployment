import sys
import os
from PyQt5.QtWidgets import QApplication,QStatusBar,QMainWindow
from PyQt5 import QtCore, uic
from PyQt5.QtCore import pyqtSignal
from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEngineProfile, QWebEnginePage

class NetworkApp(QWebEngineView):
    def __init__(self):
        super(NetworkApp, self).__init__()
        self.profile = QWebEngineProfile("network_history")
        self.download = None
        self.profile.setPersistentCookiesPolicy(QWebEngineProfile.ForcePersistentCookies)
        self._page = QWebEnginePage(self.profile, self)
        self.setPage(self._page)

    def load_home_page(self):
        self.load("http://sofiebio.herokuapp.com/")

    def download_simulator(self, os):
        self.load("http://sofiebio.herokuapp.com/github/latests_exe?os=%s" % os)

    def load(self, url):
        self._page.load(QtCore.QUrl(url))

    def deleteLater(self):
        super(NetworkApp, self).deleteLater()
        self._page.deleteLater()
        self.profile.deleteLater()

class ElixysBrowser(QMainWindow):
    download_completed = pyqtSignal()

    def __init__(self):
        super(ElixysBrowser, self).__init__()
        self.view = NetworkApp()
        self.setWindowTitle("Sofie Browser")
        self.download = None
        self.downloading_simulator = False
        self.view.page().loadProgress.connect(self.load_progress)
        self.view.page().loadFinished.connect(self.load_finished)
        self.view.profile.downloadRequested.connect(self.download_requested)
        self.view.load_home_page()
        self.setCentralWidget(self.view)

    def load_progress(self,progress):
        if progress < 100:
            self.statusBar().showMessage("Loading... %i" % progress)
        else:
            self.load_finished(True)

    def load_finished(self,ok):
        self.statusBar().clearMessage()

    def download_simulator(self, os):
        self.downloading_simulator = True
        self.view.download_simulator(os)

    def download_in_progress(self,bytesReceived, bytesTotal):
        out_of = "/%i" % bytesTotal if bytesTotal > 0 else ""
        self.statusBar().showMessage( "Downloaded ... %d%s" % (bytesReceived,out_of) )

    def download_complete(self):
        self.statusBar().clearMessage()
        self.downloading_simulator = False
        self.download_completed.emit()

    def download_requested(self,down):
        self.download = down
        if self.downloading_simulator:
            path = os.path.join(os.getcwd(), "simulator.zip")
            self.download.setPath(path)
        self.statusBar().showMessage("Downloading...")
        self.download.finished.connect(self.download_complete)
        self.download.downloadProgress.connect(self.download_in_progress)
        self.download.accept()

    def closeEvent(self, evt):
        self.view.deleteLater()
        self.deleteLater()
        evt.accept()

def main():
    app = QApplication(sys.argv)
    window = ElixysBrowser()
    window.show()
    exec_status = app.exec_()
    sys.exit(exec_status)


if __name__ == '__main__':
    main()
