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
- 📁 **Folder Processing** - Process entire directories with single command
- 🎯 **Simple CLI** - Intuitive command-line interface
- 💡 **Helpful Documentation** - Built-in help for every command
- ⚡ **Smart Processing** - Automatic format detection and optimization
- 🎨 **Advanced Effects** - Fade, speed, volume, transitions, and more
- 🔄 **Hardware Acceleration** - GPU support for faster encoding

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

# Process entire folders (recursively finds all video files)
mediaproc video compress videos/ -q high -o compressed/
mediaproc video resize ./input/ -s 720p -o ./output/

# Multiple files separated by commas
mediaproc video compress video1.mp4,video2.mp4,video3.mp4 -q medium
```

**2. Folder Processing:**

```bash
# Compress all videos in a folder
mediaproc video compress videos/ -q medium -o compressed/

# Resize all videos to 1080p
mediaproc video resize raw-footage/ -s 1080p -o processed/

# Trim all videos in folder
mediaproc video trim clips/ -s 5 -d 30 -o trimmed/

# Process maintains folder structure in output
# Input: videos/project1/clip.mp4 → Output: output/project1/clip-compressed.mp4
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

- `--quality` (`-q`): low, medium, high, extreme (CRF-based)
- `--codec` (`-c`): h264, h265, vp9, av1
- `--crf`: Custom CRF value (0-51)
- `--preset`: Encoding preset (ultrafast, fast, medium, slow, veryslow)
- `--bitrate` (`-b`): Target bitrate (e.g., 2M, 5M)
- `--min-bitrate`: Minimum bitrate (e.g., 1M)
- `--max-bitrate`: Maximum bitrate (e.g., 8M)
- `--audio-bitrate`: Audio bitrate (default: 128k)
- `--audio-codec`: Audio codec (aac, mp3, opus)
- `--optimize-for`: Optimize for web, streaming, archive, mobile
- `--resize`: Also resize during compression (e.g., 720p, 1080p)
- `--threads`: Number of encoding threads
- `--hw-accel`: Enable hardware acceleration (GPU)
- `--strip-metadata`: Remove all metadata from output
- `--two-pass`: Use two-pass encoding for better quality

**Transcode:**

- `--format` (`-f`): mp4, webm, mkv, avi
- `--codec`: h264, h265, vp9, av1
- `--bitrate`: Target bitrate (e.g., 2M, 5000k)
- `--audio-codec`: aac, opus, mp3
- `--audio-bitrate`: Audio bitrate (e.g., 128k)

**Trim:**

- `--start` (`-s`): Start time (HH:MM:SS or seconds)
- `--end` (`-e`): End time (HH:MM:SS or seconds)
- `--duration` (`-d`): Duration (HH:MM:SS or seconds)
- `--fast`: Fast mode (stream copy)
- `--accurate`: Accurate mode (re-encode for frame accuracy)
- `--codec` (`-c`): Video codec (h264, h265, copy)
- `--fade-in`: Add fade-in effect (seconds)
- `--fade-out`: Add fade-out effect (seconds)
- `--speed`: Adjust playback speed (0.5-2.0)
- `--volume`: Adjust audio volume (0.0-2.0)
- `--quality`: CRF quality if re-encoding (default: 23)
- `--no-audio`: Remove audio track from output

**Resize:**

- `--scale` (`-s`): 360p, 480p, 720p, 1080p, 1440p, 2160p (4K), 4320p (8K), or WxH
- `--codec` (`-c`): h264, h265, vp9, av1
- `--quality` (`-q`): CRF quality (0-51, lower=better, default: 23)
- `--preset`: Encoding preset (ultrafast, fast, medium, slow, veryslow)
- `--bitrate` (`-b`): Target bitrate (e.g., 5M, 10M)
- `--aspect` (`-a`): Aspect ratio (16:9, 4:3, 21:9, 1:1)
- `--fps`: Output frame rate (e.g., 24, 30, 60)
- `--scale-algo`: Scaling algorithm (bilinear, bicubic, lanczos, spline)
- `--deinterlace`: Deinterlace video (for interlaced sources)
- `--rotate`: Rotate video (90, 180, 270 degrees)
- `--flip`: Flip video (horizontal, vertical, both)
- `--crop`: Crop video (width:height:x:y or preset)
- `--threads`: Number of encoding threads
- `--hw-accel`: Enable hardware acceleration (GPU)
- `--no-audio`: Remove audio from output
- `--two-pass`: Use two-pass encoding for better quality

