import { spawn } from 'child_process';
import { resolve } from 'path';
import chalk from 'chalk';
import { fileExists } from './pathValidator.js';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  fps: number;
  bitrate: number;
  format: string;
}

/**
 * Execute ffmpeg command
 */
export async function runFFmpeg(args: string[], verbose = false): Promise<void> {
  return new Promise((resolve, reject) => {
    if (verbose) {
      console.log(chalk.dim(`ffmpeg ${args.join(' ')}`));
    }

    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
      if (verbose) {
        process.stderr.write(data);
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg failed with code ${code}\n${stderr}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start ffmpeg: ${error.message}`));
    });
  });
}

/**
 * Get video metadata using ffprobe
 */
export async function getVideoMetadata(input: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      input,
    ]);

    let stdout = '';
    let stderr = '';

    ffprobe.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed: ${stderr}`));
        return;
      }

      try {
        const data = JSON.parse(stdout);
        const videoStream = data.streams.find((s: any) => s.codec_type === 'video');

        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const metadata: VideoMetadata = {
          duration: parseFloat(data.format.duration) || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          codec: videoStream.codec_name || 'unknown',
          fps: eval(videoStream.r_frame_rate) || 0,
          bitrate: parseInt(data.format.bit_rate) || 0,
          format: data.format.format_name || 'unknown',
        };

        resolve(metadata);
      } catch (error) {
        reject(new Error(`Failed to parse ffprobe output: ${error}`));
      }
    });

    ffprobe.on('error', (error) => {
      reject(new Error(`Failed to start ffprobe: ${error.message}`));
    });
  });
}

/**
 * Check if ffmpeg is available
 */
export async function checkFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('close', (code) => resolve(code === 0));
    ffmpeg.on('error', () => resolve(false));
  });
}

/**
 * Check if ffprobe is available
 */
export async function checkFFprobe(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffprobe = spawn('ffprobe', ['-version']);
    ffprobe.on('close', (code) => resolve(code === 0));
    ffprobe.on('error', () => resolve(false));
  });
}

/**
 * Validate input file exists
 */
export function validateInputFile(input: string): string {
  const inputPath = resolve(input);
  if (!fileExists(inputPath)) {
    throw new Error(`Input file not found: ${input}`);
  }
  return inputPath;
}

/**
 * Generate output filename if not provided
 */
export function generateOutputPath(
  input: string,
  suffix: string,
  extension?: string
): string {
  const inputPath = resolve(input);
  const ext = extension || inputPath.split('.').pop();
  const base = inputPath.substring(0, inputPath.lastIndexOf('.'));
  return `${base}_${suffix}.${ext}`;
}

/**
 * Format time for display (seconds to HH:MM:SS)
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse time string (HH:MM:SS) to seconds
 */
export function parseTimeToSeconds(time: string): number {
  const parts = time.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0];
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
