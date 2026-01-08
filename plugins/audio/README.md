# Audio Plugin

Professional audio processing plugin for MediaProc CLI. Convert, extract, trim, merge, and normalize audio files with FFmpeg.

## Features

- 🔄 **Convert** - Convert between audio formats (MP3, AAC, WAV, FLAC, OGG, Opus)
- 🎵 **Extract** - Extract audio tracks from video files
- ✂️ **Trim** - Cut audio to specific time ranges with fade effects
- 🔗 **Merge** - Concatenate multiple audio files with crossfade
- 📊 **Normalize** - EBU R128 loudness normalization for consistent levels

## Installation

```bash
npm install -g @mediaproc/audio
```

Or via MediaProc CLI:

```bash
mediaproc add audio
```

## Requirements

- **FFmpeg** 4.0+ with audio codecs support
- **Node.js** 18+

Check if FFmpeg is installed:

```bash
ffmpeg -version
```

## Commands

### convert - Format Conversion

Convert audio files between different formats with quality control.

**Supported Formats:** MP3, AAC, WAV, FLAC, OGG, Opus, M4A

```bash
# Basic conversion
mediaproc audio convert input.wav -f mp3

# High-quality conversion
mediaproc audio convert input.flac -f mp3 -b 320k

# Lossless conversion
mediaproc audio convert input.wav -f flac -q lossless

# Change sample rate and channels
mediaproc audio convert input.mp3 -f wav -s 48000 -c 2

# Batch convert folder
mediaproc audio convert audio-files/ -f aac -o output/
```

**Options:**

- `-o, --output <path>` - Output file/directory
- `-f, --format <format>` - Output format (mp3, aac, wav, flac, ogg, opus, m4a)
- `-b, --bitrate <bitrate>` - Audio bitrate (e.g., 128k, 192k, 320k)
- `-q, --quality <quality>` - Quality preset: low, medium, high, lossless
- `-s, --sample-rate <rate>` - Sample rate in Hz (44100, 48000)
- `-c, --channels <channels>` - Channels: 1 (mono), 2 (stereo)

---

### extract - Audio from Video

Extract audio tracks from video files to standalone audio files.

**Supported Video Formats:** MP4, MKV, AVI, MOV, WebM, FLV

```bash
# Extract as MP3 (default)
mediaproc audio extract video.mp4

# Extract as high-quality AAC
mediaproc audio extract video.mp4 -f aac -b 256k

# Extract as lossless FLAC
mediaproc audio extract video.mkv -f flac -q lossless

# Extract as mono for voice
mediaproc audio extract video.mp4 -f mp3 --channels 1

# Batch extract from folder
mediaproc audio extract videos/ -f mp3 -o audio-tracks/
```

**Options:**

- `-o, --output <path>` - Output file/directory
- `-f, --format <format>` - Output format (mp3, aac, wav, flac, opus, ogg)
- `-b, --bitrate <bitrate>` - Audio bitrate
- `-q, --quality <quality>` - Quality preset
- `--sample-rate <rate>` - Sample rate
- `--channels <channels>` - Number of channels

---

### trim - Cut Audio

Trim audio files to specific time ranges with optional fade effects.

```bash
# Trim by time range
mediaproc audio trim audio.mp3 --start 00:01:00 --end 00:02:00

# Extract first 30 seconds
mediaproc audio trim audio.mp3 --duration 30

# Trim from 30s for 60s
mediaproc audio trim audio.mp3 -s 30 -d 60

# Add fade effects
mediaproc audio trim audio.mp3 -s 60 -d 120 --fade-in 2 --fade-out 3

# Fast mode (stream copy, no re-encoding)
mediaproc audio trim audio.mp3 --start 30 --duration 60 --fast

# Batch trim all files
mediaproc audio trim folder/ -s 10 -d 30 -o output/
```

**Options:**

- `-o, --output <path>` - Output file/directory
- `-s, --start <time>` - Start time (HH:MM:SS or seconds)
- `-e, --end <time>` - End time (HH:MM:SS or seconds)
- `-d, --duration <time>` - Duration from start
- `--fade-in <seconds>` - Fade-in duration
- `--fade-out <seconds>` - Fade-out duration
- `--fast` - Fast mode (stream copy)

---

### merge - Concatenate Audio

Join multiple audio files into one continuous file.

```bash
# Basic merge
mediaproc audio merge audio1.mp3 audio2.mp3 audio3.mp3

# Merge with custom output
mediaproc audio merge part*.mp3 -o complete.mp3

# Merge with crossfade
mediaproc audio merge song1.mp3 song2.mp3 --crossfade 2

# Merge with normalization
mediaproc audio merge *.wav --normalize -o normalized.wav

# Merge to different format
mediaproc audio merge *.wav -o output.flac --format flac
```

**Options:**

- `-o, --output <path>` - Output file (default: merged.mp3)
- `--format <format>` - Output format
- `--bitrate <bitrate>` - Output bitrate
- `--crossfade <seconds>` - Crossfade duration between files
- `--normalize` - Normalize audio levels before merging

