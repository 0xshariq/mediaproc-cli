import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
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
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        if (!fs.existsSync(watermark)) {
          spinner.fail(chalk.red(`Watermark file not found: ${watermark}`));
          process.exit(1);
        }

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-watermarked${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Watermark: ${watermark}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Position: ${options.position || 'bottom-right'}`));
          console.log(chalk.dim(`  Opacity: ${options.opacity || 0.5}`));
          console.log(chalk.dim(`  Scale: ${options.scale || 0.2}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would add watermark:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  Watermark: ${watermark}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const watermarkMeta = await createSharpInstance(watermark).metadata();

        // Calculate watermark size based on scale
        const scale = options.scale || 0.2;
        const targetWidth = Math.round((metadata.width || 0) * scale);
        
        if (options.verbose) {
          console.log(chalk.dim(`  Watermark original: ${watermarkMeta.width}x${watermarkMeta.height}`));
          console.log(chalk.dim(`  Watermark scaled: ${targetWidth}px wide`));
          console.log(chalk.dim(`  Scale factor: ${(scale * 100).toFixed(1)}%`));
        }
        
        const watermarkResized = await createSharpInstance(watermark)
          .resize(targetWidth)
          .toBuffer();

        const watermarkResizedMeta = await sharp(watermarkResized).metadata();

        // Calculate position
        let gravity: sharp.Gravity = 'southeast';
        const position = options.position || 'bottom-right';
        
        if (position === 'center') gravity = 'center';
        else if (position === 'top-left') gravity = 'northwest';
        else if (position === 'top-right') gravity = 'northeast';
        else if (position === 'bottom-left') gravity = 'southwest';
        else if (position === 'bottom-right') gravity = 'southeast';

        // Apply watermark with opacity
        const watermarkWithOpacity = await sharp(watermarkResized)
          .composite([{
            input: Buffer.from([255, 255, 255, Math.round((options.opacity || 0.5) * 255)]),
            raw: { width: 1, height: 1, channels: 4 },
            tile: true,
            blend: 'dest-in'
          }])
          .toBuffer();

        const pipeline = createSharpInstance(input).composite([{
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

        spinner.succeed(chalk.green('✓ Watermark added successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Watermark: ${watermark}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Position: ${position}`));
        console.log(chalk.dim(`  Watermark size: ${watermarkResizedMeta.width}x${watermarkResizedMeta.height}`));
        console.log(chalk.dim(`  Opacity: ${(options.opacity || 0.5) * 100}%`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to add watermark'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
