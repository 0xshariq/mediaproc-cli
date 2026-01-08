import type { Command } from 'commander';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import {
  runFFmpeg,
  getAudioMetadata,
  checkFFmpeg,
  formatFileSize,
  formatDuration,
} from '../utils/ffmpeg.js';
import { parseInputPaths, resolveOutputPaths, validateOutputPath } from '../utils/pathValidator.js';
import { createStandardHelp } from '../utils/helpFormatter.js';
import ora from 'ora';

export function extractCommand(audioCmd: Command): void {
  audioCmd
    .command('extract [input]')
    .description('Extract audio from video file')
    .option('-o, --output <path>', 'Output file or directory path')
    .option('-f, --format <format>', 'Output format: mp3, aac, wav, flac, opus, ogg', 'mp3')
    .option('-b, --bitrate <bitrate>', 'Audio bitrate (e.g., 128k, 192k, 320k)', '192k')
    .option('-q, --quality <quality>', 'Quality preset: low, medium, high, lossless', 'medium')
    .option('--sample-rate <rate>', 'Sample rate in Hz (e.g., 44100, 48000)', parseInt)
    .option('--channels <channels>', 'Number of channels: 1 (mono), 2 (stereo)', parseInt)
    .option('--dry-run', 'Preview command without executing')
    .option('-v, --verbose', 'Show detailed FFmpeg output')
    .option('-h, --help', 'Display help for extract command')
    .action(async (input: string | undefined, options: any) => {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'extract',
          emoji: '🎵',
          description: 'Extract audio track from video files. Supports multiple output formats and quality presets.',
          usage: [
            'extract <input> [options]',
            'extract video.mp4 -f mp3',
            'extract videos/ -f aac -o audio/'
          ],
          options: [
            { flag: '-o, --output <path>', description: 'Output file/directory path (default: <input>-audio.<ext>)' },
            { flag: '-f, --format <format>', description: 'Output format: mp3, aac, wav, flac, opus, ogg (default: mp3)' },
            { flag: '-b, --bitrate <bitrate>', description: 'Audio bitrate: 128k, 192k, 256k, 320k (default: 192k)' },
            { flag: '-q, --quality <quality>', description: 'Quality preset: low (96k), medium (192k), high (320k), lossless' },
            { flag: '--sample-rate <rate>', description: 'Sample rate: 44100 (CD), 48000 (studio), 96000 (Hi-Res)' },
            { flag: '--channels <channels>', description: 'Audio channels: 1 (mono), 2 (stereo)' },
            { flag: '--dry-run', description: 'Preview FFmpeg command without executing' },
            { flag: '-v, --verbose', description: 'Show detailed FFmpeg output and progress' }
          ],
          examples: [
            { command: 'extract video.mp4', description: 'Extract audio as MP3' },
            { command: 'extract video.mp4 -f aac -b 256k', description: 'Extract as high-quality AAC' },
            { command: 'extract video.mkv -f flac -q lossless', description: 'Extract as lossless FLAC' },
            { command: 'extract video.mp4 -f mp3 --channels 1', description: 'Extract as mono MP3' },
            { command: 'extract videos/ -f mp3 -o audio/', description: 'Batch extract from folder' }
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

        // Accept video formats
        const inputPaths = parseInputPaths(input, {
          allowedExtensions: ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v']
        });
        const outputDir = validateOutputPath(options.output);
        const outputPathsMap = resolveOutputPaths(inputPaths, outputDir, {
          suffix: '-audio',
          newExtension: `.${options.format}`
        });
        const outputPaths = Array.from(outputPathsMap.values());

        // Quality presets
        const qualityMap: Record<string, string> = {
          low: '96k',
          medium: '192k',
          high: '320k',
          lossless: 'lossless'
        };

        const targetBitrate = qualityMap[options.quality] || options.bitrate;

        for (let i = 0; i < inputPaths.length; i++) {
          const inputFile = inputPaths[i];
          const outputFile = outputPaths[i];

          console.log(chalk.blue(`\n🎵 Extracting audio from: ${inputFile}`));

          try {
            const metadata = await getAudioMetadata(inputFile);
            console.log(chalk.dim(`Duration: ${formatDuration(metadata.duration)} • ` +
              `Codec: ${metadata.codec} • ` +
              `Sample Rate: ${metadata.sampleRate} Hz`));
          } catch (err) {
            console.log(chalk.dim('Analyzing video file...'));
          }

          // Build FFmpeg args
          const args = ['-i', inputFile, '-y', '-vn'];  // -vn = no video

          // Codec selection
          const codecMap: Record<string, string> = {
            mp3: 'libmp3lame',
            aac: 'aac',
            flac: 'flac',
            wav: 'pcm_s16le',
            ogg: 'libvorbis',
            opus: 'libopus',
          };

          const codec = codecMap[options.format];
          if (codec) {
            args.push('-c:a', codec);
          }

          // Bitrate (skip for lossless)
          if (targetBitrate !== 'lossless') {
            args.push('-b:a', targetBitrate);
          }

          // Sample rate
          if (options.sampleRate) {
            args.push('-ar', options.sampleRate.toString());
          }

          // Channels
          if (options.channels) {
            args.push('-ac', options.channels.toString());
          }

          args.push(outputFile);

          if (options.dryRun) {
            console.log(chalk.yellow('\n[DRY RUN] Would execute:'));
            console.log(chalk.dim(`ffmpeg ${args.join(' ')}`));
            continue;
          }

          const spinner = ora('Extracting audio...').start();
          
          try {
            await runFFmpeg(args, options.verbose);
            const outputStat = await stat(outputFile);
            
            spinner.succeed(chalk.green('Extraction complete'));
            console.log(chalk.green(`✓ Output: ${outputFile}`));
            console.log(chalk.dim(`Format: ${options.format.toUpperCase()} • ` +
              `Bitrate: ${targetBitrate} • ` +
              `Size: ${formatFileSize(outputStat.size)}`));
          } catch (error) {
            spinner.fail(chalk.red('Extraction failed'));
            throw error;
          }
        }

        if (inputPaths.length > 1) {
          console.log(chalk.green(`\n✓ Extracted audio from ${inputPaths.length} videos successfully`));
        }

      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
