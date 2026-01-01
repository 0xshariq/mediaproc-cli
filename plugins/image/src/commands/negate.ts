import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface NegateOptions extends FilterOptions {
  alpha?: boolean;
  help?: boolean;
}

export function negateCommand(imageCmd: Command): void {
  imageCmd
    .command('negate <input>')
    .description('Create negative/inverted image')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--alpha', 'Also negate alpha channel')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for negate command')
    .action(async (input: string, options: NegateOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'negate',
          emoji: '🔄',
          description: 'Create negative (inverted) image by reversing all colors. Perfect for artistic effects, X-ray style images, or creating unique visual styles.',
          usage: ['negate <input>', 'negate <input> --alpha', 'negate <input> -o output.jpg'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-negative.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--alpha', description: 'Also invert alpha/transparency channel' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'negate photo.jpg', description: 'Create negative image' },
            { command: 'negate image.png --alpha', description: 'Negate including alpha channel' },
            { command: 'negate pic.jpg -o inverted.jpg', description: 'Negate with custom output' }
          ],
          additionalSections: [
            {
              title: 'Use Cases',
              items: [
                'Artistic effects - Create unique visual styles',
                'X-ray style - Medical/technical aesthetic',
                'Film negatives - Traditional photo effect',
                'High contrast - Alternative viewing mode',
                'Dark mode - Invert for different theme'
              ]
            }
          ],
          tips: [
            'Negating twice returns to original image',
            'Works great for creating dark themes',
            'Combine with grayscale for classic negative look',
            'Use --alpha flag only if image has transparency'
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
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-negative${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Negate alpha: ${options.alpha ? 'yes' : 'no'}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would negate image:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input).negate({ alpha: options.alpha || false });

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

        spinner.succeed(chalk.green('✓ Image negated successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to negate image'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
