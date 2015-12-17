#!/bin/bash
sudo dpkg -i dependencies/libv4l-0_1.2.1-2build1_amd64.deb
sudo dpkg -i  dependencies/libv4l2rds0_1.2.1-2build1_amd64.deb
sudo dpkg -i  dependencies/v4l-utils_1.2.1-2build1_amd64.deb
#sudo rm -r dependencies/v4l-utils_1.2.1-2build1_amd64.deb
#sudo rm -r dependencies/libv4l2rds0_1.0.1-1_amd64.deb


source ../../bin/activate
pip install dependencies/webassets-0.11.1.tar.gz
pip install dependencies/Flask-Asset-0.11.tar.gz


