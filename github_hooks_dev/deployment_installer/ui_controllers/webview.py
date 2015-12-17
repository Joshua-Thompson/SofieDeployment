import sys
from PyQt5.QtWidgets import QApplication,QStatusBar,QMainWindow
from PyQt5 import QtCore, uic
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

    def load(self, url):
        self._page.load(QtCore.QUrl(url))

    def deleteLater(self):
        super(NetworkApp, self).deleteLater()
        self._page.deleteLater()
        self.profile.deleteLater()

class ElixysBrowser(QMainWindow):
    def __init__(self):
        super(ElixysBrowser, self).__init__()
        self.view = NetworkApp()
        self.download = None
        self.view.page().loadProgress.connect(self.load_progress)
        self.view.page().loadFinished.connect(self.load_finished)
        self.view.profile.downloadRequested.connect(self.download_requested)
        self.view.load_home_page()
        self.setCentralWidget(self.view)

    def load_progress(self,progress):
        self.statusBar().showMessage("Loading... %i" % progress)

    def load_finished(self,ok):
        self.statusBar().clearMessage()

    def download_in_progress(self,bytesReceived, bytesTotal):
        self.statusBar().showMessage( "Downloaded ... %d" % bytesReceived )

    def download_complete(self):
        self.statusBar().clearMessage()

    def download_requested(self,down):
        self.download = down
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
