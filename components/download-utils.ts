interface Color {
  index: number;
  name: string;
  hex: string;
  rgb: [number, number, number];
  count: number;
  yardage: number;
}

/**
 * Determine text color (black or white) based on background brightness
 */
function getTextColor(rgb: [number, number, number]): string {
  const maxVal = Math.max(...rgb);
  return maxVal < 175 ? 'white' : 'black';
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download the template grid as a PNG
 */
export function downloadTemplateImage(
  grid: number[][],
  colors: Color[],
  dimensions: { width: number; height: number }
): void {
  const cellSize = 20;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Unable to get canvas context');
  }

  canvas.width = dimensions.width * cellSize;
  canvas.height = dimensions.height * cellSize;

  // Draw each cell
  for (let y = 0; y < dimensions.height; y++) {
    for (let x = 0; x < dimensions.width; x++) {
      const colorIdx = grid[y][x];
      const color = colors[colorIdx];
      const cellX = x * cellSize;
      const cellY = y * cellSize;

      // Fill cell with color
      ctx.fillStyle = color.hex;
      ctx.fillRect(cellX, cellY, cellSize, cellSize);

      // Draw cell border
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.strokeRect(cellX, cellY, cellSize, cellSize);

      // Draw thicker blue lines every 10 cells
      if ((x + 1) % 10 === 0 && x + 1 < dimensions.width) {
        ctx.strokeStyle = '#3399cc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cellX + cellSize, cellY);
        ctx.lineTo(cellX + cellSize, cellY + cellSize);
        ctx.stroke();
      }

      if ((y + 1) % 10 === 0 && y + 1 < dimensions.height) {
        ctx.strokeStyle = '#3399cc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cellX, cellY + cellSize);
        ctx.lineTo(cellX + cellSize, cellY + cellSize);
        ctx.stroke();
      }

      // Draw color index number
      ctx.fillStyle = getTextColor(color.rgb);
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        colorIdx.toString(),
        cellX + cellSize / 2,
        cellY + cellSize / 2
      );
    }
  }

  // Convert to blob and download
  canvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, 'latch-hook-template.png');
    }
  });
}

/**
 * Generate and download the color statistics as a PNG
 */
export function downloadStatsImage(
  colors: Color[],
  totalStrings: number
): void {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Unable to get canvas context');
  }

  const swatchSize = 40;
  const rowHeight = 60;
  const padding = 20;
  const textX = swatchSize + 20;

  canvas.width = 800;
  canvas.height = colors.length * rowHeight + padding * 2 + 100;

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = 'black';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Latch Hook Materials List', padding, padding + 24);

  // Column headers
  const headerY = padding + 60;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Color', padding, headerY);
  ctx.fillText('Index', textX, headerY);
  ctx.fillText('Name', textX + 60, headerY);
  ctx.fillText('Strings', textX + 250, headerY);
  ctx.fillText('Yardage', textX + 350, headerY);

  // Draw each color row
  let y = headerY + 30;
  for (const color of colors) {
    // Color swatch
    ctx.fillStyle = color.hex;
    ctx.fillRect(padding, y, swatchSize, swatchSize);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, y, swatchSize, swatchSize);

    // Color info
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(color.index.toString(), textX, y + 25);

    ctx.font = '14px sans-serif';
    ctx.fillText(color.name, textX + 60, y + 15);
    ctx.font = '12px sans-serif';
    ctx.fillText(color.hex, textX + 60, y + 35);

    ctx.font = '14px sans-serif';
    ctx.fillText(color.count.toLocaleString(), textX + 250, y + 25);
    ctx.fillText(`${color.yardage.toFixed(2)} yd`, textX + 350, y + 25);

    y += rowHeight;
  }

  // Total
  y += 10;
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(canvas.width - padding, y);
  ctx.stroke();

  y += 30;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Total:', textX + 150, y);
  ctx.fillText(totalStrings.toLocaleString(), textX + 250, y);
  const totalYardage = colors.reduce((sum, c) => sum + c.yardage, 0);
  ctx.fillText(`${totalYardage.toFixed(2)} yd`, textX + 350, y);

  // Convert to blob and download
  canvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, 'latch-hook-materials.png');
    }
  });
}

/**
 * Download the preview image from base64 data URL
 */
export function downloadPreviewImage(previewDataUrl: string): void {
  fetch(previewDataUrl)
    .then((res) => res.blob())
    .then((blob) => {
      downloadBlob(blob, 'latch-hook-preview.png');
    });
}

/**
 * Download all three images
 */
export function downloadAll(
  previewDataUrl: string,
  grid: number[][],
  colors: Color[],
  dimensions: { width: number; height: number },
  totalStrings: number
): void {
  downloadPreviewImage(previewDataUrl);
  setTimeout(() => {
    downloadTemplateImage(grid, colors, dimensions);
  }, 100);
  setTimeout(() => {
    downloadStatsImage(colors, totalStrings);
  }, 200);
}
