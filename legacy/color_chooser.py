import cv2
import numpy as np


class ColorChooser:
    def __init__(self, color_options):
        self.output_images = {}
        self.color_options = color_options

    def choose_colors_body(self, img, clusters, width, height):
        pass

    def choose_colors(self, img, clusters, arg_width, arg_height):
        width, height = self.get_dimentions(img, arg_width, arg_height)
        result_img = self.choose_colors_body(img, clusters, width, height)
        self.output_images["chosen_colors_no_grid.png"] = result_img
        stats_img, color_order = self.make_color_stats(result_img)
        self.output_images["stats_img.png"] = stats_img
        self.output_images["chosen_colors.png"] = self.add_lines_and_symbols(
            result_img, color_order
        )

    def get_dimentions(self, img, width, height):
        """
        Choose image dimesions based on user input. If the user enters a width and/or
        height, these are used to calculate the new image size. If neither are
        entered, the longer dimension is set to 120 pixels and the shorter dimention
        is calculated to maintain the aspect ratio.
        """
        DEFAULT_LONG = 120
        rows, cols = img.shape[:2]

        if width is not None and height is not None:
            return (width, height)

        elif width is not None:
            ratio = cols / float(width)
        elif height is not None:
            ratio = rows / float(height)
        elif rows > cols:
            ratio = rows / float(DEFAULT_LONG)
        else:
            ratio = cols / float(DEFAULT_LONG)

        return (int(cols / ratio), int(rows / ratio))

    def add_lines_and_symbols(self, img, color_order):
        """
        Makes an expanded version of the final template, where each pixel is outlined with a
        black box and every 10 pixels there is a light blue line (the same as which shows up
        on the latch hook canvas). Also puts symbols (numbers) in each box corresponding to
        the numbers in the stats image.
        """
        square_width = 20
        rows, cols = img.shape[:2]
        new_img = cv2.resize(img, (cols * square_width, rows * square_width))
        for i in range(0, cols):
            for j in range(0, rows):
                pixel = img[j, i]
                for ii in range(0, square_width - 2):
                    for jj in range(0, square_width - 2):
                        new_img[j * square_width + jj, i * square_width + ii] = pixel
                if i % 10 == 9 and i > 0:
                    cv2.line(
                        new_img,
                        (i * square_width + square_width - 1, j * square_width),
                        (
                            i * square_width + square_width - 1,
                            j * square_width + square_width - 1,
                        ),
                        (255, 204, 51),
                        2,
                    )
                else:
                    cv2.line(
                        new_img,
                        (i * square_width + square_width - 1, j * square_width),
                        (
                            i * square_width + square_width - 1,
                            j * square_width + square_width - 1,
                        ),
                        (0, 0, 0),
                        2,
                    )
                if (j - rows) % 10 == 9 and j > 0:
                    cv2.line(
                        new_img,
                        (i * square_width, j * square_width + square_width - 1),
                        (
                            i * square_width + square_width - 1,
                            j * square_width + square_width - 1,
                        ),
                        (255, 204, 51),
                        2,
                    )
                else:
                    cv2.line(
                        new_img,
                        (i * square_width, j * square_width + square_width - 1),
                        (
                            i * square_width + square_width - 1,
                            j * square_width + square_width - 1,
                        ),
                        (0, 0, 0),
                        2,
                    )
                font = cv2.FONT_HERSHEY_SIMPLEX
                pixelStr = "%.2x%.2x%.2x" % (pixel[2], pixel[1], pixel[0])
                number_color = (0, 0, 0)
                if max(pixel) < 175:
                    number_color = (255, 255, 255)
                if color_order[pixelStr] < 10:
                    cv2.putText(
                        new_img,
                        str(color_order[pixelStr]),
                        (i * square_width + 6, j * square_width + 12),
                        font,
                        0.3,
                        number_color,
                        1,
                        cv2.LINE_AA,
                    )
                else:
                    cv2.putText(
                        new_img,
                        str(color_order[pixelStr]),
                        (i * square_width + 2, j * square_width + 12),
                        font,
                        0.3,
                        number_color,
                        1,
                        cv2.LINE_AA,
                    )

        return new_img

    def make_color_stats(self, img):
        """
        Given a final template image, calculates how many of each color are in the
        image (aka how much of each string color is needed). Returns an image that
        contains these numbers.
        """
        color_names = dict(
            ("%.2x%.2x%.2x" % (int(v[2]), int(v[1]), int(v[0])), k)
            for k, v in self.color_options.items()
        )
        colors = {}
        rows, cols = img.shape[:2]
        width = 20

        for i in range(0, cols):
            for j in range(0, rows):
                pixel = img[j, i]
                color = "%.2x%.2x%.2x" % (pixel[2], pixel[1], pixel[0])
                if color in colors:
                    colors[color] += 1
                else:
                    colors[color] = 1

        stats_img = np.ones((len(colors) * width, 250, 3), dtype=np.uint8) * 255
        color_order = {}
        i = 0
        for color, num_strings in colors.items():
            color_order[color] = i
            stats_img[i * width + 2 : i * width + 19, 2:19] = [
                [[int(color[4:6], 16), int(color[2:4], 16), int(color[0:2], 16)]] * 17
            ] * 17
            font = cv2.FONT_HERSHEY_SIMPLEX
            number_color = (0, 0, 0)
            if max(int(color[4:6], 16), int(color[2:4], 16), int(color[0:2], 16)) < 175:
                number_color = (255, 255, 255)
            if i >= 10:
                cv2.putText(
                    stats_img,
                    str(i),
                    (3, i * width + 15),
                    font,
                    0.3,
                    number_color,
                    1,
                    cv2.LINE_AA,
                )
            else:
                cv2.putText(
                    stats_img,
                    str(i),
                    (7, i * width + 15),
                    font,
                    0.3,
                    number_color,
                    1,
                    cv2.LINE_AA,
                )
            cv2.putText(
                stats_img,
                color_names[color]
                + " "
                + str(num_strings)
                + " strings, "
                + str(round(num_strings * 2.44 / (12 * 3), 1))
                + " yards",
                (25, i * width + 13),
                font,
                0.3,
                (0, 0, 0),
                1,
                cv2.LINE_AA,
            )
            i += 1

        return stats_img, color_order
