import cv2
import numpy as np

from color_chooser import ColorChooser
from utils import get_color_differences, get_full_color_regions, calculate_total_cost


class GreedyChooser(ColorChooser):
    def choose_colors_body(self, img, clusters, width, height):
        resized_img = cv2.resize(img, (width, height), interpolation=cv2.INTER_AREA)
        self.output_images["resized_img.png"] = resized_img
        best_selected_colors = np.hstack(
            (
                np.ones(clusters, dtype=np.float64),
                np.full(len(self.color_options) - clusters, np.nan, dtype=np.float64),
            )
        )
        rows, cols = resized_img.shape[:2]
        full_color_regions = get_full_color_regions(cols, rows, self.color_options)
        differences = get_color_differences(resized_img, full_color_regions)
        best_cost = calculate_total_cost(differences, best_selected_colors)
        for i in range(clusters + 1, len(self.color_options)):
            new_selection_options = []
            for j in range(len(best_selected_colors)):
                if best_selected_colors[j] == 1:
                    new_selection = best_selected_colors.copy()
                    new_selection[j] = np.nan
                    new_selection[i] = 1
                    new_selection_options.append(new_selection)
            # for each currently chosen color, try replacing it with color i
            for new_selection_option in new_selection_options:
                cost = calculate_total_cost(differences, new_selection_option)
                if cost < best_cost:
                    best_cost = cost
                    best_selected_colors = new_selection_option

        # get the min difference, aka the closest color match, for each pixel in the image
        min_indices = np.nanargmin(
            np.multiply(
                differences, best_selected_colors.reshape(np.array([1, 1, -1]))
            ),
            axis=2,
        )
        x, y = np.indices(min_indices.shape)

        # the new image becomes the best match for each pixel
        ret_img = full_color_regions[x, y, :, min_indices]

        return ret_img
