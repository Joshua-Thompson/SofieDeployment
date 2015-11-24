This application allows users to install Elixys without requiring the flash drive with the latest version.
It can also be used to indicate weather or not elixys is up and running.

To execute this program, you must have QT installed on your system.  Our target OS is Windows, specifically the Microsoft Surface (Windows 10.0 64-bit OS).

## Windows Installation
To install on Windows, download [Python](https://www.python.org/downloads/release/python-279/).  Keep track of what processor you choose 32-bit works on a 64-bit OS, but you will need to install the same processor bit size for your QT install.
Append to your environment path the directory to the python exe.  It should also contain pip.

You will also need [Microsoft Visual C++ Compiler for Python](https://www.microsoft.com/en-us/download/details.aspx?id=44266)

[PyQt 4](https://www.riverbankcomputing.com/software/pyqt/download) will also need to be installed.  Add the path of QT designer and other exe's to your systems path.

Then,
`pip install -r requirements.txt`

You are now ready to execute the program
`python installer.py`

If the application opens the UI, you have installed everything correct.

To make this application executable for other PC's; execute
`windows_exe_builder.bat`


## Ubuntu 
```
virtualenv .
sudo apt-get install libqt4-dev
wget http://sourceforge.net/projects/pyqt/files/PyQt4/PyQt-4.11.4/PyQt-x11-gpl-4.11.4.tar.gz
wget http://sourceforge.net/projects/pyqt/files/sip/sip-4.17/sip-4.17.tar.gz
tar -xvf sip-4.17.tar.gz
cd sip-4.17/
python configure.py -e ../include/python2.7/
sudo make install
cd ../
tar -xvf PyQt-x11-gpl-4.11.4.tar.gz
cd PyQt-x11-gpl-4.11.4
python configure.py
make
make install
pip install -r requirements.txt
```
