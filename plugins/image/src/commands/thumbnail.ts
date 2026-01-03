import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { ResizeOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface ThumbnailOptions extends ResizeOptions {
  size?: number;
  help?: boolean;
}

export function thumbnailCommand(imageCmd: Command): void {
  imageCmd
    .command('thumbnail <input>')
    .description('Generate thumbnail from image')
    .option('-s, --size <size>', 'Thumbnail size in pixels (default: 150)', parseInt, 150)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 85)
    .option('--fit <fit>', 'Fit mode: cover, contain, fill, inside, outside', 'cover')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for thumbnail command')
    .action(async (input: string, options: ThumbnailOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'thumbnail',
          emoji: '🖼️',
          description: 'Generate thumbnails from images. Perfect for creating preview images, avatar sizes, or gallery thumbnails.',
          usage: ['thumbnail <input>', 'thumbnail <input> -s <size>', 'thumbnail <input> -s 200 --fit contain'],
          options: [
            { flag: '-s, --size <size>', description: 'Thumbnail size in pixels (default: 150, creates 150x150)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-thumb.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 85)' },
            { flag: '--fit <fit>', description: 'Fit mode: cover, contain, fill, inside, outside (default: cover)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'thumbnail photo.jpg', description: 'Generate 150x150 thumbnail (default)' },
            { command: 'thumbnail image.png -s 200', description: 'Generate 200x200 thumbnail' },
            { command: 'thumbnail pic.jpg -s 100 --fit contain', description: '100x100 thumbnail with padding' },
            { command: 'thumbnail photo.jpg -s 300 -q 90', description: '300x300 high-quality thumbnail' }
          ],
          additionalSections: [
            {
              title: 'Common Sizes',
              items: [
                '64x64 - Favicon, small icons',
                '150x150 - Default thumbnail size',
                '200x200 - Medium thumbnails',
                '300x300 - Large thumbnails',
                '512x512 - App icons, large previews'
              ]
            },
            {
              title: 'Fit Modes',
              items: [
                'cover - Fill entire area, crop if needed (default)',
                'contain - Fit inside with padding',
                'fill - Stretch to fill (may distort)',
                'inside - Shrink if larger, no enlargement',
                'outside - Enlarge to cover, crop if needed'
              ]
            }
          ],
          tips: [
            'Cover mode works best for profile pictures and avatars',
            'Contain mode preserves full image with padding',
            'Quality 85 is optimal for thumbnails',
            'Use WebP format for smaller file sizes'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Validating inputs...').start();

      try {
        const { inputFiles, outputDir, errors } = validatePaths(input, options.output, {
          allowedExtensions: MediaExtensions.IMAGE,
          recursive: true,
        });

        if (errors.length > 0) {
          spinner.fail(chalk.red('Validation failed:'));
          errors.forEach(err => console.log(chalk.red(`  ✗ ${err}`)));
          process.exit(1);
        }

        if (inputFiles.length === 0) {
          spinner.fail(chalk.red('No valid image files found'));
          process.exit(1);
        }

        const outputPaths = resolveOutputPaths(inputFiles, outputDir, {
          suffix: '-thumb',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        const size = options.size || 150;

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Size: ${size}x${size}`));
          console.log(chalk.dim(`  Fit: ${options.fit || 'cover'}`));
          console.log(chalk.dim(`  Quality: ${options.quality || 85}`));
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run mode - no changes will be made\n'));
          console.log(chalk.green(`Would process ${inputFiles.length} image(s):`));
          inputFiles.forEach((inputFile, index) => {
            const outputPath = outputPaths.get(inputFile);
            console.log(chalk.dim(`  ${index + 1}. ${path.basename(inputFile)} → ${path.basename(outputPath!)}`));
          });
          return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const [index, inputFile] of inputFiles.entries()) {
          const outputPath = outputPaths.get(inputFile)!;
          const fileName = path.basename(inputFile);
          
          spinner.start(`Processing ${index + 1}/${inputFiles.length}: ${fileName}...`);

          try {
            const metadata = await createSharpInstance(inputFile).metadata();
            const pipeline = createSharpInstance(inputFile)
              .resize(size, size, {
                fit: options.fit as any || 'cover',
                position: 'center'
              });

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline.jpeg({ quality: options.quality || 85 });
            } else if (outputExt === '.png') {
              pipeline.png({ quality: options.quality || 85 });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality: options.quality || 85 });
            }

            await pipeline.toFile(outputPath);
            
            spinner.succeed(chalk.green(`✓ ${fileName} processed`));
            successCount++;
          } catch (error) {
            spinner.fail(chalk.red(`✗ Failed: ${fileName}`));
            if (options.verbose && error instanceof Error) {
              console.log(chalk.red(`    Error: ${error.message}`));
            }
            failCount++;
          }
        }

        console.log(chalk.bold('\nSummary:'));
        console.log(chalk.green(`  ✓ Success: ${successCount}`));
        if (failCount > 0) {
          console.log(chalk.red(`  ✗ Failed: ${failCount}`));
        }
        console.log(chalk.dim(`  Output directory: ${outputDir}`));

      } catch (error) {
        spinner.fail(chalk.red('Processing failed'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
