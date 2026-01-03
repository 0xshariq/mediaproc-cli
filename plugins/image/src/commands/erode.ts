import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface ErodeOptions extends ImageOptions {}

export function erodeCommand(imageCmd: Command): void {
  const cmd = imageCmd
    .command('erode <input>')
    .description('Erode image (expand dark regions)')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output');
  
  cmd.addHelpText('after', () => {
    return '\n' +
        createStandardHelp({
          commandName: 'erode',
          emoji: '⚫',
          description: 'Apply morphological erosion to expand dark regions and shrink bright areas. Useful for removing noise and separating objects.',
          usage: ['erode <input>', 'erode <input> -o eroded.png'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-eroded.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'erode mask.png', description: 'Erode binary mask' },
            { command: 'erode document.jpg -o clean.jpg', description: 'Remove small bright spots' },
            { command: 'erode text.png --verbose', description: 'Thin text with details' }
          ],
          additionalSections: [
            {
              title: 'What is Erosion?',
              items: [
                'Morphological operation from image processing',
                'Expands dark (low-value) regions',
                'Shrinks bright (high-value) regions',
                'Opposite of dilation',
                'Uses 3x3 kernel by default'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Remove small bright noise/spots',
                'Separate touching objects',
                'Thin bright features (text, lines)',
                'Create borders around objects',
                'Clean up binary masks'
              ]
            },
            {
              title: 'Common Workflows',
              items: [
                'Noise removal: erode → dilate (opening)',
                'Edge detection: subtract eroded from original',
                'Object separation: multiple erosions',
                'Text processing: thin characters',
                'Mask refinement in image segmentation'
              ]
            },
            {
              title: 'Tips',
              items: [
                'Works best on binary or high-contrast images',
                'Multiple erosions = stronger effect',
                'Combine with dilate for morphological opening',
                'Useful before object counting/separation'
              ]
            }
          ],
          tips: [
            'Opposite effect of dilate command',
            'Use on binary/grayscale images',
            'Apply multiple times for stronger effect',
            'Useful for separating connected objects'
          ]
        });
  });
  
  cmd.action(async (input: string, options: ErodeOptions) => {
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
          suffix: '-eroded',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Operation: Morphological erosion (3x3 kernel)`));
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

        // Erosion kernel (3x3 matrix)
        const erodeKernel = {
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
        };

        for (const [index, inputFile] of inputFiles.entries()) {
          const outputPath = outputPaths.get(inputFile)!;
          const fileName = path.basename(inputFile);
          
          spinner.start(`Processing ${index + 1}/${inputFiles.length}: ${fileName}...`);

          try {
            const pipeline = createSharpInstance(inputFile).convolve(erodeKernel);

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline.jpeg({ quality: options.quality || 90 });
            } else if (outputExt === '.png') {
              pipeline.png({ quality: options.quality || 90 });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality: options.quality || 90 });
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
      } catch (error) {
        spinner.fail(chalk.red('Failed to apply erosion'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
