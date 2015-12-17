#!/bin/bash
current_version="$(pwd)"
cd ..
elixys_home="$(pwd)"

ON_STARTUP_DIRECTORY="$HOME/.config/autostart"
STARTUP_ICON="startup_script.desktop"
STARTUP_APP="$ON_STARTUP_DIRECTORY/$STARTUP_ICON"

source $elixys_home/bin/activate
echo "Deleting old Pillow dependencies"
sudo rm -r $elixys_home/lib/python2.7/site-packages/PIL/
sudo rm -r $elixys_home/lib/python2.7/site-packages/Pillow-2.9.0
sudo rm -r $elixys_home/lib/python2.7/site-packages/Pillow-2.9.0-py2.7.egg-info
sudo rm -r $elixys_home/lib/python2.7/site-packages/reportlab/
sudo rm -r $elixys_home/lib/python2.7/site-packages/reportlab-3.2.0/
sudo rm -r $elixys_home/lib/python2.7/site-packages/reportlab-3.2.0-py2.7.egg-info/
echo "Installing ReportLab"
sudo dpkg -i $current_version/dependencies/sysLibs/zlib1g-dev_ubuntu_amd64.deb
pip install $current_version/dependencies/updateLibs/Pillow-2.9.0/
pip install $current_version/dependencies/updateLibs/reportlab-3.2.0/
rm -r $current_version/dependencies/updateLibs
rm -r $current_version/dependencies/sysLibs

echo "Adding auto-start"
mkdir $ON_STARTUP_DIRECTORY -p


sed -i'.back' "s|gnome-terminal --working-directory=\"[$]HOME\" -x bash -c '.[/]elixys_setup; exec bash' [&]||" $HOME/.profile

source $HOME/.profile
if [[ $ELIXYS_PATH = "" ]]; then
  echo "Adding ELIXYS_PATH to the ~/.profile"
  echo "export ELIXYS_PATH=$elixys_home" >> $HOME/.profile
fi
source $HOME/.profile

sudo mv "$current_version/dependencies/startup/elixys" /usr/sbin/elixys
mkdir $ON_STARTUP_DIRECTORY -p
sudo mv "$current_version/dependencies/startup/config/autostart/$STARTUP_ICON" $ON_STARTUP_DIRECTORY
sudo rm -r "$current_version/dependencies/startup"

sudo chmod 755 $STARTUP_APP
sudo chmod 755 /usr/sbin/elixys

