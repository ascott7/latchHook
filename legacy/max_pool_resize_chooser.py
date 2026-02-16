# Start with full image, find closest picture per pixel
# When resizing, choose from colors being squashed into the square the
# one which covers the largest fraction of all the squares involved


from collections import defaultdict

import math
import numpy as np

from color_chooser import ColorChooser
from greedy_chooser import GreedyChooser
from utils import quantize_img, get_full_color_regions
from tqdm import tqdm


class MaxPoolResizeChooser(ColorChooser):
    def arr_to_str(self, arr):
        return f"{arr[2]:02x}{arr[1]:02x}{arr[0]:02x}"

    def str_to_arr(self, color_string):
        return tuple(int(color_string[i : i + 2], 16) for i in (4, 2, 0))

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

    def calculate_total_score(self, scores, selected_colors):
        return np.sum(
            np.max(
                np.multiply(scores, selected_colors.reshape(np.array([1, 1, -1]))),
                axis=2,
            )
        )

    def choose_colors_body(self, img, clusters, width, height):
        # get 1 color per pixel quickly
        rows, cols = img.shape[:2]
        quantized_img = quantize_img(img, self.color_options)
        print("done quantizing")

        scores = np.zeros((height, width, len(self.color_options)), np.int32)
        color_indicies = {
            self.arr_to_str(v): i for i, v in enumerate(self.color_options.values())
        }
        full_color_regions = get_full_color_regions(width, height, self.color_options)
        for resized_col in range(width):
            for resized_row in range(height):
                square_components = self.calc_new_square_components(
                    quantized_img, resized_col, resized_row, width, height
                )
                for color_name, score in square_components.items():
                    scores[resized_row, resized_col, color_indicies[color_name]] = score

        best_selected_colors = np.hstack(
            (
                np.ones(clusters, dtype=np.float64),
                np.zeros(len(self.color_options) - clusters, dtype=np.float64),
            )
        )
        best_score = self.calculate_total_score(scores, best_selected_colors)
        for i in tqdm(range(clusters + 1, len(self.color_options))):
            new_selection_options = []
            # don't bother with colors which didn't get any score at all
            new_choice_score = self.calculate_total_score(
                scores,
                np.hstack(
                    (
                        np.zeros(i),
                        np.array([1]),
                        np.zeros(len(self.color_options) - i - 1),
                    )
                ),
            )
            if (new_choice_score) == 0:
                continue
            for j in range(len(best_selected_colors)):
                if best_selected_colors[j] == 1:
                    new_selection = best_selected_colors.copy()
                    new_selection[j] = 0
                    new_selection[i] = 1
                    new_selection_options.append(new_selection)
            # for each currently chosen color, try replacing it with color i
            for new_selection_option in new_selection_options:
                score = self.calculate_total_score(scores, new_selection_option)
                if score > best_score:
                    best_score = score
                    best_selected_colors = new_selection_option
        # get the best score per pixel
        max_indices = np.argmax(
            np.multiply(scores, best_selected_colors.reshape(np.array([1, 1, -1]))),
            axis=2,
        )
        x, y = np.indices(max_indices.shape)
        return full_color_regions[x, y, :, max_indices]
