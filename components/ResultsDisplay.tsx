'use client';

import { useState } from 'react';
import { TemplateGrid } from './TemplateGrid';
import { ColorStatsTable } from './ColorStatsTable';
import {
  downloadPreviewImage,
  downloadTemplateImage,
  downloadStatsImage,
  downloadAll,
} from './download-utils';

interface Color {
  index: number;
  name: string;
  hex: string;
  rgb: [number, number, number];
  count: number;
  yardage: number;
}

interface ResultsDisplayProps {
  preview: string;
  grid: number[][];
  dimensions: { width: number; height: number };
  colors: Color[];
  totalStrings: number;
  onCellChange: (x: number, y: number, newColorIdx: number) => void;
  originalColors: Color[];
  onOpenSettings: () => void;
}

type Tab = 'template' | 'materials';

export function ResultsDisplay({
  preview,
  grid,
  dimensions,
  colors,
  totalStrings,
  onCellChange,
  originalColors,
  onOpenSettings,
}: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<Tab>('template');
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [zoomMultiplier, setZoomMultiplier] = useState<number>(1.0);
  const [selectedColorIdx, setSelectedColorIdx] = useState<number | null>(null);
  const [showNumbers, setShowNumbers] = useState<boolean>(true);

  // Determine text color based on background brightness
  const getTextColor = (rgb: [number, number, number]): string => {
    const maxVal = Math.max(...rgb);
    return maxVal < 175 ? 'white' : 'black';
  };

  const handleCellChange = (x: number, y: number) => {
    if (selectedColorIdx !== null) {
      onCellChange(x, y, selectedColorIdx);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="px-4 py-2 bg-white border-b flex items-center justify-between">
        {/* Left: App Title */}
        <div className="text-sm font-semibold text-gray-800">Latch Hook</div>

        {/* Center: Tab Toggle Pills */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('template')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'template'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Template
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'materials'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Materials
          </button>
        </div>

        {/* Right: Download Dropdown + Settings Gear */}
        <div className="flex items-center gap-2">
          {/* Download Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-1"
            >
              Download
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {downloadMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDownloadMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        downloadAll(preview, grid, colors, dimensions, totalStrings);
                        setDownloadMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Download All
                    </button>
                    <button
                      onClick={() => {
                        downloadPreviewImage(preview);
                        setDownloadMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Download Preview
                    </button>
                    <button
                      onClick={() => {
                        downloadTemplateImage(grid, colors, dimensions);
                        setDownloadMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Download Template
                    </button>
                    <button
                      onClick={() => {
                        downloadStatsImage(colors, totalStrings);
                        setDownloadMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Download Materials
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Settings Gear */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'template' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar Row */}
          <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-4">
            {/* Color Palette */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Colors:</span>
              <div className="flex gap-1">
                {originalColors.map((color) => (
                  <button
                    key={color.index}
                    onClick={() => setSelectedColorIdx(color.index)}
                    className={`
                      w-8 h-8 rounded border transition-all flex items-center justify-center
                      font-bold text-xs flex-shrink-0
                      ${
                        selectedColorIdx === color.index
                          ? 'ring-2 ring-blue-500 border-blue-600 scale-110'
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
            </div>

            <div className="border-l h-6 border-gray-300" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Zoom:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setZoomMultiplier(Math.max(0.5, zoomMultiplier - 0.25))}
                  disabled={zoomMultiplier <= 0.5}
                  className="px-2 py-0.5 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span className="px-2 py-0.5 min-w-[50px] text-center border border-gray-200 rounded bg-white text-sm">
                  {Math.round(zoomMultiplier * 100)}%
                </span>
                <button
                  onClick={() => setZoomMultiplier(Math.min(3, zoomMultiplier + 0.25))}
                  disabled={zoomMultiplier >= 3}
                  className="px-2 py-0.5 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
                <button
                  onClick={() => setZoomMultiplier(1.0)}
                  disabled={zoomMultiplier === 1.0}
                  className="px-2 py-0.5 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="border-l h-6 border-gray-300" />

            {/* Show Numbers Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showNumbers}
                onChange={(e) => setShowNumbers(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Show Numbers</span>
            </label>
          </div>

          {/* Grid Container */}
          <div className="flex-1 overflow-hidden">
            <TemplateGrid
              grid={grid}
              colors={originalColors}
              dimensions={dimensions}
              onCellChange={handleCellChange}
              zoomMultiplier={zoomMultiplier}
              showNumbers={showNumbers}
              selectedColorIdx={selectedColorIdx}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <ColorStatsTable colors={colors} totalStrings={totalStrings} />
        </div>
      )}
    </div>
  );
}
