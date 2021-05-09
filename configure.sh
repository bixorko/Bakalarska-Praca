#####################################################################
# 								configure.sh						#
# 					script created by Peter Vinarcik				#
# 								  xvinar00							#
# 						xvinar00@stud.fit.vutbr.cz					#
# this script automatically install camera software 				#
# into raspberry pi...												#
# precalibrated for Waveshare RPi Camera (M)						#
# otherwise user have to create calibration images 					#
#and send it to Bakalarska-praca/rpos/python/calibImgs				#
#####################################################################

#!/usr/bin/bash
# if rpos is not in folder
git clone https://www.github.com/bixorko/rpos
# install dependecies based on RPOS github
sudo apt-get install npm
sudo npm install -g npm@latest
sudo apt install git gstreamer1.0-plugins-bad gstreamer1.0-plugins-base \
 gstreamer1.0-plugins-good gstreamer1.0-plugins-ugly \
 gstreamer1.0-tools libgstreamer1.0-dev libgstreamer1.0-0-dbg \
 libgstreamer1.0-0 gstreamer1.0-omx \
 libgstreamer-plugins-base1.0-dev gtk-doc-tools
sudo apt-get install python-gi gir1.2-gst-plugins-base-1.0 gir1.2-gst-rtsp-server-1.0
# install rpicamsrc for GStreamer
git clone https://github.com/thaytan/gst-rpicamsrc.git
cd gst-rpicamsrc
./autogen.sh
make
sudo make install
cd ..
# install RTSP Server for GStreamer
git clone git://anongit.freedesktop.org/gstreamer/gst-rtsp-server
cd gst-rtsp-server
git checkout 1.4.5
./autogen.sh
make
sudo make install
cd ~
# install Shinobi
sudo su <<EOF
bash <(curl -s https://gitlab.com/Shinobi-Systems/Shinobi-Installer/raw/master/shinobi-install.sh)
bash <(curl -s https://gitlab.com/Shinobi-Systems/Shinobi-Installer/raw/master/shinobi-install.sh)
1
EOF
# run camera
cd ~/Bakalarska-praca/rpos
node rpos.js
