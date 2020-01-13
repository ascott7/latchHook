#!/usr/bin/env python3

import argparse
import json
import os

import cv2
import numpy as np
from numpy import array, uint8

from greedy_chooser import GreedyChooser
from pulp_chooser import PulpChooser

ap = argparse.ArgumentParser()
ap.add_argument("-i", "--image", required=True, help="Path to the image")
ap.add_argument("-c", "--clusters", required=True, type=int, help="# of clusters")
ap.add_argument("-w", "--width", type=int, help="width of output template in pixels")
ap.add_argument("-hi", "--height", type=int, help="height of output template in pixels")
ap.add_argument(
    "-m", "--method", type=str, choices=["greedy", "pulp"], default="greedy"
)
ap.add_argument(
    "-",
    "--color-options",
    type=str,
    help="path to numpy file of colors to use",
    default="color_names.json",
)


if __name__ == "__main__":
    args = ap.parse_args()

    with open(args.color_options) as f:
        color_options = {name: np.array(color) for name, color in json.load(f).items()}

    if args.method == "greedy":
        chooser = GreedyChooser(color_options)
    elif args.method == "pulp":
        chooser = PulpChooser(color_options)

    img = cv2.imread(args.image)
    img_name = os.path.splitext(args.image)[0]

    chooser.choose_colors(img, args.clusters, args.width, args.height)
    for name, image in chooser.output_images.items():
        cv2.imwrite(img_name + "_" + name, image)