**Merge:**

- `--re-encode`: Force re-encoding
- `--transition`: Transition effect (fade, wipe, dissolve, none)
- `--transition-duration`: Transition duration in seconds (default: 1)
- `--codec` (`-c`): Video codec (h264, h265, vp9)
- `--quality`: CRF quality if re-encoding (default: 23)
- `--scale`: Scale all videos to same resolution (e.g., 1080p)
- `--audio-track`: Select audio track from videos (1-based)
- `--audio-codec`: Audio codec (aac, mp3, opus)
- `--normalize-audio`: Normalize audio levels across videos

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

## � Advanced Features

### Hardware Acceleration

Enable GPU acceleration for significantly faster encoding:

```bash
# Use GPU for faster encoding
mediaproc video resize input.mp4 -s 4K --hw-accel
mediaproc video compress input.mp4 -q high --hw-accel
```

**Note:** Requires compatible GPU and drivers (NVIDIA NVENC, Intel Quick Sync, AMD VCE)

### Optimization Presets

Compress with specific optimization targets:

```bash
# Optimize for web delivery
mediaproc video compress input.mp4 --optimize-for web

# Optimize for streaming platforms
mediaproc video compress input.mp4 --optimize-for streaming

# Optimize for mobile devices
mediaproc video compress input.mp4 --optimize-for mobile --resize 720p

# Optimize for long-term archive
mediaproc video compress input.mp4 --optimize-for archive -c h265
```

### Multi-Threading

Control CPU usage for encoding:

```bash
# Use 8 threads for faster encoding
mediaproc video resize input.mp4 -s 1080p --threads 8

# Use all available CPU cores (default)
mediaproc video compress input.mp4 -q high
```

### Two-Pass Encoding

Better quality at target bitrate (takes twice as long):

```bash
# Two-pass encoding for optimal quality
mediaproc video compress input.mp4 --two-pass -b 5M
mediaproc video resize input.mp4 -s 1080p --two-pass
```

### Metadata Management

```bash
# Strip all metadata to reduce file size
mediaproc video compress input.mp4 --strip-metadata

# Metadata is preserved by default in most operations
```

---

## �📋 Commands Overview

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

### compress

Compress video files to reduce size while maintaining quality.

```bash
# Basic compression with default medium quality
mediaproc video compress input.mp4

# High quality compression (larger file, better quality)
mediaproc video compress input.mp4 -q high

# Extreme quality compression (near lossless)
mediaproc video compress input.mp4 -q extreme

# Custom CRF value for fine control
mediaproc video compress input.mp4 --crf 20

# Use H.265 codec for better compression (50% smaller)
mediaproc video compress input.mp4 -c h265 -q high

# Compress with resize for mobile
mediaproc video compress input.mp4 --resize 720p --optimize-for mobile

# Two-pass encoding for best quality
mediaproc video compress input.mp4 -c h265 --preset slow --two-pass

# Compress folder of videos
mediaproc video compress videos/ -q medium -o compressed/
```

**Quality Presets:**

- `low` - CRF 28 (~60% size reduction, noticeable quality loss)
- `medium` - CRF 23 (~40% size reduction, minimal quality loss) - **Default**
- `high` - CRF 20 (~30% size reduction, near-identical quality)
- `extreme` - CRF 18 (~20% size reduction, visually lossless)

**Advanced Options:**

- `--optimize-for`: Preset optimizations (web, streaming, archive, mobile)
- `--hw-accel`: Enable GPU acceleration for faster encoding
- `--threads`: Control CPU thread usage
- `--strip-metadata`: Remove all metadata to save space

**Supported Codecs:** h264, h265, vp9, av1

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

Cut video segments with precise timing and effects.

