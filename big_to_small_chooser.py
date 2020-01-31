# Start with full image, find closest picture per pixel
# When resizing, choose from colors being squashed into the square the
# one which covers the largest fraction of all the squares involved


from collections import defaultdict

import cv2
import math
import numpy as np

from color_chooser import ColorChooser
from greedy_chooser import GreedyChooser


class BigToSmallChooser(ColorChooser):
    def arr_to_str(self, arr):
        return f'{arr[2]:02x}{arr[1]:02x}{arr[0]:02x}'

    def str_to_arr(self, color_string):
        return tuple(int(color_string[i:i+2], 16) for i in (4, 2, 0))

    def calc_new_square_components(self, img, resized_col, resized_row, width, height):
        rows, cols = img.shape[:2]
        col_frac = cols / width
        row_frac = rows / height

        new_col_start = col_frac * resized_col
        new_col_end = col_frac * (resized_col + 1)
        new_row_start = row_frac * resized_row
        new_row_end = row_frac * (resized_row + 1)

        result = defaultdict(float)
        for orig_col in range(math.floor(new_col_start), math.ceil(new_col_end)):
            for orig_row in range(math.floor(new_row_start), math.ceil(new_row_end)):
                covered_width = max(orig_col, new_col_start) - min(
                    orig_col + 1, new_col_end
                )
                covered_height = max(orig_row, new_row_start) - min(
                    orig_row + 1, new_row_end
                )
                orig_color_str = self.arr_to_str(img[orig_row, orig_col])
                result[orig_color_str] += covered_width * covered_height
        return result

    def choose_colors_body(self, img, clusters, width, height):
        # get 1 color per pixel quickly
        rows, cols = img.shape[:2]
        gc = GreedyChooser(self.color_options)
        quantized_img = gc.choose_colors_body(img, len(self.color_options), cols, rows)
        print('done quantizing')

        col_frac = cols / width
        row_frac = rows / height
        result_img = np.zeros((height, width, 3), np.uint8)
        for resized_col in range(width):
            for resized_row in range(height):
                square_components = self.calc_new_square_components(
                    quantized_img, resized_col, resized_row, width, height
                )
                sorted_components = sorted(square_components.items(), key=lambda item: item[1], reverse=True)
                result_img[resized_row, resized_col, :] = self.str_to_arr(sorted_components[0][0])
        return result_img