---

### normalize - Loudness Normalization

Normalize audio levels using EBU R128 loudness standard for consistent volume.

```bash
# Normalize to broadcast standard (-16 LUFS)
mediaproc audio normalize audio.mp3

# Normalize to streaming standard (-23 LUFS)
mediaproc audio normalize audio.mp3 -t -23

# Custom target loudness
mediaproc audio normalize audio.mp3 -t -16 -l -1.0

# Simple peak normalization
mediaproc audio normalize audio.mp3 -m peak

# Batch normalize folder
mediaproc audio normalize folder/ -o output/
```

**Options:**

- `-o, --output <path>` - Output file/directory
- `-t, --target <lufs>` - Target loudness in LUFS (default: -16)
- `-l, --max-level <db>` - Maximum true peak in dB (default: -1.5)
- `-m, --method <method>` - Method: loudnorm (EBU R128), peak
- `--format <format>` - Output format

**LUFS Standards:**

- **-16 LUFS** - Broadcast standard (TV, radio)
- **-23 LUFS** - Streaming platforms (Spotify, YouTube)
- **-14 LUFS** - Apple Music, Tidal

---

## Format Support

| Format | Extension      | Type     | Codec      | Best For                   |
| ------ | -------------- | -------- | ---------- | -------------------------- |
| MP3    | `.mp3`         | Lossy    | libmp3lame | Universal compatibility    |
| AAC    | `.aac`, `.m4a` | Lossy    | aac        | Modern devices, streaming  |
| WAV    | `.wav`         | Lossless | pcm_s16le  | Professional editing       |
| FLAC   | `.flac`        | Lossless | flac       | Archival, lossless quality |
| OGG    | `.ogg`         | Lossy    | libvorbis  | Open-source projects       |
| Opus   | `.opus`        | Lossy    | libopus    | Voice, low bandwidth       |

## Quality Guidelines

### Bitrate Recommendations

| Quality | MP3  | AAC  | Opus | Use Case                  |
| ------- | ---- | ---- | ---- | ------------------------- |
| Low     | 96k  | 64k  | 48k  | Voice, podcasts           |
| Medium  | 192k | 128k | 96k  | General music             |
| High    | 320k | 256k | 128k | High-quality distribution |

### Sample Rates

- **44100 Hz** - CD quality (default for most content)
- **48000 Hz** - Professional audio, video production
- **96000 Hz** - High-resolution audio

## Common Workflows

### Podcast Production

```bash
# Extract audio from video recording
mediaproc audio extract recording.mp4 -f mp3 -b 128k --channels 1

# Normalize levels
mediaproc audio normalize recording-audio.mp3 -t -16

# Trim intro/outro
mediaproc audio trim recording-audio-normalized.mp3 -s 10 --duration 3600
```

### Music Production

```bash
# Convert to lossless for editing
mediaproc audio convert track.mp3 -f wav -q lossless

# Merge multiple takes
mediaproc audio merge take1.wav take2.wav take3.wav --normalize

# Export final master
mediaproc audio convert merged.wav -f flac -q lossless
```

### Video Production

```bash
# Extract audio from video
mediaproc audio extract video.mp4 -f wav

# Clean up audio
mediaproc audio normalize video-audio.wav -t -16

# Trim to match video
mediaproc audio trim video-audio-normalized.wav -s 0 -e 00:05:30
```

## Advanced Examples

### Batch Processing

```bash
# Convert all WAV files to MP3
for file in *.wav; do
  mediaproc audio convert "$file" -f mp3 -b 320k
done

# Or use folder processing
mediaproc audio convert wav-files/ -f mp3 -b 320k -o mp3-files/
```

### Creating Audio Montage

```bash
# Merge with crossfades and normalization
mediaproc audio merge \
  intro.mp3 \
  main-content.mp3 \
  outro.mp3 \
  --crossfade 2 \
  --normalize \
  -o final-montage.mp3
```

### Format Migration

```bash
# Migrate entire music library from MP3 to FLAC
mediaproc audio convert music-library/ \
  -f flac \
  -q lossless \
  -o flac-library/
```

## Troubleshooting

### FFmpeg Not Found

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows (via Chocolatey)
choco install ffmpeg
```

### Audio Quality Issues

- Use lossless formats (WAV, FLAC) for intermediate processing
- Avoid multiple lossy conversions (MP3 → AAC → OGG)
- Use higher bitrates (320k) for final distribution
- Enable normalization for consistent loudness

### Merge Compatibility Issues

Different formats may require re-encoding:

```bash
# Force re-encoding with specific format
mediaproc audio merge *.* --format mp3 --bitrate 192k
```

## Performance Tips

- Use `--fast` mode for large trim operations
- Enable batch processing for multiple files
- Consider hardware acceleration for video extraction
- Use appropriate quality settings (avoid overkill)

## License

MIT

## Contributing

Issues and PRs welcome at [mediaproc-cli](https://github.com/0xshariq/mediaproc-cli)
