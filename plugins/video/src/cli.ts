#!/usr/bin/env node
import { Command } from 'commander';
import { register } from './register.js';

const program = new Command();
program
  .name('mediaproc-video')
  .description(`
🎬 Video Processing Plugin v1.0.0

Professional video processing powered by FFmpeg. Compress, transcode, edit, and extract media with 7 commands.

✨ Available Commands:
  • compress    - CRF-based compression with quality presets (H.264/H.265/VP9/AV1)
  • transcode   - Convert formats and codecs (MP4, WebM, AVI, MKV, MOV)
  • convert     - Simple format conversion with remux support
  • trim        - Cut videos by time range with fade effects
  • resize      - Scale to 4K, 1080p, 720p, or custom dimensions
  • merge       - Concatenate multiple videos (fast/re-encode modes)
  • extract     - Extract audio, frames, or thumbnails

🎬 Video Codecs:
  H.264 (x264)  - Universal compatibility, efficient compression
  H.265 (x265)  - 50% better compression than H.264
  VP9           - Google's open codec for WebM
  AV1           - Next-gen codec, best compression (slower encoding)

🎵 Audio Codecs:
  AAC, MP3, Opus, Vorbis, FLAC, WAV

🚀 Usage:
  mediaproc-video <command> [options]
  mediaproc-video compress video.mp4 --quality 23
  mediaproc-video resize video.mp4 -s 1080p
  mediaproc-video trim video.mp4 -s 00:01:00 -e 00:02:00

📚 Use 'mediaproc-video <command> --help' for detailed command documentation.
  `)
  .version('1.0.0');

register(program);
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
