import type { Command } from 'commander';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import {
  runFFmpeg,
  getVideoMetadata,
  checkFFmpeg,
  formatFileSize,
  formatDuration,
} from '../utils/ffmpeg.js';
import { parseInputPaths, resolveOutputPaths } from '../utils/pathValidator.js';
import { logFFmpegOutput } from '../utils/ffmpegLogger.js';
import ora from 'ora';
import { createStandardHelp } from '../utils/helpFormatter.js';

// Format configurations
const formatConfig: Record<string, { codec: string; audioCodec: string; ext: string }> = {
    mp4: { codec: 'libx264', audioCodec: 'aac', ext: 'mp4' },
    mkv: { codec: 'libx264', audioCodec: 'aac', ext: 'mkv' },
    webm: { codec: 'libvpx-vp9', audioCodec: 'libopus', ext: 'webm' },
    avi: { codec: 'libx264', audioCodec: 'mp3', ext: 'avi' },
    mov: { codec: 'libx264', audioCodec: 'aac', ext: 'mov' },
    flv: { codec: 'libx264', audioCodec: 'aac', ext: 'flv' },
    '3gp': { codec: 'libx264', audioCodec: 'aac', ext: '3gp' },
    m4v: { codec: 'libx264', audioCodec: 'aac', ext: 'm4v' },
};

