import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface GridOptions {
  inputs: string[];
  output?: string;
  columns?: number;
  rows?: number;
  width?: number;
  height?: number;
  gap?: number;
  background?: string;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function gridCommand(imageCmd: Command): void {
  imageCmd
    .command('grid <images...>')
    .description('Create image grid/collage from multiple images')
    .option('-c, --columns <number>', 'Number of columns (default: auto-calculate)', parseInt)
    .option('-r, --rows <number>', 'Number of rows (default: auto-calculate)', parseInt)
    .option('-w, --width <pixels>', 'Cell width in pixels (default: 300)', parseInt, 300)
    .option('-h, --height <pixels>', 'Cell height in pixels (default: 300)', parseInt, 300)
    .option('-g, --gap <pixels>', 'Gap between images in pixels (default: 10)', parseInt, 10)
    .option('-b, --background <color>', 'Background color (default: #FFFFFF)', '#FFFFFF')
    .option('-o, --output <path>', 'Output file path (default: grid.jpg)')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for grid command')
    .action(async (images: string[], options: GridOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'grid',
          emoji: '🎞️',
          description: 'Create beautiful image grids and collages from multiple images. Perfect for social media posts, photo albums, and presentations.',
          usage: ['grid image1.jpg image2.jpg image3.jpg', 'grid *.jpg -c 3 -w 400 -h 400', 'grid photo1.png photo2.png -g 20 -b "#000000"'],
          options: [
            { flag: '-c, --columns <number>', description: 'Number of columns (auto-calculated if not specified)' },
            { flag: '-r, --rows <number>', description: 'Number of rows (auto-calculated if not specified)' },
            { flag: '-w, --width <pixels>', description: 'Cell width in pixels (default: 300)' },
            { flag: '-h, --height <pixels>', description: 'Cell height in pixels (default: 300)' },
            { flag: '-g, --gap <pixels>', description: 'Gap between images (default: 10)' },
            { flag: '-b, --background <color>', description: 'Background color - hex or name (default: #FFFFFF)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: grid.jpg)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'grid photo1.jpg photo2.jpg photo3.jpg photo4.jpg', description: 'Create 2x2 grid with default settings' },
            { command: 'grid *.jpg -c 3 -w 400 -h 400', description: 'Create 3-column grid with 400x400 cells' },
            { command: 'grid img1.png img2.png img3.png -g 20 -b black', description: 'Black background with 20px gaps' },
            { command: 'grid photo*.jpg -c 5 -o collage.png', description: '5-column grid saved as collage.png' },
            { command: 'grid *.jpg -r 2 -w 500 -g 0', description: 'Fixed 2 rows, no gaps' }
          ],
          additionalSections: [
            {
              title: 'Layout Options',
              items: [
                'Auto layout - Only specify columns or rows, other is calculated',
                'Fixed grid - Specify both columns and rows',
                'Square cells - Use same width and height',
                'Custom aspect - Different width and height for cells'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Instagram multi-image posts',
                'Photo album layouts',
                'Before/after comparisons',
                'Product showcase grids',
                'Portfolio presentations',
                'Social media collages'
              ]
            },
            {
              title: 'Common Grid Sizes',
              items: [
                '2x2 - Four images, Instagram style',
                '3x3 - Nine images, classic grid',
                '4x4 - Sixteen images, large collage',
                '1x3 - Three images horizontal',
                '3x1 - Three images vertical'
              ]
            }
          ],
          tips: [
            'Images are automatically resized to fit cells',
            'Use --gap 0 for seamless grid',
            'Black/white backgrounds work great for galleries',
            'Square cells (same width/height) look most uniform'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Creating grid...').start();

      try {
        // Validate inputs
        if (images.length === 0) {
          spinner.fail(chalk.red('No images provided'));
          process.exit(1);
        }

        // Check all files exist
        for (const img of images) {
          if (!fs.existsSync(img)) {
            spinner.fail(chalk.red(`Image not found: ${img}`));
            process.exit(1);
          }
        }

        const imageCount = images.length;
        
        // Calculate grid dimensions
        let columns = options.columns;
        let rows = options.rows;

        if (!columns && !rows) {
          // Auto-calculate square-ish grid
          columns = Math.ceil(Math.sqrt(imageCount));
          rows = Math.ceil(imageCount / columns);
        } else if (columns && !rows) {
          rows = Math.ceil(imageCount / columns);
        } else if (rows && !columns) {
          columns = Math.ceil(imageCount / rows);
        }

        const cellWidth = options.width || 300;
        const cellHeight = options.height || 300;
        const gap = options.gap || 10;
        const background = options.background || '#FFFFFF';

        const gridWidth = columns! * cellWidth + (columns! - 1) * gap;
        const gridHeight = rows! * cellHeight + (rows! - 1) * gap;

        const outputPath = options.output || 'grid.jpg';

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Images: ${imageCount}`));
          console.log(chalk.dim(`  Grid: ${columns}x${rows}`));
          console.log(chalk.dim(`  Cell size: ${cellWidth}x${cellHeight}`));
          console.log(chalk.dim(`  Gap: ${gap}px`));
          console.log(chalk.dim(`  Canvas: ${gridWidth}x${gridHeight}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would create grid:'));
          console.log(chalk.dim(`  Images: ${imageCount}`));
          console.log(chalk.dim(`  Layout: ${columns}x${rows}`));
          console.log(chalk.dim(`  Output size: ${gridWidth}x${gridHeight}`));
          return;
        }

        // Create base canvas
        const canvas = await createSharpInstance({
          create: {
            width: gridWidth,
            height: gridHeight,
            channels: 4,
            background: background
          }
        }).png().toBuffer();

        // Process and position images
        const composites = [];
        
        for (let i = 0; i < Math.min(imageCount, columns! * rows!); i++) {
          const row = Math.floor(i / columns!);
          const col = i % columns!;
          
          const x = col * (cellWidth + gap);
          const y = row * (cellHeight + gap);

          // Resize image to fit cell
          const processedImage = await createSharpInstance(images[i])
            .resize(cellWidth, cellHeight, {
              fit: 'cover',
              position: 'center'
            })
            .toBuffer();

          composites.push({
            input: processedImage,
            left: x,
            top: y
          });
        }

        // Composite all images onto canvas
        await createSharpInstance(canvas)
          .composite(composites)
          .toFile(outputPath);

        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Grid created successfully!'));
        console.log(chalk.dim(`  Images: ${imageCount} (${Math.min(imageCount, columns! * rows!)} used)`));
        console.log(chalk.dim(`  Layout: ${columns}x${rows}`));
        console.log(chalk.dim(`  Cell size: ${cellWidth}x${cellHeight}`));
        console.log(chalk.dim(`  Output: ${outputPath} (${gridWidth}x${gridHeight})`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to create grid'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
