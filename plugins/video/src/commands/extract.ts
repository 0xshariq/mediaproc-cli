import type { Command } from 'commander';
import chalk from 'chalk';
import { mkdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import type { ExtractOptions } from '../types.js';
import {
  runFFmpeg,
  getVideoMetadata,
  checkFFmpeg,
  formatFileSize,
  formatDuration,
  parseTimeToSeconds,
} from '../utils/ffmpeg.js';
import { validatePaths, resolveOutputPaths } from '../utils/pathValidator.js';

export function extractCommand(videoCmd: Command): void {
  // Extract audio
  videoCmd
    .command('extract-audio <input>')
    .description('Extract audio from video')
    .option('-o, --output <path>', 'Output audio file')
    .option('--format <format>', 'Audio format: mp3, aac, wav, opus', 'mp3')
    .option('--bitrate <bitrate>', 'Audio bitrate (e.g., 192k)', '192k')
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: any) => {
      try {
        console.log(chalk.blue.bold('🎬 Audio Extraction\n'));

        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          throw new Error('ffmpeg is not installed or not in PATH');
        }

        const validation = validatePaths(input, options.output);
        if (validation.errors.length > 0) {
          throw new Error(validation.errors.join('\n'));
        }
        const inputPath = validation.inputFiles[0];

        console.log(chalk.dim('📊 Analyzing video...'));
        const metadata = await getVideoMetadata(inputPath);
        console.log(chalk.gray(`   Duration: ${formatDuration(metadata.duration)}`));
        console.log();

        const format = options.format || 'mp3';
        const outputMap = resolveOutputPaths(
          validation.inputFiles,
          validation.outputPath,
          { newExtension: `.${format}` }
        );
        const output = outputMap.get(inputPath)!;

        const codecMap: Record<string, string> = {
          mp3: 'libmp3lame',
          aac: 'aac',
          wav: 'pcm_s16le',
          opus: 'libopus',
        };

        const audioCodec = codecMap[format] || 'libmp3lame';
        const args = ['-i', inputPath, '-vn', '-c:a', audioCodec];

        if (format !== 'wav') {
          args.push('-b:a', options.bitrate || '192k');
        }

        args.push('-y', output);

        if (options.dryRun) {
          console.log(chalk.yellow('🏃 Dry run mode - no files will be created\n'));
          console.log(chalk.dim('Command:'));
          console.log(chalk.gray(`  ffmpeg ${args.join(' ')}\n`));
          console.log(chalk.green('✓ Dry run complete'));
          return;
        }

        console.log(chalk.dim('🎵 Extracting audio...'));
        if (options.verbose) {
          console.log(chalk.dim(`ffmpeg ${args.join(' ')}\n`));
        }

        await runFFmpeg(args, options.verbose);

        const outputStat = await stat(output);

        console.log();
        console.log(chalk.green.bold('✓ Extraction Complete!\n'));
        console.log(chalk.gray(`   Format: ${format}`));
        console.log(chalk.gray(`   Size: ${formatFileSize(outputStat.size)}`));
        console.log(chalk.dim(`\n   ${output}`));
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  // Extract frames
  videoCmd
    .command('extract-frames <input>')
    .description('Extract frames from video as images')
    .option('-o, --output <dir>', 'Output directory', './frames')
    .option('--start <time>', 'Start time (HH:MM:SS or seconds)')
    .option('--end <time>', 'End time (HH:MM:SS or seconds)')
    .option('--fps <fps>', 'Extract N frames per second', parseFloat, 1)
    .option('--format <format>', 'Image format: jpg, png', 'jpg')
    .option('--quality <quality>', 'JPEG quality (1-31, lower is better)', parseInt, 2)
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: ExtractOptions) => {
      try {
        console.log(chalk.blue.bold('🎬 Frame Extraction\n'));

        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          throw new Error('ffmpeg is not installed or not in PATH');
        }

        const validation = validatePaths(input, options.output);
        if (validation.errors.length > 0) {
          throw new Error(validation.errors.join('\n'));
        }
        const inputPath = validation.inputFiles[0];

        console.log(chalk.dim('📊 Analyzing video...'));
        const metadata = await getVideoMetadata(inputPath);
        console.log(chalk.gray(`   Duration: ${formatDuration(metadata.duration)}`));
        console.log(chalk.gray(`   Resolution: ${metadata.width}x${metadata.height}`));
        console.log(chalk.gray(`   FPS: ${metadata.fps.toFixed(2)}`));
        console.log();

        const outputDir = resolve(validation.outputPath || './frames');
        await mkdir(outputDir, { recursive: true });

        const format = options.format || 'jpg';
        const outputPattern = join(outputDir, `frame_%04d.${format}`);

        const args = ['-i', inputPath];

        // Add start time if specified
        if (options.start) {
          args.push('-ss', parseTimeToSeconds(options.start).toString());
        }

        // Add end time if specified
        if (options.end) {
          args.push('-to', parseTimeToSeconds(options.end).toString());
        }

        // Set frame rate
        args.push('-vf', `fps=${options.fps || 1}`);

        // Image quality for JPEG
        if (format === 'jpg') {
          args.push('-q:v', (options.quality || 2).toString());
        }

        args.push('-y', outputPattern);

        // Estimate number of frames
        const duration = options.end ? parseTimeToSeconds(options.end) - (options.start ? parseTimeToSeconds(options.start) : 0) : metadata.duration - (options.start ? parseTimeToSeconds(options.start) : 0);
        const estimatedFrames = Math.ceil(duration * (options.fps || 1));

        console.log(chalk.dim('Extraction settings:'));
        console.log(chalk.gray(`   FPS: ${options.fps || 1}`));
        console.log(chalk.gray(`   Format: ${format}`));
        console.log(chalk.gray(`   Estimated frames: ~${estimatedFrames}`));
        console.log(chalk.gray(`   Output: ${outputDir}`));
        console.log();

        if (options.dryRun) {
          console.log(chalk.yellow('🏃 Dry run mode - no files will be created\n'));
          console.log(chalk.dim('Command:'));
          console.log(chalk.gray(`  ffmpeg ${args.join(' ')}\n`));
          console.log(chalk.green('✓ Dry run complete'));
          return;
        }

        console.log(chalk.dim('📸 Extracting frames...'));
        if (options.verbose) {
          console.log(chalk.dim(`ffmpeg ${args.join(' ')}\n`));
        }

        await runFFmpeg(args, options.verbose);

        console.log();
        console.log(chalk.green.bold('✓ Extraction Complete!\n'));
        console.log(chalk.gray(`   Frames saved to: ${outputDir}`));
        console.log(chalk.gray(`   Pattern: frame_####.${format}`));
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  // Extract thumbnail
  videoCmd
    .command('extract-thumbnail <input>')
    .description('Extract a single thumbnail from video')
    .option('-o, --output <path>', 'Output image file')
    .option('--time <time>', 'Time to extract (HH:MM:SS or seconds)', '00:00:01')
    .option('--format <format>', 'Image format: jpg, png', 'jpg')
    .option('--width <width>', 'Thumbnail width in pixels', parseInt)
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: any) => {
      try {
        console.log(chalk.blue.bold('🎬 Thumbnail Extraction\n'));

        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          throw new Error('ffmpeg is not installed or not in PATH');
        }

        const validation = validatePaths(input, options.output);
        if (validation.errors.length > 0) {
          throw new Error(validation.errors.join('\n'));
        }
        const inputPath = validation.inputFiles[0];

        console.log(chalk.dim('📊 Analyzing video...'));
        const metadata = await getVideoMetadata(inputPath);
        console.log(chalk.gray(`   Resolution: ${metadata.width}x${metadata.height}`));
        console.log();

        const format = options.format || 'jpg';
        const output = options.output || inputPath.replace(/\.[^.]+$/, `_thumb.${format}`);

        const timeSeconds = parseTimeToSeconds(options.time || '1');

        const args = ['-i', inputPath, '-ss', timeSeconds.toString(), '-vframes', '1'];

        // Resize if width specified
        if (options.width) {
          args.push('-vf', `scale=${options.width}:-1`);
        }

        args.push('-y', output);

        if (options.dryRun) {
          console.log(chalk.yellow('🏃 Dry run mode - no files will be created\n'));
          console.log(chalk.dim('Command:'));
          console.log(chalk.gray(`  ffmpeg ${args.join(' ')}\n`));
          console.log(chalk.green('✓ Dry run complete'));
          return;
        }

        console.log(chalk.dim('📸 Extracting thumbnail...'));
        if (options.verbose) {
          console.log(chalk.dim(`ffmpeg ${args.join(' ')}\n`));
        }

        await runFFmpeg(args, options.verbose);

        const outputStat = await stat(output);

        console.log();
        console.log(chalk.green.bold('✓ Extraction Complete!\n'));
        console.log(chalk.gray(`   Time: ${formatDuration(timeSeconds)}`));
        console.log(chalk.gray(`   Size: ${formatFileSize(outputStat.size)}`));
        console.log(chalk.dim(`\n   ${output}`));
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
