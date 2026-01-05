# 📸 MediaProc Image Plugin

Professional image processing CLI powered by [Sharp](https://sharp.pixelplumbing.com/). Fast, efficient, and feature-rich image manipulation toolkit with **51 comprehensive commands**.

## 📑 Table of Contents

- [Features](#-features)
- [Installation & Usage](#-installation--usage)
- [Quick Start](#-quick-start)
- [Global Options & Common Flags](#-global-options--common-flags)
- [Commands Overview](#-commands-overview)
- [Detailed Command Reference](#-detailed-command-reference)
  - [Transform & Resize](#-transform--resize-10-commands)
  - [Color & Tone](#-color--tone-10-commands)
  - [Effects & Filters](#-effects--filters-9-commands)
  - [Advanced Operations](#-advanced-operations-6-commands)
  - [Smart/AI Operations](#-smartai-operations-6-commands)
  - [Utility Commands](#-utility-10-commands)
- [Real-World Workflows](#-real-world-workflows)
- [Usage Tips](#-usage-tips)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

- 🚀 **High Performance** - Built on libvips for blazing fast processing
- 🎨 **51 Commands** - Comprehensive image manipulation toolkit covering all Sharp operations
- 🔧 **Professional Features** - Quality control, dry-run mode, verbose logging
- 📦 **Modern Formats** - WebP, AVIF, JPEG, PNG, TIFF, GIF support
- 🎯 **Simple CLI** - Intuitive command-line interface
- 💡 **Helpful Documentation** - Built-in help for every command
- 🤖 **Smart Operations** - AI-like auto-enhance, smart crop, batch processing

## 📦 Installation & Usage

### Option 1: Universal CLI (Recommended)

Install the universal CLI and add the image plugin:

```bash
# Install universal CLI
npm install -g @mediaproc/cli

# Add image plugin (downloaded on-demand)
mediaproc add image

# Use commands with "image" prefix
mediaproc image resize photo.jpg -w 800 -h 600
mediaproc image convert photo.jpg -f webp
```

**Note:** All commands use the `image` namespace: `mediaproc image <command>`

### Option 2: Standalone Plugin

Install and use the image plugin independently:

```bash
# Install standalone
npm install -g @mediaproc/image

# Use commands directly (no "image" prefix)
mediaproc-image resize photo.jpg -w 800 -h 600
mediaproc-image convert photo.jpg -f webp
```

**Note:** Standalone mode uses `mediaproc-image` command without the `image` prefix.

---

## 🎯 Quick Start

**With Universal CLI:**

```bash
# Resize an image
mediaproc image resize photo.jpg -w 800 -h 600

# Convert to WebP
mediaproc image convert photo.jpg -f webp -q 85

# Generate thumbnail
mediaproc image thumbnail photo.jpg -s 150

# Optimize for web
mediaproc image optimize photo.jpg -q 85

# Get help for any command
mediaproc image resize --help
```

**With Standalone Plugin:**

```bash
# Same commands, different prefix
mediaproc-image resize photo.jpg -w 800 -h 600
mediaproc-image convert photo.jpg -f webp -q 85
mediaproc-image thumbnail photo.jpg -s 150
```

---

## 🌐 Global Options & Common Flags

All image commands share a consistent set of common flags for unified behavior:

### Standard Flags (Available on All Commands)

| Flag                | Alias | Description                       | Default                   |
| ------------------- | ----- | --------------------------------- | ------------------------- |
| `--output <path>`   | `-o`  | Output file path                  | `<input>-<command>.<ext>` |
| `--quality <1-100>` | `-q`  | Output quality (1-100)            | `90`                      |
| `--dry-run`         | -     | Preview changes without executing | `false`                   |
| `--verbose`         | `-v`  | Show detailed processing output   | `false`                   |
| `--help`            | -     | Display command-specific help     | -                         |

### How Commands Work

**1. Input Processing:**

```bash
# Commands accept file paths (relative or absolute)
mediaproc image resize photo.jpg -w 800
mediaproc image resize /path/to/photo.jpg -w 800
mediaproc image resize ../images/photo.jpg -w 800
```

**2. Output Naming:**

```bash
# Default: <input>-<command>.<ext>
mediaproc image blur photo.jpg           # → photo-blur.jpg

# Custom output path:
mediaproc image blur photo.jpg -o soft.jpg

# Preserve format or change:
mediaproc image blur photo.jpg -o output.webp  # Changes format
```

**3. Quality Control:**

```bash
# High quality (larger file size)
mediaproc image resize photo.jpg -w 1920 -q 95

# Balanced (default)
mediaproc image resize photo.jpg -w 1920 -q 90

# Compressed (smaller file size)
mediaproc image resize photo.jpg -w 1920 -q 75

# Note: Quality applies to lossy formats (JPEG, WebP)
```

**4. Dry-Run Mode:**

```bash
# Preview what will happen without processing
mediaproc image resize photo.jpg -w 1920 --dry-run

# Shows: input, output paths, and operation details
# Useful for testing commands before batch processing
```

**5. Verbose Output:**

```bash
# Show detailed processing information
mediaproc image resize photo.jpg -w 1920 -v

# Displays:
# - Configuration settings
# - Processing steps
# - Metadata information
# - File size comparisons
```

### Command-Specific Options

Each command has unique options for its specific operation:

**Transform Commands:**

- Resize: `--width`, `--height`, `--fit`, `--position`, `--kernel`
- Rotate: `--angle`, `--background`
- Crop: `--left`, `--top`, `--extract-strategy`

**Color Commands:**

- Modulate: `--brightness`, `--saturation`, `--hue`
- Gamma: `--value`
- Tint: `--color`

**Effect Commands:**

- Blur: `--sigma`
- Sharpen: `--amount`, `--mode`
- Threshold: `--value`

**Advanced Commands:**

- Composite: `--overlay`, `--blend`, `--gravity`
- Boolean: `--operation`, `--operand`
- Recomb: `--matrix`

### Getting Help

**View all available commands:**

```bash
# Universal CLI
mediaproc image --help

# Standalone plugin
mediaproc-image --help
```

**Get command-specific help:**

```bash
# Shows detailed usage, options, examples
mediaproc image resize --help
mediaproc image blur --help
mediaproc image composite --help
```

**Help includes:**

- 📝 Description and purpose
- 🎯 Usage syntax
- ⚙️ Available options and flags
- 💡 Practical examples
- 📚 Use cases and workflows
- 💪 Tips and best practices

### Format Support

**Input Formats:**

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- AVIF (`.avif`)
- TIFF (`.tiff`, `.tif`)
- GIF (`.gif`)
- SVG (`.svg`)
- HEIF (`.heic`, `.heif`)

**Output Formats:**

- JPEG - Best for photos (lossy)
- PNG - Best for graphics with transparency (lossless)
- WebP - 25-35% smaller than JPEG (lossy/lossless)
- AVIF - 50% smaller than JPEG (lossy/lossless)
- TIFF - Best for professional/print (lossless)
- GIF - Best for simple animations (limited colors)

### Performance Tips

**1. Format Selection:**

```bash
# Use WebP for web (smaller, fast)
mediaproc image convert photo.jpg -f webp -q 85

# Use PNG for graphics with transparency
mediaproc image convert logo.jpg -f png

# Use AVIF for maximum compression (slower encoding)
mediaproc image convert photo.jpg -f avif -q 80
```

**2. Quality vs Size:**

```bash
# High quality (minimal compression)
-q 95   # Large file, excellent quality

# Balanced (recommended)
-q 85   # Good file size, great quality

# Aggressive (maximum compression)
-q 70   # Small file, acceptable quality
```

**3. Chaining Operations:**

```bash
# Instead of multiple commands:
mediaproc image resize input.jpg -w 1920 -o step1.jpg
mediaproc image blur step1.jpg -o step2.jpg
mediaproc image sharpen step2.jpg -o final.jpg

# Consider using pipeline/batch features:
mediaproc image batch images/ --operation "resize -w 1920"
```

**4. Batch Processing:**

```bash
# Process multiple files efficiently
for file in *.jpg; do
  mediaproc image optimize "$file" -q 85
done
```

---

## 📋 Commands Overview

All **49 commands** organized by category:

### 🔄 Transform & Resize (10 commands)

- **resize** - Resize images with advanced fit modes (cover, contain, fill, inside, outside)
- **crop** - Extract rectangular regions with positioning options
- **rotate** - Rotate by any angle with background control
- **flip** - Vertical mirroring (top-to-bottom flip)
- **flop** - Horizontal mirroring (left-to-right flip)
- **auto-orient** - Auto-rotate based on EXIF orientation data
- **affine** - Apply affine transformation matrix (scale, shear, reflect)
- **trim** - Auto-remove uniform borders from edges
- **extend** - Add padding/borders with custom colors
- **thumbnail** - Generate thumbnails (64px to 512px)

### 🎨 Color & Tone (10 commands)

- **modulate** - Adjust brightness, saturation, and hue
- **gamma** - Apply gamma correction for midtones (0.1-3.0)
- **tint** - Apply color tint overlay (RGB hex colors)
- **grayscale** - Convert to black & white
- **negate** - Create negative/inverted image
- **normalize** - Auto-enhance contrast and brightness
- **linear** - Apply linear formula: output = (a * input) + b
- **recomb** - Recombine RGB channels using transformation matrix
- **flatten** - Remove alpha transparency with background color
- **unflatten** - Add alpha channel (RGB→RGBA)

### ✨ Effects & Filters (9 commands)

- **blur** - Gaussian blur effect (0.3-1000 sigma)
- **sharpen** - Enhance image details and edges
- **median** - Noise reduction filter (1-50 size)
- **sepia** - Vintage sepia tone effect
- **vignette** - Darken edges for artistic focus
- **pixelate** - Retro pixel art effect with custom pixel size
- **threshold** - Binary black/white conversion (0-255)
- **dilate** - Morphological dilation (expand bright regions)
- **erode** - Morphological erosion (expand dark regions)

### 🎯 Advanced Operations (6 commands)

- **composite** - Layer images with blend modes (overlay, multiply, screen)
- **extract** - Extract color channels (R, G, B, alpha) or regions
- **border** - Add decorative frames with custom colors
- **clahe** - Contrast-limited adaptive histogram equalization
- **convolve** - Apply custom convolution kernels (sharpen, emboss, edge)
- **boolean** - Perform boolean operations between images (AND, OR, XOR)

### 🤖 Smart/AI Operations (6 commands)

- **smart-crop** - Intelligent content-aware cropping (attention/entropy)
- **auto-enhance** - Automatic color and contrast enhancement
- **palette** - Extract dominant color palettes (2-256 colors)
- **dominant-color** - Quick dominant color extraction
- **grid** - Combine images into collage layouts
- **batch** - Process multiple images at once with any operation

### 🔧 Utility (10 commands)

- **convert** - Format conversion (JPG, PNG, WebP, AVIF, TIFF, GIF)
- **optimize** - Size optimization (up to 70% reduction)
- **compress** - Advanced compression with quality control
- **watermark** - Add watermarks with positioning and opacity
- **info** - Display comprehensive image information
- **stats** - Detailed technical image statistics
- **split** - Split image into grid tiles
- **stack** - Stack images horizontally/vertically
- **mirror** - Create mirror/kaleidoscope effects (horizontal, vertical, quad)
- **metadata** - View, export, or remove EXIF data

---

## 📚 Detailed Command Reference

### 1. **resize** - Resize Images

Resize images with advanced options for fit modes, aspect ratio control, and quality settings.

**Usage:**

```bash
mediaproc image resize <input> [options]
```

**Options:**

- `-w, --width <width>` - Target width in pixels
- `-h, --height <height>` - Target height in pixels
- `--fit <mode>` - Fit mode: cover, contain, fill, inside, outside (default: cover)
- `--position <position>` - Position for cover/contain: center, top, bottom, left, right, etc.
- `--kernel <kernel>` - Resampling kernel: nearest, cubic, mitchell, lanczos2, lanczos3 (default: lanczos3)
- `--no-enlarge` - Don't enlarge if image is smaller than target
- `--no-reduce` - Don't reduce if image is larger than target
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Resize to 800x600 (crop to fit)
mediaproc image resize photo.jpg -w 800 -h 600

# Resize to fit within 1920x1080 (no cropping)
mediaproc image resize photo.jpg -w 1920 -h 1080 --fit contain

# Resize width only (maintain aspect ratio)
mediaproc image resize photo.jpg -w 1000

# High-quality resize with lanczos3 kernel
mediaproc image resize photo.jpg -w 2000 --kernel lanczos3 -q 95
```

**Fit Modes:**

- **cover** - Fill entire area, crop if needed (default)
- **contain** - Fit inside with padding
- **fill** - Stretch to fill (may distort)
- **inside** - Shrink if larger
- **outside** - Enlarge to cover

---

### 2. **convert** - Format Conversion

Convert images between formats with quality control and compression options.

**Usage:**

```bash
mediaproc image convert <input> [options]
```

**Options:**

- `-f, --format <format>` - Output format: jpg, png, webp, avif, tiff, gif (default: webp)
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--compression <level>` - PNG compression level 0-9 (default: 9)
- `--progressive` - Use progressive/interlaced format
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Convert to WebP
mediaproc image convert photo.jpg -f webp

# Convert to AVIF with quality 80
mediaproc image convert image.png -f avif -q 80

# Convert to progressive JPEG
mediaproc image convert photo.png -f jpg --progressive

# Convert to PNG with max compression
mediaproc image convert photo.jpg -f png --compression 9
```

**Format Guide:**

- **WebP** - Modern format, 25-35% smaller than JPG/PNG
- **AVIF** - Newest format, even smaller than WebP
- **JPG** - Best for photos, lossy compression
- **PNG** - Best for graphics/transparency, lossless
- **TIFF** - Professional/print, very large files
- **GIF** - Animations, limited colors

---

### 3. **grayscale** - Convert to Black & White

Convert images to grayscale (black and white).

**Usage:**

```bash
mediaproc image grayscale <input> [options]
```

**Options:**

- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Convert to grayscale
mediaproc image grayscale photo.jpg

# Grayscale with custom output
mediaproc image grayscale photo.jpg -o bw-photo.jpg

# Also works with UK spelling
mediaproc image greyscale photo.jpg
```

**Use Cases:**

- Artistic black and white photography
- Document scanning
- Reducing file size
- Accessibility (colorblind-friendly)
- Classic/vintage aesthetic

---

### 4. **blur** - Gaussian Blur

Apply Gaussian blur effect with configurable strength.

**Usage:**

```bash
mediaproc image blur <input> [options]
```

**Options:**

- `-s, --sigma <sigma>` - Blur strength 0.3-1000 (default: 5)
- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Default blur
mediaproc image blur photo.jpg

# Strong blur
mediaproc image blur photo.jpg -s 20

# Subtle blur
mediaproc image blur photo.jpg -s 2
```

**Blur Strength Guide:**

- **1-5** - Light blur (slight softness)
- **5-15** - Medium blur (noticeable effect)
- **15-30** - Strong blur (heavy softness)
- **30+** - Heavy blur (abstract effect)

---

### 5. **sharpen** - Sharpen Images

Sharpen images to enhance details and edges.

**Usage:**

```bash
mediaproc image sharpen <input> [options]
```

**Options:**

- `-s, --sigma <sigma>` - Sharpening strength 0.01-10 (default: 1)
- `--flat <flat>` - Sharpening for flat areas (default: 1)
- `--jagged <jagged>` - Sharpening for jagged areas (default: 2)
- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Default sharpening
mediaproc image sharpen photo.jpg

# Strong sharpening
mediaproc image sharpen image.png -s 2

# Custom parameters
mediaproc image sharpen photo.jpg -s 1.5 --flat 1.5 --jagged 2.5
```

**Sharpening Guide:**

- **0.3-0.7** - Subtle enhancement
- **1.0-1.5** - Normal sharpening
- **2.0-3.0** - Strong sharpening
- **3.0+** - Extreme (risk of artifacts)

---

### 6. **rotate** - Rotate Images

Rotate images by any angle with background color control.

**Usage:**

```bash
mediaproc image rotate <input> [options]
```

**Options:**

- `-a, --angle <degrees>` - Rotation angle in degrees (default: 90)
- `--background <color>` - Background color (default: black)
- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Rotate 90° clockwise
mediaproc image rotate photo.jpg -a 90

# Rotate 180° (upside down)
mediaproc image rotate photo.jpg -a 180

# Rotate 45° with white background
mediaproc image rotate photo.jpg -a 45 --background white

# Counter-clockwise rotation
mediaproc image rotate photo.jpg -a -90
```

**Common Angles:**

- **90** - Rotate right (clockwise)
- **-90 or 270** - Rotate left (counter-clockwise)
- **180** - Upside down
- **45** - Diagonal tilt

---

### 7. **flip** - Mirror Images

Mirror images horizontally, vertically, or both.

**Usage:**

```bash
mediaproc image flip <input> [options]
```

**Options:**

- `-d, --direction <direction>` - Direction: horizontal, vertical, both (default: horizontal)
- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Flip horizontally (mirror left-right)
mediaproc image flip photo.jpg

# Flip vertically (mirror up-down)
mediaproc image flip photo.jpg -d vertical

# Flip both ways (180° rotation)
mediaproc image flip photo.jpg -d both
```

---

### 8. **crop** - Extract Regions

Extract rectangular regions from images.

**Usage:**

```bash
mediaproc image crop <input> [options]
```

**Options:**

- `-x <pixels>` - X coordinate (left position, required)
- `-y <pixels>` - Y coordinate (top position, required)
- `-w, --width <pixels>` - Crop width (required)
- `-h, --height <pixels>` - Crop height (required)
- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Crop 800x600 region from top-left (0,0)
mediaproc image crop photo.jpg -x 0 -y 0 -w 800 -h 600

# Crop from specific position
mediaproc image crop photo.jpg -x 100 -y 50 -w 500 -h 400

# Extract center region
mediaproc image crop photo.jpg -x 400 -y 300 -w 800 -h 600
```

---

### 9. **optimize** - Size Optimization

Optimize image file size with minimal quality loss.

**Usage:**

```bash
mediaproc image optimize <input> [options]
```

**Options:**

- `-q, --quality <quality>` - Quality 1-100 (default: 85)
- `--aggressive` - More aggressive compression (quality 70)
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Optimize with quality 85
mediaproc image optimize photo.jpg

# Light optimization (high quality)
mediaproc image optimize image.png -q 90

# Aggressive compression
mediaproc image optimize pic.jpg --aggressive
```

**Quality Guide:**

- **90-100** - Minimal compression, large files
- **85-89** - Balanced (recommended for web)
- **70-84** - Good compression, slight quality loss
- **50-69** - High compression, noticeable quality loss

---

### 10. **watermark** - Add Watermarks

Add watermarks to images with position and opacity control.

**Usage:**

```bash
mediaproc image watermark <input> <watermark> [options]
```

**Options:**

- `--position <position>` - Position: center, top-left, top-right, bottom-left, bottom-right (default: bottom-right)
- `--opacity <opacity>` - Opacity 0-1 (default: 0.5)
- `--scale <scale>` - Watermark scale 0.1-1 (default: 0.2)
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Add watermark to bottom-right
mediaproc image watermark photo.jpg logo.png

# Center watermark
mediaproc image watermark image.jpg mark.png --position center

# Subtle watermark
mediaproc image watermark photo.jpg logo.png --opacity 0.3

# Larger watermark in top-right
mediaproc image watermark photo.jpg brand.png --scale 0.3 --position top-right
```

**Opacity Guide:**

- **0.1-0.3** - Very subtle
- **0.4-0.6** - Balanced (recommended)
- **0.7-0.9** - Clearly visible
- **1.0** - Fully opaque

---

### 11. **thumbnail** - Generate Thumbnails

Generate thumbnails with configurable sizes.

**Usage:**

```bash
mediaproc image thumbnail <input> [options]
```

**Options:**

- `-s, --size <size>` - Thumbnail size in pixels (default: 150)
- `--fit <fit>` - Fit mode: cover, contain, fill, inside, outside (default: cover)
- `-q, --quality <quality>` - Quality 1-100 (default: 85)
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Generate 150x150 thumbnail
mediaproc image thumbnail photo.jpg

# Generate 200x200 thumbnail
mediaproc image thumbnail image.png -s 200

# Thumbnail with padding
mediaproc image thumbnail pic.jpg -s 100 --fit contain
```

**Common Sizes:**

- **64x64** - Favicon, small icons
- **150x150** - Default thumbnail
- **200x200** - Medium thumbnails
- **300x300** - Large thumbnails
- **512x512** - App icons

---

### 12. **tint** - Apply Color Tint

Apply color tint overlay to images.

**Usage:**

```bash
mediaproc image tint <input> [options]
```

**Options:**

- `-c, --color <color>` - Tint color (hex, rgb, or name, default: #0000ff)
- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Apply blue tint
mediaproc image tint photo.jpg -c blue

# Apply sepia tint
mediaproc image tint image.png -c "#704214"

# Apply custom RGB tint
mediaproc image tint pic.jpg -c "rgb(255, 100, 50)"
```

**Common Tints:**

- **Sepia (#704214)** - Vintage/warm look
- **Blue (#0066cc)** - Cool/cold mood
- **Orange (#ff6600)** - Warm/sunset effect
- **Purple (#9933cc)** - Creative/artistic
- **Green (#00cc66)** - Nature/fresh feel

---

### 13. **negate** - Create Negative

Create negative/inverted images.

**Usage:**

```bash
mediaproc image negate <input> [options]
```

**Options:**

- `--alpha` - Also negate alpha/transparency channel
- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Create negative
mediaproc image negate photo.jpg

# Negate with alpha channel
mediaproc image negate image.png --alpha
```

**Use Cases:**

- Artistic effects
- X-ray style images
- Film negatives
- High contrast viewing
- Dark mode alternatives

---

### 14. **normalize** - Enhance Contrast

Normalize images by auto-enhancing contrast.

**Usage:**

```bash
mediaproc image normalize <input> [options]
```

**Options:**

- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Auto-enhance contrast
mediaproc image normalize photo.jpg

# Fix underexposed image
mediaproc image normalize dark-image.png

# Fix washed out image
mediaproc image normalize overexposed.jpg
```

**Best For:**

- Underexposed photos
- Overexposed photos
- Low contrast images
- Scanned documents
- Poor lighting conditions

---

### 15. **modulate** - Adjust Colors

Adjust brightness, saturation, and hue.

**Usage:**

```bash
mediaproc image modulate <input> [options]
```

**Options:**

- `-b, --brightness <value>` - Brightness multiplier 0.1-10 (default: 1)
- `-s, --saturation <value>` - Saturation multiplier 0.1-10 (default: 1)
- `--hue <degrees>` - Hue rotation -360 to 360 (default: 0)
- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Increase brightness by 20%
mediaproc image modulate photo.jpg -b 1.2

# Boost saturation by 50%
mediaproc image modulate image.png -s 1.5

# Rotate hue by 180 degrees
mediaproc image modulate pic.jpg --hue 180

# Adjust all three
mediaproc image modulate photo.jpg -b 1.2 -s 1.3 --hue 30
```

**Brightness:**

- **0.5** - 50% darker
- **1.0** - No change (default)
- **1.5** - 50% brighter
- **2.0** - Double brightness

**Saturation:**

- **0.0** - Grayscale
- **1.0** - No change (default)
- **1.5** - 50% more vibrant
- **2.0** - Double saturation

---

### 16. **gamma** - Gamma Correction

Apply gamma correction to adjust midtones.

**Usage:**

```bash
mediaproc image gamma <input> [options]
```

**Options:**

- `-g, --gamma <value>` - Gamma value 1-3 (default: 2.2)
- `--gamma-out <value>` - Output gamma value (optional)
- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Standard sRGB gamma
mediaproc image gamma photo.jpg -g 2.2

# Brighten midtones
mediaproc image gamma image.png -g 1.5

# Darken midtones
mediaproc image gamma pic.jpg -g 2.8
```

**Gamma Values:**

- **1.0** - Linear (no correction)
- **1.5** - Lighter midtones
- **2.2** - Standard sRGB
- **2.4** - Rec. 709 (video)
- **2.8** - Darker midtones

---

### 17. **trim** - Remove Borders

Auto-trim/remove border edges from images.

**Usage:**

```bash
mediaproc image trim <input> [options]
```

**Options:**

- `-t, --threshold <value>` - Edge detection threshold 1-100 (default: 10)
- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Auto-trim with default threshold
mediaproc image trim photo.jpg

# Gentle trim
mediaproc image trim image.png -t 5

# Aggressive trim
mediaproc image trim pic.jpg -t 20
```

**Threshold Guide:**

- **1-5** - Very sensitive
- **10** - Default (balanced)
- **15-25** - Aggressive
- **25+** - Very aggressive

**Best For:**

- Scanned documents
- Screenshots
- Solid color borders
- Product photos
- Auto-cropping

---

### 18. **extend** - Add Padding

Add padding/borders around images.

**Usage:**

```bash
mediaproc image extend <input> [options]
```

**Options:**

- `--all <pixels>` - Padding on all sides (shortcut)
- `--top <pixels>` - Top padding
- `--bottom <pixels>` - Bottom padding
- `--left <pixels>` - Left padding
- `--right <pixels>` - Right padding
- `--background <color>` - Background color (default: white)
- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Add 50px padding on all sides
mediaproc image extend photo.jpg --all 50

# Add black border
mediaproc image extend image.png --all 20 --background black

# Add padding top/bottom only
mediaproc image extend pic.jpg --top 100 --bottom 100

# Custom color border
mediaproc image extend photo.jpg --all 30 --background "#ff0000"
```

**Use Cases:**

- Adding borders/frames
- Letterbox/pillarbox effect
- Preparing for specific dimensions
- Space for text overlay
- Social media formatting

---

### 19. **median** - Noise Reduction

Apply median filter for noise reduction.

**Usage:**

```bash
mediaproc image median <input> [options]
```

**Options:**

- `-s, --size <size>` - Filter size 1-50 (default: 3)
- `-o, --output <path>` - Output file path
- `-q, --quality <quality>` - Quality 1-100 (default: 90)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output
- `--help` - Display help

**Examples:**

```bash
# Default median filter
mediaproc image median photo.jpg

# Stronger noise reduction
mediaproc image median noisy-image.png -s 5

# Remove scanner artifacts
mediaproc image median scan.jpg -s 7
```

**Filter Size:**

- **1** - Minimal smoothing
- **3** - Default (balanced)
- **5-7** - Strong noise reduction
- **10+** - Heavy smoothing

**Best For:**

- Salt-and-pepper noise
- Scanner artifacts
- JPEG compression noise
- Old photo restoration
- Low-light camera noise

---

### 20. **composite** - Layer Images

Composite/blend multiple images together with various blend modes and positioning.

**Usage:**

```bash
mediaproc image composite <base> <overlay> [options]
```

**Options:**

- `--blend <mode>` - Blend mode: over, add, multiply, screen, overlay (default: over)
- `--gravity <position>` - Position: center, north, south, east, west, northeast, northwest, southeast, southwest (default: center)
- `--opacity <value>` - Overlay opacity 0-1 (default: 1)
- `-x <pixels>` - X offset from gravity position
- `-y <pixels>` - Y offset from gravity position
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**

```bash
# Overlay image on top
mediaproc image composite base.jpg overlay.png

# Blend with multiply mode
mediaproc image composite photo.jpg texture.jpg --blend multiply

# Position in top-right with opacity
mediaproc image composite bg.jpg logo.png --gravity northeast --opacity 0.7

# Precise positioning
mediaproc image composite base.jpg watermark.png -x 50 -y 50
```

**Blend Modes:**

- **over** - Normal overlay (default)
- **add** - Additive blend
- **multiply** - Darken blend
- **screen** - Lighten blend
- **overlay** - Enhanced contrast blend

---

### 21. **extract** - Extract Channels

Extract specific color channels or regions from images.

**Usage:**

```bash
mediaproc image extract <input> [options]
```

**Options:**

- `--channel <channel>` - Channel: red, green, blue, alpha (default: red)
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**

```bash
# Extract red channel
mediaproc image extract photo.jpg --channel red

# Extract alpha channel (transparency)
mediaproc image extract image.png --channel alpha

# Extract green channel
mediaproc image extract pic.jpg --channel green -o green-channel.jpg
```

**Use Cases:**

- Channel analysis
- Alpha mask extraction
- Color correction workflows
- Special effects
- Debugging image issues

---

### 22. **border** - Add Decorative Borders

Add colored borders/frames around images.

**Usage:**

```bash
mediaproc image border <input> [options]
```

**Options:**

- `-w, --width <pixels>` - Border width (default: 10)
- `-c, --color <color>` - Border color (default: black)
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**

```bash
# Default black border
mediaproc image border photo.jpg

# White border
mediaproc image border image.png -w 20 -c white

# Custom color border
mediaproc image border pic.jpg -w 15 -c "#ff6600"

# Instagram-style border
mediaproc image border photo.jpg -w 30 -c "#f0f0f0"
```

**Popular Border Styles:**

- **Black 10px** - Classic frame
- **White 20-30px** - Instagram style
- **Gray 5px** - Subtle separation
- **Colored borders** - Branding/themes

---

### 23. **stats** - Image Information

Display detailed technical information about images.

**Usage:**

```bash
mediaproc image stats <input> [options]
```

**Options:**

- `-v, --verbose` - Show extended metadata and channel statistics
- `--help` - Display help

**Examples:**

```bash
# Basic stats
mediaproc image stats photo.jpg

# Detailed analysis
mediaproc image stats image.png -v
```

**Information Displayed:**

- Format and dimensions
- Color space and channels
- File size and compression
- DPI/density
- Bit depth
- EXIF metadata (if present)
- Color profile information
- Channel statistics (with -v)

**Use Cases:**

- Pre-processing analysis
- Quality verification
- Format identification
- Troubleshooting
- Metadata inspection

---

### 24. **sepia** - Vintage Sepia Tone

Apply vintage sepia tone effect for classic photography look.

**Usage:**

```bash
mediaproc image sepia <input> [options]
```

**Options:**

- `-i, --intensity <value>` - Sepia intensity 0-100 (default: 80)
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**

```bash
# Classic sepia
mediaproc image sepia photo.jpg

# Strong vintage effect
mediaproc image sepia old-photo.png -i 100

# Subtle warmth
mediaproc image sepia modern.jpg -i 40
```

**Intensity Guide:**

- **20-40** - Subtle warm tint
- **60-80** - Classic sepia (recommended)
- **80-100** - Strong vintage effect

---

### 25. **clahe** - Contrast Enhancement

Apply Contrast Limited Adaptive Histogram Equalization for advanced contrast enhancement.

**Usage:**

```bash
mediaproc image clahe <input> [options]
```

**Options:**

- `-w, --width <pixels>` - Region width (default: 8)
- `-h, --height <pixels>` - Region height (default: 8)
- `--max-slope <value>` - Maximum contrast slope 0-100 (default: 2.5)
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**

```bash
# Default CLAHE
mediaproc image clahe photo.jpg

# Strong enhancement
mediaproc image clahe underexposed.jpg --max-slope 4

# Fine-grained adjustment
mediaproc image clahe medical.png -w 16 -h 16
```

**Best For:**

- Medical imaging
- Scientific photography
- Underwater photos
- Low-light images
- X-ray enhancement

---

### 26. **convolve** - Custom Kernel Filters

Apply custom convolution kernels for advanced image filtering.

**Usage:**

```bash
mediaproc image convolve <input> [options]
```

**Options:**

- `-k, --kernel <name>` - Preset kernel: sharpen, emboss, edge-detect, box-blur, gaussian-blur, laplacian, high-pass
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**

```bash
# Edge detection
mediaproc image convolve photo.jpg -k edge-detect

# Emboss effect
mediaproc image convolve image.png -k emboss

# High-pass filter
mediaproc image convolve pic.jpg -k high-pass
```

**Preset Kernels:**

- **sharpen** - Enhance edges
- **emboss** - 3D relief effect
- **edge-detect** - Detect edges
- **box-blur** - Simple blur
- **gaussian-blur** - Smooth blur
- **laplacian** - Edge enhancement
- **high-pass** - Detail extraction

---

### 27. **vignette** - Darken Edges

Add vignette effect (darkened edges) for artistic focus.

**Usage:**

```bash
mediaproc image vignette <input> [options]
```

**Options:**

- `-i, --intensity <value>` - Vignette intensity 0-100 (default: 50)
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**

```bash
# Default vignette
mediaproc image vignette photo.jpg

# Subtle vignette
mediaproc image vignette portrait.png -i 30

# Strong dramatic effect
mediaproc image vignette landscape.jpg -i 80
```

**Intensity Guide:**

- **20-40** - Subtle focus
- **40-60** - Balanced (recommended)
- **60-80** - Dramatic effect
- **80-100** - Heavy darkening

---

## 🔧 Global Options

All commands support these global options:

- `-o, --output <path>` - Custom output file path
- `-q, --quality <quality>` - Output quality (1-100)
- `--dry-run` - Preview changes without executing
- `-v, --verbose` - Show detailed processing information
- `--help` - Display command-specific help

## 💡 Usage Tips

### Quality Settings

- **90-100**: Maximum quality, larger files
- **85-90**: Recommended for web (best balance)
- **70-85**: Good compression, slight quality loss
- **Below 70**: High compression, noticeable quality loss

### File Formats

- **WebP**: Best for web, 25-35% smaller than JPG/PNG
- **AVIF**: Newest format, smaller than WebP
- **JPG**: Best for photos
- **PNG**: Best for graphics with transparency

### Batch Processing

```bash
# Process multiple files
for file in *.jpg; do
  mediaproc image resize "$file" -w 1920 -h 1080
done

# Convert all images to WebP
for file in *.{jpg,png}; do
  mediaproc image convert "$file" -f webp -q 85
done
```

### Chaining Commands

Use dry-run to test, then execute:

```bash
# Test first
mediaproc image resize photo.jpg -w 800 --dry-run

# Then execute
mediaproc image resize photo.jpg -w 800
```

## 🚀 Performance

- Built on libvips for high performance
- Processes 4-5x faster than ImageMagick
- Low memory footprint
- Efficient multi-threading
- Optimized for batch processing

## 📝 Examples

### Web Optimization Workflow

```bash
# 1. Resize for web
mediaproc image resize photo.jpg -w 1920 -h 1080

# 2. Optimize
mediaproc image optimize photo-1920x1080.jpg -q 85

# 3. Convert to WebP
mediaproc image convert photo-1920x1080-optimized.jpg -f webp
```

### Photo Enhancement Workflow

```bash
# 1. Normalize contrast
mediaproc image normalize photo.jpg

# 2. Adjust colors
mediaproc image modulate photo-normalized.jpg -b 1.1 -s 1.2

# 3. Sharpen
mediaproc image sharpen photo-normalized-modulated.jpg -s 1.5
```

### Thumbnail Generation

```bash
# Generate multiple sizes
mediaproc image thumbnail photo.jpg -s 64 -o thumb-64.jpg
mediaproc image thumbnail photo.jpg -s 150 -o thumb-150.jpg
mediaproc image thumbnail photo.jpg -s 300 -o thumb-300.jpg
```

---

## 🤖 Custom/Smart Commands

### **batch** - Bulk Image Processing

Process multiple images in a directory with any operation.

**Usage:**

```bash
mediaproc image batch <directory> --operation <operation> [options]
```

**Options:**

- `-op, --operation <operation>` - Operation to apply: resize, convert, optimize, grayscale, etc. (required)
- `-o, --output <directory>` - Output directory (default: ./output)
- `-r, --recursive` - Process subdirectories
- `--width <pixels>` - Width for resize
- `--height <pixels>` - Height for resize
- `-f, --format <format>` - Output format for convert
- `-q, --quality <quality>` - Quality setting

**Examples:**

```bash
# Resize all images
mediaproc image batch ./photos --operation resize --width 1920

# Convert all to WebP
mediaproc image batch ./images -op convert --format webp -q 90

# Optimize all images
mediaproc image batch ./pics -op optimize -q 85 -o ./optimized

# Generate thumbnails
mediaproc image batch ./gallery -op thumbnail --width 200 --height 200
```

**Supported Operations:** resize, convert, optimize, grayscale, blur, sharpen, thumbnail, sepia, normalize

---

### **smart-crop** - Intelligent Content-Aware Cropping

Automatically crop to target dimensions while preserving important content.

**Usage:**

```bash
mediaproc image smart-crop <input> -w <width> -h <height> [options]
```

**Options:**

- `-w, --width <pixels>` - Target width (required)
- `-h, --height <pixels>` - Target height (required)
- `-s, --strategy <type>` - Strategy: entropy (edges/details) or attention (center-weighted) (default: entropy)
- `-o, --output <path>` - Output file path

**Examples:**

```bash
# Social media banner
mediaproc image smart-crop photo.jpg -w 1200 -h 630

# Square crop for Instagram
mediaproc image smart-crop portrait.jpg -w 800 -h 800 --strategy attention

# Product thumbnail
mediaproc image smart-crop product.png -w 600 -h 600 -o thumbnail.png
```

**Common Dimensions:**

- `1200x630` - Facebook/LinkedIn posts
- `1024x512` - Twitter cards
- `1080x1080` - Instagram square
- `800x800` - General thumbnails

---

### **pixelate** - Retro Pixel Art Effect

Apply pixelate/mosaic effect for artistic or privacy purposes.

**Usage:**

```bash
mediaproc image pixelate <input> [options]
```

**Options:**

- `-p, --pixels <size>` - Pixel size 2-50 (default: 10) - larger = more pixelated
- `-o, --output <path>` - Output file path

**Examples:**

```bash
# Default pixelation
mediaproc image pixelate photo.jpg

# Heavy pixelation for privacy
mediaproc image pixelate face.jpg --pixels 20

# 8-bit retro gaming style
mediaproc image pixelate game.jpg --pixels 8 -o retro.jpg
```

**Use Cases:**

- Retro gaming aesthetics (8-12 pixel size)
- Privacy protection (15-25 pixel size)
- Artistic effects
- Censorship/redaction

---

### **palette** - Color Palette Extraction

Extract and display dominant colors from images.

**Usage:**

```bash
mediaproc image palette <input> [options]
```

**Options:**

- `-c, --colors <count>` - Number of colors 1-10 (default: 5)
- `-v, --verbose` - Show hex codes and RGB values

**Examples:**

```bash
# Extract 5 dominant colors
mediaproc image palette photo.jpg

# Get brand colors
mediaproc image palette logo.png --colors 3 -v

# Full palette analysis
mediaproc image palette artwork.jpg --colors 10
```

**Output Includes:**

- Dominant colors ranked by prevalence
- RGB and hex values
- Color temperature (warm/cool)
- Brightness analysis
- Saturation levels

**Use Cases:**

- Design inspiration
- Brand color extraction
- Theme generation
- UI/UX color matching

---

### 28. **smart-crop** - Intelligent Content-Aware Cropping

Automatically crop to target dimensions while preserving important content using edge detection.

**Usage:**

```bash
mediaproc image smart-crop <input> -w <width> -h <height> [options]
```

**Options:**

- `-w, --width <pixels>` - Target width (required)
- `-h, --height <pixels>` - Target height (required)
- `-s, --strategy <type>` - Strategy: entropy (edges/details) or attention (center-weighted) (default: entropy)
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**

```bash
# Social media banner
mediaproc image smart-crop photo.jpg -w 1200 -h 630

# Square crop for Instagram
mediaproc image smart-crop portrait.jpg -w 800 -h 800 --strategy attention

# Product thumbnail
mediaproc image smart-crop product.png -w 600 -h 600
```

**Strategies:**

- **entropy** - Focus on edges and details (best for landscapes)
- **attention** - Center-weighted (best for portraits)

**Common Social Media Dimensions:**

- **1200x630** - Facebook/LinkedIn posts
- **1024x512** - Twitter cards
- **1080x1080** - Instagram square
- **1080x1350** - Instagram portrait
- **800x800** - General thumbnails

---

### 29. **pixelate** - Retro Pixel Art Effect

Apply pixelate/mosaic effect for artistic or privacy purposes.

**Usage:**

```bash
mediaproc image pixelate <input> [options]
```

**Options:**

- `-p, --pixels <size>` - Pixel size 2-50 (default: 10) - larger = more pixelated
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**

```bash
# Default pixelation
mediaproc image pixelate photo.jpg

# Heavy pixelation for privacy
mediaproc image pixelate face.jpg --pixels 20

# 8-bit retro gaming style
mediaproc image pixelate game.jpg --pixels 8
```

**Pixel Size Guide:**

- **2-5** - Subtle texture
- **8-12** - Retro gaming aesthetics
- **15-25** - Privacy protection
- **30+** - Abstract art

---

### 30. **palette** - Color Palette Extraction

Extract and display dominant colors with detailed analysis.

**Usage:**

```bash
mediaproc image palette <input> [options]
```

**Options:**

- `-c, --colors <count>` - Number of colors 1-10 (default: 5)
- `-v, --verbose` - Show hex codes and RGB values
- `--help` - Display help

**Examples:**

```bash
# Extract 5 dominant colors
mediaproc image palette photo.jpg

# Get brand colors
mediaproc image palette logo.png --colors 3 -v

# Full palette analysis
mediaproc image palette artwork.jpg --colors 10
```

**Output Includes:**

- Dominant colors ranked by prevalence
- RGB and hex values
- Color temperature (warm/cool)
- Brightness analysis
- Saturation levels
- Channel statistics

---

### 31. **batch** - Bulk Image Processing

Process multiple images in a directory with any supported operation.

**Usage:**

```bash
mediaproc image batch <directory> --operation <operation> [options]
```

**Options:**

- `-op, --operation <operation>` - Operation: resize, convert, optimize, grayscale, etc. (required)
- `-o, --output <directory>` - Output directory (default: ./output)
- `-r, --recursive` - Process subdirectories
- `--width <pixels>` - Width for resize operations
- `--height <pixels>` - Height for resize operations
- `-f, --format <format>` - Output format for convert
- `-q, --quality <quality>` - Quality setting 1-100
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**

```bash
# Resize all images
mediaproc image batch ./photos --operation resize --width 1920

# Convert all to WebP
mediaproc image batch ./images -op convert --format webp -q 90

# Optimize all recursively
mediaproc image batch ./pics -op optimize -q 85 -o ./optimized -r

# Generate thumbnails
mediaproc image batch ./gallery -op thumbnail --width 200
```

**Supported Operations:**
resize, convert, optimize, grayscale, blur, sharpen, thumbnail, sepia, normalize, modulate, rotate, flip

---

### 32. **auto-enhance** - Automatic Image Enhancement

Intelligently enhance images with automatic color, contrast, and sharpness adjustments.

**Usage:**

```bash
mediaproc image auto-enhance <input> [options]
```

**Options:**

- `-l, --level <level>` - Enhancement level: low, medium, high (default: medium)
- `-o, --output <path>` - Output file path
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Enhancement Levels:**

- **low** - Normalize + Light sharpen (subtle, ~10% improvement)
- **medium** - Normalize + Color boost + Sharpen (balanced, ~30% improvement)
- **high** - Normalize + CLAHE + Strong color boost + Heavy sharpen (aggressive, ~50% improvement)

**Examples:**

```bash
# Default enhancement
mediaproc image auto-enhance photo.jpg

# Strong enhancement for dark images
mediaproc image auto-enhance dark.jpg --level high

# Subtle enhancement
mediaproc image auto-enhance good-photo.jpg -l low
```

**What Gets Enhanced:**

- ✅ Color normalization and balance
- ✅ Contrast enhancement (CLAHE for high level)
- ✅ Sharpness and clarity
- ✅ Brightness optimization
- ✅ Saturation boost
- ✅ Detail preservation

**Best For:**

- Quick photo fixes
- Batch photo processing
- Underexposed images
- Low-contrast photos
- Dull/flat images

---

### **auto-enhance** - Automatic Image Enhancement

Intelligently enhance images with one command.

**Usage:**

```bash
mediaproc image auto-enhance <input> [options]
```

**Options:**

- `-l, --level <level>` - Enhancement level: low, medium, high (default: medium)
- `-o, --output <path>` - Output file path

**Enhancement Levels:**

- **low** - Normalize + Light sharpen (subtle)
- **medium** - Normalize + Color boost + Sharpen (recommended)
- **high** - Normalize + CLAHE + Strong color boost + Heavy sharpen (aggressive)

**Examples:**

```bash
# Default enhancement
mediaproc image auto-enhance photo.jpg

# Strong enhancement for dark images
mediaproc image auto-enhance dark.jpg --level high

# Subtle enhancement
mediaproc image auto-enhance good-photo.jpg -l low
```

**What Gets Enhanced:**

- Color normalization
- Sharpness
- Contrast
- Brightness
- Clarity
- Detail preservation

---

### 39. **grid** - Create Image Collages

Combine multiple images into professional grid/collage layouts with full control over spacing, sizing, and background.

**Usage:**

```bash
mediaproc image grid <images...> [options]
```

**Options:**

- `-c, --columns <number>` - Number of columns (auto-calculated if not specified)
- `-r, --rows <number>` - Number of rows (auto-calculated if not specified)
- `-w, --width <pixels>` - Width of each cell (default: 300)
- `-h, --height <pixels>` - Height of each cell (default: 300)
- `-g, --gap <pixels>` - Gap between images in pixels (default: 10)
- `-b, --background <color>` - Background color (default: white)
- `-o, --output <path>` - Output file path (default: grid.png)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**

```bash
# Auto 2x2 grid
mediaproc image grid img1.jpg img2.jpg img3.jpg img4.jpg

# 3-column layout (auto rows)
mediaproc image grid photos/*.jpg -c 3 -w 400 -h 400

# Instagram multi-post (3x3 square grid)
mediaproc image grid *.png -c 3 -w 400 -h 400 -g 0 -o instagram.jpg

# Photo album with spacing
mediaproc image grid family*.jpg -c 4 -g 20 -b "#f5f5f5"

# Portfolio grid
mediaproc image grid portfolio/*.jpg -r 2 -c 5 -w 300 -h 300 -g 15
```

**Auto Layout:**

- If no columns/rows specified: Auto-calculates square-ish grid
- If only columns specified: Auto-calculates rows
- If only rows specified: Auto-calculates columns
- 4 images → 2x2, 6 images → 2x3, 9 images → 3x3

**Cell Sizing:**

- All images resized to cell dimensions
- Uses "cover" fit mode (maintains aspect ratio, crops if needed)
- Images centered in cells
- Quality preserved during resize

**Common Grid Sizes:**

- **2x2** - Four image collage (1200x1200 typical)
- **3x3** - Instagram multi-post (1200x1200 or 1800x1800)
- **1x3** - Horizontal trio (900x300 typical)
- **3x1** - Vertical trio (300x900 typical)
- **4x4** - Photo album page (1600x1600)

**Social Media Presets:**

```bash
# Instagram post (3x3)
grid *.jpg -c 3 -w 400 -h 400 -g 0 -o insta.jpg

# Facebook cover
grid *.jpg -c 5 -r 2 -w 200 -h 200 -g 10

# Pinterest board
grid *.jpg -c 4 -w 250 -h 350 -g 15
```

**Use Cases:**

- 📱 Instagram multi-image posts
- 📸 Photo albums and galleries
- 🎨 Portfolio presentations
- 📊 Before/after comparisons
- 🏠 Real estate property showcases
- 👗 Product variation displays
- 🎬 Video thumbnails/previews
- 📚 Magazine-style layouts

**Background Colors:**

- **white** - Clean, professional
- **black** - Dramatic, artistic
- **#f5f5f5** - Subtle gray
- **transparent** - For PNG overlays
- **#hex or rgb()** - Custom brand colors

**Tips:**

- Use zero gap (-g 0) for seamless grids
- Larger cells (400-500px) for high quality
- Consistent cell sizes look more professional
- Match background to destination (white for web)
- Use -g 20-30 for print layouts

---

### 40. **composite** - Advanced Layer Blending

_See command #20 above for full composite documentation_

---

## 🎯 Command Quick Reference

| Category      | Commands                                                       | Count  |
| ------------- | -------------------------------------------------------------- | ------ |
| **Transform** | resize, crop, rotate, flip, trim, extend, thumbnail            | 7      |
| **Color**     | modulate, gamma, tint, grayscale, negate, normalize            | 6      |
| **Effects**   | blur, sharpen, median, sepia, vignette, pixelate               | 6      |
| **Advanced**  | composite, extract, border, clahe, convolve, watermark         | 6      |
| **Smart/AI**  | smart-crop, auto-enhance, palette, dominant-color, grid, batch | 6      |
| **Utility**   | convert, optimize, stats, split, stack, mirror, metadata       | 7      |
| **TOTAL**     |                                                                | **40** |

---

Combine multiple images into a grid/collage layout with customizable spacing and background.

**Usage:**

```bash
mediaproc image grid <images...> [options]
```

**Options:**

- `-c, --columns <number>` - Number of columns (auto-calculated if not specified)
- `-r, --rows <number>` - Number of rows (auto-calculated if not specified)
- `-w, --width <pixels>` - Width of each cell (default: 300)
- `-h, --height <pixels>` - Height of each cell (default: 300)
- `-g, --gap <pixels>` - Gap between images (default: 10)
- `-b, --background <color>` - Background color (default: white)
- `-o, --output <path>` - Output file path (default: grid.png)

**Examples:**

```bash
# Create 2x2 grid
mediaproc image grid img1.jpg img2.jpg img3.jpg img4.jpg

# 3-column layout with custom cell size
mediaproc image grid photos/*.jpg -c 3 -w 400 -h 400

# Instagram post with black background
mediaproc image grid *.png -c 3 -g 20 -b black
```

---

### 34. **split** - Split Image into Tiles

Divide large images into smaller tiles, perfect for Instagram carousels or large format printing.

**Usage:**

```bash
mediaproc image split <input> [options]
```

**Options:**

- `-t, --tiles <pattern>` - Grid pattern (e.g., "3x3", "1x10")
- `-r, --rows <number>` - Number of rows
- `-c, --columns <number>` - Number of columns
- `-o, --output <dir>` - Output directory (default: ./tiles)

**Examples:**

```bash
# Split into 3x3 grid
mediaproc image split photo.jpg --tiles 3x3

# Instagram carousel (10 horizontal slices)
mediaproc image split panorama.jpg -t "1x10"

# Large poster into 4x4 tiles for printing
mediaproc image split poster.jpg -r 4 -c 4 -o ./poster-tiles

# Vertical split for comparison
mediaproc image split before-after.jpg --tiles "1x2"
```

**Tile Naming:**

- Output files named: `tile_row_col.ext` (e.g., `tile_0_0.jpg`, `tile_0_1.jpg`)
- Zero-indexed coordinates
- Preserves original format

**Common Patterns:**

- **1x10** - Instagram carousel (panorama)
- **2x2** - Four-way comparison
- **3x3** - Nine-tile puzzle
- **4x4** - Large format printing
- **1x2** - Before/after split

**Use Cases:**

- Instagram carousel posts
- Large format printing on small printers
- Image puzzles
- Tiled backgrounds
- Progressive image loading

---

### 35. **metadata** - EXIF/Metadata Management

View, export, or remove image metadata including EXIF, IPTC, and XMP data.

**Usage:**

```bash
mediaproc image metadata <input> [options]
```

**Options:**

- `--remove` - Remove all metadata (create clean copy)
- `--export <path>` - Export metadata to JSON file
- `-o, --output <path>` - Output file path (when removing metadata)
- `-v, --verbose` - Show detailed metadata information
- `--help` - Display help

**Examples:**

```bash
# View basic metadata
mediaproc image metadata photo.jpg

# View detailed metadata
mediaproc image metadata photo.jpg -v

# Remove all metadata for privacy
mediaproc image metadata photo.jpg --remove

# Export metadata to JSON
mediaproc image metadata photo.jpg --export metadata.json

# Clean copy without GPS data
mediaproc image metadata photo.jpg --remove -o clean.jpg
```

**Metadata Types:**

- **EXIF** - Camera settings, date, GPS location, device info
- **IPTC** - Copyright, caption, keywords, author
- **XMP** - Extended metadata, Adobe properties
- **ICC** - Color profile information
- **Orientation** - Image rotation data

**Information Displayed:**

- File size and modified date
- Image dimensions and format
- Color space and channels
- DPI/density settings
- Complete EXIF tags (camera, lens, settings)
- GPS coordinates (if present)
- Copyright and attribution

**Why Remove Metadata:**

- 🔒 **Privacy** - Remove GPS location data
- 📉 **File Size** - Metadata can add 10-50KB
- 🛡️ **Security** - Remove camera/device info
- 🌐 **Web Optimization** - Smaller files load faster
- 🤝 **Clean Sharing** - Remove personal data

**File Size Impact:**

- Metadata typically: 10-50KB
- GPS data: ~500 bytes
- Thumbnails in EXIF: 5-30KB
- Total savings: 5-15% of file size

---

### 36. **stack** - Stack Images Horizontally/Vertically

Stack multiple images horizontally or vertically with alignment and spacing control.

**Usage:**

```bash
mediaproc image stack <images...> [options]
```

**Options:**

- `-d, --direction <direction>` - Stack direction: horizontal, vertical (default: horizontal)
- `-a, --align <alignment>` - Alignment: start, center, end (default: center)
- `-g, --gap <pixels>` - Gap between images in pixels (default: 0)
- `-b, --background <color>` - Background color for gaps (default: transparent)
- `-o, --output <path>` - Output file path (default: stacked.png)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**

```bash
# Horizontal before/after comparison
mediaproc image stack before.jpg after.jpg

# Vertical stack with white gaps
mediaproc image stack img1.jpg img2.jpg img3.jpg -d vertical -g 20 -b white

# Create panorama
mediaproc image stack panorama1.jpg panorama2.jpg panorama3.jpg -d horizontal -o panorama.jpg

# Right-aligned horizontal stack
mediaproc image stack photo1.jpg photo2.jpg -a end

# Instagram story sequence
mediaproc image stack story*.jpg -d vertical -g 10 -b black
```

**Direction & Alignment:**

- **horizontal + start** - Images aligned to top
- **horizontal + center** - Images centered vertically (default)
- **horizontal + end** - Images aligned to bottom
- **vertical + start** - Images aligned to left
- **vertical + center** - Images centered horizontally (default)
- **vertical + end** - Images aligned to right

**Use Cases:**

- Before/after comparisons
- Image sequences and timelines
- Panorama creation
- Portfolio layouts
- Tutorial step-by-step guides
- Product variation displays
- Comparison charts
- Story sequences

**Tips:**

- Use gaps (10-20px) for visual separation
- Transparent background works best with PNG output
- Horizontal for wide comparisons
- Vertical for tall/portrait layouts
- Center alignment usually looks best

---

### 37. **mirror** - Mirror & Kaleidoscope Effects

Create stunning mirror and kaleidoscope effects by reflecting images in various ways.

**Usage:**

```bash
mediaproc image mirror <input> [options]
```

**Options:**

- `-m, --mode <mode>` - Mirror mode: horizontal, vertical, both, quad (default: horizontal)
- `-o, --output <path>` - Output file path (default: <input>-mirror-<mode>.ext)
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**

```bash
# Horizontal mirror (left-right symmetry)
mediaproc image mirror photo.jpg

# Vertical mirror (water reflection)
mediaproc image mirror landscape.jpg --mode vertical

# Both axes (4-way symmetry)
mediaproc image mirror portrait.jpg --mode both

# Kaleidoscope effect (quad mirror)
mediaproc image mirror photo.jpg --mode quad
```

**Mirror Modes:**

- **horizontal** - Mirror left to right (creates left-right symmetry)
  - Output: 2x original width
  - Perfect for face symmetry experiments
- **vertical** - Mirror top to bottom (creates top-bottom symmetry)
  - Output: 2x original height
  - Perfect for water reflections, sky mirrors
- **both** - Mirror on both axes (creates 4-way symmetry)
  - Output: 2x width × 2x height
  - Creates complete symmetry
- **quad** - Kaleidoscope effect (mirrors center quadrant)
  - Output: Original size with center mirrored 4 ways
  - Creates mandala-like patterns

**Creative Uses:**

- 🪞 Water reflections (vertical mode)
- 👤 Symmetrical portraits
- 🎨 Kaleidoscope art (quad mode)
- 🌀 Abstract patterns
- 🦋 Rorschach test style images
- 🏛️ Architectural symmetry
- 🌸 Mandala-like designs
- 🎭 Surreal art effects

**Best Practices:**

- Works best with asymmetric input images
- Quad mode creates most dramatic effects
- Combine with other effects for unique results
- Try different modes on the same image

---

### 38. **dominant-color** - Quick Color Extraction

Quickly extract the most dominant colors from an image for instant palette generation.

**Usage:**

```bash
mediaproc image dominant-color <input> [options]
```

**Options:**

- `-c, --count <number>` - Number of dominant colors to extract (default: 5, max: 10)
- `--export <path>` - Export color palette to JSON file
- `-v, --verbose` - Show detailed RGB/HSL values
- `--help` - Display help

**Examples:**

```bash
# Extract top 5 dominant colors
mediaproc image dominant-color photo.jpg

# Get top 3 colors
mediaproc image dominant-color logo.png --count 3

# Export palette to JSON
mediaproc image dominant-color photo.jpg --export palette.json

# Detailed color info
mediaproc image dominant-color artwork.jpg -c 5 -v
```

**Output Format:**

- 🎨 **Visual Preview** - Colored blocks in terminal
- 🔢 **Hex Codes** - #RRGGBB format
- 📊 **Coverage Percentage** - How much of image uses each color
- 🌈 **RGB Values** - (r, g, b) with -v flag
- 🎨 **HSL Values** - (hue, saturation, lightness) with -v flag

**Color Analysis:**

- Colors sorted by dominance (most to least)
- Percentage shows coverage in image
- Bucketed to reduce near-identical colors
- Automatically filters similar shades

**Use Cases:**

- 🎨 Generate color palettes for design projects
- 🏢 Brand color extraction from logos
- 🌐 Website theme generation
- 📱 App UI color schemes
- 🎬 Video/film color grading reference
- 🖌️ Digital art inspiration
- 👗 Fashion color matching
- 🏠 Interior design palettes

**Export JSON Format:**

```json
{
  "source": "photo.jpg",
  "imageSize": { "width": 1920, "height": 1080 },
  "colors": [
    {
      "hex": "#3a5f7d",
      "rgb": { "r": 58, "g": 95, "b": 125 },
      "hsl": { "h": 207, "s": 37, "l": 36 },
      "percentage": 23.5
    }
  ]
}
```

**Tips:**

- Use fewer colors (2-3) for minimalist palettes
- 5-7 colors ideal for comprehensive palettes
- Export to JSON for use in design tools
- Smaller images process faster (auto-optimized)
- Works best with high-contrast images

---

### 39. **grid** - Create Image Collages

# Instagram carousel (10 horizontal slices)

mediaproc image split panorama.jpg -t "1x10"

# Large poster into 4x4 tiles

mediaproc image split poster.jpg -r 4 -c 4 -o ./poster-tiles

````

---

### 35. **metadata** - View/Export/Remove Metadata

View, export to JSON, or remove EXIF/IPTC/XMP metadata from images.

**Usage:**
```bash
mediaproc image metadata <input> [options]
````

**Options:**

- `--remove` - Remove all metadata (create clean copy)
- `--export <path>` - Export metadata to JSON file
- `-o, --output <path>` - Output file (when removing metadata)
- `-v, --verbose` - Show detailed metadata

**Examples:**

```bash
# View metadata
mediaproc image metadata photo.jpg

# Remove all metadata for privacy
mediaproc image metadata photo.jpg --remove

# Export metadata to JSON
mediaproc image metadata photo.jpg --export data.json

# Clean copy without GPS data
mediaproc image metadata photo.jpg --remove -o clean.jpg
```

---

### 36. **stack** - Stack Images

Stack multiple images horizontally or vertically with customizable alignment and spacing.

**Usage:**

```bash
mediaproc image stack <images...> [options]
```

**Options:**

- `-d, --direction <direction>` - Stack direction: horizontal, vertical (default: horizontal)
- `-a, --align <alignment>` - Alignment: start, center, end (default: center)
- `-g, --gap <pixels>` - Gap between images (default: 0)
- `-b, --background <color>` - Background color for gaps (default: transparent)
- `-o, --output <path>` - Output file path

**Examples:**

```bash
# Horizontal before/after comparison
mediaproc image stack before.jpg after.jpg

# Vertical stack with white gaps
mediaproc image stack img1.jpg img2.jpg img3.jpg -d vertical -g 20 -b white

# Create panorama
mediaproc image stack panorama*.jpg -d horizontal -o panorama.jpg
```

---

### 37. **mirror** - Create Mirror Effects

Create mirror and kaleidoscope effects by reflecting images horizontally, vertically, or in quadrants.

**Usage:**

```bash
mediaproc image mirror <input> [options]
```

**Options:**

- `-m, --mode <mode>` - Mirror mode: horizontal, vertical, both, quad (default: horizontal)
- `-o, --output <path>` - Output file path

**Examples:**

```bash
# Horizontal mirror (left-right symmetry)
mediaproc image mirror photo.jpg

# Vertical mirror (water reflection)
mediaproc image mirror landscape.jpg --mode vertical

# Kaleidoscope effect
mediaproc image mirror photo.jpg --mode quad
```

---

### 38. **dominant-color** - Extract Dominant Colors

Quickly extract the most dominant colors from an image for palette generation.

**Usage:**

```bash
mediaproc image dominant-color <input> [options]
```

**Options:**

- `-c, --count <number>` - Number of colors to extract (default: 5, max: 10)
- `--export <path>` - Export color palette to JSON file
- `-v, --verbose` - Show detailed RGB/HSL values

**Examples:**

```bash
# Extract top 5 colors
mediaproc image dominant-color photo.jpg

# Get top 3 colors
mediaproc image dominant-color logo.png --count 3

# Export to JSON for design tools
mediaproc image dominant-color photo.jpg --export palette.json
```

---

## � Real-World Workflows

### Workflow 1: Web Optimization Pipeline

```bash
# 1. Resize for responsive web
mediaproc image resize photo.jpg -w 1920 --fit inside -o web-large.jpg

# 2. Optimize with quality 85
mediaproc image optimize web-large.jpg -q 85

# 3. Convert to modern WebP format
mediaproc image convert web-large-optimized.jpg -f webp -q 85

# 4. Generate thumbnail
mediaproc image thumbnail web-large.jpg -s 300 -o thumb.jpg

# Result: web-large-optimized.webp (smallest), thumb.jpg (preview)
```

### Workflow 2: Social Media Prep

```bash
# Instagram square post
mediaproc image smart-crop photo.jpg -w 1080 -h 1080 -o instagram.jpg

# Facebook cover
mediaproc image smart-crop photo.jpg -w 820 -h 312 -o facebook-cover.jpg

# Twitter card
mediaproc image smart-crop photo.jpg -w 1200 -h 675 -o twitter-card.jpg

# Remove metadata before uploading
mediaproc image metadata instagram.jpg --remove -o instagram-clean.jpg
```

### Workflow 3: Photo Enhancement Pipeline

```bash
# 1. Auto-enhance
mediaproc image auto-enhance photo.jpg --level medium

# 2. Fine-tune colors
mediaproc image modulate photo-auto-enhanced.jpg -b 1.1 -s 1.2

# 3. Add artistic vignette
mediaproc image vignette photo-auto-enhanced-modulated.jpg -i 40

# 4. Final sharpening
mediaproc image sharpen photo-auto-enhanced-modulated-vignette.jpg -s 1.2

# Result: Professional photo ready for portfolio
```

### Workflow 4: Batch Product Photos

```bash
# Process entire product directory
mediaproc image batch ./products --operation resize --width 1200 --height 1200 -o ./web-products

# Add white borders
for file in ./web-products/*.jpg; do
  mediaproc image border "$file" -w 20 -c white
done

# Remove backgrounds (if AI plugin available)
# Then optimize all
mediaproc image batch ./web-products -op optimize -q 90
```

### Workflow 5: Instagram Carousel Creation

```bash
# 1. Create panorama from multiple images
mediaproc image stack img1.jpg img2.jpg img3.jpg -d horizontal -o panorama.jpg

# 2. Split into 10 tiles for carousel
mediaproc image split panorama.jpg --tiles "1x10" -o ./carousel

# 3. Optimize each tile
mediaproc image batch ./carousel -op optimize -q 90

# Result: 10 tiles ready for Instagram carousel post
```

### Workflow 6: Portfolio Grid

```bash
# Create 3x3 portfolio grid
mediaproc image grid portfolio/*.jpg -c 3 -w 500 -h 500 -g 15 -b "#f5f5f5" -o portfolio-grid.jpg

# Add watermark
mediaproc image watermark portfolio-grid.jpg logo.png --position bottom-right --opacity 0.4

# Optimize for web
mediaproc image optimize portfolio-grid-watermark.jpg -q 88 -o final-portfolio.jpg
```

### Workflow 7: Before/After Comparison

```bash
# Stack horizontally
mediaproc image stack before.jpg after.jpg -d horizontal -g 20 -b white -o comparison.jpg

# Add border
mediaproc image border comparison.jpg -w 30 -c "#333333"

# Optimize
mediaproc image optimize comparison-border.jpg -q 90
```

### Workflow 8: Vintage Photo Restoration

```bash
# 1. Denoise
mediaproc image median old-photo.jpg -s 5

# 2. Normalize contrast
mediaproc image normalize old-photo-median.jpg

# 3. Apply sepia for vintage look
mediaproc image sepia old-photo-median-normalized.jpg -i 70

# 4. Add subtle vignette
mediaproc image vignette old-photo-median-normalized-sepia.jpg -i 30

# Result: Restored vintage photo with character
```

### Workflow 9: Privacy-Safe Sharing

```bash
# 1. Remove all metadata (GPS, camera info)
mediaproc image metadata vacation.jpg --remove -o clean.jpg

# 2. Resize to web size
mediaproc image resize clean.jpg -w 1200 --fit inside

# 3. Compress for fast sharing
mediaproc image optimize clean-1200w.jpg -q 80

# Result: Small, fast, privacy-safe image
```

### Workflow 10: Creative Kaleidoscope Art

```bash
# 1. Extract vibrant colors
mediaproc image dominant-color photo.jpg -c 5 --export colors.json

# 2. Boost saturation
mediaproc image modulate photo.jpg -s 1.5

# 3. Create quad mirror effect
mediaproc image mirror photo-modulated.jpg --mode quad

# 4. Add border
mediaproc image border photo-modulated-mirror-quad.jpg -w 40 -c black

# Result: Stunning kaleidoscope art piece
```

### Batch Processing Tips

```bash
# Process all JPGs in directory
for file in *.jpg; do
  mediaproc image resize "$file" -w 1920 -o "processed_$file"
done

# Convert all images to WebP
for file in *.{jpg,png}; do
  mediaproc image convert "$file" -f webp -q 85
done

# Create thumbnails for all images
for file in images/*.jpg; do
  name=$(basename "$file" .jpg)
  mediaproc image thumbnail "$file" -s 200 -o "thumbs/$name-thumb.jpg"
done
```

---

## �🐛 Troubleshooting

### Command Not Found

```bash
# Ensure CLI is installed
npm list -g @mediaproc/cli

# Or use npx
npx @mediaproc/cli image resize photo.jpg -w 800
```

### Invalid Image Format

```bash
# Check supported formats
mediaproc image convert --help

# Supported: jpg, png, webp, avif, tiff, gif
```

### Out of Memory

```bash
# For very large images, consider:
# 1. Resizing first
mediaproc image resize huge.jpg -w 4000

# 2. Processing in smaller batches
# 3. Using lower quality settings
```

## 📚 Additional Resources

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [libvips](https://libvips.github.io/libvips/)
- [Image Optimization Guide](https://web.dev/fast/#optimize-your-images)

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 👤 Author

Created and maintained by [@0xshariq](https://github.com/0xshariq)

---

**Made with ❤️ using [Sharp](https://sharp.pixelplumbing.com/)**
