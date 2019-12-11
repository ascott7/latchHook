#from sklearn.cluster import MiniBatchKMeans
import numpy as np
from numpy import array, uint8
import argparse
import cv2, os

COLOR_NAMES_FILE = 'color_names.txt'

def resize2(img, args):
    """
    Resizes an image based on user input. If the user enters a width and/or
    height, these are used to calculate the new image size. If neither are
    entered, the longer dimension is set to 120 pixels and the shorter dimention
    is calculated to maintain the aspect ratio.
    """
    DEFAULT_LONG = 120
    rows, cols = img.shape[:2]

    if args["width"] is not None and args["height"] is not None:
        return cv2.resize(img, (args["width"], args["height"]), interpolation=cv2.INTER_AREA)

    elif args["width"] is not None:
        ratio = cols / float(args["width"])
    elif args["height"] is not None:
        ratio = rows / float(args["height"])
    elif rows > cols:
        ratio = rows / float(DEFAULT_LONG)
    else:
        ratio = cols / float(DEFAULT_LONG)

    return cv2.resize(img, (int(cols / ratio), int(rows / ratio)), interpolation=cv2.INTER_AREA)


"""def cluster_img(image, n_clusters):
    # load the image and grab its width and height
    (h, w) = image.shape[:2]

    # convert the image from the RGB color space to the L*a*b*
    # color space -- since we will be clustering using k-means
    # which is based on the euclidean distance, we'll use the
    # L*a*b* color space where the euclidean distance implies
    # perceptual meaning
    image = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    image = image.reshape((image.shape[0] * image.shape[1], 3))

    # apply k-means using the specified number of clusters and
    # then create the quantized image based on the predictions
    clt = MiniBatchKMeans(n_clusters = n_clusters)
    labels = clt.fit_predict(image)
    quant = clt.cluster_centers_.astype("uint8")[labels]
 
    # reshape the feature vectors to images
    quant = quant.reshape((h, w, 3))
    image = image.reshape((h, w, 3))
 
    # convert from L*a*b* to RGB
    quant = cv2.cvtColor(quant, cv2.COLOR_LAB2BGR)
    image = cv2.cvtColor(image, cv2.COLOR_LAB2BGR)

    return quant
"""
"""def cga_quantize(img, num_colors, options):
    cv2.imwrite('tmp_cv_out.png', img)
    #pal_image= Image.new("P", (1,1))
    img = Image.open('tmp_cv_out.png')
    palette = []
    palette_img = np.zeros((1, len(options), 3))
    i = 0
    for _, key in options.items():
        palette.extend([int(key[2]), int(key[1]), int(key[0])])
        palette_img[0][i] = key
        i += 1
    cv2.imwrite('palette_img.png', palette_img)
    print('starting quatization')
    #pal_image= Image.new("P", (1,1))
    #pal_image.putpalette(palette)
    pal_image = Image.open('palette_img.png')
    pal_image = pal_image.quantize(colors=len(options))
    #palette_obj = ImagePalette.ImagePalette(palette=palette, size=len(options)*3)
    #new_img = quantizetopalette(img, palette=pal_image)
    new_img = img.convert('P', palette=pal_image, dither=None)
    new_img.save('tmp_pil_out.png', "PNG")
    print('quantization done')
    cv_img = cv2.imread('tmp_pil_out.png')
    return cv_img
"""
def quantize_img_num(img, num_colors, options):
    """
    Given an image, a number of colors to use and a dictionary of colors of the form
    {colorname: color BGR val} returns an image that contains at most num_colors
    colors, all of which come from the dictionary of colors.
    """
    ret_img = None
    for n in range(len(options) - num_colors + 1):
        colors = {}

        # find the best color match for each pixel
        ret_img = quantize_img(img, options)
        rows, cols = ret_img.shape[:2]
        
        # count the number of each color that we have
        for i in range(0, cols):
            for j in range(0, rows):
                pixel = ret_img[j, i]
                color = '%.2x%.2x%.2x' % (pixel[2], pixel[1], pixel[0])
                if color in colors:
                    colors[color] += 1
                else:
                    colors[color] = 1

        # prepare to remove least used color from palette
        minColorNum, minColor = float('inf'), None
        for key, val in colors.items():
            
            if val < minColorNum and key != '000000':
                minColor = key
                minColorNum = val
                
        # remove any colors that weren't used at all
        colorOptions = options.copy()
        for colorName, colorVal in colorOptions.items():
            valName = '%.2x%.2x%.2x' % (colorVal[2], colorVal[1], colorVal[0])
            if valName not in colors:
                del options[colorName]

        # if we are at or below the target number of colors, we are done
        if len(options) <= num_colors:
            break
        
        # otherwise remove the least used color and keep going
        for colorName, colorVal in options.items():
            valName = '%.2x%.2x%.2x' % (colorVal[2], colorVal[1], colorVal[0])
            if valName == minColor:
                del options[colorName]
                break
    return ret_img
    

