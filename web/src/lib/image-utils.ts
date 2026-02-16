import sharp from 'sharp';

export interface ImageData {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Decode an image buffer to raw RGB pixel data
 */
export async function decodeImage(buffer: Buffer): Promise<ImageData> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to determine image dimensions');
  }

  const { data, info } = await image
    .ensureAlpha(0) // Remove alpha channel, set to fully opaque
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Convert RGBA to RGB by removing alpha channel
  const channels = info.channels;
  const pixels = new Uint8ClampedArray(info.width * info.height * 3);

  if (channels === 3) {
    // Already RGB
    pixels.set(data);
  } else if (channels === 4) {
    // RGBA -> RGB
    for (let i = 0; i < info.width * info.height; i++) {
      pixels[i * 3] = data[i * 4];
      pixels[i * 3 + 1] = data[i * 4 + 1];
      pixels[i * 3 + 2] = data[i * 4 + 2];
    }
  } else {
    throw new Error(`Unsupported number of channels: ${channels}`);
  }

  return {
    pixels,
    width: info.width,
    height: info.height,
  };
}

/**
 * Resize an image buffer to specified dimensions
 */
export async function resizeImage(
  buffer: Buffer,
  targetWidth: number,
  targetHeight: number
): Promise<ImageData> {
  const { data, info } = await sharp(buffer)
    .resize(targetWidth, targetHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: 'fill',
    })
    .ensureAlpha(0)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Convert to RGB
  const channels = info.channels;
  const pixels = new Uint8ClampedArray(targetWidth * targetHeight * 3);

  if (channels === 3) {
    pixels.set(data);
  } else if (channels === 4) {
    for (let i = 0; i < targetWidth * targetHeight; i++) {
      pixels[i * 3] = data[i * 4];
      pixels[i * 3 + 1] = data[i * 4 + 1];
      pixels[i * 3 + 2] = data[i * 4 + 2];
    }
  }

  return {
    pixels,
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * Encode RGB pixel data to PNG buffer
 */
export async function encodePng(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): Promise<Buffer> {
  return await sharp(Buffer.from(pixels), {
    raw: {
      width,
      height,
      channels: 3,
    },
  })
    .png()
    .toBuffer();
}

/**
 * Calculate output dimensions based on input dimensions and optional constraints
 *
 * Matches Python's get_dimentions() logic:
 * - If both width and height provided, use them
 * - If only width provided, calculate height to maintain aspect ratio
 * - If only height provided, calculate width to maintain aspect ratio
 * - If neither provided, set longer dimension to defaultLong (default 120)
 */
export function getDimensions(
  imageWidth: number,
  imageHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  defaultLong: number = 120
): Dimensions {
  if (targetWidth !== undefined && targetHeight !== undefined) {
    return { width: targetWidth, height: targetHeight };
  }

  let ratio: number;

  if (targetWidth !== undefined) {
    ratio = imageWidth / targetWidth;
  } else if (targetHeight !== undefined) {
    ratio = imageHeight / targetHeight;
  } else if (imageHeight > imageWidth) {
    ratio = imageHeight / defaultLong;
  } else {
    ratio = imageWidth / defaultLong;
  }

  return {
    width: Math.round(imageWidth / ratio),
    height: Math.round(imageHeight / ratio),
  };
}
