import { PaletteEntry } from '../color-palette';
import { getColorDifferences, calculateTotalCost } from '../color-utils';
import { ColorChooserResult } from './types';

/**
 * Greedy color selection algorithm
 *
 * Starts with the first N colors selected, then iteratively tries swapping
 * each selected color with each unselected color, keeping swaps that reduce
 * the total LAB color distance.
 */
export function greedyChooseColors(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  palette: PaletteEntry[],
  numColors: number
): ColorChooserResult {
  const numPaletteColors = palette.length;
  const numPixels = width * height;

  // Initialize: first numColors are selected (1.0), rest are NaN
  const bestSelectedColors = new Float64Array(numPaletteColors);
  for (let i = 0; i < numColors; i++) {
    bestSelectedColors[i] = 1.0;
  }
  for (let i = numColors; i < numPaletteColors; i++) {
    bestSelectedColors[i] = NaN;
  }

  // Compute color differences for all pixels
  const differences = getColorDifferences(pixels, width, height, palette);

  // Calculate initial cost
  let bestCost = calculateTotalCost(
    differences,
    bestSelectedColors,
    numPixels,
    numPaletteColors
  );

  // Try swapping each unselected color with each selected color
  for (let i = numColors; i < numPaletteColors; i++) {
    // For each currently selected color, try replacing it with color i
    for (let j = 0; j < numPaletteColors; j++) {
      if (bestSelectedColors[j] === 1.0) {
        // Create a new selection by swapping j and i
        const newSelection = bestSelectedColors.slice();
        newSelection[j] = NaN;
        newSelection[i] = 1.0;

        // Calculate cost of this new selection
        const cost = calculateTotalCost(
          differences,
          newSelection,
          numPixels,
          numPaletteColors
        );

        // Keep the swap if it improves the cost
        if (cost < bestCost) {
          bestCost = cost;
          bestSelectedColors.set(newSelection);
        }
      }
    }
  }

  // Build list of selected color indices
  const selectedColorIndices: number[] = [];
  for (let i = 0; i < numPaletteColors; i++) {
    if (bestSelectedColors[i] === 1.0) {
      selectedColorIndices.push(i);
    }
  }

  // Map each pixel to the closest selected color
  const grid: number[][] = Array(height)
    .fill(0)
    .map(() => Array(width).fill(0));

  for (let pixelIdx = 0; pixelIdx < numPixels; pixelIdx++) {
    let minDistance = Infinity;
    let closestSelectedIdx = 0;

    for (let i = 0; i < selectedColorIndices.length; i++) {
      const colorIdx = selectedColorIndices[i];
      const distance = differences[pixelIdx * numPaletteColors + colorIdx];
      if (distance < minDistance) {
        minDistance = distance;
        closestSelectedIdx = i;
      }
    }

    const y = Math.floor(pixelIdx / width);
    const x = pixelIdx % width;
    grid[y][x] = closestSelectedIdx;
  }

  // Build RGB pixel data for the color-mapped image
  const resultPixels = new Uint8ClampedArray(numPixels * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIdx = y * width + x;
      const selectedIdx = grid[y][x];
      const paletteIdx = selectedColorIndices[selectedIdx];
      const rgb = palette[paletteIdx].rgb;

      const rgbIdx = pixelIdx * 3;
      resultPixels[rgbIdx] = rgb[0];
      resultPixels[rgbIdx + 1] = rgb[1];
      resultPixels[rgbIdx + 2] = rgb[2];
    }
  }

  return {
    grid,
    selectedColorIndices,
    pixels: resultPixels,
    width,
    height,
  };
}
