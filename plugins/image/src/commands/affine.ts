import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface AffineOptions extends ImageOptions {
  matrix?: string;
  background?: string;
  interpolator?: string;
  help?: boolean;
}

export function affineCommand(imageCmd: Command): void {
  imageCmd
    .command('affine <input>')
    .description('Apply affine transformation matrix')
    .option('--matrix <values>', 'Affine matrix [a,b,c,d] or 6 values', '[1,0,0,1]')
    .option('--background <color>', 'Background color (default: transparent)', 'transparent')
    .option('--interpolator <type>', 'Interpolator: nearest, bilinear, bicubic, nohalo, lbb, vsqbs (default: bilinear)', 'bilinear')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for affine command')
    .action(async (input: string, options: AffineOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'affine',
          emoji: '🔢',
          description: 'Apply affine transformation using a 2x2 matrix. Enables custom scaling, rotation, shearing, and reflection transformations.',
          usage: [
            'affine <input> --matrix "[1,0,0,1]"',
            'affine <input> --matrix "[2,0,0,2]" (2x scale)',
            'affine <input> --matrix "[1,0.5,0,1]" (shear)'
          ],
          options: [
            { flag: '--matrix <values>', description: 'Affine matrix [a,b,c,d] as JSON array' },
            { flag: '--background <color>', description: 'Background color for empty areas' },
            { flag: '--interpolator <type>', description: 'Interpolation method (default: bilinear)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-affine.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'affine image.jpg --matrix "[2,0,0,2]"', description: 'Scale 2x in both directions' },
            { command: 'affine photo.jpg --matrix "[1,0.5,0,1]"', description: 'Horizontal shear' },
            { command: 'affine pic.jpg --matrix "[1,0,0,-1]"', description: 'Vertical flip via matrix' },
            { command: 'affine image.jpg --matrix "[0.5,0,0,0.5]" --interpolator bicubic', description: 'Downscale 0.5x with quality' }
          ],
          additionalSections: [
            {
              title: 'Matrix Format',
              items: [
                '[a, b, c, d] where:',
                'a: horizontal scaling',
                'b: horizontal shearing',
                'c: vertical shearing', 
                'd: vertical scaling',
                'Identity matrix [1,0,0,1] = no change'
              ]
            },
            {
              title: 'Common Transformations',
              items: [
                'Scale 2x: [2,0,0,2]',
                'Scale 0.5x: [0.5,0,0,0.5]',
                'Horizontal flip: [-1,0,0,1]',
                'Vertical flip: [1,0,0,-1]',
                'Horizontal shear: [1,0.5,0,1]',
                'Vertical shear: [1,0,0.5,1]'
              ]
            },
            {
              title: 'Interpolators',
              items: [
                'nearest: Fastest, lowest quality',
                'bilinear: Good balance (default)',
                'bicubic: Higher quality, slower',
                'nohalo: Excellent quality',
                'lbb: Lanczos-based best',
                'vsqbs: Very high quality'
              ]
            }
          ],
          tips: [
            'For simple rotation, use rotate command instead',
            'Use bicubic or nohalo for high-quality transforms',
            'Background color matters for rotations/shears'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Processing image...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        // Parse matrix
        const matrixStr = options.matrix || '[1,0,0,1]';
        let matrix: number[];
        try {
          matrix = JSON.parse(matrixStr);
          if (!Array.isArray(matrix) || (matrix.length !== 4 && matrix.length !== 6)) {
            throw new Error('Matrix must have 4 or 6 values');
          }
        } catch (e) {
          spinner.fail(chalk.red('Invalid matrix format. Use JSON array like [1,0,0,1]'));
          process.exit(1);
        }

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-affine${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Matrix: [${matrix.join(', ')}]`));
          console.log(chalk.dim(`  Interpolator: ${options.interpolator || 'bilinear'}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would apply affine transformation:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Matrix: [${matrix.join(', ')}]`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();

        const pipeline = createSharpInstance(input).affine(matrix, {
          background: options.background || 'transparent',
          interpolator: options.interpolator as any || 'bilinear'
        });

        const outputExt = path.extname(outputPath).toLowerCase();
        if (outputExt === '.jpg' || outputExt === '.jpeg') {
          pipeline.jpeg({ quality: options.quality || 90 });
        } else if (outputExt === '.png') {
          pipeline.png({ quality: options.quality || 90 });
        } else if (outputExt === '.webp') {
          pipeline.webp({ quality: options.quality || 90 });
        }

        await pipeline.toFile(outputPath);

        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Affine transformation applied successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Matrix: [${matrix.join(', ')}]`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)} KB`));
      } catch (error) {
        spinner.fail(chalk.red('Failed to apply affine transformation'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
