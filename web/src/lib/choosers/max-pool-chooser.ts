import { PaletteEntry } from '../color-palette';
import { quantizeImage, getClosestColorIndices } from '../color-utils';
import { ColorChooserResult } from './types';

/**
 * Calculate which original pixels contribute to a resized output pixel
 * and their fractional area coverage per color
 */
function calcSquareComponents(
  quantizedIndices: Uint16Array,
  origWidth: number,
  origHeight: number,
  resizedCol: number,
  resizedRow: number,
  targetWidth: number,
  targetHeight: number,
  numColors: number
): Float64Array {
  const colFrac = origWidth / targetWidth;
  const rowFrac = origHeight / targetHeight;

  const newColStart = colFrac * resizedCol;
  const newColEnd = colFrac * (resizedCol + 1);
  const newRowStart = rowFrac * resizedRow;
  const newRowEnd = rowFrac * (resizedRow + 1);

  const coverage = new Float64Array(numColors);

  for (
    let origCol = Math.floor(newColStart);
    origCol < Math.ceil(newColEnd);
    origCol++
  ) {
    for (
      let origRow = Math.floor(newRowStart);
      origRow < Math.ceil(newRowEnd);
      origRow++
    ) {
      const coveredWidth =
        Math.min(origCol + 1, newColEnd) - Math.max(origCol, newColStart);
      const coveredHeight =
        Math.min(origRow + 1, newRowEnd) - Math.max(origRow, newRowStart);

      const pixelIdx = origRow * origWidth + origCol;
      const colorIdx = quantizedIndices[pixelIdx];
      coverage[colorIdx] += coveredWidth * coveredHeight;
    }
  }

  return coverage;
}

/**
 * Calculate total score (sum of max coverage scores) for selected colors
 */
function calculateTotalScore(
  scores: Float64Array,
  selectedColors: Float64Array,
  numPixels: number,
  numColors: number
): number {
  let totalScore = 0;

  for (let pixelIdx = 0; pixelIdx < numPixels; pixelIdx++) {
    let maxScore = 0;

    for (let colorIdx = 0; colorIdx < numColors; colorIdx++) {
      if (selectedColors[colorIdx] === 1.0) {
        const score = scores[pixelIdx * numColors + colorIdx];
        if (score > maxScore) {
          maxScore = score;
        }
      }
    }

    totalScore += maxScore;
  }

  return totalScore;
}

/**
 * Max pool resize color chooser
 *
 * Quantizes the full-resolution image to palette colors, then uses max-pooling
 * during resize (chooses color covering largest area in each output pixel).
 * Uses greedy swapping to select best color subset that maximizes coverage.
 */
export function maxPoolChooseColors(
  pixels: Uint8ClampedArray,
  origWidth: number,
  origHeight: number,
  targetWidth: number,
  targetHeight: number,
  palette: PaletteEntry[],
  numColors: number
): ColorChooserResult {
  const numPaletteColors = palette.length;
  const numPixels = targetWidth * targetHeight;

  // Quantize full-resolution image to palette colors
  const quantizedIndices = getClosestColorIndices(
    pixels,
    origWidth,
    origHeight,
    palette
  );

  // Build scores matrix: scores[pixelIdx * numColors + colorIdx] = coverage
  const scores = new Float64Array(numPixels * numPaletteColors);

  for (let resizedCol = 0; resizedCol < targetWidth; resizedCol++) {
    for (let resizedRow = 0; resizedRow < targetHeight; resizedRow++) {
      const coverage = calcSquareComponents(
        quantizedIndices,
        origWidth,
        origHeight,
        resizedCol,
        resizedRow,
        targetWidth,
        targetHeight,
        numPaletteColors
      );

      const pixelIdx = resizedRow * targetWidth + resizedCol;
      for (let colorIdx = 0; colorIdx < numPaletteColors; colorIdx++) {
        scores[pixelIdx * numPaletteColors + colorIdx] = coverage[colorIdx];
      }
    }
  }

  // Initialize: first numColors selected (1.0), rest are 0
  const bestSelectedColors = new Float64Array(numPaletteColors);
  for (let i = 0; i < numColors; i++) {
    bestSelectedColors[i] = 1.0;
  }

  // Calculate initial score
  let bestScore = calculateTotalScore(
    scores,
    bestSelectedColors,
    numPixels,
    numPaletteColors
  );

  // Try swapping each unselected color with each selected color
  for (let i = numColors; i < numPaletteColors; i++) {
    // Skip colors with zero score
    let colorScore = 0;
    for (let pixelIdx = 0; pixelIdx < numPixels; pixelIdx++) {
      colorScore += scores[pixelIdx * numPaletteColors + i];
    }
    if (colorScore === 0) {
      continue;
    }

    // For each currently selected color, try replacing it with color i
    for (let j = 0; j < numPaletteColors; j++) {
      if (bestSelectedColors[j] === 1.0) {
        // Create a new selection by swapping j and i
        const newSelection = bestSelectedColors.slice();
        newSelection[j] = 0;
        newSelection[i] = 1.0;

        // Calculate score of this new selection
        const score = calculateTotalScore(
          scores,
          newSelection,
          numPixels,
          numPaletteColors
        );

        // Keep the swap if it improves the score
        if (score > bestScore) {
          bestScore = score;
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

  // Map each pixel to the selected color with highest score
  const grid: number[][] = Array(targetHeight)
    .fill(0)
    .map(() => Array(targetWidth).fill(0));

  for (let pixelIdx = 0; pixelIdx < numPixels; pixelIdx++) {
    let maxScore = -1;
    let bestSelectedIdx = 0;

    for (let i = 0; i < selectedColorIndices.length; i++) {
      const colorIdx = selectedColorIndices[i];
      const score = scores[pixelIdx * numPaletteColors + colorIdx];
      if (score > maxScore) {
        maxScore = score;
        bestSelectedIdx = i;
      }
    }

    const y = Math.floor(pixelIdx / targetWidth);
    const x = pixelIdx % targetWidth;
    grid[y][x] = bestSelectedIdx;
  }

  // Build RGB pixel data for the color-mapped image
  const resultPixels = new Uint8ClampedArray(numPixels * 3);
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const pixelIdx = y * targetWidth + x;
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
    width: targetWidth,
    height: targetHeight,
  };
}
