'use client';

import { useState, useEffect } from 'react';

interface ConfigPanelProps {
  imageWidth: number | null;
  imageHeight: number | null;
  onGenerate: (config: GenerateConfig) => void;
  isGenerating: boolean;
}

export interface GenerateConfig {
  width: number;
  height: number;
  clusters: number;
  method: 'greedy' | 'mpr';
}

export function ConfigPanel({
  imageWidth,
  imageHeight,
  onGenerate,
  isGenerating,
}: ConfigPanelProps) {
  const [widthStr, setWidthStr] = useState<string>('80');
  const [heightStr, setHeightStr] = useState<string>('60');
  const [colorCountStr, setColorCountStr] = useState<string>('10');
  const [method, setMethod] = useState<'greedy' | 'mpr'>('greedy');

  // Initialize dimensions when image is uploaded
  useEffect(() => {
    if (!imageWidth || !imageHeight) {
      setWidthStr('80');
      setHeightStr('60');
      return;
    }

    const aspectRatio = imageWidth / imageHeight;
    const defaultWidth = 80;
    const calculatedHeight = Math.round(defaultWidth / aspectRatio);
    setWidthStr(defaultWidth.toString());
    setHeightStr(calculatedHeight.toString());
  }, [imageWidth, imageHeight]);

  const handleWidthChange = (value: string) => {
    setWidthStr(value);

    if (imageWidth && imageHeight) {
      const w = parseInt(value, 10);
      if (!isNaN(w) && w > 0) {
        const aspectRatio = imageWidth / imageHeight;
        const calculatedHeight = Math.round(w / aspectRatio);
        setHeightStr(calculatedHeight.toString());
      }
    }
  };

  const handleHeightChange = (value: string) => {
    setHeightStr(value);

    if (imageWidth && imageHeight) {
      const h = parseInt(value, 10);
      if (!isNaN(h) && h > 0) {
        const aspectRatio = imageWidth / imageHeight;
        const calculatedWidth = Math.round(h * aspectRatio);
        setWidthStr(calculatedWidth.toString());
      }
    }
  };

  const handleGenerate = () => {
    const width = parseInt(widthStr, 10);
    const height = parseInt(heightStr, 10);
    const clusters = parseInt(colorCountStr, 10);

    // Validate and use defaults if invalid
    const validWidth = !isNaN(width) && width >= 20 && width <= 120 ? width : 80;
    const validHeight = !isNaN(height) && height >= 20 && height <= 120 ? height : 80;
    const validClusters = !isNaN(clusters) && clusters >= 2 && clusters <= 25 ? clusters : 10;

    const config: GenerateConfig = {
      width: validWidth,
      height: validHeight,
      clusters: validClusters,
      method,
    };

    onGenerate(config);
  };

  const canGenerate = imageWidth !== null && imageHeight !== null && !isGenerating;

  return (
    <div className="space-y-4">
      {/* Width & Height Side-by-Side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="width"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Width (px)
          </label>
          <input
            id="width"
            type="text"
            value={widthStr}
            onChange={(e) => handleWidthChange(e.target.value)}
            placeholder="80"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">Range: 20-120</p>
        </div>

        <div>
          <label
            htmlFor="height"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Height (px)
          </label>
          <input
            id="height"
            type="text"
            value={heightStr}
            onChange={(e) => handleHeightChange(e.target.value)}
            placeholder="60"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">Range: 20-120</p>
        </div>
      </div>

      {/* Colors & Method Side-by-Side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="colors"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Colors
          </label>
          <input
            id="colors"
            type="text"
            value={colorCountStr}
            onChange={(e) => setColorCountStr(e.target.value)}
            placeholder="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">Range: 2-25</p>
        </div>

        <div>
          <label
            htmlFor="method"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Method
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value as 'greedy' | 'mpr')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="greedy">Greedy</option>
            <option value="mpr">Max Pool</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {method === 'greedy' ? 'Fast (recommended)' : 'High quality'}
          </p>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className={`
          w-full px-6 py-3 rounded-lg font-medium text-white
          transition-colors flex items-center justify-center gap-2
          ${
            canGenerate
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-300 cursor-not-allowed'
          }
        `}
      >
        {isGenerating ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating...
          </>
        ) : (
          'Generate Template'
        )}
      </button>

      {!canGenerate && !isGenerating && (
        <p className="mt-2 text-sm text-gray-600 text-center">
          Please upload an image first
        </p>
      )}
    </div>
  );
}
