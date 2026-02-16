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
  onCellChange?: (x: number, y: number) => void;
  zoomMultiplier: number;
  showNumbers: boolean;
  selectedColorIdx: number | null;
}

export function TemplateGrid({
  grid,
  colors,
  dimensions,
  onCellChange,
  zoomMultiplier,
  showNumbers,
  selectedColorIdx,
}: TemplateGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [containerHeight, setContainerHeight] = useState<number>(600);

  // Measure container width and height with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        if (width > 0) {
          setContainerWidth(width);
        }
        if (height > 0) {
          setContainerHeight(height);
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

  // Calculate cell size to fit BOTH width and height, then apply zoom multiplier
  const padding = 32; // 16px padding on each side
  const maxCellSizeByWidth = Math.floor((containerWidth - padding) / dimensions.width);
  const maxCellSizeByHeight = Math.floor((containerHeight - padding) / dimensions.height);

  // Use the smaller of the two to ensure it fits in both dimensions
  const fitCellSize = Math.max(8, Math.min(30, Math.min(maxCellSizeByWidth, maxCellSizeByHeight)));
  const cellSize = fitCellSize * zoomMultiplier;

  const handleCellClick = (x: number, y: number) => {
    if (onCellChange) {
      onCellChange(x, y);
    }
  };

  return (
    <div className="h-full w-full overflow-auto bg-white" ref={containerRef}>
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
  );
}
