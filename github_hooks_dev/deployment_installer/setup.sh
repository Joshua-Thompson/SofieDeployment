#!/bin/bash

installSip(){
    wget http://sourceforge.net/projects/pyqt/files/sip/sip-4.17/sip-4.17.tar.gz
    tar -xvf sip-4.17.tar.gz
    cd sip-4.17/
    python configure.py -e ../include/
    sudo make install
    cd ../
}

installPyQt(){
    wget http://sourceforge.net/projects/pyqt/files/PyQt5/PyQt-5.5.1/PyQt-gpl-5.5.1.tar.gz
    tar -xvf PyQt-gpl-5.5.1.tar.gz
    cd PyQt-gpl-5.5.1
    python configure.py
    make
    make install
    cd ../
}

virtualenv .
source bin/activate
installSip
installPyQt
pip install -r requirements.txt
