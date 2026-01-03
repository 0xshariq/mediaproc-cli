import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface SepiaOptions {
  input: string;
  output?: string;
  intensity?: number;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function sepiaCommand(imageCmd: Command): void {
  imageCmd
    .command('sepia <input>')
    .description('Apply sepia tone effect (vintage/antique look)')
    .option('-i, --intensity <value>', 'Sepia intensity 0-100 (default: 80)', parseFloat, 80)
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for sepia command')
    .action(async (input: string, options: SepiaOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'sepia',
          emoji: '📜',
          description: 'Apply sepia tone effect to create vintage, antique, or nostalgic photographs. Converts colors to warm brown tones.',
          usage: ['sepia <input>', 'sepia <input> -i 90', 'sepia <input> -o vintage.jpg'],
          options: [
            { flag: '-i, --intensity <value>', description: 'Sepia intensity 0-100 (default: 80)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'sepia photo.jpg', description: 'Apply default sepia effect' },
            { command: 'sepia image.png -i 100', description: 'Maximum sepia intensity' },
            { command: 'sepia pic.jpg -i 50', description: 'Subtle sepia tone' },
            { command: 'sepia photo.jpg -o vintage.jpg', description: 'Save as vintage photo' }
          ],
          additionalSections: [
            {
              title: 'Intensity Guide',
              items: [
                '0-30 - Subtle warm tint',
                '40-60 - Moderate vintage look',
                '70-85 - Classic sepia (recommended)',
                '90-100 - Strong antique effect'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Create vintage photograph effects',
                'Historical photo restoration style',
                'Artistic nostalgic looks',
                'Wedding photo albums',
                'Heritage collections'
              ]
            }
          ],
          tips: [
            'Start with 80 intensity for classic look',
            'Combine with vignette for enhanced vintage feel',
            'Works great on portraits and landscapes',
            'Lower intensity for subtle warmth'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Validating inputs...').start();

      try {
        const intensity = Math.max(0, Math.min(100, options.intensity || 80)) / 100;

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
          suffix: '-sepia',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Intensity: ${(intensity * 100).toFixed(0)}%`));
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

            // Sepia tone matrix (standard sepia transformation)
            // Adjusted by intensity
            const sepiaMatrix = [
              [0.393 * intensity + (1 - intensity), 0.769 * intensity, 0.189 * intensity],
              [0.349 * intensity, 0.686 * intensity + (1 - intensity), 0.168 * intensity],
              [0.272 * intensity, 0.534 * intensity, 0.131 * intensity + (1 - intensity)]
            ];

            await createSharpInstance(inputFile)
              .recomb(sepiaMatrix as [[number, number, number], [number, number, number], [number, number, number]])
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
