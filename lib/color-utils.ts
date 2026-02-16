import { PaletteEntry } from './color-palette';
import convert from 'color-convert';

/**
 * Calculate squared Euclidean distance between two LAB colors
 */
export function labDistanceSquared(
  lab1: [number, number, number],
  lab2: [number, number, number]
): number {
  const dL = lab1[0] - lab2[0];
  const dA = lab1[1] - lab2[1];
  const dB = lab1[2] - lab2[2];
  return dL * dL + dA * dA + dB * dB;
}

/**
 * Convert RGB pixel data to LAB color space
 * pixels: flat array of RGB values [r,g,b,r,g,b,...]
 * Returns: array of LAB values [l,a,b,l,a,b,...]
 */
export function rgbToLabArray(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): Float64Array {
  const numPixels = width * height;
  const labArray = new Float64Array(numPixels * 3);

  for (let i = 0; i < numPixels; i++) {
    const pixelIdx = i * 3;
    const r = pixels[pixelIdx];
    const g = pixels[pixelIdx + 1];
    const b = pixels[pixelIdx + 2];
    const lab = convert.rgb.lab([r, g, b]) as [number, number, number];
    labArray[pixelIdx] = lab[0];
    labArray[pixelIdx + 1] = lab[1];
    labArray[pixelIdx + 2] = lab[2];
  }

  return labArray;
}

/**
 * Compute squared LAB distance between each pixel and each palette color
 *
 * Returns a flat Float64Array of size (width * height * numColors) where
 * differences[pixelIdx * numColors + colorIdx] is the squared LAB distance
 * between pixel at pixelIdx and palette color at colorIdx
 */
export function getColorDifferences(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  palette: PaletteEntry[]
): Float64Array {
  const numPixels = width * height;
  const numColors = palette.length;
  const differences = new Float64Array(numPixels * numColors);

  // Convert all pixels to LAB
  const pixelLabs = rgbToLabArray(pixels, width, height);

  // For each pixel, compute distance to each palette color
  for (let pixelIdx = 0; pixelIdx < numPixels; pixelIdx++) {
    const labIdx = pixelIdx * 3;
    const pixelLab: [number, number, number] = [
      pixelLabs[labIdx],
      pixelLabs[labIdx + 1],
      pixelLabs[labIdx + 2],
    ];

    for (let colorIdx = 0; colorIdx < numColors; colorIdx++) {
      const distance = labDistanceSquared(pixelLab, palette[colorIdx].lab);
      differences[pixelIdx * numColors + colorIdx] = distance;
    }
  }

  return differences;
}

/**
 * Calculate total cost (sum of minimum LAB distances) for a set of selected colors
 *
 * selectedColors: array of length numColors where 1.0 = selected, NaN = not selected
 * differences: result from getColorDifferences()
 */
export function calculateTotalCost(
  differences: Float64Array,
  selectedColors: Float64Array,
  numPixels: number,
  numColors: number
): number {
  let totalCost = 0;

  for (let pixelIdx = 0; pixelIdx < numPixels; pixelIdx++) {
    let minDistance = Infinity;

    for (let colorIdx = 0; colorIdx < numColors; colorIdx++) {
      const isSelected = selectedColors[colorIdx];
      if (!isNaN(isSelected)) {
        const distance = differences[pixelIdx * numColors + colorIdx];
        if (distance < minDistance) {
          minDistance = distance;
        }
      }
    }

    totalCost += minDistance;
  }

  return totalCost;
}

/**
 * Quantize an image by replacing each pixel with the nearest palette color
 *
 * Returns a Uint8ClampedArray of RGB values (same format as input)
 */
export function quantizeImage(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  palette: PaletteEntry[]
): Uint8ClampedArray {
  const numPixels = width * height;
  const numColors = palette.length;
  const result = new Uint8ClampedArray(numPixels * 3);

  // Get LAB values for all pixels
  const pixelLabs = rgbToLabArray(pixels, width, height);

  // For each pixel, find the closest palette color
  for (let pixelIdx = 0; pixelIdx < numPixels; pixelIdx++) {
    const labIdx = pixelIdx * 3;
    const pixelLab: [number, number, number] = [
      pixelLabs[labIdx],
      pixelLabs[labIdx + 1],
      pixelLabs[labIdx + 2],
    ];

    let minDistance = Infinity;
    let closestColorIdx = 0;

    for (let colorIdx = 0; colorIdx < numColors; colorIdx++) {
      const distance = labDistanceSquared(pixelLab, palette[colorIdx].lab);
      if (distance < minDistance) {
        minDistance = distance;
        closestColorIdx = colorIdx;
      }
    }

    // Set the pixel to the closest color's RGB value
    const rgbIdx = pixelIdx * 3;
    const closestRgb = palette[closestColorIdx].rgb;
    result[rgbIdx] = closestRgb[0];
    result[rgbIdx + 1] = closestRgb[1];
    result[rgbIdx + 2] = closestRgb[2];
  }

  return result;
}

/**
 * Get the index of the closest palette color for each pixel
 * Returns array of color indices (0 to palette.length-1)
 */
export function getClosestColorIndices(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  palette: PaletteEntry[]
): Uint16Array {
  const numPixels = width * height;
  const numColors = palette.length;
  const indices = new Uint16Array(numPixels);

  // Get LAB values for all pixels
  const pixelLabs = rgbToLabArray(pixels, width, height);

  // For each pixel, find the closest palette color
  for (let pixelIdx = 0; pixelIdx < numPixels; pixelIdx++) {
    const labIdx = pixelIdx * 3;
    const pixelLab: [number, number, number] = [
      pixelLabs[labIdx],
      pixelLabs[labIdx + 1],
      pixelLabs[labIdx + 2],
    ];

    let minDistance = Infinity;
    let closestColorIdx = 0;

    for (let colorIdx = 0; colorIdx < numColors; colorIdx++) {
      const distance = labDistanceSquared(pixelLab, palette[colorIdx].lab);
      if (distance < minDistance) {
        minDistance = distance;
        closestColorIdx = colorIdx;
      }
    }

    indices[pixelIdx] = closestColorIdx;
  }

  return indices;
}
