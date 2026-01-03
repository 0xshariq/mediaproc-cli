import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface VignetteOptions {
  input: string;
  output?: string;
  strength?: number;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function vignetteCommand(imageCmd: Command): void {
  imageCmd
    .command('vignette <input>')
    .description('Add vignette effect (darkened edges)')
    .option('-s, --strength <value>', 'Vignette strength 0-100 (default: 50)', parseFloat, 50)
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for vignette command')
    .action(async (input: string, options: VignetteOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'vignette',
          emoji: '🌓',
          description: 'Add vignette effect by darkening or lightening the edges of an image. Creates focus on the center and adds artistic mood.',
          usage: ['vignette <input>', 'vignette <input> -s 70', 'vignette <input> -o artistic.jpg'],
          options: [
            { flag: '-s, --strength <value>', description: 'Vignette strength 0-100 (default: 50)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'vignette photo.jpg', description: 'Apply default vignette' },
            { command: 'vignette portrait.png -s 80', description: 'Strong vignette effect' },
            { command: 'vignette landscape.jpg -s 30', description: 'Subtle edge darkening' },
            { command: 'vignette image.jpg -o artistic.jpg', description: 'Save with vignette' }
          ],
          additionalSections: [
            {
              title: 'Strength Guide',
              items: [
                '0-20 - Very subtle, barely noticeable',
                '30-50 - Moderate, natural look (recommended)',
                '60-80 - Strong, dramatic effect',
                '90-100 - Very intense, artistic'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Portrait photography - focus on subject',
                'Vintage/retro effects',
                'Artistic mood creation',
                'Direct viewer attention to center',
                'Wedding and event photography',
                'Social media posts'
              ]
            }
          ],
          tips: [
            'Start with 50 and adjust to taste',
            'Works great with portraits',
            'Combine with sepia for vintage look',
            'Lower strength for natural results'
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
          suffix: '-vignette',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        const strength = Math.max(0, Math.min(100, options.strength || 50)) / 100;

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Strength: ${(strength * 100).toFixed(0)}%`));
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

            // Create vignette overlay using SVG
            const vignetteOverlay = Buffer.from(`
              <svg width="${width}" height="${height}">
                <defs>
                  <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
                    <stop offset="40%" style="stop-color:white;stop-opacity:0" />
                    <stop offset="100%" style="stop-color:black;stop-opacity:${strength}" />
                  </radialGradient>
                </defs>
                <rect width="${width}" height="${height}" fill="url(#vignette)" />
              </svg>
            `);

            await createSharpInstance(inputFile)
              .composite([{
                input: vignetteOverlay,
                blend: 'multiply'
              }])
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
        spinner.fail(chalk.red('Failed to add vignette'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
