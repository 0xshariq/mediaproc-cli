import type { Command } from 'commander';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import type { VideoOptions } from '../types.js';
import {
  runFFmpeg,
  getVideoMetadata,
  checkFFmpeg,
  formatFileSize,
  formatDuration,
} from '../utils/ffmpeg.js';
import { validatePaths, resolveOutputPaths } from '../utils/pathValidator.js';

export function resizeCommand(videoCmd: Command): void {
  videoCmd
    .command('resize <input>')
    .description('Resize video resolution')
    .option('-o, --output <path>', 'Output file path')
    .option('-w, --width <width>', 'Width in pixels', parseInt)
    .option('-h, --height <height>', 'Height in pixels', parseInt)
    .option('--scale <scale>', 'Scale preset: 480p, 720p, 1080p, 1440p, 4k')
    .option('--aspect', 'Maintain aspect ratio (default: true)', true)
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: VideoOptions) => {
      try {
        console.log(chalk.blue.bold('🎬 Video Resizing\n'));

        // Check ffmpeg
        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          throw new Error('ffmpeg is not installed or not in PATH');
        }

        // Validate input
        const validation = validatePaths(input, options.output);
        if (validation.errors.length > 0) {
          throw new Error(validation.errors.join('\n'));
        }
        const inputPath = validation.inputFiles[0];

        // Get input metadata
        console.log(chalk.dim('📊 Analyzing video...'));
        const metadata = await getVideoMetadata(inputPath);
        const inputStat = await stat(inputPath);

        console.log(chalk.gray(`   Current resolution: ${metadata.width}x${metadata.height}`));
        console.log(chalk.gray(`   Duration: ${formatDuration(metadata.duration)}`));
        console.log(chalk.gray(`   Size: ${formatFileSize(inputStat.size)}`));
        console.log();

        // Determine target resolution
        let targetWidth: number;
        let targetHeight: number;

        if (options.scale) {
          // Use preset scale
          const scalePresets: Record<string, { width: number; height: number }> = {
            '480p': { width: 854, height: 480 },
            '720p': { width: 1280, height: 720 },
            '1080p': { width: 1920, height: 1080 },
            '1440p': { width: 2560, height: 1440 },
            '4k': { width: 3840, height: 2160 },
          };

          const preset = scalePresets[options.scale];
          if (!preset) {
            throw new Error(`Invalid scale preset: ${options.scale}. Use: 480p, 720p, 1080p, 1440p, or 4k`);
          }

          targetWidth = preset.width;
          targetHeight = preset.height;
        } else if (options.width && options.height) {
          // Use custom dimensions
          targetWidth = options.width;
          targetHeight = options.height;
        } else if (options.width) {
          // Calculate height maintaining aspect ratio
          targetWidth = options.width;
          targetHeight = Math.round((options.width / metadata.width) * metadata.height);
        } else if (options.height) {
          // Calculate width maintaining aspect ratio
          targetHeight = options.height;
          targetWidth = Math.round((options.height / metadata.height) * metadata.width);
        } else {
          throw new Error('Specify either --scale, --width, --height, or both --width and --height');
        }

        // Ensure even dimensions (required for some codecs)
        targetWidth = Math.round(targetWidth / 2) * 2;
        targetHeight = Math.round(targetHeight / 2) * 2;

        // Generate output path
        const outputMap = resolveOutputPaths(
          validation.inputFiles,
          validation.outputPath,
          { suffix: `-${targetWidth}x${targetHeight}`, newExtension: '.mp4' }
        );
        const output = outputMap.get(inputPath)!;

        // Build ffmpeg scale filter
        const scaleFilter = options.aspect ? `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2` : `scale=${targetWidth}:${targetHeight}`;

        // Build ffmpeg arguments
        const args = ['-i', inputPath, '-vf', scaleFilter, '-c:v', 'libx264', '-crf', '23', '-preset', 'medium', '-c:a', 'copy', '-y', output];

        console.log(chalk.dim('Resize settings:'));
        console.log(chalk.gray(`   From: ${metadata.width}x${metadata.height}`));
        console.log(chalk.gray(`   To: ${targetWidth}x${targetHeight}`));
        console.log(chalk.gray(`   Maintain aspect: ${options.aspect ? 'Yes' : 'No'}`));
        console.log();

        if (options.dryRun) {
          console.log(chalk.yellow('🏃 Dry run mode - no files will be created\n'));
          console.log(chalk.dim('Command:'));
          console.log(chalk.gray(`  ffmpeg ${args.join(' ')}\n`));
          console.log(chalk.green('✓ Dry run complete'));
          return;
        }

        // Run resize
        console.log(chalk.dim('📐 Resizing video...'));
        if (options.verbose) {
          console.log(chalk.dim(`ffmpeg ${args.join(' ')}\n`));
        }

        await runFFmpeg(args, options.verbose);

        // Get output file size
        const outputStat = await stat(output);

        console.log();
        console.log(chalk.green.bold('✓ Resizing Complete!\n'));
        console.log(chalk.gray(`   Resolution: ${metadata.width}x${metadata.height} → ${targetWidth}x${targetHeight}`));
        console.log(chalk.gray(`   Size: ${formatFileSize(inputStat.size)} → ${formatFileSize(outputStat.size)}`));
        console.log(chalk.dim(`\n   ${output}`));
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
