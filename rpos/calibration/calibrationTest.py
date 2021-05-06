import cv2
import numpy as np
import glob
import sys
import select
from json import JSONEncoder
import json
import codecs
import os.path
from os import path

# GLOBAL VARIABLES
CHECKERBOARD = (6,9)
objpoints = []
imgpoints = []

subpix_criteria = (cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER, 30, 0.1)
objp = np.zeros((1, 6*9, 3), np.float32)
objp[0,:,:2] = np.mgrid[0:6, 0:9].T.reshape(-1, 2)

# LOAD IMAGES FOR CALIBRATION ONLY!
images = glob.glob('./*.jpg')


def calibrateCamera(objpoints, imgpoints, imgShape):
	
	# most of this code is taken from https://medium.com/@kennethjiang/calibrate-fisheye-lens-using-opencv-333b05afa0b0
	# but it's edited for omnidir module
	K = np.zeros((3, 3))
	D = np.zeros([1, 4])
	xi = np.zeros(1)
	
	rvecs = [np.zeros((1, 1, 3), dtype=np.float32) for i in range(len(imgpoints))]
	tvecs = [np.zeros((1, 1, 3), dtype=np.float32) for i in range(len(imgpoints))]

	rms = cv2.omnidir.calibrate(
		objpoints, imgpoints, imgShape, K, xi, D, cv2.omnidir.CALIB_FIX_SKEW + cv2.omnidir.CALIB_FIX_CENTER + cv2.omnidir.CALIB_FIX_GAMMA,
		(cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 60, 0.000001), rvecs, tvecs)
	
	return K, D, xi


def calcCorners():
	
	for fname in images:
		img = cv2.imread(fname)
		print(f'{fname} - ', end = "")
		gray = cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)

		ret, corners = cv2.findChessboardCorners(gray, CHECKERBOARD, cv2.CALIB_CB_ADAPTIVE_THRESH+cv2.CALIB_CB_FAST_CHECK+cv2.CALIB_CB_NORMALIZE_IMAGE)

		if ret == True:
			objpoints.append(objp)
			cv2.cornerSubPix(gray,corners, (3,3), (-1,-1), subpix_criteria)
			imgpoints.append(corners)
			print('FOUND!')
		else:
			print('NO!')
		
		showed = cv2.drawChessboardCorners(img, CHECKERBOARD, corners, ret)
		cv2.imshow("calibration", showed)
		cv2.waitKey(0)
			
	return objpoints, imgpoints, gray


class NumpyArrayEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return JSONEncoder.default(self, obj)


if __name__ == "__main__":
	objpoints, imgpoints, gray = calcCorners()
	K, D, xi = calibrateCamera(objpoints, imgpoints, gray.shape[::-1])
	numpyData = {"K": K, "D": D, "xi": xi}
	with open("cameraParams.json", "w") as f:
		json.dump(numpyData, f, cls=NumpyArrayEncoder)
