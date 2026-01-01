import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ConvertOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface ConvertOptionsExtended extends ConvertOptions {
  help?: boolean;
}

export function convertCommand(imageCmd: Command): void {
  imageCmd
    .command('convert <input>')
    .description('Convert image to different format')
    .option('-f, --format <format>', 'Output format: jpg, png, webp, avif, tiff, gif', 'webp')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--compression <level>', 'PNG compression level (0-9)', parseInt, 9)
    .option('--progressive', 'Use progressive/interlaced format')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for convert command')
    .action(async (input: string, options: ConvertOptionsExtended) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'convert',
          emoji: '🔄',
          description: 'Convert images between different formats. Supports modern formats like WebP and AVIF for better compression and quality.',
          usage: ['convert <input> -f <format>', 'convert <input> -f <format> -o <output>', 'convert <input> -f webp -q 85'],
          options: [
            { flag: '-f, --format <format>', description: 'Output format: jpg, png, webp, avif, tiff, gif (default: webp)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>.<format>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--compression <level>', description: 'PNG compression level 0-9 (default: 9)' },
            { flag: '--progressive', description: 'Use progressive/interlaced format' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'convert photo.jpg -f webp', description: 'Convert JPG to WebP (modern, smaller)' },
            { command: 'convert image.png -f avif -q 80', description: 'Convert to AVIF with quality 80' },
            { command: 'convert pic.webp -f jpg', description: 'Convert WebP back to JPG' },
            { command: 'convert photo.jpg -f png --compression 9', description: 'Convert to PNG with max compression' },
            { command: 'convert image.png -f jpg --progressive', description: 'Convert to progressive JPG' }
          ],
          additionalSections: [
            {
              title: 'Format Guide',
              items: [
                'WebP - Modern format, 25-35% smaller than JPG/PNG',
                'AVIF - Newest format, even smaller than WebP',
                'JPG - Best for photos, lossy compression',
                'PNG - Best for graphics/transparency, lossless',
                'TIFF - Professional/print, very large files',
                'GIF - Animations, limited colors'
              ]
            }
          ],
          tips: [
            'WebP and AVIF offer best compression for web',
            'Use PNG for images with transparency',
            'AVIF may not be supported in all browsers yet',
            'Progressive JPGs load gradually (better for web)'
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

        const validFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'tiff', 'gif'];
        if (!validFormats.includes(options.format)) {
          spinner.fail(chalk.red(`Invalid format. Supported: ${validFormats.join(', ')}`));
          process.exit(1);
        }

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}.${options.format}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Format: ${options.format}`));
          console.log(chalk.dim(`  Quality: ${options.quality || 90}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would convert image:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          console.log(chalk.dim(`  Format: ${options.format}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        let pipeline = createSharpInstance(input);

        // Apply format-specific options
        if (options.format === 'jpg' || options.format === 'jpeg') {
          pipeline.jpeg({ quality: options.quality || 90, progressive: options.progressive || false });
        } else if (options.format === 'png') {
          pipeline.png({ quality: options.quality || 90, compressionLevel: options.compression || 9, progressive: options.progressive || false });
        } else if (options.format === 'webp') {
          pipeline.webp({ quality: options.quality || 90 });
        } else if (options.format === 'avif') {
          pipeline.avif({ quality: options.quality || 90 });
        } else if (options.format === 'tiff') {
          pipeline.tiff({ quality: options.quality || 90 });
        } else if (options.format === 'gif') {
          pipeline.gif();
        }

        await pipeline.toFile(outputPath);

        const inputStats = fs.statSync(input);
        const outputStats = fs.statSync(outputPath);
        const sizeDiff = ((outputStats.size - inputStats.size) / inputStats.size * 100).toFixed(2);

        spinner.succeed(chalk.green('✓ Image converted successfully!'));
        console.log(chalk.dim(`  Input: ${input} (${metadata.format?.toUpperCase()})`));
        console.log(chalk.dim(`  Output: ${outputPath} (${options.format.toUpperCase()})`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  File size: ${(inputStats.size / 1024).toFixed(2)}KB → ${(outputStats.size / 1024).toFixed(2)}KB (${sizeDiff > '0' ? '+' : ''}${sizeDiff}%)`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to convert image'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
