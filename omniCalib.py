import cv2
import numpy as np
import glob
import sys
import select

# GLOBAL VARIABLES
CHECKERBOARD = (6,9)
objpoints = []
imgpoints = []

subpix_criteria = (cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER, 30, 0.1)
objp = np.zeros((1, 6*9, 3), np.float32)
objp[0,:,:2] = np.mgrid[0:6, 0:9].T.reshape(-1, 2)

# LOAD IMAGES FOR CALIBRATION ONLY!
images = glob.glob('*.jpg')

# FACE DETECTION
cascPath = "haarcascade_frontalface_default.xml"

# Create the haar cascade
faceCascade = cv2.CascadeClassifier(cascPath)

liveCap = False
faceDetection = False

_RL = 0.
_UD = 0.
_ZOOM = 0.30


def detectFace(image):
	
	gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
	
	# Detect faces in the image
	faces = faceCascade.detectMultiScale(
		gray,
		scaleFactor=1.1,
		minNeighbors=5,
		minSize=(30, 30),
		flags = cv2.CASCADE_SCALE_IMAGE
	)
	
	# Draw a rectangle around the faces
	for (x, y, w, h) in faces:
		cv2.rectangle(image, (x, y), (x+w, y+h), (0, 255, 0), 2)
		
	return image


def undistortImg(K, D, xi, img):
	
	# read image, which user wants to undistort - when not liveCap
	if not liveCap:
		img = cv2.imread(img)
	# else
	# img is the live captured image - when liveCap
	
	# set the camera matrix - resize the width and height of final image
	new_K = np.copy(K)
	new_K[0, 0] = new_K[0, 0] / 2 # /3 for bigger FOV
	new_K[1, 1] = new_K[1, 1] / 3 # /3 for bigger FOV
	
	# commets under this means that if user wants to move left we have to set
	# z value in first index of np array to 0.1 , with move to right to -0.1, .2 .3 .4.....
	# z value in second index of np array set to 0.1, -0.1, .2, .3, .4.... when we want to move
	# up and down 
	# ? - this looks like it moving "camera focus" so i have to find out what can i do with it - TODO!
	# TODO - investigate ?
	# TODO - create parser for CLI commands which can be used as input from user 
	# 		(u - move up, d - move down, r - move right, l - move left)
	# TODO - maybe create ZOOM (set DEF values)
	#			   DEF	X     LEFT        X   DEF     UP	  ?   X   DEF
	#						  RIGHT					 DOWN
	# R = np.array(((0.5, 0.,    _RL),     (0., 0.6,   _UD),   (0., 0., 0.3)))
	R = np.array(((0.5, 0.,    _RL),     (0., 0.6,   _UD),   (0., 0., _ZOOM)))
	
	# write undistorted image into numpy array
	undistorted = np.zeros((1024, 720, 3), np.uint8)
	undistorted = cv2.omnidir.undistortImage(img, K, D, xi, cv2.omnidir.RECTIFY_PERSPECTIVE, undistorted, new_K, R=R)
	
	if faceDetection:
		undistorted = detectFace(undistorted)
	# image preview
	# this shows on output for user
	if liveCap:
		cv2.imshow("undistorted", undistorted)
	else:
	# save image	
		cv2.imshow("undistorted", undistorted)
		cv2.imwrite("./undistortedPython.png", undistorted);	
		cv2.waitKey(0)


def calibrateCamera(objpoints, imgpoints, imgShape):
	
	# most of this code is taken from https://medium.com/@kennethjiang/calibrate-fisheye-lens-using-opencv-333b05afa0b0
	# but it's edited for omnidir module
	K = np.zeros((3, 3))
	D = np.zeros([1, 4])
	xi = np.zeros(1)
	
	rvecs = [np.zeros((1, 1, 3), dtype=np.float32) for i in range(len(imgpoints))]
	tvecs = [np.zeros((1, 1, 3), dtype=np.float32) for i in range(len(imgpoints))]

	rms = cv2.omnidir.calibrate(
		objpoints, imgpoints, imgShape, K, xi, D, cv2.omnidir.RECTIFY_PERSPECTIVE,
		(cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 60, 0.000001), rvecs, tvecs)
	
	return K, D, xi


def calcCorners():
	
	for fname in images:
		img = cv2.imread(fname)
		print(f'{fname}... ', end = "")
		gray = cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)

		ret, corners = cv2.findChessboardCorners(gray, CHECKERBOARD, cv2.CALIB_CB_ADAPTIVE_THRESH+cv2.CALIB_CB_FAST_CHECK+cv2.CALIB_CB_NORMALIZE_IMAGE)

		if ret == True:
			objpoints.append(objp)
			cv2.cornerSubPix(gray,corners, (3,3), (-1,-1), subpix_criteria)
			imgpoints.append(corners)
			print('FOUND!')
		else:
			print('NO!')
			
	return objpoints, imgpoints, gray


def printHelp():
	print("HELP")
	exit(0)


if __name__ == "__main__":
	
	if len(sys.argv) != 2:
		print('BAD INPUT ARGUMENTS!')
		printHelp()
		
	objpoints, imgpoints, gray = calcCorners()
	K, D, xi = calibrateCamera(objpoints, imgpoints, gray.shape[::-1])
	
	if sys.argv[1] == '--livecap':
		liveCap = True
		cap = cv2.VideoCapture(0)
		cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1024)
		cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
		
		while(True):
			ret, frame = cap.read()
			# cv2.imshow('frame', frame) # uncomment this when want to see default camera view
			
			i, o, e = select.select([sys.stdin], [], [], 0.00000000001)
			if (i):
				direction = sys.stdin.readline().strip()
				if direction == 'd':
					_UD -= 0.1
				elif direction == 'u':
					_UD += 0.1
				elif direction == 'l':
					_RL -= 0.1
				elif direction == 'r':
					_RL += 0.1
				elif direction == 'zi':
					_ZOOM -= 0.01
				elif direction == 'zo':
					_ZOOM += 0.01
			  
			undistortImg(K, D, xi, frame)
			if cv2.waitKey(1) & 0xFF == ord('q'):
				break
		
		cap.release()
		cv2.destroyAllWindows()
		
	elif sys.argv[1] == '--img':
		undistortImg(K, D, xi, 'to_undistort_plz.jpg')
		
	elif sys.argv[1] == '--help':
		printHelp()
		
	else:
		print('BAD INPUT ARGUMENTS!')
		printHelp()
