pyinstaller -y --windowed installer.spec
xcopy C:\Qt\5.5\msvc2013\bin\QtWebEngineProcess.exe dist\installer
xcopy C:\Qt\5.5\msvc2013\*.* dist\installer
xcopy qt.conf dist\installer