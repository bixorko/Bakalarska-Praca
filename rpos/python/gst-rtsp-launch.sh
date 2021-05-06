#!/bin/sh
echo $@
/usr/bin/python3 ./python/gst-rtsp-launch.py $@ -v

