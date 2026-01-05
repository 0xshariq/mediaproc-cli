# 🎬 MediaProc Video Plugin

Professional video processing CLI powered by [FFmpeg](https://ffmpeg.org/). Fast, efficient, and comprehensive video manipulation toolkit with **6 essential commands** covering 90% of video processing use cases.

## 📑 Table of Contents

- [Features](#-features)
- [Installation & Usage](#-installation--usage)
- [Requirements](#-requirements)
- [Quick Start](#-quick-start)
- [Global Options & Common Flags](#-global-options--common-flags)
- [Commands Overview](#-commands-overview)
- [Detailed Command Reference](#-detailed-command-reference)
- [Real-World Workflows](#-real-world-workflows)
- [Usage Tips](#-usage-tips)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

- 🚀 **High Performance** - Built on FFmpeg for industry-standard processing
- 🎬 **6 Essential Commands** - Compress, transcode, trim, resize, merge, extract
- 🔧 **Professional Features** - Quality control, dry-run mode, verbose logging
- 📦 **Universal Format Support** - MP4, WebM, MKV, AVI and all major codecs
- 🎯 **Simple CLI** - Intuitive command-line interface
- 💡 **Helpful Documentation** - Built-in help for every command
- ⚡ **Smart Processing** - Automatic format detection and optimization

## 📦 Installation & Usage

### Option 1: Universal CLI (Recommended)

Install the universal CLI and add the video plugin:

```bash
# Install universal CLI
npm install -g @mediaproc/cli

# Add video plugin (downloaded on-demand)
mediaproc add video

# Use commands with "video" prefix
mediaproc video compress input.mp4 -q high
mediaproc video transcode input.avi -f mp4
```

**Note:** All commands use the `video` namespace: `mediaproc video <command>`

### Option 2: Standalone Plugin

Install and use the video plugin independently:

```bash
# Install standalone
npm install -g @mediaproc/video

# Use commands directly (no "video" prefix)
mediaproc-video compress input.mp4 -q high
mediaproc-video transcode input.avi -f mp4
```

**Note:** Standalone mode uses `mediaproc-video` command without the `video` prefix.

---

## 🛠 Requirements

This plugin requires **FFmpeg** to be installed on your system:

### macOS

```bash
brew install ffmpeg
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install ffmpeg
```

### Windows

Download from [ffmpeg.org](https://ffmpeg.org/download.html) or use chocolatey:

```bash
choco install ffmpeg
```

### Verify Installation

```bash
ffmpeg -version
ffprobe -version
```

## Both `ffmpeg` and `ffprobe` are required for full functionality.

## 🎯 Quick Start

**With Universal CLI:**

```bash
# Compress a video
mediaproc video compress input.mp4 -q high

# Convert format
mediaproc video transcode input.avi -f mp4

# Trim video segment
mediaproc video trim input.mp4 --start 00:01:00 --end 00:02:30

# Resize to 720p
mediaproc video resize input.mp4 --scale 720p

# Merge videos
mediaproc video merge video1.mp4 video2.mp4 video3.mp4

# Extract audio
mediaproc video extract-audio input.mp4

# Get help for any command
mediaproc video compress --help
```

**With Standalone Plugin:**

```bash
# Same commands, different prefix
mediaproc-video compress input.mp4 -q high
mediaproc-video transcode input.avi -f mp4
mediaproc-video trim input.mp4 --start 00:01:00 --end 00:02:30
```

---

## 🌐 Global Options & Common Flags

All video commands share a consistent set of common flags for unified behavior:

### Standard Flags (Available on All Commands)

| Flag              | Alias | Description                       | Default                   |
| ----------------- | ----- | --------------------------------- | ------------------------- |
| `--output <path>` | `-o`  | Output file path                  | `<input>-<command>.<ext>` |
| `--dry-run`       | -     | Preview changes without executing | `false`                   |
| `--verbose`       | `-v`  | Show detailed FFmpeg output       | `false`                   |
| `--help`          | -     | Display command-specific help     | -                         |

### How Commands Work

**1. Input Processing:**

```bash
# Commands accept file paths (relative or absolute)
mediaproc video compress video.mp4 -q high
mediaproc video compress /path/to/video.mp4 -q high
mediaproc video compress ../videos/video.mp4 -q high
```

**2. Output Naming:**

```bash
# Default: <input>-<command>.<ext>
mediaproc video compress input.mp4           # → input-compressed.mp4

# Custom output path:
mediaproc video compress input.mp4 -o output.mp4

# Change format:
mediaproc video transcode input.avi -f mp4 -o output.mp4
```

**3. Metadata Analysis:**

```bash
# Commands automatically analyze input video
# Shows: duration, resolution, codec, bitrate, file size
mediaproc video compress input.mp4 -v

# FFprobe is used for metadata extraction
```

**4. Dry-Run Mode:**

```bash
# Preview what will happen without processing
mediaproc video resize input.mp4 --scale 1080p --dry-run

# Shows: input details, operation parameters, output path
# FFmpeg command preview
# Useful for testing before batch processing
```

**5. Verbose Output:**

```bash
# Show detailed FFmpeg processing information
mediaproc video compress input.mp4 -q high -v

# Displays:
# - Input video metadata
# - FFmpeg command being executed
# - Real-time encoding progress
# - Output statistics and comparison
```

### Command-Specific Options

Each command has unique options for its specific operation:

**Compress:**

- `--quality` (`-q`): low, medium, high (CRF-based)
- `--codec`: h264, h265, vp9
- `--crf`: Custom CRF value (0-51)

**Transcode:**

- `--format` (`-f`): mp4, webm, mkv, avi
- `--codec`: h264, h265, vp9, av1
- `--bitrate`: Target bitrate (e.g., 2M, 5000k)
- `--audio-codec`: aac, opus, mp3
- `--audio-bitrate`: Audio bitrate (e.g., 128k)

**Trim:**

- `--start`: Start time (HH:MM:SS or seconds)
- `--end`: End time (HH:MM:SS or seconds)
- `--duration`: Duration (HH:MM:SS or seconds)
- `--fast`: Fast mode (stream copy)

**Resize:**

- `--scale`: 480p, 720p, 1080p, 1440p, 4k
- `--width` (`-w`): Custom width in pixels
- `--height` (`-h`): Custom height in pixels
- `--aspect`: Maintain aspect ratio (default: true)

**Merge:**

- `--re-encode`: Force re-encoding

**Extract:**

- `extract-audio --format`: mp3, aac, wav, opus
- `extract-audio --bitrate`: Audio bitrate
- `extract-frames --fps`: Frames per second
- `extract-frames --format`: jpg, png
- `extract-thumbnail --time`: Time to extract
- `extract-thumbnail --width`: Thumbnail width

### Getting Help

**View all available commands:**

```bash
# Universal CLI
mediaproc video --help

# Standalone plugin
mediaproc-video --help
```

**Get command-specific help:**

```bash
# Shows detailed usage, options, examples
mediaproc video compress --help
mediaproc video transcode --help
mediaproc video trim --help
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

- MP4 (`.mp4`)
- AVI (`.avi`)
- MKV (`.mkv`)
- MOV (`.mov`)
- WebM (`.webm`)
- FLV (`.flv`)
- WMV (`.wmv`)
- MPEG (`.mpg`, `.mpeg`)
- And all formats supported by FFmpeg

**Output Formats:**

- **MP4** - Best for universal compatibility (H.264/H.265)
- **WebM** - Best for web with VP9/VP8 codec
- **MKV** - Best for high quality archival
- **AVI** - Legacy format support

**Video Codecs:**

- **H.264 (libx264)** - Universal, fast encoding, good compression
- **H.265 (libx265)** - Better compression, slower encoding
- **VP9 (libvpx-vp9)** - Open source, WebM format
- **AV1 (libaom-av1)** - Best compression, very slow encoding

**Audio Codecs:**

- **AAC** - Universal, good quality
- **MP3** - Legacy, wide support
- **Opus** - Best for low bitrates
- **WAV** - Lossless audio

### Performance Tips

**1. Format Selection:**

```bash
# Use MP4 with H.264 for universal compatibility
mediaproc video transcode input.avi -f mp4 --codec h264

# Use WebM with VP9 for web delivery
mediaproc video transcode input.mp4 -f webm --codec vp9

# Use H.265 for maximum compression (slower)
mediaproc video transcode input.mp4 --codec h265
```

**2. Quality vs Size (CRF):**

```bash
# High quality (minimal compression)
mediaproc video compress input.mp4 --crf 18   # Large file

# Balanced (recommended)
mediaproc video compress input.mp4 -q medium  # CRF 23

# Aggressive (maximum compression)
mediaproc video compress input.mp4 --crf 28   # Small file
```

**CRF Guide:**

- **0-17**: Visually lossless (very large)
- **18-23**: High quality (archival)
- **23-28**: Good quality (distribution) ← Recommended
- **28-51**: Lower quality (streaming)

**3. Fast Trimming:**

```bash
# Use --fast for quick cuts (no re-encode)
mediaproc video trim input.mp4 --start 00:01:00 --end 00:02:00 --fast

# Accurate mode re-encodes (slower but precise)
mediaproc video trim input.mp4 --start 00:01:00 --end 00:02:00
```

**4. Batch Processing:**

```bash
# Compress multiple videos
for file in *.mp4; do
  mediaproc video compress "$file" -q medium
done

# Convert all AVI to MP4
for file in *.avi; do
  mediaproc video transcode "$file" -f mp4 -o "${file%.avi}.mp4"
done

# Extract audio from all videos
for file in *.mp4; do
  mediaproc video extract-audio "$file"
done
```

---

## 📋 Commands Overview

| Command             | Description                 | Primary Use Case                 |
| ------------------- | --------------------------- | -------------------------------- |
| `compress`          | Reduce video file size      | File size optimization           |
| `transcode`         | Convert format/codec        | Format conversion, codec change  |
| `trim`              | Cut video segments          | Remove unwanted parts            |
| `resize`            | Change video resolution     | Resolution scaling, aspect ratio |
| `merge`             | Concatenate multiple videos | Join clips together              |
| `extract-audio`     | Extract audio track         | Get audio from video             |
| `extract-frames`    | Extract image sequence      | Create thumbnails, analysis      |
| `extract-thumbnail` | Extract single frame        | Generate video thumbnail         |

---

## 📖 Detailed Command Reference

Compress video files to reduce size while maintaining quality.

```bash
# Basic compression
mediaproc video compress input.mp4

# High quality compression
mediaproc video compress input.mp4 -q high

# Custom CRF value
mediaproc video compress input.mp4 --crf 18

# Use H.265 codec for better compression
mediaproc video compress input.mp4 --codec h265
```

**Quality Presets:**

- `low` - CRF 28 (smaller file, lower quality)
- `medium` - CRF 23 (balanced - default)
- `high` - CRF 18 (larger file, better quality)

**Supported Codecs:** h264, h265, vp9

### transcode

Convert videos between formats and codecs.

```bash
# Convert to MP4
mediaproc video transcode input.avi -f mp4

# Use H.265 codec
mediaproc video transcode input.mp4 --codec h265

# Convert to WebM with VP9
mediaproc video transcode input.mp4 -f webm --codec vp9

# Set custom bitrate
mediaproc video transcode input.mp4 --bitrate 5M
```

**Supported Formats:** mp4, webm, mkv, avi

**Supported Codecs:** h264, h265, vp9, av1

### trim

Cut video segments with precise timing.

```bash
# Trim using start and end times
mediaproc video trim input.mp4 --start 00:00:10 --end 00:01:30

# Trim using duration
mediaproc video trim input.mp4 --start 10 --duration 80

# Fast mode (stream copy - less accurate but faster)
mediaproc video trim input.mp4 --start 00:00:05 --end 00:00:15 --fast
```

**Time Formats:**

- HH:MM:SS (e.g., 00:01:30)
- Seconds (e.g., 90)

### resize

Change video resolution with quality preservation.

```bash
# Use preset scale
mediaproc video resize input.mp4 --scale 720p

# Custom dimensions
mediaproc video resize input.mp4 -w 1280 -h 720

# Calculate height automatically
mediaproc video resize input.mp4 -w 1920

# Don't maintain aspect ratio
mediaproc video resize input.mp4 -w 1920 -h 1080 --no-aspect
```

**Scale Presets:**

- `480p` - 854x480
- `720p` - 1280x720 (HD)
- `1080p` - 1920x1080 (Full HD)
- `1440p` - 2560x1440 (2K)
- `4k` - 3840x2160 (4K UHD)

### merge

Concatenate multiple videos into one.

```bash
# Merge videos (auto-detect if re-encode needed)
mediaproc video merge video1.mp4 video2.mp4 video3.mp4

# Force re-encoding for compatibility
mediaproc video merge *.mp4 --re-encode

# Custom output path
mediaproc video merge part1.mp4 part2.mp4 -o final.mp4
```

**Notes:**

- Videos with same format/codec use fast concat (no re-encode)
- Mixed formats automatically re-encode for compatibility
- Use `--re-encode` to force re-encoding

### extract

Extract audio, frames, or thumbnails from video.

#### Extract Audio

```bash
# Extract as MP3
mediaproc video extract-audio input.mp4

# Extract as AAC with custom bitrate
mediaproc video extract-audio input.mp4 --format aac --bitrate 192k

# Extract as WAV (lossless)
mediaproc video extract-audio input.mp4 --format wav
```

**Audio Formats:** mp3, aac, wav, opus

#### Extract Frames

```bash
# Extract 1 frame per second
mediaproc video extract-frames input.mp4 --fps 1

# Extract frames from specific time range
mediaproc video extract-frames input.mp4 --start 00:00:10 --end 00:00:20 --fps 5

# Extract as PNG
mediaproc video extract-frames input.mp4 --format png
```

#### Extract Thumbnail

```bash
# Extract thumbnail at 1 second
mediaproc video extract-thumbnail input.mp4

# Extract at specific time
mediaproc video extract-thumbnail input.mp4 --time 00:01:30

# Resize thumbnail
mediaproc video extract-thumbnail input.mp4 --width 640
```

## Global Options

All commands support these options:

- `-o, --output <path>` - Specify output file/directory
- `--dry-run` - Preview command without executing
- `-v, --verbose` - Show detailed FFmpeg output
- `--help` - Show command help

## Common Use Cases

### 1. Prepare Video for Web

```bash
# Compress and convert to web-friendly format
mediaproc video transcode input.mov -f mp4 --codec h264
mediaproc video compress output.mp4 -q medium
```

### 2. Create Social Media Clips

```bash
# Trim to 60 seconds
mediaproc video trim long-video.mp4 --start 00:01:00 --duration 60

# Resize to 1080p
mediaproc video resize trimmed.mp4 --scale 1080p

# Compress for smaller file
mediaproc video compress resized.mp4 -q medium
```

### 3. Extract Highlights

```bash
# Extract multiple segments
mediaproc video trim full-game.mp4 --start 00:05:30 --end 00:06:00 -o highlight1.mp4
mediaproc video trim full-game.mp4 --start 00:12:15 --end 00:12:45 -o highlight2.mp4

# Merge highlights
mediaproc video merge highlight1.mp4 highlight2.mp4 -o best-moments.mp4
```

### 4. Create Video Thumbnails

```bash
# Extract thumbnail from middle of video
mediaproc video extract-thumbnail video.mp4 --time 00:00:30

# Create multiple thumbnails
mediaproc video extract-frames video.mp4 --fps 0.1 --format jpg
```

### 5. Batch Processing

```bash
# Compress all MP4 files
for file in *.mp4; do
  mediaproc video compress "$file" -o "compressed_$file"
done

# Convert all AVI to MP4
for file in *.avi; do
  mediaproc video transcode "$file" -f mp4
done
```

## Performance Tips

1. **Use fast trim mode** for quick cuts without quality loss
2. **Avoid re-encoding** when merging videos with same format
3. **Use CRF over bitrate** for better quality/size ratio
4. **Choose H.265** for better compression (slower encoding)
5. **Use presets** for common resolutions to save time

## Technical Details

### Quality Settings (CRF)

CRF (Constant Rate Factor) controls quality:

- **0-17**: Visually lossless (very large files)
- **18-23**: High quality (recommended for archival)
- **23-28**: Good quality (recommended for distribution)
- **28-51**: Lower quality (streaming/small files)

### Codec Comparison

| Codec | Compression | Speed     | Browser Support |
| ----- | ----------- | --------- | --------------- |
| H.264 | Good        | Fast      | Excellent       |
| H.265 | Better      | Slow      | Modern only     |
| VP9   | Better      | Slow      | Good (WebM)     |
| AV1   | Best        | Very Slow | Limited         |

### Container Formats

- **MP4**: Universal, best compatibility
- **WebM**: Web-optimized, used with VP9
- **MKV**: Feature-rich, large file support
- **AVI**: Legacy, avoid for new projects

## Error Handling

The plugin provides clear error messages:

- **FFmpeg not found**: Install FFmpeg first
- **Invalid input file**: Check file path and permissions
- **Codec not supported**: Use different codec or format
- **Out of range**: Check start/end times against video duration

## Development

### Building

```bash
pnpm install
pnpm build
```

### Testing

```bash
# Test compress
mediaproc video compress test-video.mp4 --dry-run -v

# Test all commands
pnpm test
```

## Contributing

Contributions welcome! Please:

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Submit PR with clear description

## License

MIT

## Support

- 📖 [Full Documentation](https://mediaproc.dev/docs/plugins/video)
- 🐛 [Report Issues](https://github.com/0xshariq/mediaproc-cli/issues)
- 💬 [Discussions](https://github.com/0xshariq/mediaproc-cli/discussions)

## Credits

Built with [FFmpeg](https://ffmpeg.org/) - the leading multimedia framework.
