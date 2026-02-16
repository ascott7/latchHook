/**
 * Result from a color chooser algorithm
 */
export interface ColorChooserResult {
  /** 2D array of color indices [height][width], referencing the selectedColorIndices */
  grid: number[][];
  /** Indices of selected colors from the palette (0-based) */
  selectedColorIndices: number[];
  /** RGB pixel data of the resized and color-mapped image */
  pixels: Uint8ClampedArray;
  /** Width of the output image */
  width: number;
  /** Height of the output image */
  height: number;
}
