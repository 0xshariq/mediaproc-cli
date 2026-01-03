import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import * as fs from 'fs';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { ImageOptions } from '../types.js';
import { createSharpInstance, sharp } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface WatermarkOptions extends ImageOptions {
  position?: string;
  opacity?: number;
  scale?: number;
  help?: boolean;
}

export function watermarkCommand(imageCmd: Command): void {
  imageCmd
    .command('watermark <input> <watermark>')
    .description('Add watermark to image')
    .option('-o, --output <path>', 'Output file path')
    .option('--position <position>', 'Position: center, top-left, top-right, bottom-left, bottom-right', 'bottom-right')
    .option('--opacity <opacity>', 'Watermark opacity (0-1, default: 0.5)', parseFloat, 0.5)
    .option('--scale <scale>', 'Watermark scale (0.1-1, default: 0.2)', parseFloat, 0.2)
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for watermark command')
    .action(async (input: string, watermark: string, options: WatermarkOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'watermark',
          emoji: '©️',
          description: 'Add watermark to images for copyright protection, branding, or attribution. Supports positioning and opacity control.',
          usage: ['watermark <input> <watermark>', 'watermark <input> <logo.png> --position center', 'watermark <input> <mark.png> --opacity 0.3 --scale 0.3'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-watermarked.<ext>)' },
            { flag: '--position <position>', description: 'Position: center, top-left, top-right, bottom-left, bottom-right (default: bottom-right)' },
            { flag: '--opacity <opacity>', description: 'Watermark opacity 0-1 (default: 0.5)' },
            { flag: '--scale <scale>', description: 'Watermark scale 0.1-1 (default: 0.2, 20% of image width)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'watermark photo.jpg logo.png', description: 'Add watermark to bottom-right (default)' },
            { command: 'watermark image.jpg mark.png --position center', description: 'Center watermark' },
            { command: 'watermark pic.jpg logo.png --opacity 0.3', description: 'Subtle watermark (30% opacity)' },
            { command: 'watermark photo.jpg brand.png --scale 0.3 --position top-right', description: 'Larger watermark in top-right' }
          ],
          additionalSections: [
            {
              title: 'Positions',
              items: [
                'center - Middle of image',
                'top-left - Upper left corner',
                'top-right - Upper right corner',
                'bottom-left - Lower left corner',
                'bottom-right - Lower right corner (default)'
              ]
            },
            {
              title: 'Opacity Guide',
              items: [
                '0.1-0.3 - Very subtle, barely visible',
                '0.4-0.6 - Balanced visibility (recommended)',
                '0.7-0.9 - Strong, clearly visible',
                '1.0 - Fully opaque (no transparency)'
              ]
            }
          ],
          tips: [
            'Use PNG watermarks with transparency for best results',
            'Scale 0.2 (20%) is usually appropriate for logos',
            'Opacity 0.5 balances protection and aesthetics',
            'Bottom-right is standard for copyright marks'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Processing image...').start();

      try {
        // Validate watermark file exists (single file, not multi)
        if (!fs.existsSync(watermark)) {
          spinner.fail(chalk.red(`Watermark file not found: ${watermark}`));
          process.exit(1);
        }

        // Validate input paths (can be multiple)
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
          suffix: '-watermarked',
          preserveStructure: inputFiles.length > 1,
        });

        let successCount = 0;
        let failCount = 0;

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Found ${inputFiles.length} file(s)`));
          console.log(chalk.dim(`  Watermark: ${watermark}`));
          console.log(chalk.dim(`  Output directory: ${outputDir}`));
          console.log(chalk.dim(`  Position: ${options.position || 'bottom-right'}`));
          console.log(chalk.dim(`  Opacity: ${options.opacity || 0.5}`));
          console.log(chalk.dim(`  Scale: ${options.scale || 0.2}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green(`✓ Would add watermark to ${inputFiles.length} file(s):`));
          inputFiles.forEach(f => console.log(chalk.dim(`  - ${f}`)));
          console.log(chalk.dim(`  Watermark: ${watermark}`));
          return;
        }

        // Preload watermark
        const scale = options.scale || 0.2;
        const position = options.position || 'bottom-right';
        
        // Calculate gravity once
        let gravity: sharp.Gravity = 'southeast';
        if (position === 'center') gravity = 'center';
        else if (position === 'top-left') gravity = 'northwest';
        else if (position === 'top-right') gravity = 'northeast';
        else if (position === 'bottom-left') gravity = 'southwest';
        else if (position === 'bottom-right') gravity = 'southeast';

        // Process all files
        for (const inputFile of inputFiles) {
          try {
            const fileName = path.basename(inputFile);
            const outputPath = outputPaths.get(inputFile)!;

            const metadata = await createSharpInstance(inputFile).metadata();

            // Calculate watermark size based on scale
            const targetWidth = Math.round((metadata.width || 0) * scale);
            
            const watermarkResized = await createSharpInstance(watermark)
              .resize(targetWidth)
              .toBuffer();

            // Apply watermark with opacity
            const watermarkWithOpacity = await sharp(watermarkResized)
              .composite([{
                input: Buffer.from([255, 255, 255, Math.round((options.opacity || 0.5) * 255)]),
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                blend: 'dest-in'
              }])
              .toBuffer();

            const pipeline = createSharpInstance(inputFile).composite([{
              input: watermarkWithOpacity,
              gravity,
            }]);

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline.jpeg({ quality: options.quality || 90 });
            } else if (outputExt === '.png') {
              pipeline.png({ quality: options.quality || 90 });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality: options.quality || 90 });
            }

            await pipeline.toFile(outputPath);

            spinner.succeed(chalk.green(`✓ ${fileName} watermarked`));
            successCount++;
          } catch (error) {
            spinner.fail(chalk.red(`✗ Failed: ${path.basename(inputFile)}`));
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
