import cv2, sys, os
import numpy as np

def chooseColor(img):
    rows, cols = img.shape[:2]
    gap = 5
    cropped_img = img[gap:rows-gap, gap:cols-gap]
    return np.median(np.median(img, axis=0), axis=0)

if __name__ == "__main__":
    directory = sys.argv[1]
    colors  = {}
    for subdir, dirs, files in os.walk(directory):
        for f in files:
            filename, ext = os.path.splitext(f)
            if ext == '.jpg':
                img = cv2.imread(os.path.join(subdir, f))
                colors[filename[8:]] = chooseColor(img).astype('uint8')
    print colors