def quantize_img(img, options):
    """
    Given an image and a dictionary of the form {colorname: BGR val}, returns an image
    where every pixel has been replaced by the most similar color in the dictionary.
    Similarity is determined by squared distance in the L*A*B* color space. 
    """
    n_colors = len(options)
    rows,cols = img.shape[:2]

    lab_img = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    for n in range(len(options) - n_colors + 1):
        # create differences array, img_size x number of colors being considered
        differences = np.zeros((rows, cols, len(options) - n), np.int32)
        full_color_regions = np.zeros((rows, cols, 3, len(options) - n), np.uint8)

        # for each color, make an image of entirely that color and take the squared
        # distance ((r1-r2)^2 + (g1-b2)^2 + (b1-b2)^2) between the corresponding pixels
        # in the image and the solid color image
        i = 0
        for name, color in options.items():
            solid_img = np.zeros((rows, cols, 3), np.uint8)
            solid_img[:, :, :] = color
            full_color_regions[:, :, :, i] = solid_img
            solid_img_lab = cv2.cvtColor(solid_img, cv2.COLOR_BGR2LAB)
            diff = lab_img.astype("float") - solid_img_lab.astype("float")
            diff = diff**2
            differences[:, :, i] = np.sum(diff, axis=2)
            i += 1

        new_img = np.zeros((rows, cols, 3), np.uint8)

        # get the min difference, aka the closest color match, for each pixel in the image
        min_indices = np.argmin(differences, axis=2)
        x, y = np.indices(min_indices.shape)

        # the new image becomes the best match for each pixel
        new_img = full_color_regions[x, y, :, min_indices]
                
    return new_img

def add_lines_and_symbols(img, color_order):
    """
    Makes an expanded version of the final template, where each pixel is outlined with a
    black box and every 10 pixels there is a light blue line (the same as which shows up
    on the latch hook canvas). Also puts symbols (numbers) in each box corresponding to
    the numbers in the stats image.
    """
    square_width = 20
    rows, cols = img.shape[:2]
    new_img = cv2.resize(img, (cols*square_width, rows*square_width))
    for i in range(0, cols):
        for j in range(0, rows):
            pixel = img[j, i]
            for ii in range(0, square_width - 2):
                for jj in range(0, square_width - 2):
                    new_img[j*square_width + jj, i*square_width + ii] = pixel
            if i % 10 == 9 and i > 0:
                cv2.line(new_img, (i*square_width+square_width-1, j*square_width), (i*square_width+square_width-1, j*square_width+square_width-1), (255,204,51), 2)
            else:
                cv2.line(new_img, (i*square_width+square_width-1, j*square_width), (i*square_width+square_width-1, j*square_width+square_width-1), (0,0,0), 2)
            if j % 10 == 9 and j > 0:
                cv2.line(new_img, (i*square_width, j*square_width+square_width-1), (i*square_width+square_width-1, j*square_width+square_width-1), (255,204,51), 2)
            else:
                cv2.line(new_img, (i*square_width, j*square_width+square_width-1), (i*square_width+square_width-1, j*square_width+square_width-1), (0,0,0), 2)
            font = cv2.FONT_HERSHEY_SIMPLEX
            pixelStr = '%.2x%.2x%.2x' % (pixel[2], pixel[1], pixel[0])
            number_color = (0, 0, 0)
            if max(pixel) < 175:
                number_color = (255, 255, 255)
            if color_order[pixelStr] < 10:
                cv2.putText(new_img, str(color_order[pixelStr]), (i*square_width+6, j*square_width+12), font, 0.3,number_color,1,cv2.LINE_AA)
            else:
                cv2.putText(new_img, str(color_order[pixelStr]), (i*square_width+2, j*square_width+12), font, 0.3,number_color,1,cv2.LINE_AA)


    return new_img

