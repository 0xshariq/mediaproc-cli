import type { Command } from 'commander';
import chalk from 'chalk';
import { writeFile, unlink, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  runFFmpeg,
  getVideoMetadata,
  checkFFmpeg,
  formatFileSize,
  formatDuration,
} from '../utils/ffmpeg.js';
import { validatePaths, resolveOutputPaths, fileExists } from '../utils/pathValidator.js';

export function mergeCommand(videoCmd: Command): void {
  videoCmd
    .command('merge <inputs...>')
    .description('Merge multiple videos into one')
    .option('-o, --output <path>', 'Output file path', 'merged.mp4')
    .option('--re-encode', 'Re-encode videos (slower but handles different formats)')
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (inputs: string[], options: any) => {
      const tempListFile = join(tmpdir(), `mediaproc-merge-${Date.now()}.txt`);

      try {
        console.log(chalk.blue.bold('🎬 Video Merging\n'));

        if (inputs.length < 2) {
          throw new Error('At least 2 videos are required for merging');
        }

        // Check ffmpeg
        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          throw new Error('ffmpeg is not installed or not in PATH');
        }

        // Validate all inputs
        console.log(chalk.dim('📊 Analyzing videos...\n'));
        const inputPaths: string[] = [];
        const metadataList: any[] = [];
        let totalDuration = 0;
        let totalSize = 0;

        for (let i = 0; i < inputs.length; i++) {
          const validation = validatePaths(inputs[i], undefined);
          if (validation.errors.length > 0) {
            throw new Error(`Input ${i + 1}: ${validation.errors.join(', ')}`);
          }
          const inputPath = validation.inputFiles[0];
          
          // Check if input file exists
          if (!(await fileExists(inputPath))) {
            throw new Error(`Input ${i + 1} does not exist: ${inputPath}`);
          }
          
          inputPaths.push(inputPath);

          const metadata = await getVideoMetadata(inputPath);
          const fileStat = await stat(inputPath);

          metadataList.push(metadata);
          totalDuration += metadata.duration;
          totalSize += fileStat.size;

          console.log(chalk.gray(`   ${i + 1}. ${inputs[i]}`));
          console.log(chalk.dim(`      ${metadata.width}x${metadata.height}, ${formatDuration(metadata.duration)}, ${metadata.codec}`));
        }

        console.log();
        console.log(chalk.gray(`   Total duration: ${formatDuration(totalDuration)}`));
        console.log(chalk.gray(`   Total size: ${formatFileSize(totalSize)}`));
        console.log();

        // Check if all videos have same resolution/codec
        const firstMeta = metadataList[0];
        const needsReEncode = options.reEncode || metadataList.some((m) => m.width !== firstMeta.width || m.height !== firstMeta.height || m.codec !== firstMeta.codec);

        if (needsReEncode && !options.reEncode) {
          console.log(chalk.yellow('⚠️  Videos have different formats/resolutions'));
          console.log(chalk.yellow('   Will re-encode for compatibility (slower)'));
          console.log(chalk.dim('   Use --re-encode to skip this warning\n'));
        }

        // Validate and resolve output path
        const outputValidation = validatePaths(inputPaths[0], options.output, {
          newExtension: '.mp4'
        });
        if (outputValidation.errors.length > 0) {
          throw new Error(`Output path invalid: ${outputValidation.errors.join(', ')}`);
        }
        
        const outputMap = resolveOutputPaths([inputPaths[0]], options.output, {
          newExtension: '.mp4'
        });
        const output = outputMap.get(inputPaths[0])!;
        
        // Check if output file already exists
        if (await fileExists(output) && !options.dryRun) {
          console.log(chalk.yellow(`⚠️  Output file exists and will be overwritten: ${output}\n`));
        }

        let args: string[];

        if (needsReEncode) {
          // Re-encode mode: use filter_complex
          const filterInputs = inputPaths.map((_, i) => `[${i}:v][${i}:a]`).join('');
          const filterComplex = `${filterInputs}concat=n=${inputPaths.length}:v=1:a=1[outv][outa]`;

          args = [];
          inputPaths.forEach((path) => {
            args.push('-i', path);
          });
          args.push('-filter_complex', filterComplex, '-map', '[outv]', '-map', '[outa]', '-c:v', 'libx264', '-crf', '23', '-c:a', 'aac', '-y', output);
        } else {
          // Fast concat mode: use concat demuxer (no re-encode)
          // Create concat list file
          const listContent = inputPaths.map((path) => `file '${path.replace(/'/g, "'\\''")}'`).join('\n');
          await writeFile(tempListFile, listContent);

          args = ['-f', 'concat', '-safe', '0', '-i', tempListFile, '-c', 'copy', '-y', output];
        }

        if (options.dryRun) {
          console.log(chalk.yellow('🏃 Dry run mode - no files will be created\n'));
          console.log(chalk.dim('Method:'));
          console.log(chalk.gray(`   ${needsReEncode ? 'Re-encode (compatible)' : 'Fast concat (stream copy)'}`));
          console.log(chalk.dim('\nCommand:'));
          console.log(chalk.gray(`  ffmpeg ${args.join(' ')}\n`));
          console.log(chalk.green('✓ Dry run complete'));
          return;
        }

        // Run merge
        console.log(chalk.dim(`🔗 Merging videos (${needsReEncode ? 're-encoding' : 'fast mode'})...`));
        if (options.verbose) {
          console.log(chalk.dim(`ffmpeg ${args.join(' ')}\n`));
        }

        await runFFmpeg(args, options.verbose);

        // Get output file size
        const outputStat = await stat(output);

        console.log();
        console.log(chalk.green.bold('✓ Merging Complete!\n'));
        console.log(chalk.gray(`   Videos merged: ${inputs.length}`));
        console.log(chalk.gray(`   Total duration: ${formatDuration(totalDuration)}`));
        console.log(chalk.gray(`   Output size: ${formatFileSize(outputStat.size)}`));
        console.log(chalk.dim(`\n   ${output}`));
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      } finally {
        // Clean up temp file
        try {
          await unlink(tempListFile);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
}
