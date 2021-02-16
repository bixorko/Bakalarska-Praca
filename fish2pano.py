import numpy as np
import cv2


#MyCamera class which can handle RPi Camera ONLY WITH FISHEYE LENS!!!
#Parameters of this class are height and width of image (which camera takes)
class MyCamera:
	# manual calibration for perfect panorama cutting (x radius of inner and outer donut)
	# R1 -> inner radius calculated from x coordinates
	# R1x (inner donut x coordinate) - Cx (x coordinate of center of the image)
	# R2 -> outer radius calcualted same as R1 but outer donut x coordinate is taken (R2x)
	# R2x (outer donut x coordinate) - Cx (x coordinate of center of the image)
	R1 = 85
	R2 = 230
	
	def __init__(self, width, height):
		self.width = width
		self.height = height
		
	def create_panorama(self, Cx, Cy):
		Wd = 2.0*((self.R2 + self.R1)/2)*np.pi
		Hd = self.R2 - self.R1
		
		map_x = np.zeros((Hd, int(Wd)), dtype=np.float32)
		map_y = np.zeros((Hd, int(Wd)), dtype=np.float32)
		
		for y in range(0, int(Hd-1)):
		    for x in range(0, int(Wd-1)):
		        r = (float(y)/float(Hd))*(self.R2-self.R1)+self.R1
		        theta = (float(x)/float(Wd))*2.0*np.pi
		        xS = Cx+r*np.sin(theta)
		        yS = Cy+r*np.cos(theta)
		        map_x.itemset((y,x), int(xS))
		        map_y.itemset((y,x), int(yS))
		return map_x, map_y


	def run_camera(self):
		cap = cv2.VideoCapture(0)
		xmap, ymap = self.create_panorama(320, 240)
		
		while(True):
			# Capture frame-by-frame
			ret, frame = cap.read()

			# Pixel position to draw at
			col, row = int(self.width/2), int(self.height/2)

			# The following will draw a circle in the middle of picture
			# So we can easily "cut" the picture into panorama
			# If we haven't this circle drawed, we wont split it up
			# cause we haven't "donut" which is neccesary to create it to panorama  
			cv2.circle(frame, (col, row), 100, (0,0,0), -1)
			frame = cv2.remap(frame, xmap, ymap, cv2.INTER_LINEAR)
			
			# Display the resulting frame
			cv2.imshow('frame', frame)
			if cv2.waitKey(1) & 0xFF == ord('q'):
				break
		
		cap.release()
		cv2.destroyAllWindows()
		
		
if __name__ == "__main__":
	MyCamera(640,480).run_camera()



















