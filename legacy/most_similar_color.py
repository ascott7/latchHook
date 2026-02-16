#!/usr/bin/env python3

import argparse
import json

import cv2
import numpy as np


ap = argparse.ArgumentParser()
ap.add_argument(
    "-c", "--color", required=True, type=str, help="color to check (in hex format)"
)
ap.add_argument(
    "-",
    "--color-options",
    type=str,
    help="path to numpy file of colors to use",
    default="color_names.json",
)


def get_ranked_colors(color, color_options):
    # create image with one pixel containing just the color
    color_img = np.zeros((1, 1, 3), np.uint8)
    color_img[:, :, :] = color
    color_lab_img = cv2.cvtColor(color_img, cv2.COLOR_BGR2LAB)

    # diff each of the options
    differences = {}
    for name, color in color_options.items():
        solid_img = np.zeros((1, 1, 3), np.uint8)
        solid_img[:, :, :] = color
        solid_img_lab = cv2.cvtColor(solid_img, cv2.COLOR_BGR2LAB)
        diff = abs(color_lab_img.astype("float") - solid_img_lab.astype("float"))
        differences[name] = np.sum(diff, axis=2)[0][0]

    return sorted(differences.items(), key=lambda item: item[1])


if __name__ == "__main__":
    args = ap.parse_args()

    with open(args.color_options) as f:
        color_options = {name: np.array(color) for name, color in json.load(f).items()}
    color_hex = args.color.lstrip("#")
    color_bgr = tuple(int(color_hex[i : i + 2], 16) for i in (4, 2, 0))
    print(f"input bgr: {color_bgr}")
    print("Closest matches (name, bgr, sum of bgr difference from input)")
    ranked_colors = get_ranked_colors(color_bgr, color_options)
    for name, bgr_diff in ranked_colors[:10]:
        print(name, color_options[name], bgr_diff)
