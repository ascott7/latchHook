# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a latch hook template generator that converts input images into color-constrained patterns for latch hook crafts. It uses a fixed palette of yarn colors from Herrschners and generates templates with grids, color codes, and material statistics.

## Running the Code

Main command:
```bash
python choose_colors.py -i <image_path> -c <num_colors> [-w width] [-hi height] [-m method]
```

Arguments:
- `-i, --image`: Path to input image (required)
- `-c, --clusters`: Number of colors to use from palette (required)
- `-w, --width`: Output template width in pixels (optional)
- `-hi, --height`: Output template height in pixels (optional)
- `-m, --method`: Color selection method - `greedy` (default), `pulp`, or `mpr` (optional)
- `--color-options`: Path to color palette JSON (defaults to `color_names.json`)

Examples:
```bash
# Basic usage with 10 colors
python choose_colors.py -i input.jpg -c 10

# With specific dimensions
python choose_colors.py -i input.jpg -c 15 -w 120 -hi 80

# Using linear programming method
python choose_colors.py -i input.jpg -c 12 -m pulp
```

Utility scripts:
```bash
# Find most similar colors to a hex color
python most_similar_color.py -c "#FF5733"

# Extract colors from yarn images (for updating palette)
python get_color_options.py <directory> <output.json>
```

## Architecture

### Color Chooser Strategy Pattern

The codebase uses a strategy pattern with `ColorChooser` as the base class:

- **ColorChooser** (`color_chooser.py`): Abstract base class that defines:
  - `choose_colors_body()`: Must be implemented by subclasses to perform color selection
  - `choose_colors()`: Orchestrates the full process (resize, color selection, output generation)
  - Output generation methods: `add_lines_and_symbols()`, `make_color_stats()`

- **Three concrete strategies** for color selection:
  1. **GreedyChooser** (`greedy_chooser.py`): Starts with first N colors, then iteratively tries swapping each chosen color with unused colors, keeping swaps that reduce total LAB color distance
  2. **PulpChooser** (`pulp_chooser.py`): Formulates color assignment as a linear programming problem with constraints on max colors used; finds optimal solution
  3. **MaxPoolResizeChooser** (`max_pool_resize_chooser.py`): First quantizes full-resolution image to palette colors, then uses max-pooling strategy during resize (chooses color covering largest area in each output pixel)

### Color Matching and Quantization

All color matching uses **LAB color space** (not RGB/BGR) because it's perceptually uniform - equal distances in LAB correspond to equal perceived color differences.

Key functions in `utils.py`:
- `get_full_color_regions()`: Creates an array of solid-color images for each palette color
- `get_color_differences()`: Computes squared LAB distance between each pixel and each palette color
- `quantize_img()`: Replaces every pixel with closest palette color (used by MaxPoolResizeChooser)
- `calculate_total_cost()`: Sum of minimum LAB distances for selected color subset

### Output Generation

The `ColorChooser` base class generates three output images (stored in `output_images` dict):

1. **`chosen_colors_no_grid.png`**: Resized image with selected colors, no overlays
2. **`chosen_colors.png`**: Template with grid overlay:
   - Each pixel becomes a 20x20 square with black borders
   - Light blue lines every 10 squares (matching physical canvas)
   - Numbers in each square corresponding to color index
3. **`stats_img.png`**: Material requirements showing:
   - Color swatches numbered 0 to N
   - Color names from palette
   - String count per color
   - Yardage calculation: `(num_strings × 2.44) / 36` yards (2.44 inches per pre-cut string)

### Color Palette

`color_names.json` contains ~75 yarn colors in BGR format (OpenCV convention). Color names match Herrschners catalog. Colors are stored as BGR arrays (e.g., `[208, 200, 195]` for grey).

## Code Formatting

This project uses Black for code formatting:
```bash
black .
```

Configuration is in `pyproject.toml` with Python 3.6 compatibility mode.

## Key Implementation Details

- **Image dimensions**: If neither width nor height specified, the longer dimension defaults to 120 pixels with aspect ratio preserved
- **Greedy algorithm** enforces that exactly `clusters` colors are chosen (uses 1 for selected, NaN for unselected)
- **MaxPoolResizeChooser** enforces chosen color count by using 1/0 instead of 1/NaN and skips colors with zero score
- **Grid overlay colors**: Black for regular lines, `(255, 204, 51)` (light blue/cyan) for every 10th line
- **Text color in overlays**: White if max(BGR) < 175, otherwise black (for readability on dark vs light backgrounds)
