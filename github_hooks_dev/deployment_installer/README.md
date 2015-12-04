This application allows users to install Elixys without requiring the flash drive with the latest version.
It can also be used to indicate weather or not elixys is up and running.

To execute this program, you must have QT installed on your system.  Our target OS is Windows, specifically the Microsoft Surface (Windows 10.0 64-bit OS).

## Windows Installation
1. Install Visual Studio 2013, not 2015.  Make sure to include C++.  
2. Install Python 2.7 (https://www.python.org/downloads/release/python-279/)
3. Install QT at C:\Qt.  Include the visual studio build; MinGW is the default build
4. Add the visual studio build C:\Qt\5.5\msvc2013\bin to System Path
5. Download Sip 4.7 (http://sourceforge.net/projects/pyqt/files/sip/sip-4.17/sip-4.17.zip)

From "Developer Command Prompt VS2013" execute the commands
```
python configure.py
nmake
nmake install
```
6. Download PyQt 5.5 (http://sourceforge.net/projects/pyqt/files/PyQt5/PyQt-5.5.1/PyQt-gpl-5.5.1.zip)
```
python configure.py --disable=QtPositioning --disable=QtNfc
nmake
nmake install
```

Then,
```
pip install -r requirements.txt
```

You are now ready to execute the program
`python installer.py`

If the application opens the UI, you have installed everything correct.

To make this application executable for other PC's; execute
`windows_exe_builder.bat`


## Ubuntu
```
sudo apt-get install libqt4-dev
./setup.sh
```

## OSX
```
brew install pyqt
./setup.sh
```
