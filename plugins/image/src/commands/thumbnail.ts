import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
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

      const spinner = ora('Generating thumbnail...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-thumb${inputPath.ext}`);
        const size = options.size || 150;

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Size: ${size}x${size}`));
          console.log(chalk.dim(`  Fit: ${options.fit || 'cover'}`));
          console.log(chalk.dim(`  Quality: ${options.quality || 85}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would generate thumbnail:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          console.log(chalk.dim(`  Size: ${size}x${size}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input)
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

        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Thumbnail generated successfully!'));
        console.log(chalk.dim(`  Input: ${input} (${metadata.width}x${metadata.height})`));
        console.log(chalk.dim(`  Output: ${outputPath} (${size}x${size})`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to generate thumbnail'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
