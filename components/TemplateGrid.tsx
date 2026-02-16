'use client';

import { useState, useRef, useEffect } from 'react';

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
  onCellChange?: (x: number, y: number, newColorIdx: number) => void;
}

export function TemplateGrid({ grid, colors, dimensions, onCellChange }: TemplateGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [zoomMultiplier, setZoomMultiplier] = useState<number>(1.0);
  const [selectedColorIdx, setSelectedColorIdx] = useState<number | null>(null);
  const [showNumbers, setShowNumbers] = useState<boolean>(true);

  // Measure container width with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Determine text color based on background brightness
  const getTextColor = (rgb: [number, number, number]): string => {
    const maxVal = Math.max(...rgb);
    return maxVal < 175 ? 'white' : 'black';
  };

  // Calculate cell size to fit viewport, then apply zoom multiplier
  const fitCellSize = Math.max(8, Math.min(30, Math.floor((containerWidth - 32) / dimensions.width)));
  const cellSize = fitCellSize * zoomMultiplier;

  const handleCellClick = (x: number, y: number) => {
    if (onCellChange && selectedColorIdx !== null) {
      onCellChange(x, y, selectedColorIdx);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Color Palette */}
      {onCellChange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Color to Paint:
          </label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color.index}
                onClick={() => setSelectedColorIdx(color.index)}
                className={`
                  w-12 h-12 rounded border-2 transition-all flex items-center justify-center
                  font-bold text-sm
                  ${
                    selectedColorIdx === color.index
                      ? 'ring-2 ring-blue-300 border-blue-600 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }
                `}
                style={{
                  backgroundColor: color.hex,
                  color: getTextColor(color.rgb),
                }}
                title={color.name}
              >
                {color.index}
              </button>
            ))}
          </div>
          {selectedColorIdx !== null && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {colors[selectedColorIdx].name} (click cells to paint)
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-6 flex-wrap">
        {/* Zoom Controls */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Zoom:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setZoomMultiplier(Math.max(0.5, zoomMultiplier - 0.25))}
              disabled={zoomMultiplier <= 0.5}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              −
            </button>
            <span className="px-3 py-1 min-w-[60px] text-center border border-gray-200 rounded bg-gray-50">
              {Math.round(zoomMultiplier * 100)}%
            </span>
            <button
              onClick={() => setZoomMultiplier(Math.min(3, zoomMultiplier + 0.25))}
              disabled={zoomMultiplier >= 3}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
            <button
              onClick={() => setZoomMultiplier(1.0)}
              disabled={zoomMultiplier === 1.0}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Show Numbers Toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showNumbers}
              onChange={(e) => setShowNumbers(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Numbers</span>
          </label>
        </div>
      </div>

      {/* Grid Container */}
      <div
        ref={containerRef}
        className="border border-gray-300 rounded-lg overflow-auto max-h-[600px] bg-white"
      >
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
                    onClick={() => handleCellClick(x, y)}
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
                      cursor: onCellChange && selectedColorIdx !== null ? 'crosshair' : 'help',
                    }}
                  >
                    {showNumbers && colorIdx}

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
      <p className="text-sm text-gray-700">
        Grid size: {dimensions.width} × {dimensions.height} pixels
        {' • '}
        Blue lines appear every 10 squares (matching physical canvas)
      </p>
    </div>
  );
}