```bash
# Trim using start and end times (HH:MM:SS format)
mediaproc video trim input.mp4 -s 00:00:10 -e 00:01:30

# Trim using seconds (simpler)
mediaproc video trim input.mp4 -s 10 -e 90

# Trim using duration instead of end time
mediaproc video trim input.mp4 -s 10 -d 80

# Fast mode (stream copy - very quick, may not be frame-accurate)
mediaproc video trim input.mp4 -s 00:00:05 -e 00:00:15 --fast

# Accurate mode (re-encode for perfect frame accuracy)
mediaproc video trim input.mp4 -s 10 -d 30 --accurate

# Trim with fade-in effect (3 seconds)
mediaproc video trim input.mp4 -s 60 -d 120 --fade-in 3

# Trim with fade-out effect (2 seconds)
mediaproc video trim input.mp4 -s 30 -d 60 --fade-out 2

# Trim with both fade effects
mediaproc video trim input.mp4 -s 0 -d 120 --fade-in 2 --fade-out 3

# Adjust playback speed (0.5x slow motion)
mediaproc video trim input.mp4 -s 10 -d 30 --speed 0.5

# Adjust playback speed (2x fast forward)
mediaproc video trim input.mp4 -s 10 -d 30 --speed 2.0

# Adjust audio volume (50%)
mediaproc video trim input.mp4 -s 10 -d 30 --volume 0.5

# Remove audio from clip
mediaproc video trim input.mp4 -s 10 -d 30 --no-audio

# Trim folder of videos
mediaproc video trim videos/ -s 5 -d 30 -o clips/
```

**Time Formats:**

- **Seconds**: `90` (1 minute 30 seconds)
- **MM:SS**: `01:30` (1 minute 30 seconds)
- **HH:MM:SS**: `00:01:30` (1 minute 30 seconds)

**Duration Options:**

- Use `--end` for absolute end time
- Use `--duration` for relative duration from start
- Cannot use both `--end` and `--duration` together

**Modes:**

- **Default**: Stream copy (fast and accurate for most cases)
- **Fast (`--fast`)**: Stream copy without re-encoding (very quick, may cut at nearest keyframe)
- **Accurate (`--accurate`)**: Re-encode for perfect frame accuracy (slower but precise)

**Effects:**

- `--fade-in`: Add fade-in effect at the beginning
- `--fade-out`: Add fade-out effect at the end
- `--speed`: Adjust playback speed (0.5 = 50% slower, 2.0 = 2x faster)
- `--volume`: Adjust audio volume (0.5 = 50%, 1.0 = 100%, 2.0 = 200%)

### resize

Change video resolution with quality preservation and advanced transformations.

```bash
# Use preset scale (recommended)
mediaproc video resize input.mp4 -s 720p

# Resize to 4K with high quality
mediaproc video resize input.mp4 -s 2160p -c h265 --preset slow

# Resize to 8K (4320p)
mediaproc video resize input.mp4 -s 4320p

# Custom dimensions (WIDTHxHEIGHT)
mediaproc video resize input.mp4 -s 1920x1080

# Change aspect ratio to 16:9
mediaproc video resize input.mp4 -s 1080p -a 16:9

# Resize with custom frame rate
mediaproc video resize input.mp4 -s 1080p --fps 60

# Rotate video 90 degrees clockwise
mediaproc video resize input.mp4 --rotate 90

# Flip video horizontally
mediaproc video resize input.mp4 --flip horizontal

# Crop to 16:9 aspect ratio
mediaproc video resize input.mp4 --crop 16:9

# Deinterlace old footage
mediaproc video resize input.mp4 -s 1080p --deinterlace

# Use Lanczos scaling algorithm (best quality)
mediaproc video resize input.mp4 -s 1080p --scale-algo lanczos

# Hardware accelerated resize
mediaproc video resize input.mp4 -s 4K --hw-accel

# Resize folder of videos
mediaproc video resize videos/ -s 1080p -o output/
```

**Scale Presets:**

- `360p` - 640x360 (Low quality, mobile)
- `480p` - 854x480 (SD quality)
- `720p` - 1280x720 (HD ready) - **Recommended for web**
- `1080p` - 1920x1080 (Full HD) - **Recommended for distribution**
- `1440p` - 2560x1440 (2K/QHD)
- `2160p` - 3840x2160 (4K/UHD)
- `4320p` - 7680x4320 (8K/UHD)
- `WxH` - Custom (e.g., 1920x1080)

