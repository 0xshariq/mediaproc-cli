# MediaProc

> Universal media processing CLI with plugin architecture. One tool for images, videos, audio, and more.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.6.0--beta-blue.svg)](https://www.npmjs.com/package/@mediaproc/cli)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

```bash
# Install
npm install -g @mediaproc/cli

# Process images
mediaproc image resize photo.jpg --width 1920 --height 1080
mediaproc image convert *.jpg --format webp --quality 85

# Process videos  
mediaproc video compress movie.mp4 --quality high
mediaproc video trim video.mp4 --start 00:01:30 --end 00:03:45

# Process audio
mediaproc audio convert song.wav --format mp3 --quality high
mediaproc audio normalize podcast.mp3 --target -16
```

## Why MediaProc?

**The Problem:** Modern development workflows require multiple tools for media processing:
- FFmpeg for videos
- ImageMagick for images  
- SoX for audio
- Each with different syntax, steep learning curves, and complex workflows

**The Solution:** MediaProc provides a unified CLI with consistent commands across all media types.

| Feature | Traditional | MediaProc |
|---------|------------|-----------|
| **Tools Needed** | 5+ separate tools | One tool |
| **Installation** | Complex setup | `npm install -g @mediaproc/cli` |
| **Syntax** | Different for each | Consistent everywhere |
| **Extensibility** | Limited | Plugin architecture |

## Quick Start

```bash
# Install CLI
npm install -g @mediaproc/cli

# Install plugins (or use built-in ones)
mediaproc add image
mediaproc add video
mediaproc add audio

# List available plugins
mediaproc list

# Get help
mediaproc --help
mediaproc image --help
```

## Available Plugins

### Built-in Plugins

Included with CLI installation:

#### Image Plugin (51 commands)
```bash
mediaproc image resize photo.jpg --width 1920
mediaproc image convert *.png --format webp
mediaproc image compress image.jpg --quality 85
mediaproc image blur photo.jpg --sigma 10
mediaproc image watermark photo.jpg --text "Copyright 2026"
```

**Commands:** resize, crop, rotate, flip, convert, compress, optimize, blur, sharpen, grayscale, tint, watermark, thumbnail, and 36 more...

**Formats:** JPG, PNG, WebP, AVIF, TIFF, GIF, SVG

[Full Image Plugin Documentation →](plugins/image/README.md)

#### Video Plugin (6 commands)
```bash
mediaproc video compress movie.mp4 --quality medium
mediaproc video transcode video.mp4 --format webm --codec vp9
mediaproc video trim video.mp4 --start 10 --end 60
mediaproc video resize 4k-video.mp4 --preset 1080p
mediaproc video merge video1.mp4 video2.mp4 video3.mp4
mediaproc video extract movie.mp4 --type audio --output audio.mp3
```

**Commands:** compress, transcode, trim, resize, merge, extract

**Formats:** MP4, WebM, AVI, MKV, MOV

[Full Video Plugin Documentation →](plugins/video/README.md)

#### Audio Plugin (5 commands)
```bash
mediaproc audio convert song.wav --format mp3 --quality high
mediaproc audio normalize podcast.mp3 --target -16
mediaproc audio trim audio.wav --start 10 --duration 30
mediaproc audio merge track1.mp3 track2.mp3 track3.mp3
mediaproc audio extract video.mp4 --format mp3
```

**Commands:** convert, normalize, trim, merge, extract

**Formats:** MP3, AAC, WAV, FLAC, OGG, Opus

[Full Audio Plugin Documentation →](plugins/audio/README.md)

### Coming Soon

- **Document** - PDF processing (Q2 2026)
- **Animation** - GIF/Lottie optimization (Q2 2026)
- **3D** - 3D model processing (Q3 2026)
- **Stream** - HLS/DASH streaming (Q3 2026)
- **AI** - AI-powered features (Q3 2026)

## Plugin Management

```bash
# List installed plugins
mediaproc list

# Install plugins
mediaproc add <plugin-name>

# Remove plugins  
mediaproc remove <plugin-name>

# Update plugins
mediaproc update              # Update all
mediaproc update <plugin>     # Update specific

# Browse available plugins
mediaproc plugins
```

## Examples

### Image Processing

```bash
# Resize for web
mediaproc image resize photo.jpg --width 1920 --height 1080 --fit cover

# Batch convert to WebP
mediaproc image convert *.jpg --format webp --quality 85

# Create thumbnails
mediaproc image thumbnail photo.jpg --size 256 --output thumb.jpg

# Add watermark
mediaproc image watermark photo.jpg --text "© 2026" --position southeast

# Optimize for web
mediaproc image optimize image.jpg --quality 80
```

### Video Processing

```bash
# Compress video
mediaproc video compress movie.mp4 --quality medium --output compressed.mp4

# Convert to WebM
mediaproc video transcode video.mp4 --format webm --codec vp9

# Cut segment
mediaproc video trim long-video.mp4 --start 00:10:00 --end 00:15:00

# Scale down
mediaproc video resize 4k-video.mp4 --preset 1080p

# Extract audio
mediaproc video extract movie.mp4 --type audio --output soundtrack.mp3
```

### Audio Processing

```bash
# Convert to MP3
mediaproc audio convert song.wav --format mp3 --quality 320k

# Normalize volume
mediaproc audio normalize podcast.mp3 --target -16 --output normalized.mp3

# Merge tracks
mediaproc audio merge intro.mp3 main.mp3 outro.mp3 --output complete.mp3

# Extract from video
mediaproc audio extract video.mp4 --format flac
```

## CLI Commands

### Plugin Management
- `mediaproc add <plugin>` - Install plugin
- `mediaproc remove <plugin>` - Uninstall plugin
- `mediaproc list` - List installed plugins
- `mediaproc plugins` - Browse available plugins
- `mediaproc update [plugin]` - Update plugin(s)

### Help & Info
- `mediaproc --help` - Show help
- `mediaproc <plugin> --help` - Plugin-specific help
- `mediaproc --version` - Show version

## Requirements

- **Node.js** >= 18.0.0
- **FFmpeg** (for video/audio plugins)
  ```bash
  # macOS
  brew install ffmpeg
  
  # Ubuntu/Debian
  sudo apt install ffmpeg
  
  # Windows
  choco install ffmpeg
  ```

## Development

### Project Structure

```
mediaproc/
├── src/              # Core CLI source
├── plugins/          # Official plugins
│   ├── image/       # Image processing
│   ├── video/       # Video processing  
│   └── audio/       # Audio processing
├── docs/            # Documentation
└── web/             # Documentation website
```

### Build & Test

```bash
# Install dependencies
pnpm install

# Build CLI
pnpm build

# Build all plugins
pnpm build:all

# Test
pnpm test

# Run locally
node dist/cli.js
```

### Creating Plugins

See [Plugin Integration Guide](docs/plugin-integration-guide.md) for complete documentation on creating your own plugins.

## Documentation

- [Installation Guide](docs/configuration.md#installation)
- [Plugin Integration Guide](docs/plugin-integration-guide.md)
- [Plugin System Architecture](docs/plugin-system.md)
- [Architecture Overview](docs/architecture-decisions.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

**📚 Full Documentation:** [https://mediaproc.dev](https://mediaproc.dev)

## Roadmap

**Current (v0.6.0-beta):**
- ✅ Core CLI with plugin system
- ✅ Image Plugin (51 commands)
- ✅ Video Plugin (6 commands)
- ✅ Audio Plugin (5 commands)

**Q1 2026:**
- 🚧 Document Plugin
- 🚧 Comprehensive testing
- 🚧 CI/CD pipeline

**Q2 2026:**
- 📋 Animation Plugin
- 📋 Metadata Plugin
- 📋 v1.0 Release

**Q3-Q4 2026:**
- 📋 3D Plugin
- 📋 Stream Plugin  
- 📋 AI Plugin
- 📋 Plugin Marketplace

See [Upcoming Features](docs/upcoming-features.md) for details.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ways to contribute:**
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests
- 🎨 Create plugins

## Community

- **Issues:** [GitHub Issues](https://github.com/0xshariq/mediaproc-cli/issues)
- **Discussions:** [GitHub Discussions](https://github.com/0xshariq/mediaproc-cli/discussions)
- **Twitter:** [@0xshariq](https://twitter.com/0xshariq)

## License

MIT © [0xshariq](https://github.com/0xshariq)

See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [@0xshariq](https://github.com/0xshariq)**

Give us a ⭐️ if you find this project useful!

</div>