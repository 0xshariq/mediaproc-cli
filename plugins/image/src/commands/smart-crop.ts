import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface SmartCropOptions {
  input: string;
  output?: string;
  width: number;
  height: number;
  strategy?: 'entropy' | 'attention';
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function smartCropCommand(imageCmd: Command): void {
  imageCmd
    .command('smart-crop <input>')
    .description('Intelligent cropping based on image content')
    .requiredOption('-w, --width <pixels>', 'Target width', parseInt)
    .requiredOption('-h, --height <pixels>', 'Target height', parseInt)
    .option('-s, --strategy <type>', 'Cropping strategy: entropy (default), attention', 'entropy')
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for smart-crop command')
    .action(async (input: string, options: SmartCropOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'smart-crop',
          emoji: '🎯',
          description: 'Intelligently crop images to target dimensions while preserving the most important content. Uses entropy or attention-based algorithms.',
          usage: ['smart-crop <input> -w 1200 -h 630', 'smart-crop <input> -w 800 -h 800 --strategy attention', 'smart-crop <input> -w 1920 -h 1080 -o banner.jpg'],
          options: [
            { flag: '-w, --width <pixels>', description: 'Target width in pixels (required)' },
            { flag: '-h, --height <pixels>', description: 'Target height in pixels (required)' },
            { flag: '-s, --strategy <type>', description: 'Cropping strategy: entropy (edges/details) or attention (center-weighted) (default: entropy)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'smart-crop photo.jpg -w 1200 -h 630', description: 'Create social media banner' },
            { command: 'smart-crop portrait.jpg -w 800 -h 800 --strategy attention', description: 'Square crop with center focus' },
            { command: 'smart-crop landscape.jpg -w 1920 -h 1080', description: 'Full HD crop with detail preservation' },
            { command: 'smart-crop product.png -w 600 -h 600 -o thumbnail.png', description: 'Smart product thumbnail' }
          ],
          additionalSections: [
            {
              title: 'Cropping Strategies',
              items: [
                'entropy - Analyzes image details and edges, preserves high-information areas',
                'attention - Center-weighted, ideal for portraits and centered subjects',
                'Both strategies avoid cutting off important content'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Social media images (Facebook, Twitter, LinkedIn)',
                'Product thumbnails for e-commerce',
                'Blog post featured images',
                'Profile pictures and avatars',
                'Banner images for websites',
                'Mobile app screenshots'
              ]
            },
            {
              title: 'Common Dimensions',
              items: [
                '1200x630 - Facebook/LinkedIn shared posts',
                '1024x512 - Twitter cards',
                '1080x1080 - Instagram square posts',
                '1080x1920 - Instagram stories',
                '800x800 - General square thumbnails',
                '1920x1080 - Full HD banners'
              ]
            }
          ],
          tips: [
            'Use entropy for landscapes and detailed images',
            'Use attention for portraits and centered subjects',
            'Preview with --dry-run to check crop area',
            'Works best when target size is smaller than source'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Analyzing image content...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(inputPath.dir, `${inputPath.name}-cropped${inputPath.ext}`);

        const metadata = await createSharpInstance(input).metadata();

        if (!metadata.width || !metadata.height) {
          spinner.fail(chalk.red('Unable to read image dimensions'));
          process.exit(1);
        }

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input} (${metadata.width}x${metadata.height})`));
          console.log(chalk.dim(`  Target: ${options.width}x${options.height}`));
          console.log(chalk.dim(`  Strategy: ${options.strategy}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would smart crop:'));
          console.log(chalk.dim(`  From: ${metadata.width}x${metadata.height}`));
          console.log(chalk.dim(`  To: ${options.width}x${options.height}`));
          console.log(chalk.dim(`  Strategy: ${options.strategy}`));
          return;
        }

        // Use Sharp's smart cropping capabilities
        const strategy = options.strategy === 'attention' ? 'attention' : 'entropy';

        await createSharpInstance(input)
          .resize(options.width, options.height, {
            fit: 'cover',
            position: strategy
          })
          .toFile(outputPath);

        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Smart crop completed successfully!'));
        console.log(chalk.dim(`  Input: ${input} (${metadata.width}x${metadata.height})`));
        console.log(chalk.dim(`  Output: ${outputPath} (${options.width}x${options.height})`));
        console.log(chalk.dim(`  Strategy: ${strategy}`));
        console.log(chalk.dim(`  Aspect ratio: ${metadata.width}:${metadata.height} → ${options.width}:${options.height}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Smart crop failed'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
