import sys
from PyQt5.QtWidgets import QApplication
from PyQt5 import QtCore, uic
from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEngineProfile, QWebEnginePage

class NetworkApp(QWebEngineView):
    def __init__(self):
        super(NetworkApp, self).__init__()
        self.profile = QWebEngineProfile("network_history")
        self.download = None
        self.profile.setPersistentCookiesPolicy(QWebEngineProfile.ForcePersistentCookies)
        self.profile.downloadRequested.connect(self.downloading)
        self._page = QWebEnginePage(self.profile, self)
        self._page.loadStarted.connect(self.load_started)
        self._page.loadProgress.connect(self.load_progress)
        self.setPage(self._page)

    def load_home_page(self):
        self._page.load(QtCore.QUrl("http://sofiebio.herokuapp.com/"))

    def load_started(self):
        print "Loading..."

    def load_progress(self,val):
        print "Progress %i" % val

    def download_complete(self):
        print 'Download Complete'

    def download_in_progress(self, bytesReceived, bytesTotal):
        print "Downloading ... %d/%d" % (bytesReceived,bytesTotal)

    def downloading(self, down):
        self.download = down
        self.download.finished.connect(self.download_complete)
        self.download.downloadProgress.connect(self.download_in_progress)
        self.download.accept()

    def closeEvent(self, evt):
        self.deleteLater()
        self._page.deleteLater()
        self.profile.deleteLater()
        evt.accept()

def main():
    app = QApplication(sys.argv)
    view = NetworkApp()
    view.show()
    exec_status = app.exec_()
    sys.exit(exec_status)


if __name__ == '__main__':
    main()
