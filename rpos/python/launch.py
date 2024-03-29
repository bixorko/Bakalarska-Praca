#################################
# 			launch.py			#
#   Created by Peter Vinarcik	#
# 			 xvinar00			#
#  xvinar00@stud.fit.vutbr.cz	#
#################################


import cv2
import gi
import numpy as np
import glob
import sys
import select
import json
from json import JSONEncoder
import subprocess
import os.path
from os import path
import socket
import fcntl
import struct


# Need to check version of Gst and GstRtspServer
# older versions doesn't support writting to stream with MediaFactory
gi.require_version('Gst', '1.0')
gi.require_version('GstRtspServer', '1.0')
from gi.repository import Gst, GstRtspServer, GObject


"""This function detects face in distorted image
parameter image is distorted image from
undistortImg() function
"""


def detectFace(image):
	
	gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
	
	# Detect faces in the image
	# needs improve, especially in speed 
	faces = faceCascade.detectMultiScale(
		gray,
		scaleFactor=1.1,
		minNeighbors=5,
		minSize=(30, 30),
		flags=cv2.CASCADE_SCALE_IMAGE
	)
	
	# Draw a rectangle around the faces
	for (x, y, w, h) in faces:
		cv2.rectangle(image, (x, y), (x+w, y+h), (0, 255, 0), 2)
		
	return image


"""This function makes correction
of distortion in image.
It removes radial distortion
and returns final image.
If faceDetection is True, then it is
sent to faceDetect function and only after that it is
returned as final image.
"""


def undistortImg(K, D, xi, img):
	
	# set the camera matrix - resize the width and height of final image
	new_K = np.copy(K)
	new_K[0, 0] = new_K[0, 0] / 2  # /3 for bigger FOV
	new_K[1, 1] = new_K[1, 1] / 3  # /3 for bigger FOV

	# comments below this means that if user wants to move left we have to set
	# z value in first index of np array to 0.1 
	# with move to right to -0.1, .2 .3 .4.....
	# z value in second index of np array set to 0.1, -0.1, .2, .3, .4.... 
	# when we want to move
	# up and down 
	# 		(u - move up, d - move down, r - move right, l - move left)
	# 			   DEF	X     LEFT        X   DEF     UP	  ?   X   DEF
	# 						  RIGHT					 DOWN
	# R = np.array(((0.5, 0.,    _RL),     (0., 0.6,   _UD),   (0., 0., 0.3)))
	R = np.array(((0.5, 0.,    _RL),     (0., 0.6,   _UD),   (0., 0., _ZOOM)))

	# write undistorted image into numpy array
	undistorted = np.zeros((1024, 720, 3), np.uint8)
	undistorted = cv2.omnidir.undistortImage(
		img, K, D, xi, 
		cv2.omnidir.RECTIFY_PERSPECTIVE, undistorted, new_K, R=R)

	# if face detection is toggled on
	# image without distortion is sent
	# into detectFace function
	# but for now, it makes stream unstable
	# so default is faceDetection boolean
	# set to False
	if faceDetection:
		undistorted = detectFace(undistorted)

	# returns output without distortion
	return undistorted


"""This function is calibrating camera,
parameters objpoints, imgpoints and imgShape
are calculated in calcCorners function or user
can calculate it on his own and then pass those matrices
into this function.
It returns external and internal parameters of camera.
These parameters are used after that to remove distortion from
captured fish-eye image.
"""


def calibrateCamera(objpoints, imgpoints, imgShape):

	# this code is inspired by
	# https://medium.com/@kennethjiang/calibrate-fisheye-lens-using-opencv-333b05afa0b0
	# but it's edited for omnidir module
	K = np.zeros((3, 3))
	D = np.zeros([1, 4])
	xi = np.zeros(1)

	rvecs = [np.zeros((1, 1, 3), dtype=np.float32) for i in range(len(imgpoints))]
	tvecs = [np.zeros((1, 1, 3), dtype=np.float32) for i in range(len(imgpoints))]

	rms = cv2.omnidir.calibrate(
		objpoints, imgpoints, imgShape, K, xi, D, cv2.omnidir.RECTIFY_PERSPECTIVE,
		(cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 60, 0.000001), 
		rvecs, tvecs)

	return K, D, xi


"""This function is connected with calibrateCamera, because
output of this function - object and image points are passed
into calibrateCamera function. 
It finds those points by searching corners of chessboard pattern.
Images for calibration are in ./rpos/calibration folder
"""


