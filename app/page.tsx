'use client';

import { useState } from 'react';
import { ImageUploader } from '@/components/ImageUploader';
import { ConfigPanel, GenerateConfig } from '@/components/ConfigPanel';
import { ResultsDisplay } from '@/components/ResultsDisplay';

interface Color {
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
  colors: Color[];
  totalStrings: number;
}

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageWidth, setImageWidth] = useState<number | null>(null);
  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GenerateResponse | null>(null);

  const handleImageSelected = (file: File, width: number, height: number) => {
    setUploadedFile(file);
    setImageWidth(width);
    setImageHeight(height);
    setResults(null); // Clear previous results
    setError(null);
  };

  const handleGenerate = async (config: GenerateConfig) => {
    if (!uploadedFile) {
      setError('Please upload an image first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', uploadedFile);
      formData.append('clusters', config.clusters.toString());
      formData.append('method', config.method);
      formData.append('width', config.width.toString());
      formData.append('height', config.height.toString());

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate template');
      }

      const data: GenerateResponse = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Latch Hook Pattern Generator
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Convert your images into latch hook templates with color-optimized palettes
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Image Upload & Config */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">1. Upload Image</h2>
              <ImageUploader onImageSelected={handleImageSelected} />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">2. Configure</h2>
              <ConfigPanel
                imageWidth={imageWidth}
                imageHeight={imageHeight}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-2">
            {results ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">3. Results</h2>
                <ResultsDisplay
                  preview={results.preview}
                  grid={results.grid}
                  dimensions={results.dimensions}
                  colors={results.colors}
                  totalStrings={results.totalStrings}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No template generated yet
                </h3>
                <p className="text-gray-600">
                  Upload an image and click &quot;Generate Template&quot; to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            Latch Hook Pattern Generator • Built with Next.js and TypeScript
          </p>
        </div>
      </footer>
    </div>
  );
}
