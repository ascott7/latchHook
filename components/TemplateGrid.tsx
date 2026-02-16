'use client';

import { useState } from 'react';

interface Color {
  index: number;
  name: string;
  hex: string;
  rgb: [number, number, number];
}

interface TemplateGridProps {
  grid: number[][];
  colors: Color[];
  dimensions: { width: number; height: number };
}

export function TemplateGrid({ grid, colors, dimensions }: TemplateGridProps) {
  const [zoom, setZoom] = useState<number>(1);

  // Determine text color based on background brightness
  const getTextColor = (rgb: [number, number, number]): string => {
    const maxVal = Math.max(...rgb);
    return maxVal < 175 ? 'white' : 'black';
  };

  // Cell size in pixels
  const baseCellSize = 20;
  const cellSize = baseCellSize * zoom;

  return (
    <div className="flex flex-col gap-4">
      {/* Zoom Controls */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Zoom:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            disabled={zoom <= 0.5}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            −
          </button>
          <span className="px-3 py-1 min-w-[60px] text-center border border-gray-200 rounded bg-gray-50">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            disabled={zoom >= 3}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="border border-gray-300 rounded-lg overflow-auto max-h-[600px] bg-white">
        <div
          className="inline-block p-4"
          style={{
            width: 'fit-content',
          }}
        >
          <div
            className="relative"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${dimensions.width}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${dimensions.height}, ${cellSize}px)`,
              gap: 0,
            }}
          >
            {grid.map((row, y) =>
              row.map((colorIdx, x) => {
                const color = colors[colorIdx];
                const textColor = getTextColor(color.rgb);

                // Determine border style
                const isRightEdge = (x + 1) % 10 === 0 && x + 1 < dimensions.width;
                const isBottomEdge = (y + 1) % 10 === 0 && y + 1 < dimensions.height;

                return (
                  <div
                    key={`${y}-${x}`}
                    className="group relative"
                    style={{
                      backgroundColor: color.hex,
                      border: '1px solid black',
                      borderRightWidth: isRightEdge ? '2px' : '1px',
                      borderRightColor: isRightEdge ? '#3399cc' : 'black',
                      borderBottomWidth: isBottomEdge ? '2px' : '1px',
                      borderBottomColor: isBottomEdge ? '#3399cc' : 'black',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: `${Math.max(8, cellSize * 0.4)}px`,
                      fontWeight: 'bold',
                      color: textColor,
                      cursor: 'help',
                    }}
                  >
                    {colorIdx}

                    {/* Tooltip */}
                    <div
                      className="absolute hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
                      style={{
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '4px',
                        pointerEvents: 'none',
                      }}
                    >
                      {color.name}
                      <div
                        className="absolute"
                        style={{
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '4px solid transparent',
                          borderRight: '4px solid transparent',
                          borderTop: '4px solid #111827',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Grid Info */}
      <p className="text-sm text-gray-600">
        Grid size: {dimensions.width} × {dimensions.height} pixels
        {' • '}
        Blue lines appear every 10 squares (matching physical canvas)
      </p>
    </div>
  );
}
