import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface DilateOptions extends ImageOptions { }

export function dilateCommand(imageCmd: Command): void {
    const cmd = imageCmd
        .command('dilate <input>')
        .description('Dilate image (expand bright regions)')
        .option('-o, --output <path>', 'Output file path')
        .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
        .option('--dry-run', 'Show what would be done without executing')
        .option('-v, --verbose', 'Verbose output');

    cmd.addHelpText('after', (): string => {
        createStandardHelp({
            commandName: 'dilate',
            emoji: '⚪',
            description: 'Apply morphological dilation to expand bright regions and fill gaps. Useful for closing holes and connecting nearby objects.',
            usage: ['dilate <input>', 'dilate <input> -o dilated.png'],
            options: [
                { flag: '-o, --output <path>', description: 'Output file path (default: <input>-dilated.<ext>)' },
                { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
                { flag: '--dry-run', description: 'Preview changes without executing' },
                { flag: '-v, --verbose', description: 'Show detailed output' }
            ],
            examples: [
                { command: 'dilate mask.png', description: 'Expand white regions in mask' },
                { command: 'dilate document.jpg -o filled.jpg', description: 'Fill small gaps' },
                { command: 'dilate binary.png --verbose', description: 'Connect nearby objects' }
            ],
            additionalSections: [
                {
                    title: 'What is Dilation?',
                    items: [
                        'Morphological operation from image processing',
                        'Expands bright (high-value) regions',
                        'Shrinks dark (low-value) regions',
                        'Opposite of erosion',
                        'Uses 3x3 kernel by default'
                    ]
                },
                {
                    title: 'Use Cases',
                    items: [
                        'Fill small holes/gaps in objects',
                        'Connect nearby components',
                        'Expand boundaries of objects',
                        'Remove small dark noise',
                        'Strengthen weak edges'
                    ]
                },
                {
                    title: 'Common Workflows',
                    items: [
                        'Hole filling: dilate → erode (closing)',
                        'Edge detection: subtract original from dilated',
                        'Object joining: multiple dilations',
                        'Mask expansion for compositing',
                        'Feature enhancement in binary images'
                    ]
                },
                {
                    title: 'Tips',
                    items: [
                        'Works best on binary or high-contrast images',
                        'Multiple dilations = stronger effect',
                        'Combine with erode for morphological closing',
                        'Useful before filling/connecting operations'
                    ]
                }
            ],
            tips: [
                'Opposite effect of erode command',
                'Use on binary/grayscale images',
                'Apply multiple times for stronger effect',
                'Useful for connecting nearby objects'
            ]
        });
        return '';
    });

    cmd.action(async (input: string, options: DilateOptions) => {
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
              suffix: '-dilated',
              preserveStructure: inputFiles.length > 1,
            });

            spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

            if (options.verbose) {
              console.log(chalk.blue('\nConfiguration:'));
              console.log(chalk.dim(`  Operation: Morphological dilation (3x3 kernel)`));
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

            // Create a 3x3 dilation kernel (all ones)
            const dilationKernel = {
                width: 3,
                height: 3,
                kernel: [1, 1, 1, 1, 1, 1, 1, 1, 1]
            };

            for (const [index, inputFile] of inputFiles.entries()) {
              const outputPath = outputPaths.get(inputFile)!;
              const fileName = path.basename(inputFile);
              
              spinner.start(`Processing ${index + 1}/${inputFiles.length}: ${fileName}...`);

              try {
                const pipeline = createSharpInstance(inputFile).convolve(dilationKernel);

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
            spinner.fail(chalk.red('Failed to apply dilation'));
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(chalk.red(errorMessage));
            process.exit(1);
        }
    });
}
