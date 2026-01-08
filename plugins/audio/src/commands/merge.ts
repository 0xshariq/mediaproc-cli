import type { Command } from 'commander';
import chalk from 'chalk';
import { stat, writeFile, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import {
  runFFmpeg,
  getAudioMetadata,
  checkFFmpeg,
  formatFileSize,
  formatDuration,
} from '../utils/ffmpeg.js';
import { parseInputPaths } from '../utils/pathValidator.js';
import { createStandardHelp } from '../utils/helpFormatter.js';
import ora from 'ora';

export function mergeCommand(audioCmd: Command): void {
  audioCmd
    .command('merge [inputs...]')
    .description('Merge multiple audio files into one')
    .option('-o, --output <path>', 'Output file path', 'merged.mp3')
    .option('--format <format>', 'Output format: mp3, aac, wav, flac, ogg', 'mp3')
    .option('--bitrate <bitrate>', 'Output bitrate (e.g., 192k, 320k)', '192k')
    .option('--crossfade <seconds>', 'Crossfade duration between files (seconds)', parseFloat)
    .option('--normalize', 'Normalize audio levels before merging')
    .option('--dry-run', 'Preview command without executing')
    .option('-v, --verbose', 'Show detailed FFmpeg output')
    .option('-h, --help', 'Display help for merge command')
    .action(async (inputs: string[], options: any) => {
      if (options.help || !inputs || inputs.length === 0) {
        createStandardHelp({
          commandName: 'merge',
          emoji: '🔗',
          description: 'Concatenate multiple audio files into a single output file. Supports crossfade transitions and automatic audio normalization.',
          usage: [
            'merge <input1> <input2> [input3...] [options]',
            'merge audio1.mp3 audio2.mp3',
            'merge part*.mp3 -o complete.mp3'
          ],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: merged.mp3)' },
            { flag: '--format <format>', description: 'Output format: mp3, aac, wav, flac, ogg (default: mp3)' },
            { flag: '--bitrate <bitrate>', description: 'Output bitrate: 128k, 192k, 256k, 320k (default: 192k)' },
            { flag: '--crossfade <seconds>', description: 'Crossfade duration between files in seconds (0-10)' },
            { flag: '--normalize', description: 'Normalize audio levels before merging for consistent volume' },
            { flag: '--dry-run', description: 'Preview FFmpeg command without executing' },
            { flag: '-v, --verbose', description: 'Show detailed FFmpeg output and progress' }
          ],
          examples: [
            { command: 'merge audio1.mp3 audio2.mp3 audio3.mp3', description: 'Merge three files' },
            { command: 'merge part*.mp3 -o complete.mp3', description: 'Merge all matching files' },
            { command: 'merge a.mp3 b.mp3 --crossfade 2', description: 'Merge with 2-second crossfade' },
            { command: 'merge *.wav -o output.flac --format flac', description: 'Merge WAVs to FLAC' },
            { command: 'merge a.mp3 b.mp3 --normalize', description: 'Normalize before merging' }
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

        if (inputs.length < 2) {
          console.error(chalk.red('\n✗ Error: At least 2 audio files required for merging'));
          process.exit(1);
        }

        console.log(chalk.blue(`\n🔗 Merging ${inputs.length} audio files...`));

        // Validate all input files
        const validatedInputs: string[] = [];
        for (const input of inputs) {
          try {
            const paths = parseInputPaths(input, {
              allowedExtensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.opus', '.m4a']
            });
            validatedInputs.push(...paths);
          } catch (err) {
            console.warn(chalk.yellow(`⚠ Skipping invalid input: ${input}`));
          }
        }

        if (validatedInputs.length < 2) {
          console.error(chalk.red('\n✗ Error: Not enough valid audio files found'));
          process.exit(1);
        }

        // Show input files
        let totalDuration = 0;
        for (const inputFile of validatedInputs) {
          const metadata = await getAudioMetadata(inputFile);
          console.log(chalk.dim(`  ${inputFile} (${formatDuration(metadata.duration)})`));
          totalDuration += metadata.duration;
        }

        console.log(chalk.dim(`\nTotal duration: ${formatDuration(totalDuration)}`));

        // Create concat file list
        const concatFile = join(dirname(validatedInputs[0]), '.concat-list.txt');
        const concatContent = validatedInputs.map(f => `file '${f}'`).join('\n');
        await writeFile(concatFile, concatContent);

        const args = ['-f', 'concat', '-safe', '0', '-i', concatFile, '-y'];

        // Add crossfade if specified
        if (options.crossfade) {
          // Build complex filter for crossfade
          const filterParts: string[] = [];
          for (let i = 0; i < validatedInputs.length - 1; i++) {
            if (i === 0) {
              filterParts.push(`[0:a][1:a]acrossfade=d=${options.crossfade}[a01]`);
            } else {
              filterParts.push(`[a0${i}][${i + 1}:a]acrossfade=d=${options.crossfade}[a0${i + 1}]`);
            }
          }
          args.push('-filter_complex', filterParts.join(';'));
          args.push('-map', `[a0${validatedInputs.length - 1}]`);
        }

        // Normalization
        if (options.normalize && !options.crossfade) {
          args.push('-af', 'loudnorm=I=-16:TP=-1.5:LRA=11');
        }

        // Output bitrate
        args.push('-b:a', options.bitrate);

        args.push(options.output);

        if (options.dryRun) {
          console.log(chalk.yellow('\n[DRY RUN] Would execute:'));
          console.log(chalk.dim(`ffmpeg ${args.join(' ')}`));
          await unlink(concatFile);
          return;
        }

        const spinner = ora('Merging audio files...').start();
        
        try {
          await runFFmpeg(args, options.verbose);
          const outputStat = await stat(options.output);
          
          // Clean up concat file
          await unlink(concatFile);
          
          spinner.succeed(chalk.green('Merge complete'));
          console.log(chalk.green(`✓ Output: ${options.output}`));
          console.log(chalk.dim(`Duration: ${formatDuration(totalDuration)} • Size: ${formatFileSize(outputStat.size)}`));
        } catch (error) {
          await unlink(concatFile).catch(() => {});
          spinner.fail(chalk.red('Merge failed'));
          throw error;
        }

      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