def calcCorners():

	# loop through all calibration images
	for fname in images:
		img = cv2.imread(fname)
		
		# all prints in this function are only debug prints
		# debug prints from this script can be accessed by
		# changing Log Level in rposConfig.json to value 4
		print(f'{fname}... ', end="")
		gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
		
		# this part calculates those specific img points
		# based on calibration image
		ret, corners = cv2.findChessboardCorners(
			gray, CHECKERBOARD, 
			cv2.CALIB_CB_ADAPTIVE_THRESH+cv2.CALIB_CB_FAST_CHECK
			+ cv2.CALIB_CB_NORMALIZE_IMAGE)
		
		# if pattern was found on calibration image
		# it stores points into matrices created 
		# in global variables part at the start
		# of the script
		if ret is True:
			objpoints.append(objp)
			cv2.cornerSubPix(gray, corners, (3, 3), (-1, -1), subpix_criteria)
			imgpoints.append(corners)
			print('FOUND!')
		else:
			print('NO!')

	return objpoints, imgpoints, gray


"""MOST IMPORTANT CLASS!
Part of this code is taken from 
http://gstreamer-devel.966125.n4.nabble.com/Write-opencv-frames-into-gstreamer-rtsp-server-pipeline-td4685382.html

It is connected with GstServer class written below this class
and it creates "Factory" for writing image data to running RTSP Stream.
It inherits from GstRtspServer.RTSPMediaFactory so we can modify and use
on_need_data and do_* methods.

It also contains GStreamer pipeline for launch with values same as 
we use for capturing and processing fish-eye images (1024x720), 10 fps, etc.
"""


class SensorFactory(GstRtspServer.RTSPMediaFactory):
	
	def __init__(self, **properties):
		super(SensorFactory, self).__init__(**properties)
		self.cap = cv2.VideoCapture(0)
		self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1024)
		self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
		self.number_frames = 0
		self.fps = 10
		# duration of a frame in nanoseconds
		self.duration = 1 / self.fps * Gst.SECOND 
		self.launch_string = 'appsrc name=source is-live=true block=true format=GST_FORMAT_TIME ' \
								'caps=video/x-raw,format=BGR,width=1024,height=720,framerate={}/1 ' \
								'! videoconvert ! video/x-raw,format=I420 ' \
								'! x264enc speed-preset=ultrafast tune=zerolatency ' \
								'! rtph264pay config-interval=1 name=pay0 pt=96'.format(self.fps)
	
	'''This function is connected as appsrc for GStreamer pipeline.
	It means, that whenever is emited signal, it writes data
	into running RTSP Stream
	'''
	def on_need_data(self, src, lenght):
		global _UD, _RL, _ZOOM
		if self.cap.isOpened():
			ret, frame = self.cap.read()
			if ret:
				
				# lines = sys.stdin.readline() 
				# line above also works... 
				# the difference with below example is that 
				# it is read every time it loops
				
				i, o, e = select.select([sys.stdin], [], [], 0.00000000001)
				
				# communication in other way: Python -> NodeJS
				# a = sys.stdout.flush()
				# if a:
				# 	print(a, flush=True)

				# if something arrived in stdin from NodeJS
				if i:				
					# read from stdin
					direction = sys.stdin.readline()
					direction = direction[2:len(direction)-2]

					# if it is direction from GET Request, move Camera
					if direction == 'down':
						print("DOWN", flush=True)
						_UD -= 0.1
					elif direction == 'up':
						print("UP", flush=True)
						_UD += 0.1
					elif direction == 'left':
						print("LEFT", flush=True)
						_RL -= 0.1
					elif direction == 'right':
						print("RIGHT", flush=True)
						_RL += 0.1
					elif direction == 'zoom-in':
						print("IN", flush=True)
						_ZOOM -= 0.01
					elif direction == 'zoom-out':
						print("OUT", flush=True)
						_ZOOM += 0.01
				else:
					pass

				# creates undistorted image and 
				# after that, it is written into RTSP Stream
				# by emitting push signal
				data = undistortImg(K, D, xi, frame).tostring()
				buf = Gst.Buffer.new_allocate(None, len(data), None)
				buf.fill(0, data)
				buf.duration = self.duration
				timestamp = self.number_frames * self.duration
				buf.pts = buf.dts = int(timestamp)
				buf.offset = timestamp
				self.number_frames += 1
				retval = src.emit('push-buffer', buf)
				
				# debug print for written image data
				# print('pushed buffer, frame {}, duration 
				# {} ns, durations {} s'.format(self.number_frames,
				# self.duration,
				# self.duration / Gst.SECOND))
				
				if retval != Gst.FlowReturn.OK:
					print(retval)
	
	"""This function prepares the launch 
	with pipeline from init
	"""
	def do_create_element(self, url):
		return Gst.parse_launch(self.launch_string)

	"""This function connects appsrc from GStreamer pipeline
	with on_need_data function. 'source' is the name of appsrc
	specified in gstreamer pipeline from init
	"""
	def do_configure(self, rtsp_media):
		self.number_frames = 0
		appsrc = rtsp_media.get_element().get_child_by_name('source')
		appsrc.connect('need-data', self.on_need_data)


