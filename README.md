# Latch Hook Pattern Generator

Convert images into latch hook patterns with color-optimized palettes using Herrschners yarn colors.

## Web App (Production)

The Next.js web application provides a user-friendly interface for generating latch hook templates.

### Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

### Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Features

- **Image Upload**: Drag-and-drop or click to upload JPG, PNG, or WebP images
- **Configuration**: Set dimensions (20-120px), color count (2-25), and algorithm
- **Algorithms**:
  - **Greedy** (recommended): Fast, minimizes LAB color distance
  - **Max Pool Resize**: Considers full-resolution image, slower but can be more accurate
- **Results**:
  - Preview image
  - Interactive grid template with color numbers
  - Materials list with yardage calculations
- **Downloads**: Export template, materials list, and preview as PNGs

## Python CLI (Legacy)

The original Python implementation is in the `legacy/` directory.

```bash
cd legacy
python choose_colors.py -i input.jpg -c 10 -w 80
```

See `legacy/README.md` for full documentation.

## Tech Stack

### Web App
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Sharp (image processing)
- color-convert (LAB color space)

### Python CLI
- OpenCV
- NumPy
- PuLP (linear programming)

## Color Palette

Both versions use the same Herrschners yarn palette (`color_names.json`) with ~75 colors optimized for latch hook crafts.
