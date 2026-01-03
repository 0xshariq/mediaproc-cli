import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import * as fs from 'fs';
import { validatePaths, MediaExtensions } from '@mediaproc/cli';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface SplitOptions {
  input: string;
  tiles?: string;
  rows?: number;
  columns?: number;
  output?: string;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function splitCommand(imageCmd: Command): void {
  imageCmd
    .command('split <input>')
    .description('Split image into tiles/grid pieces')
    .option('-t, --tiles <grid>', 'Grid pattern like "2x2", "3x3", "4x2"')
    .option('-r, --rows <number>', 'Number of rows', parseInt)
    .option('-c, --columns <number>', 'Number of columns', parseInt)
    .option('-o, --output <directory>', 'Output directory (default: ./tiles)')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for split command')
    .action(async (input: string, options: SplitOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'split',
          emoji: '✂️',
          description: 'Split large images into smaller tiles or grid pieces. Perfect for Instagram carousels, large prints, or processing huge images in chunks.',
          usage: ['split <input> --tiles 3x3', 'split <input> -r 2 -c 3', 'split <input> -t "4x4" -o ./output'],
          options: [
            { flag: '-t, --tiles <grid>', description: 'Grid pattern: "2x2", "3x3", "4x2", etc.' },
            { flag: '-r, --rows <number>', description: 'Number of rows (alternative to --tiles)' },
            { flag: '-c, --columns <number>', description: 'Number of columns (alternative to --tiles)' },
            { flag: '-o, --output <directory>', description: 'Output directory (default: ./tiles)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'split photo.jpg --tiles 3x3', description: 'Split into 9 tiles (3x3 grid)' },
            { command: 'split large.png -t "4x4"', description: 'Split into 16 tiles' },
            { command: 'split panorama.jpg -r 1 -c 5', description: 'Split horizontally into 5 pieces' },
            { command: 'split image.jpg -r 3 -c 1 -o ./vertical', description: 'Split vertically into 3 pieces' },
            { command: 'split poster.jpg --tiles 2x3 -o ./parts', description: 'Split into 6 tiles' }
          ],
          additionalSections: [
            {
              title: 'Output Format',
              items: [
                'Files named: tile_row_col.ext (e.g., tile_0_0.jpg)',
                'Row and column numbers start at 0',
                'Original format preserved',
                'Tiles saved in specified output directory'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Instagram carousel posts (1x10 split)',
                'Large format printing (split for smaller printers)',
                'Processing huge images in chunks',
                'Creating puzzle effects',
                'Panorama splitting',
                'Social media multi-post sequences'
              ]
            },
            {
              title: 'Common Split Patterns',
              items: [
                '2x2 - Four equal quadrants',
                '3x3 - Nine tiles, standard grid',
                '1x3 - Three horizontal slices',
                '3x1 - Three vertical slices',
                '1x10 - Instagram carousel (10 images)',
                '4x4 - Sixteen tiles for detailed work'
              ]
            }
          ],
          tips: [
            'Instagram carousel: use 1x10 for full scrollable panorama',
            'Tiles maintain original quality',
            'Use for large images that won\'t fit in memory',
            'Perfect for creating grid posts on social media'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Analyzing image...').start();

      try {
        // Validate input paths
        const { inputFiles, outputDir: baseOutputDir, errors } = validatePaths(input, options.output || './tiles', {
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

        let successCount = 0;
        let failCount = 0;

        // Parse grid dimensions
        let rows: number;
        let columns: number;

        if (options.tiles) {
          const match = options.tiles.match(/^(\d+)x(\d+)$/);
          if (!match) {
            spinner.fail(chalk.red('Invalid tiles format. Use format like "3x3" or "2x4"'));
            process.exit(1);
          }
          rows = parseInt(match[1]);
          columns = parseInt(match[2]);
        } else if (options.rows && options.columns) {
          rows = options.rows;
          columns = options.columns;
        } else {
          spinner.fail(chalk.red('Please specify either --tiles or both --rows and --columns'));
          process.exit(1);
        }

        const totalTiles = rows * columns;

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Found ${inputFiles.length} file(s)`));
          console.log(chalk.dim(`  Grid: ${rows}x${columns} (${totalTiles} tiles per image)`));
          console.log(chalk.dim(`  Output directory: ${baseOutputDir}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green(`✓ Would split ${inputFiles.length} file(s):`));
          inputFiles.forEach(f => console.log(chalk.dim(`  - ${f}`)));
          console.log(chalk.dim(`  Into: ${rows}x${columns} grid (${totalTiles} tiles each)`));
          return;
        }

        // Create output directory
        if (!fs.existsSync(baseOutputDir)) {
          fs.mkdirSync(baseOutputDir, { recursive: true });
        }

        // Process all files
        for (const inputFile of inputFiles) {
          try {
            const fileName = path.basename(inputFile);
            const inputPath = path.parse(inputFile);
            
            const metadata = await createSharpInstance(inputFile).metadata();
            
            if (!metadata.width || !metadata.height) {
              spinner.fail(chalk.red(`Unable to read dimensions: ${fileName}`));
              failCount++;
              continue;
            }

            const tileWidth = Math.floor(metadata.width / columns);
            const tileHeight = Math.floor(metadata.height / rows);

            spinner.text = `Splitting ${fileName}...`;

            const imageBuffer = await createSharpInstance(inputFile).toBuffer();
            
            // Create subdirectory for this file if multiple inputs
            const fileOutputDir = inputFiles.length > 1 
              ? path.join(baseOutputDir, inputPath.name)
              : baseOutputDir;
            
            if (!fs.existsSync(fileOutputDir)) {
              fs.mkdirSync(fileOutputDir, { recursive: true });
            }
            
            for (let row = 0; row < rows; row++) {
              for (let col = 0; col < columns; col++) {
                const left = col * tileWidth;
                const top = row * tileHeight;
                
                const outputPath = path.join(fileOutputDir, `tile_${row}_${col}${inputPath.ext}`);
                
                await createSharpInstance(imageBuffer)
                  .extract({
                    left,
                    top,
                    width: tileWidth,
                    height: tileHeight
                  })
                  .toFile(outputPath);
                
                spinner.text = `Splitting ${fileName}... ${((row * columns + col + 1) / totalTiles * 100).toFixed(0)}%`;
              }
            }

            spinner.succeed(chalk.green(`✓ ${fileName} split into ${totalTiles} tiles`));
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
        console.log(chalk.dim(`  Output directory: ${baseOutputDir}`));
        console.log(chalk.dim(`  Tiles per image: ${totalTiles} (${rows}x${columns})`));

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
