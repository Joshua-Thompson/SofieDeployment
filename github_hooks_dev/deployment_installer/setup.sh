#!/bin/bash

virtualenv .
source bin/activate
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
cd ../
pip install -r requirements.txt
