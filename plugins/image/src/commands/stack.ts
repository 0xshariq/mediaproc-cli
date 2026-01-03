import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { validatePaths, MediaExtensions } from '../utils/pathValidator.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface StackOptions {
  inputs: string[];
  direction?: 'horizontal' | 'vertical';
  align?: 'start' | 'center' | 'end';
  gap?: number;
  background?: string;
  output?: string;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function stackCommand(imageCmd: Command): void {
  imageCmd
    .command('stack <images...>')
    .description('Stack multiple images horizontally or vertically')
    .option('-d, --direction <direction>', 'Stack direction: horizontal, vertical (default: horizontal)', 'horizontal')
    .option('-a, --align <alignment>', 'Alignment: start, center, end (default: center)', 'center')
    .option('-g, --gap <pixels>', 'Gap between images in pixels (default: 0)', parseInt, 0)
    .option('-b, --background <color>', 'Background color for gaps (default: transparent)', 'rgba(0,0,0,0)')
    .option('-o, --output <path>', 'Output file path (default: stacked.png)')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for stack command')
    .action(async (images: string[], options: StackOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'stack',
          emoji: '📚',
          description: 'Stack multiple images horizontally or vertically with customizable alignment and spacing. Perfect for before/after comparisons, image sequences, and panoramas.',
          usage: ['stack image1.jpg image2.jpg', 'stack *.jpg --direction vertical', 'stack img1.png img2.png -d horizontal -a center -g 10'],
          options: [
            { flag: '-d, --direction <direction>', description: 'Stack direction: horizontal or vertical (default: horizontal)' },
            { flag: '-a, --align <alignment>', description: 'Alignment: start (top/left), center, end (bottom/right) (default: center)' },
            { flag: '-g, --gap <pixels>', description: 'Gap between images in pixels (default: 0)' },
            { flag: '-b, --background <color>', description: 'Background color for gaps (default: transparent)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: stacked.png)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'stack before.jpg after.jpg', description: 'Horizontal before/after comparison' },
            { command: 'stack img1.jpg img2.jpg img3.jpg --direction vertical', description: 'Stack 3 images vertically' },
            { command: 'stack *.png -d horizontal -g 20 -b white', description: 'Horizontal with white gaps' },
            { command: 'stack photo1.jpg photo2.jpg -a end -o result.png', description: 'Right-aligned horizontal stack' },
            { command: 'stack panorama*.jpg -d horizontal -o panorama.jpg', description: 'Create panorama' }
          ],
          additionalSections: [
            {
              title: 'Direction & Alignment',
              items: [
                'horizontal + start - Images aligned to top',
                'horizontal + center - Images centered vertically',
                'horizontal + end - Images aligned to bottom',
                'vertical + start - Images aligned to left',
                'vertical + center - Images centered horizontally',
                'vertical + end - Images aligned to right'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Before/after comparisons',
                'Image sequences and timelines',
                'Panorama stitching',
                'Portfolio layouts',
                'Tutorial step-by-step images',
                'Product variations display',
                'Comparison charts'
              ]
            }
          ],
          tips: [
            'Use gaps for visual separation',
            'Transparent background works best with PNGs',
            'Horizontal for wide comparisons, vertical for tall',
            'Center alignment usually looks best'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Preparing images...').start();

      try {
        if (images.length < 2) {
          spinner.fail(chalk.red('Need at least 2 images to stack'));
          process.exit(1);
        }

        // Validate all input files
        const { inputFiles, errors } = validatePaths(images.join(','), undefined, {
          allowedExtensions: MediaExtensions.IMAGE,
          recursive: false,
        });

        if (errors.length > 0) {
          spinner.fail(chalk.red('Validation failed:'));
          errors.forEach(err => console.log(chalk.red(`  ✗ ${err}`)));
          process.exit(1);
        }

        if (inputFiles.length < 2) {
          spinner.fail(chalk.red('Need at least 2 valid images to stack'));
          process.exit(1);
        }

        // Use validated files
        const validImages = inputFiles;
        for (const img of validImages) {
          if (!fs.existsSync(img)) {
            spinner.fail(chalk.red(`Image not found: ${img}`));
            process.exit(1);
          }
        }

        const direction = options.direction === 'vertical' ? 'vertical' : 'horizontal';
        const align = options.align || 'center';
        const gap = options.gap || 0;
        const background = options.background || 'rgba(0,0,0,0)';
        const outputPath = options.output || 'stacked.png';

        // Load all images and get dimensions
        const imageDimensions = await Promise.all(
          images.map(async (img) => {
            const meta = await createSharpInstance(img).metadata();
            return {
              path: img,
              width: meta.width!,
              height: meta.height!
            };
          })
        );

        // Calculate canvas size
        let canvasWidth: number;
        let canvasHeight: number;

        if (direction === 'horizontal') {
          canvasWidth = imageDimensions.reduce((sum, img) => sum + img.width, 0) + gap * (images.length - 1);
          canvasHeight = Math.max(...imageDimensions.map(img => img.height));
        } else {
          canvasWidth = Math.max(...imageDimensions.map(img => img.width));
          canvasHeight = imageDimensions.reduce((sum, img) => sum + img.height, 0) + gap * (images.length - 1);
        }

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Images: ${images.length}`));
          console.log(chalk.dim(`  Direction: ${direction}`));
          console.log(chalk.dim(`  Alignment: ${align}`));
          console.log(chalk.dim(`  Gap: ${gap}px`));
          console.log(chalk.dim(`  Canvas: ${canvasWidth}x${canvasHeight}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would stack images:'));
          console.log(chalk.dim(`  Images: ${images.length}`));
          console.log(chalk.dim(`  Direction: ${direction}`));
          console.log(chalk.dim(`  Output size: ${canvasWidth}x${canvasHeight}`));
          return;
        }

        // Create canvas
        const canvas = await createSharpInstance({
          create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: background
          }
        }).png().toBuffer();

        // Position images
        const composites = [];
        let currentPos = 0;

        for (let i = 0; i < images.length; i++) {
          const img = imageDimensions[i];
          let left: number, top: number;

          if (direction === 'horizontal') {
            left = currentPos;

            // Vertical alignment
            if (align === 'start') {
              top = 0;
            } else if (align === 'end') {
              top = canvasHeight - img.height;
            } else {
              top = Math.floor((canvasHeight - img.height) / 2);
            }

            currentPos += img.width + gap;
          } else {
            top = currentPos;

            // Horizontal alignment
            if (align === 'start') {
              left = 0;
            } else if (align === 'end') {
              left = canvasWidth - img.width;
            } else {
              left = Math.floor((canvasWidth - img.width) / 2);
            }

            currentPos += img.height + gap;
          }

          const imageBuffer = await createSharpInstance(img.path).toBuffer();

          composites.push({
            input: imageBuffer,
            left,
            top
          });
        }

        // Composite all images
        await createSharpInstance(canvas)
          .composite(composites)
          .toFile(outputPath);

        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Images stacked successfully!'));
        console.log(chalk.dim(`  Images: ${images.length}`));
        console.log(chalk.dim(`  Direction: ${direction}`));
        console.log(chalk.dim(`  Alignment: ${align}`));
        console.log(chalk.dim(`  Output: ${outputPath} (${canvasWidth}x${canvasHeight})`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to stack images'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
