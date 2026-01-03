import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
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
        // Validate input paths
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
          suffix: '-cropped',
          preserveStructure: inputFiles.length > 1,
        });

        let successCount = 0;
        let failCount = 0;

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Found ${inputFiles.length} file(s)`));
          console.log(chalk.dim(`  Target: ${options.width}x${options.height}`));
          console.log(chalk.dim(`  Strategy: ${options.strategy}`));
          console.log(chalk.dim(`  Output directory: ${outputDir}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green(`✓ Would smart crop ${inputFiles.length} file(s):`));
          inputFiles.forEach(f => console.log(chalk.dim(`  - ${f}`)));
          console.log(chalk.dim(`  To: ${options.width}x${options.height}`));
          console.log(chalk.dim(`  Strategy: ${options.strategy}`));
          return;
        }

        const strategy = options.strategy === 'attention' ? 'attention' : 'entropy';

        // Process all files
        for (const inputFile of inputFiles) {
          try {
            const fileName = path.basename(inputFile);
            const outputPath = outputPaths.get(inputFile)!;

            await createSharpInstance(inputFile)
              .resize(options.width, options.height, {
                fit: 'cover',
                position: strategy
              })
              .toFile(outputPath);

            spinner.succeed(chalk.green(`✓ ${fileName} smart cropped`));
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
