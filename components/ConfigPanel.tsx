'use client';

import { useState, useEffect } from 'react';

interface ConfigPanelProps {
  imageWidth: number | null;
  imageHeight: number | null;
  onGenerate: (config: GenerateConfig) => void;
  isGenerating: boolean;
}

export interface GenerateConfig {
  width?: number;
  height?: number;
  clusters: number;
  method: 'greedy' | 'mpr';
}

type DimensionMode = 'width' | 'height';

export function ConfigPanel({
  imageWidth,
  imageHeight,
  onGenerate,
  isGenerating,
}: ConfigPanelProps) {
  const [dimensionMode, setDimensionMode] = useState<DimensionMode>('width');
  const [dimensionValue, setDimensionValue] = useState<number>(80);
  const [colorCount, setColorCount] = useState<number>(10);
  const [method, setMethod] = useState<'greedy' | 'mpr'>('greedy');

  // Calculate the other dimension based on aspect ratio
  const calculatedDimension = imageWidth && imageHeight
    ? dimensionMode === 'width'
      ? Math.round((imageHeight / imageWidth) * dimensionValue)
      : Math.round((imageWidth / imageHeight) * dimensionValue)
    : null;

  const handleGenerate = () => {
    const config: GenerateConfig = {
      clusters: colorCount,
      method,
    };

    if (dimensionMode === 'width') {
      config.width = dimensionValue;
    } else {
      config.height = dimensionValue;
    }

    onGenerate(config);
  };

  const canGenerate = imageWidth !== null && imageHeight !== null && !isGenerating;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Configuration</h3>

        {/* Dimension Mode Toggle */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dimension Mode
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDimensionMode('width')}
              className={`
                flex-1 px-4 py-2 rounded-lg border-2 transition-colors
                ${
                  dimensionMode === 'width'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              Set Width
            </button>
            <button
              type="button"
              onClick={() => setDimensionMode('height')}
              className={`
                flex-1 px-4 py-2 rounded-lg border-2 transition-colors
                ${
                  dimensionMode === 'height'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              Set Height
            </button>
          </div>
        </div>

        {/* Dimension Input */}
        <div className="mb-4">
          <label
            htmlFor="dimension"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {dimensionMode === 'width' ? 'Width' : 'Height'} (pixels)
          </label>
          <input
            id="dimension"
            type="number"
            min={20}
            max={120}
            value={dimensionValue}
            onChange={(e) => setDimensionValue(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {calculatedDimension !== null && (
            <p className="mt-1 text-sm text-gray-600">
              Calculated {dimensionMode === 'width' ? 'height' : 'width'}:{' '}
              {calculatedDimension}px
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Range: 20-120 pixels (default: 80)
          </p>
        </div>

        {/* Color Count */}
        <div className="mb-4">
          <label
            htmlFor="colors"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Number of Colors
          </label>
          <input
            id="colors"
            type="number"
            min={2}
            max={25}
            value={colorCount}
            onChange={(e) => setColorCount(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            Range: 2-25 colors (default: 10)
          </p>
        </div>

        {/* Method Selection */}
        <div className="mb-6">
          <label
            htmlFor="method"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Color Selection Method
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value as 'greedy' | 'mpr')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="greedy">Greedy (Recommended)</option>
            <option value="mpr">Max Pool Resize</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {method === 'greedy'
              ? 'Fast algorithm that minimizes color distance'
              : 'Considers full-resolution image, may be slower'}
          </p>
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
    </div>
  );
}
