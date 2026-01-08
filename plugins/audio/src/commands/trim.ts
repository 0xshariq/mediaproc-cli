import type { Command } from 'commander';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import {
  runFFmpeg,
  getAudioMetadata,
  checkFFmpeg,
  formatFileSize,
  formatDuration,
  parseTime,
} from '../utils/ffmpeg.js';
import { parseInputPaths, resolveOutputPaths, validateOutputPath } from '../utils/pathValidator.js';
import { createStandardHelp } from '../utils/helpFormatter.js';
import ora from 'ora';

export function trimCommand(audioCmd: Command): void {
  audioCmd
    .command('trim [input]')
    .description('Trim audio to specified time range')
    .option('-o, --output <path>', 'Output file or directory path')
    .option('-s, --start <time>', 'Start time (HH:MM:SS or seconds)', '00:00:00')
    .option('-e, --end <time>', 'End time (HH:MM:SS or seconds)')
    .option('-d, --duration <time>', 'Duration from start (HH:MM:SS or seconds)')
    .option('--fade-in <seconds>', 'Add fade-in effect (seconds)', parseFloat)
    .option('--fade-out <seconds>', 'Add fade-out effect (seconds)', parseFloat)
    .option('--format <format>', 'Output format (default: same as input)')
    .option('--fast', 'Fast mode (stream copy, no re-encoding)')
    .option('--dry-run', 'Preview command without executing')
    .option('-v, --verbose', 'Show detailed FFmpeg output')
    .option('-h, --help', 'Display help for trim command')
    .action(async (input: string | undefined, options: any) => {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'trim',
          emoji: '✂️',
          description: 'Cut audio files to specific time ranges. Supports precise timing with optional fade effects.',
          usage: [
            'trim <input> [options]',
            'trim audio.mp3 --start 00:00:30 --end 00:01:30',
            'trim audio.mp3 --duration 60'
          ],
          options: [
            { flag: '-o, --output <path>', description: 'Output file/directory path (default: <input>-trimmed.<ext>)' },
            { flag: '-s, --start <time>', description: 'Start time: HH:MM:SS format or seconds (e.g., 00:01:30 or 90)' },
            { flag: '-e, --end <time>', description: 'End time: HH:MM:SS format or seconds' },
            { flag: '-d, --duration <time>', description: 'Duration from start: HH:MM:SS or seconds (e.g., 00:01:00 or 60)' },
            { flag: '--fade-in <seconds>', description: 'Fade-in effect duration in seconds (0.1-10)' },
            { flag: '--fade-out <seconds>', description: 'Fade-out effect duration in seconds (0.1-10)' },
            { flag: '--format <format>', description: 'Output format: mp3, aac, wav, flac (default: same as input)' },
            { flag: '--fast', description: 'Fast mode using stream copy (no quality loss, frame-accurate)' },
            { flag: '--dry-run', description: 'Preview FFmpeg command without executing' },
            { flag: '-v, --verbose', description: 'Show detailed FFmpeg output and progress' }
          ],
          examples: [
            { command: 'trim audio.mp3 --start 00:01:00 --end 00:02:00', description: 'Trim from 1:00 to 2:00' },
            { command: 'trim audio.mp3 --duration 30', description: 'Extract first 30 seconds' },
            { command: 'trim audio.mp3 -s 30 -d 60', description: 'From 30s, extract 60s' },
            { command: 'trim audio.mp3 -s 60 -e 120 --fade-in 2 --fade-out 3', description: 'Trim with fade effects' },
            { command: 'trim audio.mp3 --start 30 --duration 60 --fast', description: 'Fast trim (stream copy)' },
            { command: 'trim folder/ -s 10 -d 30 -o output/', description: 'Batch trim all files' }
          ],
        });
        return;
      }

      try {
        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          console.error(chalk.red('\n✗ FFmpeg not found. Please install FFmpeg first.'));
          process.exit(1);
        }

        if (!options.end && !options.duration) {
          console.error(chalk.red('\n✗ Error: Either --end or --duration must be specified'));
          process.exit(1);
        }

        const inputPaths = parseInputPaths(input, {
          allowedExtensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.opus', '.m4a']
        });
        const suffix = options.format ? `-trimmed.${options.format}` : '-trimmed';
        const outputDir = validateOutputPath(options.output);
        const outputPathsMap = resolveOutputPaths(inputPaths, outputDir, { suffix });
        const outputPaths = Array.from(outputPathsMap.values());

        for (let i = 0; i < inputPaths.length; i++) {
          const inputFile = inputPaths[i];
          const outputFile = outputPaths[i];

          console.log(chalk.blue(`\n✂️  Trimming: ${inputFile}`));

          const metadata = await getAudioMetadata(inputFile);
          const inputStat = await stat(inputFile);

          const startTime = parseTime(options.start);
          const endTime = options.end ? parseTime(options.end) : startTime + parseTime(options.duration);
          const duration = endTime - startTime;

          console.log(chalk.dim(`Duration: ${formatDuration(metadata.duration)} • ` +
            `Sample Rate: ${metadata.sampleRate} Hz`));
          console.log(chalk.dim(`Trim: ${formatDuration(startTime)} → ${formatDuration(endTime)} ` +
            `(${formatDuration(duration)})`));

          const args = ['-i', inputFile, '-y'];

          // Start time
          args.push('-ss', startTime.toString());

          // Duration or end time
          if (options.duration) {
            args.push('-t', parseTime(options.duration).toString());
          } else if (options.end) {
            args.push('-to', endTime.toString());
          }

          // Fast mode (stream copy)
          if (options.fast && !options.fadeIn && !options.fadeOut) {
            args.push('-c', 'copy');
          } else {
            // Build audio filters
            const filters: string[] = [];

            if (options.fadeIn) {
              filters.push(`afade=t=in:st=0:d=${options.fadeIn}`);
            }

            if (options.fadeOut) {
              const fadeStart = duration - options.fadeOut;
              filters.push(`afade=t=out:st=${fadeStart}:d=${options.fadeOut}`);
            }

            if (filters.length > 0) {
              args.push('-af', filters.join(','));
            }
          }

          args.push(outputFile);

          if (options.dryRun) {
            console.log(chalk.yellow('\n[DRY RUN] Would execute:'));
            console.log(chalk.dim(`ffmpeg ${args.join(' ')}`));
            continue;
          }

          const spinner = ora('Trimming...').start();
          
          try {
            await runFFmpeg(args, options.verbose);
            const outputStat = await stat(outputFile);
            
            spinner.succeed(chalk.green('Trim complete'));
            console.log(chalk.green(`✓ Output: ${outputFile}`));
            console.log(chalk.dim(`Size: ${formatFileSize(inputStat.size)} → ${formatFileSize(outputStat.size)}`));
          } catch (error) {
            spinner.fail(chalk.red('Trim failed'));
            throw error;
          }
        }

        if (inputPaths.length > 1) {
          console.log(chalk.green(`\n✓ Trimmed ${inputPaths.length} files successfully`));
        }

      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