**Advanced Transformations:**

- `--rotate`: Rotate video (90, 180, 270 degrees)
- `--flip`: Flip horizontally, vertically, or both
- `--crop`: Crop video to specific dimensions or aspect ratio
- `--deinterlace`: Remove interlacing artifacts
- `--scale-algo`: Choose scaling algorithm (lanczos recommended)

### merge

Concatenate multiple videos into one with transitions and effects.

```bash
# Simple merge (auto-detect if re-encode needed)
mediaproc video merge video1.mp4 video2.mp4 video3.mp4

# Merge with custom output name
mediaproc video merge part1.mp4 part2.mp4 part3.mp4 -o complete.mp4

# Force re-encoding for compatibility
mediaproc video merge *.mp4 --re-encode

# Merge with fade transitions between clips
mediaproc video merge clip1.mp4 clip2.mp4 --transition fade --transition-duration 2

# Merge with specific codec and quality
mediaproc video merge video1.mp4 video2.mp4 -c h265 --quality 20

# Scale all videos to same resolution before merging
mediaproc video merge *.mp4 --scale 1080p

# Merge with normalized audio levels
mediaproc video merge video1.mp4 video2.mp4 --normalize-audio

# Select specific audio track (for multi-track videos)
mediaproc video merge video1.mp4 video2.mp4 --audio-track 2

# Merge to different format
mediaproc video merge *.mp4 -o output.mkv --format mkv
```

**Merge Methods:**

- **Fast Concatenation**: No re-encoding, very fast, requires same codec/format/resolution
- **Re-encoding (`--re-encode`)**: Slower but handles any format/codec combination
- **Auto Detection**: Automatically chooses best method based on input files

**Transitions:**

- `none` - No transition (default)
- `fade` - Crossfade between clips
- `wipe` - Wipe transition
- `dissolve` - Dissolve transition

**Requirements:**

- At least 2 videos required for merging
- Videos with different resolutions can be scaled to match using `--scale`
- Audio tracks will be merged in order
- Videos are processed in the order specified

**Advanced Options:**

- `--normalize-audio`: Normalize audio levels across all videos for consistent volume
- `--audio-track`: Select which audio track to use from multi-track videos
- `--scale`: Resize all videos to same resolution before merging

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

## 🎯 Real-World Workflows

### Workflow 1: Social Media Content

Prepare videos for Instagram, TikTok, YouTube Shorts:

```bash
# 1. Trim to desired length (60 seconds for Instagram)
mediaproc video trim long-video.mp4 -s 00:01:00 -d 60 -o clip.mp4

# 2. Resize to 1080x1080 (square for Instagram)
mediaproc video resize clip.mp4 -s 1080x1080 -o square.mp4

# 3. Add fade effects
mediaproc video trim square.mp4 -s 0 -d 60 --fade-in 1 --fade-out 1 -o final.mp4

# 4. Compress for upload
mediaproc video compress final.mp4 -q high --optimize-for web
```

### Workflow 2: YouTube Video Production

Professional YouTube video workflow:

```bash
# 1. Merge multiple clips
mediaproc video merge intro.mp4 main.mp4 outro.mp4 --transition fade -o raw.mp4

# 2. Resize to 1080p if needed
mediaproc video resize raw.mp4 -s 1080p --fps 60 -o hd.mp4

# 3. Compress for upload (maintain quality)
mediaproc video compress hd.mp4 -q extreme -c h264 --two-pass -o final.mp4
```

### Workflow 3: Batch Process Raw Footage

Process entire folders of raw footage:

```bash
# 1. Convert all MOV files to MP4
mediaproc video transcode raw-footage/ -f mp4 -o converted/

# 2. Resize all to 1080p
mediaproc video resize converted/ -s 1080p -o resized/

# 3. Compress all files
mediaproc video compress resized/ -q high --hw-accel -o final/
```

### Workflow 4: Create Video Highlight Reel

Extract and combine best moments:

