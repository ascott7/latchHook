'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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

interface UndoRedoAction {
  x: number;
  y: number;
  oldColor: number;
  newColor: number;
}

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageWidth, setImageWidth] = useState<number | null>(null);
  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GenerateResponse | null>(null);

  // Editable grid state
  const [editableGrid, setEditableGrid] = useState<number[][] | null>(null);
  const [undoStack, setUndoStack] = useState<UndoRedoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoRedoAction[]>([]);

  const hasEdits = undoStack.length > 0;

  const handleImageSelected = (file: File, width: number, height: number) => {
    setUploadedFile(file);
    setImageWidth(width);
    setImageHeight(height);
    setResults(null);
    setEditableGrid(null);
    setUndoStack([]);
    setRedoStack([]);
    setError(null);
  };

  // Cell editing callbacks
  const handleCellChange = (x: number, y: number, newColorIdx: number) => {
    if (!editableGrid) return;

    const oldColorIdx = editableGrid[y][x];
    if (oldColorIdx === newColorIdx) return; // No change

    // Update grid
    const newGrid = editableGrid.map((row) => [...row]);
    newGrid[y][x] = newColorIdx;
    setEditableGrid(newGrid);

    // Push to undo stack
    setUndoStack((prev) => [...prev, { x, y, oldColor: oldColorIdx, newColor: newColorIdx }]);
    setRedoStack([]); // Clear redo stack on new change
  };

  const undo = useCallback(() => {
    if (!editableGrid || undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];
    const newGrid = editableGrid.map((row) => [...row]);
    newGrid[action.y][action.x] = action.oldColor;

    setEditableGrid(newGrid);
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, action]);
  }, [editableGrid, undoStack]);

  const redo = useCallback(() => {
    if (!editableGrid || redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];
    const newGrid = editableGrid.map((row) => [...row]);
    newGrid[action.y][action.x] = action.newColor;

    setEditableGrid(newGrid);
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, action]);
  }, [editableGrid, redoStack]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Recompute colors dynamically from editable grid
  const dynamicColors = useMemo(() => {
    if (!results || !editableGrid) return null;

    const colorCounts = new Map<number, number>();
    for (const row of editableGrid) {
      for (const colorIdx of row) {
        colorCounts.set(colorIdx, (colorCounts.get(colorIdx) || 0) + 1);
      }
    }

    return results.colors.map((color) => ({
      ...color,
      count: colorCounts.get(color.index) || 0,
      yardage: Math.round(((colorCounts.get(color.index) || 0) * 2.44) / 36 * 100) / 100,
    }));
  }, [editableGrid, results]);

  const handleGenerate = async (config: GenerateConfig) => {
    if (!uploadedFile) {
      setError('Please upload an image first');
      return;
    }

    // Warn if there are unsaved edits
    if (hasEdits) {
      const confirmed = window.confirm(
        'You have unsaved edits. Regenerating will discard them. Continue?'
      );
      if (!confirmed) return;
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

      // Initialize editable grid with deep copy
      setEditableGrid(data.grid.map((row) => [...row]));
      setUndoStack([]);
      setRedoStack([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Before generation: setup view. After: grid-maximized view
  if (!results || !editableGrid || !dynamicColors) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Latch Hook Pattern Generator
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Convert your images into latch hook templates with color-optimized palettes
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Image</h2>
            <ImageUploader onImageSelected={handleImageSelected} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Configure</h2>
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
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <ResultsDisplay
        preview={results.preview}
        grid={editableGrid}
        dimensions={results.dimensions}
        colors={dynamicColors}
        totalStrings={results.totalStrings}
        onCellChange={handleCellChange}
        originalColors={results.colors}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Settings Drawer */}
      {settingsOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setSettingsOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Close Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Settings</h2>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Upload Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Upload Image</h3>
                <ImageUploader onImageSelected={handleImageSelected} />
              </div>

              {/* Config Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Configure</h3>
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
          </div>
        </>
      )}
    </div>
  );
}
