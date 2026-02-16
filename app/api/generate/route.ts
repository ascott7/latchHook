import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { paletteEntries } from '@/lib/color-palette';
import { decodeImage, resizeImage, encodePng, getDimensions } from '@/lib/image-utils';
import { greedyChooseColors } from '@/lib/choosers/greedy-chooser';
import { maxPoolChooseColors } from '@/lib/choosers/max-pool-chooser';

// Set max duration for Vercel Hobby plan (10 seconds)
export const maxDuration = 10;

interface ColorInfo {
  index: number;
  name: string;
  hex: string;
  rgb: [number, number, number];
  count: number;
  yardage: number;
}

interface GenerateResponse {
  preview: string;
  grid: number[][];
  dimensions: {
    width: number;
    height: number;
  };
  colors: ColorInfo[];
  totalStrings: number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const imageFile = formData.get('image') as File | null;
    const widthStr = formData.get('width') as string | null;
    const heightStr = formData.get('height') as string | null;
    const clustersStr = formData.get('clusters') as string | null;
    const method = formData.get('method') as string | null;

    // Validate required fields
    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    if (!clustersStr) {
      return NextResponse.json(
        { error: 'Number of colors (clusters) is required' },
        { status: 400 }
      );
    }

    const numColors = parseInt(clustersStr, 10);
    if (isNaN(numColors) || numColors < 2 || numColors > 25) {
      return NextResponse.json(
        { error: 'Number of colors must be between 2 and 25' },
        { status: 400 }
      );
    }

    const targetWidth = widthStr ? parseInt(widthStr, 10) : undefined;
    const targetHeight = heightStr ? parseInt(heightStr, 10) : undefined;

    if (
      (targetWidth !== undefined && (isNaN(targetWidth) || targetWidth < 20 || targetWidth > 120)) ||
      (targetHeight !== undefined && (isNaN(targetHeight) || targetHeight < 20 || targetHeight > 120))
    ) {
      return NextResponse.json(
        { error: 'Dimensions must be between 20 and 120 pixels' },
        { status: 400 }
      );
    }

    const algorithmMethod = method || 'greedy';
    if (algorithmMethod !== 'greedy' && algorithmMethod !== 'mpr') {
      return NextResponse.json(
        { error: 'Method must be "greedy" or "mpr"' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Decode image to get original dimensions
    const originalImage = await decodeImage(imageBuffer);

    // Calculate target dimensions
    const dimensions = getDimensions(
      originalImage.width,
      originalImage.height,
      targetWidth,
      targetHeight,
      80 // Default to 80 instead of 120 for performance
    );

    // Resize image
    const resizedImage = await resizeImage(
      imageBuffer,
      dimensions.width,
      dimensions.height
    );

    // Run color selection algorithm
    let result;
    if (algorithmMethod === 'mpr') {
      result = maxPoolChooseColors(
        originalImage.pixels,
        originalImage.width,
        originalImage.height,
        dimensions.width,
        dimensions.height,
        paletteEntries,
        numColors
      );
    } else {
      result = greedyChooseColors(
        resizedImage.pixels,
        dimensions.width,
        dimensions.height,
        paletteEntries,
        numColors
      );
    }

    // Generate preview image (base64 PNG) — upscaled 2x with nearest neighbor
    const previewBuffer = await sharp(Buffer.from(result.pixels), {
      raw: { width: result.width, height: result.height, channels: 3 },
    })
      .resize(result.width * 2, result.height * 2, { kernel: sharp.kernel.nearest })
      .png()
      .toBuffer();
    const previewBase64 = `data:image/png;base64,${previewBuffer.toString('base64')}`;

    // Calculate string counts for each color
    const colorCounts = new Map<number, number>();
    for (const row of result.grid) {
      for (const colorIdx of row) {
        colorCounts.set(colorIdx, (colorCounts.get(colorIdx) || 0) + 1);
      }
    }

    // Build colors array with statistics
    const colors: ColorInfo[] = result.selectedColorIndices.map(
      (paletteIdx, selectedIdx) => {
        const entry = paletteEntries[paletteIdx];
        const count = colorCounts.get(selectedIdx) || 0;
        // Yardage calculation: (count * 2.44 inches) / 36 inches per yard
        const yardage = (count * 2.44) / 36;

        return {
          index: selectedIdx,
          name: entry.name,
          hex: entry.hex,
          rgb: entry.rgb,
          count,
          yardage: Math.round(yardage * 100) / 100, // Round to 2 decimal places
        };
      }
    );

    const totalStrings = result.width * result.height;

    const response: GenerateResponse = {
      preview: previewBase64,
      grid: result.grid,
      dimensions: {
        width: result.width,
        height: result.height,
      },
      colors,
      totalStrings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
