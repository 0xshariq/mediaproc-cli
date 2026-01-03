import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
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

      const spinner = ora('Validating inputs...').start();

      try {
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
          suffix: '-negated',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Negate alpha: ${options.alpha ? 'yes' : 'no'}`));
          console.log(chalk.dim(`  Quality: ${options.quality || 90}`));
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run mode - no changes will be made\n'));
          console.log(chalk.green(`Would process ${inputFiles.length} image(s):`));
          inputFiles.forEach((inputFile, index) => {
            const outputPath = outputPaths.get(inputFile);
            console.log(chalk.dim(`  ${index + 1}. ${path.basename(inputFile)} → ${path.basename(outputPath!)}`));
          });
          return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const [index, inputFile] of inputFiles.entries()) {
          const outputPath = outputPaths.get(inputFile)!;
          const fileName = path.basename(inputFile);
          
          spinner.start(`Processing ${index + 1}/${inputFiles.length}: ${fileName}...`);

          try {
            const metadata = await createSharpInstance(inputFile).metadata();
            const pipeline = createSharpInstance(inputFile).negate({ alpha: options.alpha || false });

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline.jpeg({ quality: options.quality || 90 });
            } else if (outputExt === '.png') {
              pipeline.png({ quality: options.quality || 90 });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality: options.quality || 90 });
            }

            await pipeline.toFile(outputPath);
            
            if (options.verbose) {
              spinner.succeed(chalk.green(`✓ ${fileName} processed (${metadata.width}x${metadata.height})`));
            } else {
              spinner.succeed(chalk.green(`✓ ${fileName} processed`));
            }
            successCount++;
          } catch (error) {
            spinner.fail(chalk.red(`✗ Failed: ${fileName}`));
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
