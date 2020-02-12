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
        selected_colors = np.ones(len(self.color_options), dtype=np.float64)
        full_color_regions = get_full_color_regions(resized_img, self.color_options)
        differences = get_color_differences(resized_img, full_color_regions)
        rows, cols = resized_img.shape[:2]
        for n in range(len(self.color_options) - clusters + 1):
            min_indices = np.nanargmin(
                np.multiply(differences, selected_colors.reshape(np.array([1, 1, -1]))),
                axis=2,
            )
            mask_indices, counts = np.unique(min_indices, return_counts=True)

            # remove any colors that weren't used at all
            used_mask = np.full(len(self.color_options), np.nan)
            used_mask[mask_indices] = 1
            selected_colors = np.multiply(selected_colors, used_mask)

            # if we are at or below the target number of colors, we are done
            if np.nansum(selected_colors) <= clusters:
                break

            # remove least used color
            least_used_color = np.nanargmin(counts)
            selected_colors[mask_indices[least_used_color]] = np.nan

        # get the min difference, aka the closest color match, for each pixel in the image
        min_indices = np.nanargmin(
            np.multiply(differences, selected_colors.reshape(np.array([1, 1, -1]))),
            axis=2,
        )
        x, y = np.indices(min_indices.shape)

        # the new image becomes the best match for each pixel
        ret_img = full_color_regions[x, y, :, min_indices]

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