def make_color_stats(img):
    """
    Given a final template image, calculates how many of each color are in the
    image (aka how much of each string color is needed). Returns an image that
    contains these numbers.
    """
    color_names = eval(open(COLOR_NAMES_FILE, 'r').read())
    color_names = dict(('%.2x%.2x%.2x'%(int(v[2]), int(v[1]), int(v[0])),k) for k,v in color_names.items())
    colors = {}
    rows,cols = img.shape[:2]
    width = 20
    
    for i in range(0, cols):
        for j in range(0, rows):
            pixel = img[j, i]
            color = '%.2x%.2x%.2x' % (pixel[2], pixel[1], pixel[0])
            if color in colors:
                colors[color] += 1
            else:
                colors[color] = 1
                
    stats_img = np.ones((len(colors)*width, 250, 3), dtype=np.uint8)*255
    color_order = {}
    i = 0
    for color, num_strings in colors.items():
        color_order[color] = i
        stats_img[i*width + 2: i*width + 19, 2:19] = [[[int(color[4:6], 16), int(color[2:4], 16), int(color[0:2], 16)]] * 17] * 17
        font = cv2.FONT_HERSHEY_SIMPLEX
        number_color = (0, 0, 0)
        if max(int(color[4:6], 16), int(color[2:4], 16), int(color[0:2], 16)) < 175:
            number_color = (255, 255, 255)
        if i >= 10:
            cv2.putText(stats_img, str(i), (3, i*width+15), font, 0.3,number_color,1,cv2.LINE_AA)
        else:
            cv2.putText(stats_img, str(i), (7, i*width+15), font, 0.3,number_color,1,cv2.LINE_AA)
        cv2.putText(stats_img,color_names[color] + ' ' + str(num_strings) + ' strings, ' +
                    str(round(num_strings * 2.44/(12*3), 1)) + ' yards', (25,i*width+13), font, 0.3,(0,0,0),1,cv2.LINE_AA)
        i += 1

    return stats_img, color_order

if __name__ == "__main__":
    # construct the argument parser and parse the arguments
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--image", required = True, help = "Path to the image")
    ap.add_argument("-c", "--clusters", required = True, type = int,
	            help = "# of clusters")
    ap.add_argument("-w", "--width", required = False, type = int,
                    help = "width of output template in pixels")
    ap.add_argument("-hi", "--height", required = False, type = int,
                    help = "height of output template in pixels")
    args = vars(ap.parse_args())
    img = cv2.imread(args["image"])
    img_name = os.path.splitext(args["image"])[0]

    options = eval(open(COLOR_NAMES_FILE, 'r').read())
    
    img = resize2(img, args)
    cv2.imwrite(img_name + '_resized.png', img)
    color_img = quantize_img_num(img, args["clusters"], options)
    cv2.imwrite(img_name + "_chosen_colors_no_grid.png", color_img)
    stats_img, color_order = make_color_stats(color_img)
    cv2.imwrite(img_name + "_stats_img.png", stats_img)

    lined_img = add_lines_and_symbols(color_img, color_order)
    cv2.imwrite(img_name + "_chosen_colors.png", lined_img)
