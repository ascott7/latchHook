import cv2
import numpy as np
from numpy import array, uint8
from pulp import *

from color_chooser import ColorChooser


class PulpChooser(ColorChooser):
    def __init__(self, color_options):
        super().__init__(color_options)
        self.solid_img = np.zeros((len(color_options), 1, 3), np.uint8)
        i = 0
        for name, color in color_options.items():
            self.solid_img[i, 0, :] = color
            i += 1
        self.solid_img_lab = cv2.cvtColor(self.solid_img, cv2.COLOR_BGR2LAB)

    def choose_colors_body(self, img, clusters, width, height):
        resized_img = cv2.resize(img, (width, height), interpolation=cv2.INTER_AREA)
        lab_img = cv2.cvtColor(resized_img, cv2.COLOR_BGR2LAB)

        prob = LpProblem("Color_choosing", LpMinimize)
        colors = []
        color_vars = LpVariable.dicts(
            f"color_names", list(range(len(self.color_options))), 0, 1, cat="Integer"
        )
        for row in range(height):
            for col in range(width):
                index = row * width + col
                colors.append(
                    LpVariable.dicts(
                        f"colors{index}", list(range(len(self.color_options))), 0, 1, cat="Integer"
                    )
                )
                # choose exactly 1 color per pixel
                prob += sum(colors[index].values()) == 1

        # if a color is chosen somewhere, the corresponding color_vars index must also be true
        for color in range(len(self.color_options)):
            prob += (
                addImplies(
                    prob,
                    addOrList(prob, [list(c.values())[color] for c in colors]),
                    color_vars[color],
                )
                >= 1
            )

        # allow a max of c chosen colors
        prob += sum(color_vars.values()) <= clusters

        # goal is to minimize squared distance per pixel
        prob += self.calculateScore(colors, lab_img)
        prob.solve()
        print(prob.status)
        ret = self.retrieve_img(colors, height, width)
        print(f"used {sum([cv.varValue for cv in color_vars.values()])} colors")
        return ret

    def calculateScore(self, colors, img):
        score = 0
        rows, cols = img.shape[:2]
        for row in range(rows):
            for col in range(cols):
                index = row * cols + col
                # find non-zero value
                for i in range(len(self.color_options)):
                    score += colors[index][i] * np.sum(
                        (
                            img[row, col, :].astype("float")
                            - self.solid_img_lab[i, 0, :].astype("float")
                        )
                        ** 2
                    )
        return score

    def retrieve_img(self, colors, rows, cols):
        ret_img = np.zeros((rows, cols, 3), np.uint8)
        for row in range(rows):
            for col in range(cols):
                index = row * cols + col
                chosen_color = np.argmax([v.varValue for v in colors[index].values()])
                ret_img[row, col] = self.solid_img[chosen_color]
        return ret_img


and_count = 0
def addAnd(prob, a, b):
    global and_count
    and_var = LpVariable(f"and_var{and_count}", 0, 1, cat="Integer")
    prob += and_var >= a + b - 1
    prob += and_var <= a
    prob += and_var <= b
    return and_var


or_count = 0
def addOr(prob, a, b):
    global or_count
    or_var = LpVariable(f"or_var{or_count}", 0, 1, cat="Integer")
    or_count += 1
    prob += or_var <= a + b
    prob += or_var >= a
    prob += or_var >= b
    return or_var


def addOrList(prob, ints):
    result = ints[0]
    for i in ints[1:]:
        result = addOr(prob, result, i)
    return result


implies_count = 0
def addImplies(prob, a, b):
    global implies_count
    implies_var = LpVariable(f"implies_var{implies_count}", 0, 1, cat="Integer")
    implies_count += 1
    prob += implies_var <= 1 - a + b
    prob += implies_var >= 1 - a
    prob += implies_var >= b
    return implies_var

