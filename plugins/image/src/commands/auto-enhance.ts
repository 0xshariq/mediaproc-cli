import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface AutoEnhanceOptions {
  input: string;
  output?: string;
  level?: string;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function autoEnhanceCommand(imageCmd: Command): void {
  imageCmd
    .command('auto-enhance <input>')
    .description('Automatically enhance image with intelligent adjustments')
    .option('-l, --level <level>', 'Enhancement level: low, medium, high (default: medium)', 'medium')
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for auto-enhance command')
    .action(async (input: string, options: AutoEnhanceOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'auto-enhance',
          emoji: '✨',
          description: 'Automatically enhance images with intelligent adjustments. Applies normalization, sharpening, and contrast optimization in one command.',
          usage: ['auto-enhance <input>', 'auto-enhance <input> --level high', 'auto-enhance <input> -l low -o enhanced.jpg'],
          options: [
            { flag: '-l, --level <level>', description: 'Enhancement level: low, medium, high (default: medium)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'auto-enhance photo.jpg', description: 'Apply medium enhancement' },
            { command: 'auto-enhance dark.jpg --level high', description: 'Strong enhancement for poor lighting' },
            { command: 'auto-enhance image.png -l low', description: 'Subtle enhancement' },
            { command: 'auto-enhance pic.jpg -o enhanced.jpg', description: 'Save enhanced version' }
          ],
          additionalSections: [
            {
              title: 'Enhancement Levels',
              items: [
                'low - Subtle: Normalize + Light sharpen',
                'medium - Balanced: Normalize + Moderate sharpen + Contrast (recommended)',
                'high - Aggressive: Normalize + Strong sharpen + High contrast + CLAHE'
              ]
            },
            {
              title: 'What Gets Enhanced',
              items: [
                'Color normalization - Balance histogram',
                'Sharpness - Enhance edge definition',
                'Contrast - Improve dynamic range',
                'Brightness - Auto-level exposure',
                'Clarity - Reduce dullness',
                'Detail - Enhance fine features'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Quick photo fixes for social media',
                'Old/faded photo restoration',
                'Low-light image improvement',
                'Batch processing automation',
                'Smartphone photo enhancement',
                'Scan cleanup and improvement'
              ]
            }
          ],
          tips: [
            'Start with medium and adjust if needed',
            'High level great for dark/dull images',
            'Low level for already good photos',
            'Combine with other commands for custom workflows'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Analyzing and enhancing...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const level = ['low', 'medium', 'high'].includes(options.level || 'medium') ? options.level : 'medium';
        
        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(inputPath.dir, `${inputPath.name}-enhanced${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Enhancement level: ${level}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would apply auto-enhancement:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Level: ${level}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        let pipeline = createSharpInstance(input);

        // Apply enhancements based on level
        switch (level) {
          case 'low':
            // Subtle enhancement
            pipeline = pipeline
              .normalize()  // Histogram normalization
              .sharpen({ sigma: 0.5 });  // Light sharpen
            break;

          case 'medium':
            // Balanced enhancement (default)
            pipeline = pipeline
              .normalize()  // Histogram normalization
              .modulate({ brightness: 1.05, saturation: 1.1 })  // Slight boost
              .sharpen({ sigma: 1.0 });  // Moderate sharpen
            break;

          case 'high':
            // Aggressive enhancement
            pipeline = pipeline
              .normalize()  // Histogram normalization
              .clahe({ width: 3, height: 3, maxSlope: 3 })  // Local contrast
              .modulate({ brightness: 1.1, saturation: 1.2, hue: 0 })  // Boost colors
              .sharpen({ sigma: 1.5 });  // Strong sharpen
            break;
        }

        await pipeline.toFile(outputPath);

        const inputStats = fs.statSync(input);
        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Auto-enhancement complete!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  Level: ${level}`));
        console.log(chalk.dim(`  Applied: ${level === 'low' ? 'Normalize + Light sharpen' : level === 'medium' ? 'Normalize + Color boost + Sharpen' : 'Normalize + CLAHE + Color boost + Strong sharpen'}`));
        console.log(chalk.dim(`  File size: ${(inputStats.size / 1024).toFixed(2)}KB → ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Auto-enhancement failed'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