"""This class is creating RTSP Stream.
It is connected to Factory, so we can
send datas to this stream - as it was descripted above.
"""


class GstServer(GstRtspServer.RTSPServer):
	
	def __init__(self, **properties):
		super(GstServer, self).__init__(**properties)
		self.factory = SensorFactory()
		self.factory.set_shared(True)
		self.get_mount_points().add_factory("/onvif1", self.factory)
		self.attach(None)
		

"""This class is inspired by 
https://pynative.com/python-serialize-numpy-ndarray-into-json/
and this class helps to create numpy arrays 
as json file - store those arrays into json file, 
so calibration does not have to be ran everytime.
"""


class NumpyArrayEncoder(JSONEncoder):
	def default(self, obj):
		if isinstance(obj, np.ndarray):
			return obj.tolist()
		return JSONEncoder.default(self, obj)


"""This function is used for modifying
shinobiCameraSettings.json, because it prepares values in IP boxes
to IP of Rapsberry Pi in network
so user does not need to manually change something based on in which
network he is.
"""


def get_ip_address(ifname):
	s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
	return socket.inet_ntoa(fcntl.ioctl(
		s.fileno(),
		0x8915,  # SIOCGIFADDR
		struct.pack('256s', bytes(ifname[:15], 'utf-8'))
	)[20:24])

# GLOBAL VARIABLES
CHECKERBOARD = (6, 9)
objpoints = []
imgpoints = []

subpix_criteria = (cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER, 30, 0.1)
objp = np.zeros((1, 6*9, 3), np.float32)
objp[0, :, :2] = np.mgrid[0:6, 0:9].T.reshape(-1, 2)


# LOAD IMAGES FOR CALIBRATION ONLY!
images = glob.glob('./calibration/*.jpg')


# FACE DETECTION
cascPath = "./face_recognition/haarcascade_frontalface_default.xml"

# Create the haar cascade
faceCascade = cv2.CascadeClassifier(cascPath)
faceDetection = False


# Rotation Matrix params
_RL = 0.
_UD = 0.
_ZOOM = 0.30


# Before Camera starts to send data to RTSP Stream
# camera calibration will be done by using calcCorners 
# and calibrateCamera function

if path.exists("./calibration/cameraParams.json"):
	with open("./calibration/cameraParams.json", "r") as f:
		decodedArray = json.load(f)
		K = np.asarray(decodedArray["K"])
		D = np.asarray(decodedArray["D"])
		xi = np.asarray(decodedArray["xi"])		
else:
	objpoints, imgpoints, gray = calcCorners()
	K, D, xi = calibrateCamera(objpoints, imgpoints, gray.shape[::-1])
	numpyData = {"K": K, "D": D, "xi": xi}
	with open("./calibration/cameraParams.json", "w") as f:
		json.dump(numpyData, f, cls=NumpyArrayEncoder)
		
# Tries eth0 (if ethernet cable is in RPi
# if no, then wlan0 IP is taken
# and this ip is written into
# auto_host box, host box and control_base_url box
try:
	deviceIp = get_ip_address("eth0")
	
except:
	deviceIp = get_ip_address("wlan0")

shiCamSettings = open("./shinobiCameraSettings.json", "r")
json_obj = json.load(shiCamSettings)
shiCamSettings.close()
json_obj["host"] = deviceIp
json_obj["details"]["auto_host"] = "rtsp://user:user@" + deviceIp + ":8554/onvif1"
json_obj["details"]["control_base_url"] = "http://" + deviceIp + ":8081"
shiCamSettings = open("./shinobiCameraSettings.json", "w")
json.dump(json_obj, shiCamSettings)
shiCamSettings.close()


# check if user wants to use face detection
if len(sys.argv) > 1:
	if sys.argv[1] == '--face' or sys.argv[1] == '-f':
		faceDetection = True


# Init thread for livestream
GObject.threads_init()
Gst.init(None)

# Create server and mount it to specific point with specific Factory
server = GstServer()

# MAIN PROGRAM
loop = GObject.MainLoop()
loop.run()
