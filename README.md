# MediaProc

Universal media processing CLI with an extensible plugin architecture. One tool to process all your media - images, videos, audio, documents, and more.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.5.2-blue.svg)](https://www.npmjs.com/package/@mediaproc/cli)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/status-beta-green)](https://github.com/0xshariq/mediaproc)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 📋 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Current Status](#-current-status)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Available Plugins](#-available-plugins)
- [Plugin Terminology](#-plugin-terminology)
- [Documentation](#-documentation)
- [Examples](#-examples)
- [Development](#-development)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Community](#-community)
- [License](#-license)

---

## 🎯 The Problem

Media processing in modern development workflows is **fragmented and complex**:

### Current Pain Points

1. **Too Many Tools**

   - FFmpeg for videos
   - ImageMagick for images
   - SoX for audio
   - Ghostscript for PDFs
   - Different tools for each media type

2. **Inconsistent Interfaces**

   - Each tool has different command syntax
   - Different parameter names and formats
   - Steep learning curve for each tool
   - Hard to remember all the commands

3. **Complex Workflows**

   - Chaining multiple tools together
   - Writing custom shell scripts
   - Managing dependencies across tools
   - Debugging is painful

4. **Lack of Flexibility**

   - Hard to extend with custom processing
   - No plugin ecosystem
   - Difficult to integrate into CI/CD
   - Limited automation capabilities

5. **Performance Issues**
   - Manual parallelization
   - No built-in batch processing
   - Memory management challenges
   - Inefficient for large files

### Real-World Scenarios

**Web Developer:** "I need to resize 100 images, convert to WebP, and optimize for web. Should I use Sharp? ImageMagick? Write a Node script? Use Gulp/Webpack?"

**Video Editor:** "I need to transcode videos, extract thumbnails, and create HLS streams. Do I write FFmpeg commands? Use a GUI tool? Build a custom pipeline?"

**DevOps Engineer:** "I need to automate media processing in CI/CD. How do I make it reliable, fast, and easy to maintain across different media types?"

**Content Manager:** "I need to batch process documents, add watermarks to images, and compress videos. I don't want to learn 5 different tools."

---

## 💡 Our Solution

**MediaProc is a unified CLI that solves these problems:**

### Core Philosophy

🎯 **One Tool for Everything** - Process any media type with consistent commands  
🔌 **Plugin Architecture** - Extend with official or community plugins  
⚡ **Performance First** - Multi-threaded, streaming, optimized for large files  
🎨 **Simple & Intuitive** - Clear commands, helpful errors, great DX  
🔧 **Automation Ready** - Perfect for scripts, CI/CD, and workflows  
🌍 **Community Driven** - Open source, extensible, third-party plugins welcome

### What Makes MediaProc Different

| Feature            | Traditional Tools          | MediaProc                       |
| ------------------ | -------------------------- | ------------------------------- |
| **Interface**      | Different for each tool    | Unified, consistent CLI         |
| **Installation**   | Install 5+ separate tools  | One tool, add plugins as needed |
| **Learning Curve** | Learn each tool separately | Learn once, use everywhere      |
| **Extensibility**  | Limited or none            | Built-in plugin system          |
| **Performance**    | Manual optimization        | Auto-parallelization, streaming |
| **Automation**     | Write custom scripts       | Built-in pipeline workflows     |
| **Community**      | Separate ecosystems        | Unified plugin marketplace      |

### How It Works

```bash
# Traditional approach (multiple tools)
convert input.jpg -resize 1920x1080 output.jpg
ffmpeg -i input.mp4 -c:v h264 -crf 23 output.mp4
sox input.wav -r 44100 output.mp3
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -o output.pdf input.pdf

# MediaProc approach (one tool, consistent syntax)
mediaproc image resize input.jpg --width 1920 --height 1080
mediaproc video transcode input.mp4 --codec h264 --crf 23
mediaproc audio convert input.wav --samplerate 44100 --format mp3
mediaproc document compress input.pdf --quality high
```

---

## 📊 Current Status

**Version**: 0.5.2 (Beta - Production Ready!)  
**Status**: ✅ Image plugin (51 commands) + ✅ Video plugin (6 commands) + Universal CLI  
**Next Release**: Audio & Document plugins (Q1 2026)  
**Expected v1.0**: Q2 2026

### Plugin Management

MediaProc provides comprehensive plugin lifecycle management:

- `mediaproc list` - List all installed plugins with versions
- `mediaproc add <plugin>` - Install plugins from npm registry
- `mediaproc remove <plugin>` - Safely uninstall plugins
- `mediaproc delete <plugin>` - Delete plugins (alias for remove)
- `mediaproc update [plugin]` - Update plugin(s) to latest versions
  - Without plugin name: updates all installed plugins
  - With plugin name: updates specific plugin
  - Shows version changes and update summary
- `mediaproc validate [plugin]` - Validate plugin installation and integrity
  - Check plugin structure and dependencies
  - Verify command registrations
  - Detect issues before execution

### Universal Commands (Work Without Plugins)

Core CLI commands available immediately after installation:

**Media Operations:**

- `mediaproc convert <input> <output>` - Auto-detect and suggest the conversion
- `mediaproc info <file>` - Display comprehensive file information
- `mediaproc optimize <file>` - Analyze and suggest optimization strategies

**Help & Configuration:**

- `mediaproc help [command]` - Show help for commands
- `mediaproc init` - Initialize configuration file
- `mediaproc config` - Manage configuration settings
- `mediaproc run <command>` - Execute plugin commands

### Image Processing (@mediaproc/image)

**Install:** `mediaproc add image`

**51 Professional Commands Available:**

**Transform & Resize** (10 commands)

- `resize` - Resize with fit modes (cover, contain, fill, inside, outside)
- `crop` - Extract rectangular regions with positioning
- `rotate` - Any angle rotation with background control
- `flip` - Vertical mirroring (top-bottom)
- `flop` - Horizontal mirroring (left-right)
- `auto-orient` - Auto-rotate based on EXIF orientation
- `affine` - Apply affine transformation matrix (scale, shear, reflect)
- `trim` - Auto-remove uniform borders
- `extend` - Add padding/borders with custom colors
- `thumbnail` - Generate thumbnails (64px to 512px)

**Color & Tone** (10 commands)

- `modulate` - Adjust brightness, saturation, hue
- `gamma` - Gamma correction for midtones (0.1-3.0)
- `tint` - Apply color tint overlays (RGB hex)
- `grayscale` - Convert to black & white
- `negate` - Create negative/inverted images
- `normalize` - Auto-enhance contrast and brightness
- `linear` - Apply linear formula: output = (a \* input) + b
- `recomb` - Recombine RGB channels using matrix
- `flatten` - Remove alpha transparency with background color
- `unflatten` - Add alpha channel (RGB→RGBA)

**Effects & Filters** (9 commands)

- `blur` - Gaussian blur (0.3-1000 sigma)
- `sharpen` - Enhance details and edges (flat/jagged modes)
- `median` - Noise reduction filter (1-50 size)
- `sepia` - Vintage sepia tone effect
- `vignette` - Darken edges for artistic focus
- `pixelate` - Retro pixel art effect (custom pixel size)
- `threshold` - Binary black/white conversion (0-255)
- `dilate` - Morphological dilation (expand bright regions)
- `erode` - Morphological erosion (expand dark regions)

**Advanced Operations** (6 commands)

- `composite` - Layer images with blend modes (overlay, multiply, screen)
- `extract` - Extract color channels (red, green, blue, alpha)
- `border` - Add decorative frames with custom colors
- `clahe` - Contrast-limited adaptive histogram equalization
- `convolve` - Apply custom convolution kernels (sharpen, emboss, edge)
- `boolean` - Perform boolean operations between images (AND, OR, XOR)

**Smart/AI Operations** (6 commands)

- `smart-crop` - Intelligent content-aware cropping (attention/entropy)
- `auto-enhance` - Automatic color and contrast enhancement
- `palette` - Extract dominant color palettes (2-256 colors)
- `dominant-color` - Quick dominant color extraction
- `grid` - Combine images into collage layouts
- `batch` - Process multiple images at once with any operation

**Utility** (10 commands)

- `compress` - Advanced compression with quality control
- `convert` - Format conversion (JPG, PNG, WebP, AVIF, TIFF, GIF)
- `optimize` - Size optimization (up to 70% reduction, lossless/lossy)
- `info` - Display detailed image metadata
- `watermark` - Add watermarks with positioning and opacity
- `stats` - Technical image statistics (channels, depth, color space)
- `split` - Split image into grid tiles
- `stack` - Stack images horizontally/vertically
- `mirror` - Create mirror/kaleidoscope effects
- `metadata` - View, export, or remove EXIF data

**Format Support:**

- Input: JPG, PNG, WebP, AVIF, TIFF, GIF, SVG, HEIF
- Output: JPG, PNG, WebP, AVIF, TIFF, GIF
- Modern formats: WebP (25-35% smaller), AVIF (50% smaller)

**Professional Features:**

- Quality control (1-100)
- Dry-run mode (preview before executing)
- Verbose logging
- Built-in help for every command
- Comprehensive error handling
- File size reporting

### Video Processing (@mediaproc/video)

**Install:** `mediaproc add video`

**6 Professional Commands Available:**

**Format & Quality**

- `compress` - CRF-based compression with presets (ultrafast to veryslow)
  - H.264/H.265 codec support
  - Quality control via CRF (0-51)
  - Two-pass encoding option
  - Hardware acceleration support
- `transcode` - Convert between formats with codec control
  - MP4, WebM, AVI, MKV, MOV support
  - Video: H.264, H.265, VP9, AV1
  - Audio: AAC, MP3, Opus, Vorbis
  - Custom bitrate and quality settings

**Editing & Manipulation**

- `trim` - Cut videos by time or percentage
  - Start/end time specification (HH:MM:SS)
  - Duration-based trimming
  - Percentage-based cutting
  - Frame-accurate cutting
- `resize` - Scale videos to target resolution
  - Preset sizes: 4K, 1080p, 720p, 480p, 360p
  - Custom dimensions with aspect ratio preservation
  - Multiple scaling algorithms (fast/quality)

**Merging & Extraction**

- `merge` - Concatenate multiple videos
  - Fast concat mode (no re-encode)
  - Re-encode mode for different formats
  - Automatic format compatibility detection
- `extract` - Extract media from videos
  - `extract-audio` - Extract audio tracks (MP3, AAC, WAV, FLAC)
  - `extract-frames` - Export frame sequences (JPG, PNG)
  - `extract-thumbnail` - Generate video thumbnails

**Technical Features:**

- FFmpeg-powered processing
- Hardware acceleration (when available)
- Progress tracking with ETA
- Dry-run mode for preview
- Comprehensive metadata display
- File size reporting
- Quality presets for common use cases

✅ **Architecture** - Plugin system designed and implemented  
✅ **Core CLI** - Command framework with plugin discovery  
✅ **Built-in Plugins** - Image & Video plugins ship with CLI  
✅ **Plugin Registry** - Smart plugin management  
✅ **Documentation** - Comprehensive guides and standards  
✅ **Community Guidelines** - Contributing, security, code of conduct

### 🚧 In Development

🚧 **Audio Plugin** - Format conversion, normalization, trimming  
🚧 **Testing** - Comprehensive test coverage  
🚧 **Examples** - Real-world usage examples

### What's Next

📋 **Audio Plugin** - Format conversion, normalization (Q1 2026)  
📋 **Document Plugin** - PDF processing, OCR (Q2 2026)  
📋 **Advanced Plugins** - 3D, streaming, AI features (Q2-Q3 2026)  
📋 **Plugin Marketplace** - Community plugin directory (Q3 2026)

See [Upcoming Features](docs/upcoming-features.md) for detailed roadmap.

---

## ✨ Features

### Core Architecture

#### 🎁 **Built-in Plugins** (Out of the Box)

MediaProc ships with essential plugins pre-installed, giving you immediate productivity:

- **@mediaproc/image** - Professional image processing (49 commands)

  - Resize, crop, rotate, flip, convert formats
  - Filters: blur, sharpen, tint, grayscale, median
  - Color adjustments: modulate, gamma, normalize
  - Utilities: thumbnail, watermark, optimize, trim, extend

- **@mediaproc/video** - Professional video processing (6 commands)
  - Compress: CRF-based compression with quality presets
  - Transcode: Format conversion (MP4, WebM, AVI, MKV)
  - Trim: Time-based cutting and clipping
  - Resize: Scale to 4K, 1080p, 720p, or custom
  - Merge: Concatenate multiple videos
  - Extract: Audio tracks, frame sequences, thumbnails

_More built-in plugins coming soon: audio, document_

#### 🔌 **Add-on Plugins** (Install as Needed)

Extend functionality by installing additional plugins from npm:

```bash
# Add more plugins from npm
mediaproc add animation  # GIF, WebP, Lottie optimization
mediaproc add 3d         # glTF, OBJ, FBX processing
mediaproc add stream     # HLS/DASH streaming
mediaproc add ai         # AI-powered enhancements
```

#### 💡 **Why This Architecture?**

**Universal CLI Benefits:**

- ✅ Get started instantly with built-in plugins
- ✅ Consistent command syntax across all plugins
- ✅ Unified plugin management (`add`, `remove`, `list`)
- ✅ Shared configuration and settings
- ✅ Better integration between different media types
- ✅ One tool to learn instead of many

**Standalone Plugin Benefits:**

- ✅ Each plugin can also run independently
- ✅ Lightweight installs (only what you need)
- ✅ Faster startup for single-purpose usage
- ✅ Easy to distribute and share

**Example: Two Ways to Use**

```bash
# Option 1: Use with universal CLI (recommended)
npm install -g @mediaproc/cli  # Includes @mediaproc/image built-in
mediaproc image resize photo.jpg -w 1920

# Option 2: Use plugin standalone (if you only need images)
npm install -g @mediaproc/image
mediaproc-image resize photo.jpg -w 1920
```

### Current Features (v0.2.0)

#### Core CLI

- ✅ Plugin discovery and loading
- ✅ Built-in plugins (ship with CLI)
- ✅ Add-on plugins (install from npm)
- ✅ Smart installation (auto-detects global/local)
- ✅ Plugin registry with short names
- ✅ Configuration management
- ✅ TypeScript with strict mode
- ✅ Cross-platform support

#### Plugin Management

- `mediaproc list` - List all plugins (built-in and installed)
- `mediaproc add <plugin>` - Install add-on plugins from npm
- `mediaproc remove <plugin>` - Uninstall add-on plugins
- `mediaproc delete <plugin>` - Delete/uninstall plugins (alias: uninstall)
  - `--global` - Delete globally installed plugin
  - `--local` - Delete locally installed plugin
  - `--yes` - Skip confirmation prompt
  - `--verbose` - Show detailed output
- `mediaproc update [plugin]` - Update plugin(s) to latest version
  - `--version <version>` - Update to specific version
  - `--global` - Update globally installed plugins
  - `--verbose` - Show detailed output
- `mediaproc plugins` - Show available plugins
- `mediaproc init` - Initialize configuration
- `mediaproc config` - Manage settings

#### Universal Commands (Work Without Plugins)

- `mediaproc convert <input> <output>` - Auto-detect and convert any media file
- `mediaproc info <file>` - Show file information for any media type
- `mediaproc optimize <file>` - Suggest optimization strategy based on file type

#### Image Processing (@mediaproc/image) ★ BUILT-IN

**40 Professional Commands Ready to Use:**

**Transform & Resize** (7 commands)

- `resize` - Resize with fit modes (cover, contain, fill, inside, outside)
- `crop` - Extract rectangular regions with positioning
- `rotate` - Any angle rotation with background control
- `flip` - Horizontal/vertical/both mirroring
- `trim` - Auto-remove uniform borders
- `extend` - Add padding/borders with custom colors
- `thumbnail` - Generate thumbnails (64px to 512px)

**Color & Tone** (6 commands)

- `modulate` - Adjust brightness, saturation, hue
- `gamma` - Gamma correction for midtones (0.1-3.0)
- `tint` - Apply color tint overlays (RGB hex)
- `grayscale` - Convert to black & white
- `negate` - Create negative/inverted images
- `normalize` - Auto-enhance contrast and brightness

**Effects & Filters** (6 commands)

- `blur` - Gaussian blur (0.3-1000 sigma)
- `sharpen` - Enhance details and edges (flat/jagged modes)
- `median` - Noise reduction filter (1-50 size)
- `sepia` - Vintage sepia tone effect
- `vignette` - Darken edges for artistic focus
- `pixelate` - Retro pixel art effect (custom pixel size)

**Advanced Operations** (6 commands)

- `composite` - Layer images with blend modes
- `extract` - Extract color channels or regions
- `border` - Add decorative frames
- `clahe` - Contrast-limited adaptive histogram equalization
- `convolve` - Apply custom convolution kernels
- `text` - Add text overlays with styling

**Utility & Metadata** (8 commands)

- `convert` - Format conversion
- `optimize` - Smart size optimization
- `compress` - Advanced compression control
- `watermark` - Add watermarks with positioning
- `info` - Display image metadata
- `metadata` - Manage EXIF/IPTC data
- `thumbnail` - Generate optimized thumbnails
- `stats` - Technical image statistics

**Format Support:**

- Input: JPG, PNG, WebP, AVIF, TIFF, GIF, SVG, HEIF
- Output: JPG, PNG, WebP, AVIF, TIFF, GIF
- Modern formats: WebP (25-35% smaller), AVIF (50% smaller)

**Professional Features:**

- Quality control (1-100)
- Dry-run mode (preview before executing)
- Verbose logging
- Built-in help for every command
- Comprehensive error handling
- File size reporting

See [plugins/image/README.md](plugins/image/README.md) for complete image plugin documentation.

### Planned Features (Add-on Plugins)

#### Video Processing (@mediaproc/video) - Q1 2026

- Format transcoding (MP4, WebM, AVI, MKV)
- Codec conversion (H.264, H.265, VP9, AV1)
- Quality presets (web, mobile, high-quality)
- Frame extraction
- Trimming and cutting
- Video merging
- Audio track management

#### Audio Processing (@mediaproc/audio) - Q1 2026

- Format conversion (MP3, AAC, FLAC, WAV, OGG)
- Normalization and loudness adjustment
- Trimming and splitting
- Audio extraction from video
- Multi-track merging
- Bitrate control

#### Document Processing (@mediaproc/document) - Q2 2026

- Bitrate control

#### Document Processing (Q2 2026)

- PDF compression
- Page extraction and splitting
- OCR text extraction
- PDF merging
- Format conversion
- Watermarking

#### Advanced Features (Q3-Q4 2026)

- Animation optimization (GIF, WebP, Lottie)
- 3D model optimization
- Metadata management
- HLS/DASH streaming
- AI-assisted processing
- Pipeline workflows

See [docs/upcoming-features.md](docs/upcoming-features.md) for complete feature list.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** (recommended) or npm
- **System dependencies** (installed as needed by plugins):
  - FFmpeg (for video/audio)
  - Sharp/libvips (for images)
  - Ghostscript (for PDFs)

### Installation

#### From npm (when published)

```bash
# Install the universal CLI (includes built-in plugins)
npm install -g @mediaproc/cli

# Start using immediately - image plugin is built-in!
mediaproc image resize photo.jpg -w 1920
mediaproc image convert photo.jpg -f webp

# Check version and list plugins
mediaproc --version
mediaproc list
```

#### From Source (current)

```bash
# Clone repository
git clone https://github.com/0xshariq/mediaproc.git
cd mediaproc

# Install dependencies
pnpm install

# Build all packages (including built-in plugins)
pnpm build:all

# Link globally
cd plugins/image && pnpm link --global
cd ../.. && pnpm link --global

# Verify
mediaproc --version
mediaproc list  # Should show @mediaproc/image as built-in
```

### Basic Usage

```bash
# Image processing (built-in - works immediately!)
mediaproc image resize photo.jpg --width 1920 --height 1080
mediaproc image convert photo.jpg -f webp -q 85
mediaproc image thumbnail photo.jpg -s 300

# Get help anytime
mediaproc --help
mediaproc image --help
mediaproc image resize --help
```

### Adding More Plugins

```bash
# Install additional plugins from npm
mediaproc add video    # Video processing
mediaproc add audio    # Audio processing
mediaproc add document # PDF processing

# Update plugins to latest version
mediaproc update           # Update all plugins
mediaproc update image     # Update specific plugin

# View all plugins (built-in + installed)
mediaproc list

# Example output:
# 📦 Built-in Plugins:
# ✓ image ★ BUILT-IN
#
# 🔌 User-Installed:
# ✓ video
# ✓ audio
```

# View installed plugins

mediaproc list

````

---

## 📦 Available Plugins

### Official Plugins

| Plugin                             | Commands | Status         | Description                              |
| ---------------------------------- | -------- | -------------- | ---------------------------------------- |
| **[image](plugins/image)**         | 10       | 🚧 In Progress | Resize, convert, optimize, filter images |
| **[video](plugins/video)**         | 6        | 🚧 In Progress | Transcode, compress, trim, merge videos  |
| **[audio](plugins/audio)**         | 5        | 🚧 In Progress | Convert, normalize, trim, merge audio    |
| **[document](plugins/document)**   | 5        | 📋 Planned     | Process PDFs and documents               |
| **[animation](plugins/animation)** | 2        | 📋 Planned     | Optimize GIFs and animations             |
| **[3d](plugins/3d)**               | 4        | 📋 Planned     | Optimize 3D models                       |
| **[metadata](plugins/metadata)**   | 4        | 📋 Planned     | Manage media metadata                    |
| **[stream](plugins/stream)**       | 3        | 📋 Planned     | HLS/DASH packaging                       |
| **[ai](plugins/ai)**               | 4        | 💡 Concept     | AI-powered processing                    |
| **[pipeline](plugins/pipeline)**   | 2        | 📋 Planned     | Workflow automation                      |

**Legend:** ✅ Complete | 🚧 In Progress | 📋 Planned | 💡 Concept

### Community Plugins

Third-party plugins are welcome! See [Creating Plugins](#-creating-your-own-plugins) below.

**Plugin Development Resources:**

- 📖 [Plugin Integration Guide](docs/plugin-integration-guide.md) - Complete tutorial
- 🏗️ [Plugin Template](https://github.com/0xshariq/mediaproc-plugin-template) - Starter template (coming soon)
- 📚 [Example Plugins](https://github.com/0xshariq/mediaproc-examples) - Real examples (coming soon)

_Coming soon: Browse community plugins at https://plugins.mediaproc.dev_

---

## � Plugin Terminology

### Important: No Plugins Are Pre-Installed!

MediaProc CLI is lightweight and contains **NO plugin code**. All plugins must be explicitly installed.

### Plugin Types

1. **Official Plugins** (`@mediaproc/*`) - Maintained by MediaProc team
   - Example: `@mediaproc/image`, `@mediaproc/video`
   - High quality, regularly updated
   - Install: `mediaproc add image`

2. **Community Plugins** (`mediaproc-*`) - Community-maintained
   - Example: `mediaproc-custom-filter`
   - Follow community standards
   - Install: `mediaproc add mediaproc-custom-filter`

3. **Third-Party Plugins** - Any compatible npm package
   - No naming convention required
   - Must implement MediaProc plugin interface
   - Install: `mediaproc add package-name`

### Quick Reference

```bash
# Install CLI (no plugins included)
npm install -g @mediaproc/cli

# Browse available plugins
mediaproc plugins

# Install official plugins
mediaproc add image    # Image processing
mediaproc add video    # Video processing

# Check what's installed
mediaproc list

# Use installed plugins
mediaproc image resize photo.jpg -w 800
```

### Updating Plugins

Keep plugins up-to-date for latest features and bug fixes:

```bash
# Update all installed plugins
mediaproc update

# Update specific plugin
mediaproc update image
mediaproc update video

# Update with scope control
mediaproc update --global     # Global plugins only
mediaproc update image --local  # Local plugin only

# Verbose output
mediaproc update --verbose
```

See full documentation for version control and advanced options.
   - Example: `mediaproc-custom-filter`
   - Full name required: `mediaproc update mediaproc-custom-filter`

3. **Third-Party Plugins** - ◇ THIRD-PARTY
   - Any other npm package
   - Full package name: `mediaproc update @company/plugin-name`

**What the update command does:**

1. **Detects Plugin Type**: Identifies official, community, or third-party plugins
2. **Detects Installation Scope**: Automatically determines if plugins are installed globally or locally
3. **Fetches Latest Versions**: Checks npm registry for the newest versions (or specific version)
4. **Updates Dependencies**: Uses the appropriate package manager (npm, pnpm, yarn, bun, deno)
5. **Shows Changes**: Displays version changes (old → new)
6. **Auto-Reload**: Plugins are automatically available after update

**Examples:**

```bash
# Update all plugins (recommended)
$ mediaproc update
✓ Updating all MediaProc plugins...
✓ All MediaProc plugins updated successfully

# Update official plugin to latest
$ mediaproc update image
✓ Detecting plugin type for image...
✓ image ★ OFFICIAL updated successfully (1.2.0 → 1.2.2)

# Update to specific version
$ mediaproc update image --version 1.2.1
✓ image ★ OFFICIAL updated successfully (1.2.0 → 1.2.1)

# Update community plugin
$ mediaproc update mediaproc-custom-filter
✓ mediaproc-custom-filter ◆ COMMUNITY updated successfully

# Update with verbose output
$ mediaproc update image --verbose
ℹ Package manager: pnpm
ℹ Plugin type: ★ OFFICIAL
ℹ Package name: @mediaproc/image
ℹ Current version: 1.2.0
ℹ Running: pnpm add @mediaproc/image
✓ image ★ OFFICIAL updated successfully (1.2.0 → 1.2.2)
```

**📘 Full Guide:** See [Plugin Terminology Guide](docs/plugin-terminology.md) for detailed explanations.

---

### Deleting Plugins

Remove plugins you no longer need to free up disk space:

```bash
# Delete a plugin (auto-detects installation scope)
mediaproc delete image
mediaproc delete video

# Delete specific scope
mediaproc delete image --global    # Delete globally installed
mediaproc delete image --local     # Delete locally installed

# Skip confirmation prompt
mediaproc delete image --yes       # No confirmation

# Verbose output
mediaproc delete image --verbose   # Show detailed information
```

**Plugin Type Detection:**

The delete command automatically detects and handles three types of plugins:

1. **Official Plugins** (`@mediaproc/*`) - ★ OFFICIAL
   ```bash
   mediaproc delete image                    # Short name
   mediaproc delete @mediaproc/image        # Full name
   ```

2. **Community Plugins** (`mediaproc-*`) - ◆ COMMUNITY
   ```bash
   mediaproc delete mediaproc-custom-filter  # Full name required
   ```

3. **Third-Party Plugins** - ◇ THIRD-PARTY
   ```bash
   mediaproc delete @company/plugin-name     # Full package name
   ```

**What the delete command does:**

1. **Detects Plugin Type**: Identifies official, community, or third-party plugins
2. **Detects Installation Scope**: Automatically determines if plugin is installed globally or locally
3. **Confirms Deletion**: Shows confirmation prompt (skip with `--yes`)
4. **Uninstalls Package**: Uses the appropriate package manager (npm, pnpm, yarn, bun)
5. **Shows Status**: Displays deletion status with plugin type badge
6. **Frees Memory**: Removes all plugin files from disk

**Examples:**

```bash
# Delete a plugin
mediaproc delete image
mediaproc delete video --global

# Skip confirmation
mediaproc delete image --yes

# Alias: uninstall
mediaproc uninstall image
```

**📘 Full Guide:** See [Plugin Terminology Guide](docs/plugin-terminology.md) for detailed explanations.

---

## �📚 Documentation

Comprehensive documentation is available in the [docs/](docs/) folder:

### Core Documentation

- **[Plugin Terminology](docs/plugin-terminology.md)** - **START HERE!** Clear definitions and common misconceptions

  - Official vs Community vs Third-Party plugins
  - No plugins are pre-installed (explained)
  - Installation workflow and plugin states
  - Best practices and FAQ

- **[Plugin Architecture](docs/plugin-architecture.md)** - How the plugin system works

  - On-demand loading architecture
  - Plugin discovery and lifecycle
  - Why no auto-loading
  - Technical implementation

- **[Plugin System](docs/plugin-system.md)** - Complete guide to the plugin architecture

  - How plugins work
  - Plugin discovery and loading
  - Creating plugins
  - **Third-party plugin standards**
  - Plugin submission process
  - Quality standards
  - Testing and publishing

- **[Configuration](docs/configuration.md)** - Configure MediaProc for your workflow

  - Configuration file format
  - Global and project-level settings
  - Plugin-specific options
  - Environment variables
  - Pipeline configuration

- **[Upcoming Features](docs/upcoming-features.md)** - Roadmap and planned features
  - Phase 1: Core plugins (Q1-Q2 2026)
  - Phase 2: Advanced plugins (Q3 2026)
  - Phase 3: AI & future-proof (Q4 2026)
  - Long-term vision (2027+)

### Plugin Documentation

- **[Image Plugin Documentation](docs/image-plugin-documentation.md)** - Complete reference for the Image Plugin
  - All 40 commands documented
  - Usage examples and workflows
  - Best practices and tips
  - Social media presets
  - Real-world use cases
  - Troubleshooting guide

### Community Guides

- **[Contributing](CONTRIBUTING.md)** - How to contribute to MediaProc

  - Reporting bugs
  - Suggesting features
  - Pull request guidelines
  - Development setup
  - Plugin development

- **[Security](SECURITY.md)** - Security policy and vulnerability reporting

  - Supported versions
  - Reporting vulnerabilities
  - Security best practices
  - Disclosure policy

- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community guidelines

  - Our pledge
  - Standards and expectations
  - Enforcement
  - Reporting process

- **[Changelog](CHANGELOG.md)** - Release history and changes
- **[License](LICENSE)** - MIT License

### External Resources (Coming Soon)

- 🌐 Website: https://mediaproc.dev
- 📖 Full Docs: https://docs.mediaproc.dev
- 🎓 Tutorials: https://tutorials.mediaproc.dev
- 📦 Plugin Marketplace: https://plugins.mediaproc.dev
- 💻 GitHub: https://github.com/0xshariq/mediaproc

---

## 💡 Examples

### Image Processing

```bash
# Resize image
mediaproc image resize photo.jpg --width 1920 --height 1080 --fit cover

# Convert format
mediaproc image convert photo.jpg --format webp --quality 85

# Apply filter
mediaproc image grayscale photo.jpg --output bw-photo.jpg

# Watermark
mediaproc image watermark photo.jpg --text "© 2025" --position bottom-right

# Batch processing
for img in photos/*.jpg; do
  mediaproc image convert "$img" --format webp --quality 85
done
````

### Video Processing

```bash
# Compress video
mediaproc video compress large-video.mp4 --quality 80 --codec h264

# Transcode format
mediaproc video transcode input.avi --format mp4

# Extract frames
mediaproc video extract video.mp4 --fps 1 --format png

# Trim video
mediaproc video trim video.mp4 --start 00:01:30 --end 00:02:45

# Merge videos
mediaproc video merge video1.mp4 video2.mp4 video3.mp4 --output combined.mp4
```

### Audio Processing

```bash
# Convert format
mediaproc audio convert song.wav --format mp3 --bitrate 320k

# Normalize volume
mediaproc audio normalize podcast.mp3 --target -16

# Extract audio from video
mediaproc audio extract video.mp4 --format flac

# Trim audio
mediaproc audio trim song.mp3 --start 00:30 --end 03:45
```

### Pipeline Workflows

```yaml
# workflow.yaml
name: "Optimize Images for Web"
description: "Batch image optimization pipeline"

steps:
  - plugin: image
    command: resize
    options:
      width: 1920
      height: 1080
      fit: contain

  - plugin: image
    command: convert
    options:
      format: webp
      quality: 85

  - plugin: image
    command: optimize
    options:
      level: 9
```

```bash
# Run pipeline
mediaproc run workflow.yaml --input images/ --output optimized/
```

_Note: Image processing commands are **fully implemented and ready to use**! Video, audio, and other commands are planned for Q1-Q2 2026. See [Current Status](#-current-status) for details._

---

## 🔧 Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/0xshariq/mediaproc.git
cd mediaproc

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Link CLI globally
pnpm link --global

# Run in dev mode (watch mode)
pnpm dev
```

### Project Structure

```
mediaproc/
├── src/                    # Core CLI source code
│   ├── cli.ts             # Main entry point
│   ├── plugin-manager.ts  # Plugin discovery & loading
│   ├── plugin-registry.ts # Plugin name mapping
│   ├── types.ts           # TypeScript types
│   └── commands/          # Core commands
│
├── plugins/               # Plugin packages
│   ├── image/            # Image processing plugin
│   ├── video/            # Video processing plugin
│   ├── audio/            # Audio processing plugin
│   └── .../              # More plugins
│
├── docs/                  # Documentation
├── bin/                   # Executable files
├── CONTRIBUTING.md        # Contribution guidelines
├── SECURITY.md           # Security policy
├── CODE_OF_CONDUCT.md    # Community guidelines
├── CHANGELOG.md          # Release history
└── package.json          # Root package config
```

### Building

```bash
# Build all packages
pnpm build

# Build specific plugin
pnpm --filter @mediaproc/image build

# Clean build artifacts
pnpm clean

# Clean and rebuild
pnpm clean && pnpm build
```

### Testing

```bash
# Run all tests (when implemented)
pnpm test

# Test specific plugin
pnpm --filter @mediaproc/image test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

---

## 🎨 Creating Your Own Plugins

MediaProc welcomes third-party plugins! Anyone can create and publish plugins.

### Quick Start

```bash
# Create plugin directory
mkdir mediaproc-plugin-myprocessor
cd mediaproc-plugin-myprocessor

# Initialize
npm init -y

# Install dependencies
npm install --save-peer @mediaproc/cli
npm install --save-dev typescript @types/node
npm install chalk commander ora
```

### Plugin Structure

```typescript
// src/index.ts
import { Command } from "commander";

export const name = "myprocessor";
export const version = "1.0.0";
export const description = "My custom processor";

export function register(program: Command): void {
  const cmd = program.command(name).description(description);

  cmd
    .command("process <input>")
    .description("Process a file")
    .option("-o, --output <path>", "Output path")
    .action(async (input, options) => {
      // Your processing logic
      console.log("Processing:", input);
    });
}
```

### Publishing

```bash
# Build
npm run build

# Test locally
npm link
mediaproc myprocessor process test.jpg

# Publish
npm publish
```

### Getting Listed

Submit your plugin to be featured in the plugin directory:

1. Publish to npm
2. Open an issue with [Plugin Submission] tag
3. We'll review and list it!

**Full Guide:** See [docs/plugin-system.md](docs/plugin-system.md) for complete plugin development guide, including:

- Naming conventions
- Required exports and structure
- Quality standards
- Submission process
- Testing and best practices

---

## 🗺️ Roadmap

### Q1 2026 - Core Plugins

- ✅ Complete image plugin implementation
- ✅ Complete video plugin implementation
- ✅ Complete audio plugin implementation
- ✅ Performance optimization
- ✅ Comprehensive testing
- ✅ Beta release

### Q2 2026 - Advanced Features

- ✅ Document plugin (PDF processing)
- ✅ Animation plugin (GIF optimization)
- ✅ Metadata plugin
- ✅ Pipeline workflows
- ✅ Plugin marketplace launch

### Q3 2026 - Specialized Plugins

- ✅ 3D model optimization
- ✅ Streaming (HLS/DASH)
- ✅ GUI wrapper (Electron)
- ✅ VS Code extension

### Q4 2026 - AI & Future-Proof

- ✅ AI-assisted features
- ✅ Background removal
- ✅ Auto-captioning
- ✅ v1.0 stable release

### 2027+ - Long-Term Vision

- Cloud integration (S3, CDN)
- Serverless function support
- Enterprise features
- Mobile SDK
- WebAssembly support

**Full Roadmap:** See [docs/upcoming-features.md](docs/upcoming-features.md) for detailed feature plans.

---

## 🤝 Contributing

We welcome contributions of all kinds! MediaProc is in active development and there are many ways to help:

### Ways to Contribute

- 🐛 **Report Bugs** - [Open an issue](https://github.com/0xshariq/mediaproc/issues/new?template=bug_report.md)
- 💡 **Suggest Features** - [Start a discussion](https://github.com/0xshariq/mediaproc/discussions/new?category=ideas)
- 📝 **Improve Docs** - Fix typos, add examples, clarify explanations
- 🔧 **Write Code** - Implement features, fix bugs, optimize performance
- 🧪 **Write Tests** - Improve test coverage
- 🎨 **Create Plugins** - Build community plugins
- 💬 **Help Others** - Answer questions in discussions
- 🌟 **Spread the Word** - Star the repo, share on social media

### Getting Started

1. Read the [Contributing Guide](CONTRIBUTING.md)
2. Check the [Code of Conduct](CODE_OF_CONDUCT.md)
3. Look for [good first issues](https://github.com/0xshariq/mediaproc/labels/good%20first%20issue)
4. Join discussions and ask questions
5. Submit your first PR!

### Development Workflow

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/mediaproc.git

# Create branch
git checkout -b feature/my-feature

# Make changes
# ... edit files ...

# Build and test
pnpm build
pnpm test

# Commit
git commit -m "feat(image): add AVIF support"

# Push and create PR
git push origin feature/my-feature
```

**Full Guide:** See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

---

## 👥 Community

### Get Help & Connect

- **💬 GitHub Discussions** - Ask questions, share ideas
- **🐛 GitHub Issues** - Report bugs, request features
- **📧 Email** - support@mediaproc.dev (coming soon)
- **🐦 Twitter** - @mediaproc (coming soon)
- **💬 Discord** - Join our community (coming soon)

### Recognition

Contributors are recognized in:

- [CHANGELOG.md](CHANGELOG.md) - Release contributions
- [GitHub Contributors](https://github.com/0xshariq/mediaproc/graphs/contributors) - Code contributions
- Social media shoutouts
- Plugin spotlights

---

## 📄 License

MediaProc is [MIT licensed](LICENSE).

```
MIT License

Copyright (c) 2025 0xshariq and MediaProc contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

See [LICENSE](LICENSE) for full license text.

---

## 🙏 Acknowledgments

MediaProc is built on top of amazing open-source projects:

### Core Technologies

- **[Sharp](https://sharp.pixelplumbing.com/)** - High-performance image processing (libvips)
- **[FFmpeg](https://ffmpeg.org/)** - Complete multimedia framework
- **[Commander.js](https://github.com/tj/commander.js)** - Node.js CLI framework
- **[Chalk](https://github.com/chalk/chalk)** - Terminal string styling
- **[Ora](https://github.com/sindresorhus/ora)** - Elegant terminal spinners
- **[Execa](https://github.com/sindresorhus/execa)** - Better child_process

### Inspiration

- **FFmpeg** - The gold standard for media processing
- **Sharp** - Blazing fast image processing
- **ImageMagick** - Comprehensive image manipulation
- **Homebrew** - Plugin-like package management
- **VS Code** - Extension architecture

---

## 🌟 Star History

If you find MediaProc useful, please consider giving it a star ⭐️

It helps us grow and shows appreciation for the work!

---

## 📞 Contact

- **Author**: [@0xshariq](https://github.com/0xshariq)
- **Email**: support@mediaproc.dev (coming soon)
- **Website**: https://mediaproc.dev (coming soon)
- **Issues**: [GitHub Issues](https://github.com/0xshariq/mediaproc/issues)
- **Discussions**: [GitHub Discussions](https://github.com/0xshariq/mediaproc/discussions)

---

## ⚠️ Development Notice

**MediaProc is under active development.**

- API and commands may change before v1.0
- Not recommended for production use yet
- Feedback and contributions highly appreciated!
- Expected stable release: Q4 2026

---

<div align="center">

**Built with ❤️ by [@0xshariq](https://github.com/0xshariq) and [contributors](https://github.com/0xshariq/mediaproc/graphs/contributors)**

[⬆ Back to Top](#mediaproc)

</div>

---

## 📖 Plugin Development

### Creating Third-Party Plugins

Want to extend MediaProc with your own functionality? Follow our comprehensive guide:

**\ud83d\udcd8 [Plugin Integration Guide](docs/plugin-integration-guide.md)** - Complete step-by-step tutorial covering:

- Quick start (5-minute plugin)
- Plugin architecture explained
- Step-by-step tutorial with real example
- Plugin standards and requirements
- Testing and debugging
- Publishing to npm
- Getting your plugin featured

**Additional Resources:**

- \ud83d\udcd6 [Plugin System Architecture](docs/plugin-system.md) - Deep dive into how plugins work
- \ud83c\udfd7\ufe0f [Plugin Template](https://github.com/0xshariq/mediaproc-plugin-template) - Starter template (coming soon)
- \ud83d\udcda [Example Plugins](https://github.com/0xshariq/mediaproc-examples) - Real-world examples (coming soon)

### Plugin Ideas

Need inspiration? Here are some plugin ideas:

- **Filters** - Instagram-style filters, artistic effects
- **Converters** - Specialized format conversions
- **Social Media** - Platform-specific optimizations (Twitter, Facebook, Instagram)
- **Analysis** - Media analysis, quality checking, metadata extraction
- **Cloud Integration** - S3, Cloudinary, Imgur upload
- **AI/ML** - Face detection, object recognition, style transfer
- **Automation** - Batch processing, workflow templates

---

## 📄 License

MediaProc is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What This Means

✅ **You CAN:**

- Use MediaProc commercially
- Modify the source code
- Distribute your modifications
- Use it privately
- Contribute to the project

⚠️ **You MUST:**

- Include the original copyright notice
- Include the license text
- Give credit to **[@0xshariq](https://github.com/0xshariq)** (original author)

❌ **We're NOT LIABLE:**

- No warranty is provided
- Authors are not liable for any damages

### Attribution

If you use MediaProc in your project, a mention would be appreciated:

```
Powered by MediaProc - https://github.com/0xshariq/mediaproc-cli
Created by @0xshariq
```

---

## 👥 Credits

**Created and maintained by:**

- **[@0xshariq](https://github.com/0xshariq)** - Original Author & Lead Developer

**Contributors:**
See [CONTRIBUTORS.md](CONTRIBUTORS.md) for the list of amazing people who have contributed to this project.

Want to be listed here? Check out our [Contributing Guide](CONTRIBUTING.md)!

---
