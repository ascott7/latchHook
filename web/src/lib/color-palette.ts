import colorNamesJson from '../../../public/color_names.json';
import convert from 'color-convert';

export interface PaletteEntry {
  name: string;
  bgr: [number, number, number];
  rgb: [number, number, number];
  lab: [number, number, number];
  hex: string;
}

/**
 * Converts BGR array to RGB array
 */
function bgrToRgb(bgr: [number, number, number]): [number, number, number] {
  return [bgr[2], bgr[1], bgr[0]];
}

/**
 * Converts RGB array to hex string
 */
function rgbToHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');
}

/**
 * Load and process the color palette with pre-computed LAB values
 */
function loadPalette(): PaletteEntry[] {
  const entries: PaletteEntry[] = [];

  for (const [name, bgr] of Object.entries(colorNamesJson)) {
    const bgrArray = bgr as [number, number, number];
    const rgb = bgrToRgb(bgrArray);
    const lab = convert.rgb.lab(rgb) as [number, number, number];
    const hex = rgbToHex(rgb);

    entries.push({
      name,
      bgr: bgrArray,
      rgb,
      lab,
      hex,
    });
  }

  return entries;
}

// Export pre-loaded palette entries
export const paletteEntries = loadPalette();

// Also export count for convenience
export const paletteSize = paletteEntries.length;
