import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface PixelateOptions {
  input: string;
  output?: string;
  pixels?: number;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function pixelateCommand(imageCmd: Command): void {
  imageCmd
    .command('pixelate <input>')
    .description('Apply pixelate effect (mosaic/retro style)')
    .option('-p, --pixels <size>', 'Pixel size 2-50 (default: 10)', parseInt, 10)
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for pixelate command')
    .action(async (input: string, options: PixelateOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'pixelate',
          emoji: '🎮',
          description: 'Apply pixelate/mosaic effect to images. Perfect for retro gaming aesthetics, privacy protection, and artistic effects.',
          usage: ['pixelate <input>', 'pixelate <input> --pixels 20', 'pixelate <input> -p 5 -o retro.jpg'],
          options: [
            { flag: '-p, --pixels <size>', description: 'Pixel size 2-50 (default: 10) - larger = more pixelated' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'pixelate photo.jpg', description: 'Apply default pixelation' },
            { command: 'pixelate face.jpg --pixels 20', description: 'Heavy pixelation for privacy' },
            { command: 'pixelate image.png -p 5', description: 'Subtle pixel art effect' },
            { command: 'pixelate game.jpg --pixels 8 -o retro.jpg', description: '8-bit retro gaming style' }
          ],
          additionalSections: [
            {
              title: 'Pixel Size Guide',
              items: [
                '2-5 - Subtle pixelation, retains detail',
                '8-12 - Classic 8-bit/16-bit gaming style',
                '15-25 - Strong effect, good for privacy',
                '30-50 - Extreme pixelation, very blocky'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Retro/vintage gaming aesthetics',
                'Privacy protection (blur faces/text)',
                'Artistic mosaic effects',
                'Censorship/redaction',
                '8-bit style graphics',
                'Low-resolution vintage look'
              ]
            }
          ],
          tips: [
            'Start with 10 and adjust to preference',
            'Larger pixels = stronger effect',
            'Works great for retro game art',
            'Combine with sepia for vintage feel'
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
          suffix: '-pixelated',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        const pixelSize = Math.max(2, Math.min(50, options.pixels || 10));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Pixel size: ${pixelSize}x${pixelSize}`));
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
            const width = metadata.width!;
            const height = metadata.height!;

            // Pixelate by shrinking then enlarging with nearest neighbor
            const shrunkWidth = Math.floor(width / pixelSize);
            const shrunkHeight = Math.floor(height / pixelSize);

            await createSharpInstance(inputFile)
              .resize(shrunkWidth, shrunkHeight, {
                kernel: 'nearest'
              })
              .resize(width, height, {
                kernel: 'nearest'
              })
              .toFile(outputPath);
            
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

      } catch (error) {
        spinner.fail(chalk.red('Failed to apply pixelate effect'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
