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
}

type Tab = 'preview' | 'template' | 'materials';

export function ResultsDisplay({
  preview,
  grid,
  dimensions,
  colors,
  totalStrings,
  onCellChange,
  originalColors,
}: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<Tab>('preview');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'template', label: 'Template' },
    { id: 'materials', label: 'Materials' },
  ];

  return (
    <div className="space-y-4">
      {/* Download Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => downloadAll(preview, grid, colors, dimensions, totalStrings)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Download All
        </button>
        <button
          onClick={() => downloadPreviewImage(preview)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Download Preview
        </button>
        <button
          onClick={() => downloadTemplateImage(grid, colors, dimensions)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Download Template
        </button>
        <button
          onClick={() => downloadStatsImage(colors, totalStrings)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Download Materials
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'preview' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Color Preview</h3>
            <p className="text-sm text-gray-700">
              Quick visual preview of your latch hook pattern with selected colors
            </p>
            <div className="flex justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
              <img
                src={preview}
                alt="Pattern preview"
                className="max-w-full h-auto shadow-lg"
                style={{
                  imageRendering: 'pixelated',
                  maxHeight: '600px',
                }}
              />
            </div>
            <p className="text-xs text-gray-600 text-center">
              Dimensions: {dimensions.width} × {dimensions.height} pixels
            </p>
          </div>
        )}

        {activeTab === 'template' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Latch Hook Template</h3>
            <p className="text-sm text-gray-700">
              Click a color from the palette, then click cells to paint. Use Ctrl+Z to undo.
            </p>
            <TemplateGrid
              grid={grid}
              colors={originalColors}
              dimensions={dimensions}
              onCellChange={onCellChange}
            />
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Materials List</h3>
            <p className="text-sm text-gray-700">
              Required yarn colors and quantities for your latch hook project
            </p>
            <ColorStatsTable colors={colors} totalStrings={totalStrings} />
          </div>
        )}
      </div>
    </div>
  );
}
