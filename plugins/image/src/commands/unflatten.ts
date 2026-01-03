import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface UnflattenOptions extends ImageOptions {
}

export function unflattenCommand(imageCmd: Command): void {
  const cmd = imageCmd
    .command('unflatten <input>')
    .description('Add alpha channel to RGB image (inverse of flatten)')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output');

  cmd.addHelpText('after', () => {
    return '\n' + createStandardHelp({
      commandName: 'unflatten',
      emoji: '🔓',
      description: 'Add alpha channel to image (convert RGB to RGBA). Opposite of flatten command.',
      usage: ['unflatten <input>', 'unflatten <input> -o transparent.png'],
      options: [
        { flag: '-o, --output <path>', description: 'Output file path (default: <input>-unflat.png)' },
        { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
        { flag: '--dry-run', description: 'Preview changes without executing' },
        { flag: '-v, --verbose', description: 'Show detailed output' }
      ],
      examples: [
        { command: 'unflatten image.jpg', description: 'Add alpha channel' },
        { command: 'unflatten photo.jpg -o with-alpha.png', description: 'Convert JPG to PNG with alpha' }
      ],
      additionalSections: [
        {
          title: 'Use Cases',
          items: [
            'Prepare image for compositing operations',
            'Convert JPEG to PNG with transparency support',
            'Add alpha channel before applying transparency',
            'Prepare for further alpha manipulations'
          ]
        }
      ],
      tips: [
        'All pixels will be fully opaque after unflatten',
        'Use PNG format to preserve alpha channel',
        'Required before some compositing operations',
        'Increases file size (adds alpha data)'
      ]
    });
  });

  cmd.action(async (input: string, options: UnflattenOptions) => {
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
          suffix: '-unflat',
          newExtension: '.png', // Unflatten typically outputs PNG
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
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
            const pipeline = createSharpInstance(inputFile).unflatten();

            // Unflatten typically outputs PNG to preserve alpha
            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.png') {
              pipeline.png({ quality: options.quality || 90 });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality: options.quality || 90 });
            } else {
              pipeline.png({ quality: options.quality || 90 });
            }

            await pipeline.toFile(outputPath);
            
            spinner.succeed(chalk.green(`✓ ${fileName} processed`));
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
        console.log(chalk.cyan('  ℹ  Alpha channel added (all pixels fully opaque)'));
      } catch (error) {
        spinner.fail(chalk.red('Failed to unflatten image'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
