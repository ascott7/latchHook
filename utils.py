import cv2
import numpy as np


def get_full_color_regions(img, color_options):
    """
    Given an image and a dictionary of the form {colorname: BGR val}, returns a
    numpy array with a full image per BGR color value
    """
    rows, cols = img.shape[:2]
    full_color_regions = np.zeros((rows, cols, 3, len(color_options)), np.uint8)
    for i, (name, color) in enumerate(color_options.items()):
        solid_img = np.zeros((rows, cols, 3), np.uint8)
        solid_img[:, :, :] = color
        full_color_regions[:, :, :, i] = solid_img
    return full_color_regions


def get_color_differences(img, full_color_regions):
    """
    Given an image and the result of get_full_color_regions(), return the
    sum of the squared L*A*B* difference per pixel per color.
    """
    rows, cols = img.shape[:2]
    n_colors = full_color_regions.shape[3]
    lab_img = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)

    # create differences array, img_size x number of colors being considered
    differences = np.zeros((rows, cols, n_colors), np.int32)

    # for each color, make an image of entirely that color and take the squared
    # distance ((r1-r2)^2 + (g1-b2)^2 + (b1-b2)^2) between the corresponding pixels
    # in the image and the solid color image
    for i in range(n_colors):
        solid_img = full_color_regions[:, :, :, i]
        solid_img_lab = cv2.cvtColor(solid_img, cv2.COLOR_BGR2LAB)
        diff = lab_img.astype("float") - solid_img_lab.astype("float")
        diff = diff ** 2
        differences[:, :, i] = np.sum(diff, axis=2)
    return differences


def quantize_img(img, color_options):
    """
    Given an image and a dictionary of the form {colorname: BGR val}, returns an image
    where every pixel has been replaced by the most similar color in the dictionary.
    Similarity is determined by squared distance in the L*A*B* color space.
    """
    rows, cols = img.shape[:2]

    full_color_regions = get_full_color_regions(img, color_options)
    differences = get_color_differences(img, full_color_regions)
    new_img = np.zeros((rows, cols, 3), np.uint8)
    # get the min difference, aka the closest color match, for each pixel in the image
    min_indices = np.argmin(differences, axis=2)
    x, y = np.indices(min_indices.shape)

    # the new image becomes the best match for each pixel
    new_img = full_color_regions[x, y, :, min_indices]
    return new_img
