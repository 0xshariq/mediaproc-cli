#!/usr/bin/env node
import { Command } from 'commander';
import { register } from './register.js';

const program = new Command();
program
  .name('mediaproc-audio')
  .description(`
🎵 Audio Processing Plugin v1.0.0

Professional audio processing powered by FFmpeg/FFprobe. Convert, normalize, trim, merge, and extract audio with 5 powerful commands.

📦 Commands Overview:

  🔄 convert [input]
     Convert audio between formats with quality control
     • Formats: MP3, AAC, WAV, FLAC, OGG, Opus, M4A, WMA
     • Quality presets: low (96k), medium (192k), high (320k), lossless
     • Custom bitrate, sample rate, and channel control
     • Example: mediaproc-audio convert song.wav -f mp3 -b 320k

  🎵 extract [input]
     Extract audio tracks from video files
     • Input: MP4, MKV, AVI, MOV, WebM, FLV, WMV, M4V
     • Output: MP3, AAC, WAV, FLAC, Opus, OGG
     • Quality and bitrate control
     • Example: mediaproc-audio extract video.mp4 -f flac -q lossless

  📊 normalize [input]
     Normalize audio levels to consistent loudness
     • EBU R128 loudness normalization (loudnorm filter)
     • Peak normalization method
     • Target LUFS: -16 (broadcast), -23 (streaming), -14 (podcasts)
     • True peak limiting to prevent clipping
     • Example: mediaproc-audio normalize podcast.mp3 -t -16 -l -1.5

  ✂️  trim [input]
     Cut audio segments with precise timing
     • Time-based: HH:MM:SS or seconds (e.g., 00:01:30 or 90)
     • Duration-based: extract specific length
     • Optional fade-in/fade-out effects (0.1-10 seconds)
     • Fast mode: stream copy without re-encoding
     • Example: mediaproc-audio trim song.mp3 -s 30 -d 60 --fade-in 2

  🔗 merge [inputs...]
     Concatenate multiple audio files into one
     • Seamless joining of audio tracks
     • Optional crossfade between files (0-10 seconds)
     • Automatic format normalization
     • Audio level normalization option
     • Example: mediaproc-audio merge part1.mp3 part2.mp3 -o complete.mp3 --crossfade 2

🎶 Format Support:
  Lossy Formats:    MP3, AAC, OGG Vorbis, Opus, M4A (AAC), WMA
  Lossless Formats: WAV (PCM), FLAC (Free Lossless Audio Codec)
  Video Sources:    MP4, MKV, AVI, MOV, WebM, FLV, WMV, M4V

📡 Audio Quality Guide:
  96k  (low)      - Voice recordings, podcasts, audiobooks
  128k (medium-)  - Acceptable music quality, streaming
  192k (medium)   - Good music quality, general use
  256k (high-)    - Very good quality, near-transparent
  320k (high)     - Maximum MP3 quality, transparent to most listeners
  FLAC/WAV        - Lossless, archival quality, professional mastering

📊 Loudness Normalization Standards:
  -16 LUFS - EBU R128 broadcast standard (TV, Radio, Streaming)
  -23 LUFS - ATSC A/85 loudness target (Spotify, YouTube, Apple Music)
  -14 LUFS - Podcast and audiobook standard
  -9 LUFS  - Mastering reference (loud commercial sound)

🔧 Common Workflows:
  # Convert WAV to high-quality MP3
  mediaproc-audio convert master.wav -f mp3 -b 320k -s 48000

  # Extract lossless audio from video
  mediaproc-audio extract concert.mp4 -f flac -q lossless

  # Normalize for streaming platforms
  mediaproc-audio normalize song.mp3 -t -23 -m loudnorm

  # Trim with fade effects
  mediaproc-audio trim interview.mp3 -s 00:05:30 -e 00:15:45 --fade-in 1 --fade-out 2

  # Merge album tracks with crossfade
  mediaproc-audio merge track*.mp3 -o album.mp3 --crossfade 3 --normalize

  # Batch convert folder to Opus
  for file in *.wav; do mediaproc-audio convert "$file" -f opus -b 192k; done

🚀 Quick Start:
  mediaproc-audio <command> [input] [options]
  
📚 Detailed Help:
  Use 'mediaproc-audio <command> --help' for comprehensive documentation on each command.
  `)
  .version('1.0.0');

register(program);
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
