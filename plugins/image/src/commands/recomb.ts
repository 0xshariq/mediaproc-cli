import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface RecombOptions extends ImageOptions {
    matrix?: string;
    help?: boolean;
}

export function recombCommand(imageCmd: Command): void {
    imageCmd
        .command('recomb <input>')
        .description('Recombine RGB channels using matrix')
        .option('--matrix <values>', 'Recombination matrix (3x3) as JSON', '[[1,0,0],[0,1,0],[0,0,1]]')
        .option('-o, --output <path>', 'Output file path')
        .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
        .option('--dry-run', 'Show what would be done without executing')
        .option('-v, --verbose', 'Verbose output')
        .option('--help', 'Display help for recomb command')
        .action(async (input: string, options: RecombOptions) => {
            if (options.help) {
                createStandardHelp({
                    commandName: 'recomb',
                    emoji: '🌈',
                    description: 'Recombine image channels using a transformation matrix. Create custom color effects by mixing R, G, B channels.',
                    usage: [
                        'recomb <input> --matrix "[[1,0,0],[0,1,0],[0,0,1]]"',
                        'recomb <input> --matrix "[[0,0,1],[0,1,0],[1,0,0]]" (swap R/B)'
                    ],
                    options: [
                        { flag: '--matrix <values>', description: '3x3 matrix as JSON array (default: identity)' },
                        { flag: '-o, --output <path>', description: 'Output file path (default: <input>-recomb.<ext>)' },
                        { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
                        { flag: '--dry-run', description: 'Preview changes without executing' },
                        { flag: '-v, --verbose', description: 'Show detailed output' }
                    ],
                    examples: [
                        { command: 'recomb image.jpg --matrix "[[0,0,1],[0,1,0],[1,0,0]]"', description: 'Swap red and blue channels' },
                        { command: 'recomb photo.jpg --matrix "[[0.5,0.5,0],[0.5,0.5,0],[0,0,1]]"', description: 'Average red/green, keep blue' },
                        { command: 'recomb pic.jpg --matrix "[[1,0,0],[1,0,0],[1,0,0]]"', description: 'Use red channel for all' }
                    ],
                    additionalSections: [
                        {
                            title: 'Matrix Format',
                            items: [
                                '3x3 matrix: [[R],[G],[B]]',
                                'Each row defines output channel',
                                'Each column represents input channel (R, G, B)',
                                'Identity [[1,0,0],[0,1,0],[0,0,1]] = no change'
                            ]
                        },
                        {
                            title: 'Common Operations',
                            items: [
                                'Swap R/B: [[0,0,1],[0,1,0],[1,0,0]]',
                                'Swap R/G: [[0,1,0],[1,0,0],[0,0,1]]',
                                'Grayscale: [[0.33,0.33,0.33],...] (all rows same)',
                                'Red only: [[1,0,0],[0,0,0],[0,0,0]]',
                                'Remove red: [[0,0,0],[0,1,0],[0,0,1]]'
                            ]
                        },
                        {
                            title: 'Creative Effects',
                            items: [
                                'Channel shifting creates false color effects',
                                'Mixing channels creates unique tones',
                                'Can simulate color blindness',
                                'Create infrared-like effects'
                            ]
                        }
                    ],
                    tips: [
                        'Identity matrix produces no change',
                        'Values typically 0 to 1',
                        'Can use negative values for inversions',
                        'Useful for color correction and artistic effects'
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

                // Parse matrix
                const matrixStr = options.matrix || '[[1,0,0],[0,1,0],[0,0,1]]';
                let matrix: number[][];
                try {
                    matrix = JSON.parse(matrixStr);
                    if (!Array.isArray(matrix) || matrix.length !== 3) {
                        throw new Error('Matrix must be 3x3');
                    }
                    for (const row of matrix) {
                        if (!Array.isArray(row) || row.length !== 3) {
                            throw new Error('Each row must have 3 values');
                        }
                    }
                } catch (e) {
                    spinner.fail(chalk.red('Invalid matrix format. Use 3x3 JSON array like [[1,0,0],[0,1,0],[0,0,1]]'));
                    process.exit(1);
                }

                const inputPath = path.parse(input);
                const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-recomb${inputPath.ext}`);

                if (options.verbose) {
                    spinner.info(chalk.blue('Configuration:'));
                    console.log(chalk.dim(`  Input: ${input}`));
                    console.log(chalk.dim(`  Output: ${outputPath}`));
                    console.log(chalk.dim(`  Matrix: ${JSON.stringify(matrix)}`));
                    spinner.start('Processing...');
                }

                if (options.dryRun) {
                    spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
                    console.log(chalk.green('✓ Would recombine channels:'));
                    console.log(chalk.dim(`  Input: ${input}`));
                    console.log(chalk.dim(`  Matrix: ${JSON.stringify(matrix)}`));
                    return;
                }

                const metadata = await createSharpInstance(input).metadata();
                const pipeline = createSharpInstance(input).recomb(matrix);

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

                spinner.succeed(chalk.green('✓ Channels recombined successfully!'));
                console.log(chalk.dim(`  Input: ${input}`));
                console.log(chalk.dim(`  Output: ${outputPath}`));
                console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
                console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)} KB`));
            } catch (error) {
                spinner.fail(chalk.red('Failed to recombine channels'));
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(chalk.red(errorMessage));
                process.exit(1);
            }
        });
}
