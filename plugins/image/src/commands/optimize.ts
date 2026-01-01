import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface OptimizeOptions extends ImageOptions {
  aggressive?: boolean;
  help?: boolean;
}

export function optimizeCommand(imageCmd: Command): void {
  imageCmd
    .command('optimize <input>')
    .description('Optimize image size without quality loss')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100, default: 85)', parseInt, 85)
    .option('--aggressive', 'More aggressive compression (lower quality)')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for optimize command')
    .action(async (input: string, options: OptimizeOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'optimize',
          emoji: '⚡',
          description: 'Optimize image file size with minimal quality loss. Perfect for web optimization, faster loading times, and reduced storage.',
          usage: ['optimize <input>', 'optimize <input> -q <quality>', 'optimize <input> --aggressive'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-optimized.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Quality 1-100 (default: 85)' },
            { flag: '--aggressive', description: 'More aggressive compression (quality 70)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'optimize photo.jpg', description: 'Optimize with quality 85 (default)' },
            { command: 'optimize image.png -q 90', description: 'Light optimization, high quality' },
            { command: 'optimize pic.jpg --aggressive', description: 'Aggressive compression for maximum size reduction' },
            { command: 'optimize photo.webp -q 80', description: 'Optimize WebP with custom quality' }
          ],
          additionalSections: [
            {
              title: 'Quality Guide',
              items: [
                'Quality 90-100: Minimal compression, large files',
                'Quality 85-89: Balanced (recommended for web)',
                'Quality 70-84: Good compression, slight quality loss',
                'Quality 50-69: High compression, noticeable quality loss',
                'Aggressive mode: Uses quality 70 with max compression'
              ]
            },
            {
              title: 'Format Optimization',
              items: [
                'JPG: Strips metadata, applies compression',
                'PNG: Max compression level, removes metadata',
                'WebP: Efficient modern compression',
                'All: Removes EXIF data to reduce size'
              ]
            }
          ],
          tips: [
            'Quality 85 offers best balance of size and quality',
            'Use --aggressive for thumbnails or previews',
            'Consider converting to WebP for even better compression',
            'Always keep original files before optimizing'
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

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-optimized${inputPath.ext}`);

        const quality = options.aggressive ? 70 : (options.quality || 85);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Quality: ${quality}`));
          console.log(chalk.dim(`  Mode: ${options.aggressive ? 'aggressive' : 'normal'}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would optimize image:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          console.log(chalk.dim(`  Quality: ${quality}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        let pipeline = createSharpInstance(input);

        // Strip metadata to reduce size
        pipeline = pipeline.withMetadata({
          orientation: metadata.orientation
        });

        // Apply format-specific optimization
        const outputExt = path.extname(outputPath).toLowerCase();
        if (outputExt === '.jpg' || outputExt === '.jpeg') {
          pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
        } else if (outputExt === '.png') {
          pipeline.png({ quality, compressionLevel: 9, progressive: true, effort: 10 });
        } else if (outputExt === '.webp') {
          pipeline.webp({ quality, effort: 6 });
        } else if (outputExt === '.avif') {
          pipeline.avif({ quality, effort: 9 });
        }

        await pipeline.toFile(outputPath);

        const inputStats = fs.statSync(input);
        const outputStats = fs.statSync(outputPath);
        const sizeDiff = ((outputStats.size - inputStats.size) / inputStats.size * 100).toFixed(2);
        const saved = ((inputStats.size - outputStats.size) / 1024).toFixed(2);

        spinner.succeed(chalk.green('✓ Image optimized successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  Quality: ${quality}`));
        console.log(chalk.dim(`  File size: ${(inputStats.size / 1024).toFixed(2)}KB → ${(outputStats.size / 1024).toFixed(2)}KB`));
        console.log(chalk.green(`  Saved: ${saved}KB (${Math.abs(parseFloat(sizeDiff))}% reduction)`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to optimize image'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