```bash
# 1. Extract multiple highlight clips
mediaproc video trim game.mp4 -s 300 -d 15 -o highlight1.mp4
mediaproc video trim game.mp4 -s 850 -d 20 -o highlight2.mp4
mediaproc video trim game.mp4 -s 1200 -d 12 -o highlight3.mp4

# 2. Add speed effects to create excitement
mediaproc video trim highlight2.mp4 -s 0 -d 20 --speed 1.5 -o fast.mp4

# 3. Merge with transitions
mediaproc video merge highlight1.mp4 fast.mp4 highlight3.mp4 \
  --transition fade --transition-duration 1.5 -o reel.mp4

# 4. Final compress
mediaproc video compress reel.mp4 -q extreme -o final-reel.mp4
```

### Workflow 5: Archive Old Videos

Convert and compress old videos for storage:

```bash
# 1. Deinterlace old interlaced footage
mediaproc video resize old-video.avi -s 720p --deinterlace -o progressive.mp4

# 2. Compress with H.265 for 50% space savings
mediaproc video compress progressive.mp4 -c h265 -q high --optimize-for archive

# 3. Extract thumbnail for catalog
mediaproc video extract-thumbnail progressive-compressed.mp4 --time 5
```

### Workflow 6: Prepare Course/Training Videos

Educational content optimization:

```bash
# 1. Trim intro and outro
mediaproc video trim raw-recording.mp4 -s 10 -e 3600 -o main.mp4

# 2. Resize to standard resolution
mediaproc video resize main.mp4 -s 1080p --fps 30 -o standard.mp4

# 3. Compress for web delivery
mediaproc video compress standard.mp4 --optimize-for web -q high
```

### Workflow 7: Create Slow Motion Effects

```bash
# 1. Extract clip
mediaproc video trim action.mp4 -s 120 -d 5 -o clip.mp4

# 2. Apply 50% slow motion
mediaproc video trim clip.mp4 -s 0 -d 5 --speed 0.5 -o slow.mp4

# 3. Add fade-in and fade-out
mediaproc video trim slow.mp4 -s 0 -e end --fade-in 0.5 --fade-out 0.5
```

---

## 💡 Usage Tips

### Best Practices

1. **Use `--dry-run` first** - Preview operations before processing
   ```bash
   mediaproc video compress input.mp4 -q high --dry-run
   ```

2. **Enable hardware acceleration** - 3-5x faster encoding with GPU
   ```bash
   mediaproc video resize input.mp4 -s 4K --hw-accel
   ```

3. **Process folders efficiently** - Batch process entire directories
   ```bash
   mediaproc video compress videos/ -q medium -o output/
   ```

4. **Use CRF over bitrate** - Better quality/size ratio
   ```bash
   mediaproc video compress input.mp4 --crf 23  # Better than --bitrate
   ```

5. **Choose the right codec** - H.265 for 50% better compression
   ```bash
   mediaproc video compress input.mp4 -c h265 -q high
   ```

6. **Fast trim for quick cuts** - Use stream copy for instant trimming
   ```bash
   mediaproc video trim input.mp4 -s 10 -d 30 --fast
   ```

7. **Two-pass for best quality** - Worth it for final renders
   ```bash
   mediaproc video compress input.mp4 -q extreme --two-pass
   ```

### Performance Tips

- **Fast Mode**: Use `--fast` with trim for instant cuts (no re-encoding)
- **Presets**: Use ultrafast/fast presets for quick processing, slow/veryslow for final output
- **Threading**: More threads = faster (but diminishing returns beyond 8)
- **GPU Acceleration**: Enable `--hw-accel` for 3-5x speed boost (requires compatible GPU)
- **Format Selection**: H.264 is fastest, AV1 is slowest but best compression

### Quality Guidelines

**For Distribution (recommended):**
- Quality: `-q high` or `--crf 20-23`
- Codec: h264 or h265
- Resolution: 1080p or 1440p

**For Web/Streaming:**
- Quality: `-q medium` or `--crf 23-28`
- Optimization: `--optimize-for web`
- Resolution: 720p or 1080p

**For Archive:**
- Quality: `-q extreme` or `--crf 18`
- Codec: h265 (best compression)
- Options: `--two-pass --optimize-for archive`

**For Mobile:**
- Quality: `-q medium`
- Resolution: 720p or lower
- Optimization: `--optimize-for mobile`

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
