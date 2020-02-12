import cv2
import numpy as np

from color_chooser import ColorChooser
from utils import (
    get_color_differences,
    get_full_color_regions,
)


class GreedyChooser(ColorChooser):
    def choose_colors_body(self, img, clusters, width, height):
        resized_img = cv2.resize(img, (width, height), interpolation=cv2.INTER_AREA)
        self.output_images["resized_img.png"] = resized_img
        ret_img = None
        self.color_options = self.color_options.copy()
        for n in range(len(self.color_options) - clusters + 1):
            colors = {}

            # find the best color match for each pixel
            ret_img = self.quantize_img(resized_img)
            rows, cols = ret_img.shape[:2]

            # count the number of each color that we have
            for i in range(0, cols):
                for j in range(0, rows):
                    pixel = ret_img[j, i]
                    color = "%.2x%.2x%.2x" % (pixel[2], pixel[1], pixel[0])
                    if color in colors:
                        colors[color] += 1
                    else:
                        colors[color] = 1

            # prepare to remove least used color from palette
            minColorNum, minColor = float("inf"), None
            for key, val in colors.items():

                if val < minColorNum and key != "000000":
                    minColor = key
                    minColorNum = val

            # remove any colors that weren't used at all
            self.color_options_copy = self.color_options.copy()
            for colorName, colorVal in self.color_options_copy.items():
                valName = "%.2x%.2x%.2x" % (colorVal[2], colorVal[1], colorVal[0])
                if valName not in colors:
                    del self.color_options[colorName]

            # if we are at or below the target number of colors, we are done
            if len(self.color_options) <= clusters:
                break

            # otherwise remove the least used color and keep going
            for colorName, colorVal in self.color_options.items():
                valName = "%.2x%.2x%.2x" % (colorVal[2], colorVal[1], colorVal[0])
                if valName == minColor:
                    del self.color_options[colorName]
                    break
        return ret_img

    def quantize_img(self, img):
        """
        Given an image and a dictionary of the form {colorname: BGR val}, returns an image
        where every pixel has been replaced by the most similar color in the dictionary.
        Similarity is determined by squared distance in the L*A*B* color space.
        """
        rows, cols = img.shape[:2]

        full_color_regions = get_full_color_regions(img, self.color_options)
        differences = get_color_differences(img, full_color_regions)
        new_img = np.zeros((rows, cols, 3), np.uint8)
        # get the min difference, aka the closest color match, for each pixel in the image
        min_indices = np.argmin(differences, axis=2)
        x, y = np.indices(min_indices.shape)

        # the new image becomes the best match for each pixel
        new_img = full_color_regions[x, y, :, min_indices]
        return new_img