export function convertCommand(videoCmd: Command): void {
    videoCmd
        .command('convert [input]')
        .description('Convert videos between different formats with smart defaults')
        .option('-o, --output <path>', 'Output file or directory path')
        .option('-f, --format <format>', 'Target format: mp4, mkv, webm, avi, mov, flv, 3gp, m4v (default: mp4)', 'mp4')
        .option('-q, --quality <crf>', 'Quality (CRF): 0-51, lower is better (default: 23)', parseInt, 23)
        .option('--codec <codec>', 'Override video codec: h264, h265, vp9, av1')
        .option('--audio-codec <codec>', 'Override audio codec: aac, mp3, opus')
        .option('--preset <preset>', 'Encoding preset: ultrafast, fast, medium, slow, veryslow (default: medium)', 'medium')
        .option('-b, --bitrate <bitrate>', 'Target video bitrate (e.g., 5M, 2000k)')
        .option('--audio-bitrate <bitrate>', 'Audio bitrate (e.g., 128k, 192k)', '192k')
        .option('--no-audio', 'Remove audio from output')
        .option('--threads <n>', 'Number of encoding threads (default: auto)', parseInt)
        .option('--hw-accel', 'Enable hardware acceleration')
        .option('--fast', 'Fast conversion (remux when possible, no re-encode)')
        .option('--dry-run', 'Preview command without executing')
        .option('-v, --verbose', 'Show detailed FFmpeg output')
        .option('-h, --help', 'Display help for convert command')
        .action(async (input: string | undefined, options: any) => {
            // Show help if requested
            if (options.help || !input) {
                createStandardHelp({
                    commandName: 'convert',
                    emoji: '🔄',
                    description: 'Convert videos between different formats with smart codec defaults. Supports remuxing (fast, lossless) when only container changes, or re-encoding when codec conversion needed. Handles single files or entire directories.',
                    usage: [
                        'convert <input> [options]',
                        'convert video.avi -f mp4',
                        'convert videos/ -f webm -o output/'
                    ],
                    options: [
                        { flag: '-f, --format <format>', description: 'Target format: mp4, mkv, webm, avi, mov, flv, 3gp, m4v (default: mp4)' },
                        { flag: '-o, --output <path>', description: 'Output file/directory (default: <input>-converted.<ext>)' },
                        { flag: '-q, --quality <crf>', description: 'CRF quality 0-51, lower=better (default: 23)' },
                        { flag: '--codec <codec>', description: 'Override video codec: h264, h265, vp9, av1' },
                        { flag: '--audio-codec <codec>', description: 'Override audio codec: aac, mp3, opus' },
                        { flag: '--preset <preset>', description: 'Encoding: ultrafast, fast, medium, slow, veryslow' },
                        { flag: '-b, --bitrate <bitrate>', description: 'Target video bitrate (e.g., 5M for 5 Mbps)' },
                        { flag: '--audio-bitrate <bitrate>', description: 'Audio bitrate (default: 192k)' },
                        { flag: '--no-audio', description: 'Remove audio track from output' },
                        { flag: '--threads <n>', description: 'Number of encoding threads (default: auto)' },
                        { flag: '--hw-accel', description: 'Enable hardware acceleration (GPU)' },
                        { flag: '--fast', description: 'Fast mode: remux when possible (no re-encode)' },
                        { flag: '--dry-run', description: 'Preview FFmpeg command without executing' },
                        { flag: '-v, --verbose', description: 'Show detailed FFmpeg output' }
                    ],
                    examples: [
                        { command: 'convert video.avi -f mp4', description: 'Convert AVI to MP4 (H.264 + AAC)' },
                        { command: 'convert video.mp4 -f webm', description: 'Convert to WebM (VP9 + Opus)' },
                        { command: 'convert video.mov -f mp4 --fast', description: 'Fast remux MOV to MP4 (if codecs compatible)' },
                        { command: 'convert videos/ -f mkv -o output/', description: 'Convert all videos in folder to MKV' },
                        { command: 'convert video.mp4 -f webm -q 30', description: 'Convert with lower quality (smaller file)' },
                        { command: 'convert video.avi -f mp4 --codec h265 --preset slow', description: 'Convert to MP4 with H.265 codec (better compression)' }
                    ],
                    notes: [
                        'Smart defaults: Each format has optimal codec defaults (MP4→H.264+AAC, WebM→VP9+Opus)',
                        'Fast mode: Uses remuxing when only container changes (instant, lossless)',
                        'Directory support: Automatically processes all video files in folder',
                        'Format detection: Automatically detects if re-encoding needed or remux possible'
                    ]
                });
                return;
            }

            try {
                // Check ffmpeg
                const ffmpegAvailable = await checkFFmpeg();
                if (!ffmpegAvailable) {
                    console.log(chalk.red('❌ Error: ffmpeg is not installed or not in PATH'));
                    console.log(chalk.yellow('\nInstall ffmpeg:'));
                    console.log(chalk.dim('  macOS:   brew install ffmpeg'));
                    console.log(chalk.dim('  Ubuntu:  sudo apt install ffmpeg'));
                    console.log(chalk.dim('  Windows: Download from https://ffmpeg.org/download.html'));
                    process.exit(1);
                }

                // Validate format
                const format = options.format.toLowerCase();
                if (!formatConfig[format]) {
                    console.log(chalk.red(`❌ Unsupported format: ${format}`));
                    console.log(chalk.yellow('Supported formats: mp4, mkv, webm, avi, mov, flv, 3gp, m4v'));
                    process.exit(1);
                }

                // Parse input paths
                const inputPaths = await parseInputPaths(input, ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg', '.3gp']);

                if (inputPaths.length === 0) {
                    console.log(chalk.red('❌ No valid video files found'));
                    process.exit(1);
                }

                // Resolve output paths
        const outputPathsMap = resolveOutputPaths(
            inputPaths,
            options.output,
            {
                suffix: '',
                newExtension: formatConfig[format].ext
            }
        );

        const outputPaths = Array.from(outputPathsMap.values());
                // Process each file
                for (let i = 0; i < inputPaths.length; i++) {
                    const inputFile = inputPaths[i];
                    const outputFile = outputPaths[i];

                    console.log(chalk.blue.bold(`\n🔄 Converting Video ${inputPaths.length > 1 ? `(${i + 1}/${inputPaths.length})` : ''}`));
                    console.log(chalk.dim(`Input:  ${inputFile}`));
                    console.log(chalk.dim(`Output: ${outputFile}`));

                    // Get metadata
                    const metadata = await getVideoMetadata(inputFile);
                    const inputStat = await stat(inputFile);

                    console.log(chalk.gray(`\n📊 Input Details:`));
                    console.log(chalk.gray(`   Format: ${metadata.format}`));
                    console.log(chalk.gray(`   Duration: ${formatDuration(metadata.duration)}`));
                    console.log(chalk.gray(`   Resolution: ${metadata.width}x${metadata.height}`));
                    console.log(chalk.gray(`   Codec: ${metadata.codec}`));
                    console.log(chalk.gray(`   Size: ${formatFileSize(inputStat.size)}`));

                    // Get format config
                    const config = formatConfig[format];
                    const videoCodec = options.codec || config.codec;
                    const audioCodec = options.audioCodec || config.audioCodec;

                    // Build FFmpeg command
                    const args: string[] = ['-i', inputFile];

                    // Check if we can do fast remux (no re-encoding)
                    const canRemux = options.fast &&
                        metadata.codec === videoCodec &&
                        metadata.format !== format;

                    if (canRemux) {
                        console.log(chalk.green('\n⚡ Fast mode: Remuxing (no re-encoding)'));
                        args.push('-c', 'copy');
                    } else {
                        console.log(chalk.yellow(`\n🎬 Converting to ${format.toUpperCase()} (${videoCodec} + ${audioCodec})...`));

                        // Map codec names to FFmpeg encoder names
                        const codecMap: Record<string, string> = {
                            'h264': 'libx264',
                            'h265': 'libx265',
                            'hevc': 'libx265',
                            'vp9': 'libvpx-vp9',
                            'vp8': 'libvpx',
                            'av1': 'libaom-av1',
                        };

                        const audioCodecMap: Record<string, string> = {
                            'aac': 'aac',
                            'mp3': 'libmp3lame',
                            'opus': 'libopus',
                            'vorbis': 'libvorbis',
                        };

                        // Video encoding
                        const encoderName = codecMap[videoCodec.toLowerCase()] || videoCodec;
                        args.push('-c:v', encoderName);

                        // Hardware acceleration
                        if (options.hwAccel) {
                            args.unshift('-hwaccel', 'auto');
                        }

                        // Quality/Bitrate
                        if (options.bitrate) {
                            args.push('-b:v', options.bitrate);
                        } else {
                            args.push('-crf', String(options.quality));
                        }

                        // Preset
                        if (options.preset && (encoderName === 'libx264' || encoderName === 'libx265')) {
                            args.push('-preset', options.preset);
                        }

                        // Threads
                        if (options.threads) {
                            args.push('-threads', String(options.threads));
                        }

                        // Audio encoding
                        if (options.noAudio) {
                            args.push('-an');
                        } else {
                            const audioEncoderName = audioCodecMap[audioCodec.toLowerCase()] || audioCodec;
                            args.push('-c:a', audioEncoderName);
                            args.push('-b:a', options.audioBitrate);
                        }
                    }

                    // Output file
                    args.push('-y', outputFile);

                    // Dry run
                    if (options.dryRun) {
                        console.log(chalk.dim('\n[DRY RUN] Would execute:'));
                        console.log(chalk.cyan(`ffmpeg ${args.join(' ')}`));
                        console.log();
                        continue;
                    }

                    // Execute conversion
                    const spinner = ora('Converting...').start();

                    try {
                        await runFFmpeg(args, options.verbose, (line) => {
                            if (options.verbose) {
                                logFFmpegOutput(line);
                            }
                        });

                        spinner.succeed('Conversion complete');

                        // Output stats
                        const outputStat = await stat(outputFile);
                        const savedSize = inputStat.size - outputStat.size;
                        const savedPercent = ((savedSize / inputStat.size) * 100).toFixed(1);

                        console.log(chalk.green(`\n✓ Converted to ${format.toUpperCase()}`));
                        console.log(chalk.gray(`   Output: ${outputFile}`));
                        console.log(chalk.gray(`   Size: ${formatFileSize(outputStat.size)}`));

                        if (savedSize > 0) {
                            console.log(chalk.green(`   Saved: ${formatFileSize(savedSize)} (${savedPercent}%)`));
                        } else if (savedSize < 0) {
                            console.log(chalk.yellow(`   Size increased: ${formatFileSize(Math.abs(savedSize))} (${Math.abs(parseFloat(savedPercent))}%)`));
                        }

                    } catch (error) {
                        spinner.fail('Conversion failed');
                        throw error;
                    }
                }

                if (inputPaths.length > 1) {
                    console.log(chalk.green.bold(`\n✓ Converted ${inputPaths.length} videos successfully!`));
                }

            } catch (error) {
                console.log(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
                process.exit(1);
            }
        });
}
