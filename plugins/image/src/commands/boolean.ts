import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import * as fs from 'fs';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface BooleanOptions extends ImageOptions {
  operation: string;
  operand?: string;
}

export function booleanCommand(imageCmd: Command): void {
  const cmd = imageCmd
    .command('boolean <input>')
    .description('Perform boolean operations between images')
    .requiredOption('--operation <op>', 'Boolean operation: and, or, eor (XOR)')
    .requiredOption('--operand <path>', 'Second image for operation')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output');
  
  cmd.addHelpText('after', () => {
    return '\n' +
        createStandardHelp({
          commandName: 'boolean',
          emoji: '⚡',
          description: 'Perform bitwise boolean operations between two images. Combine images using AND, OR, or XOR (EOR) logic.',
          usage: [
            'boolean <input> --operation and --operand mask.png',
            'boolean <input> --operation or --operand overlay.png',
            'boolean <input> --operation eor --operand pattern.png'
          ],
          options: [
            { flag: '--operation <op>', description: 'Operation: and, or, eor (required)' },
            { flag: '--operand <path>', description: 'Second image path (required)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-boolean.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'boolean image.jpg --operation and --operand mask.png', description: 'AND operation (extract masked region)' },
            { command: 'boolean photo.jpg --operation or --operand overlay.png', description: 'OR operation (combine images)' },
            { command: 'boolean pic.jpg --operation eor --operand pattern.png', description: 'XOR operation (find differences)' }
          ],
          additionalSections: [
            {
              title: 'Operations',
              items: [
                'and: Bitwise AND - keeps pixels present in both',
                'or: Bitwise OR - combines pixels from both',
                'eor (XOR): Exclusive OR - highlights differences'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'AND: Apply masks, extract regions',
                'OR: Combine patterns, merge images',
                'XOR: Detect changes, create patterns',
                'Watermarking and steganography',
                'Image differencing'
              ]
            },
            {
              title: 'Requirements',
              items: [
                'Both images should have same dimensions',
                'Works best with grayscale or similar formats',
                'Output format follows input format',
                'Bitwise operations on pixel values'
              ]
            },
            {
              title: 'Tips',
              items: [
                'XOR useful for change detection',
                'AND useful for masking operations',
                'OR useful for compositing',
                'Consider converting to grayscale first'
              ]
            }
          ],
          tips: [
            'Images should have matching dimensions',
            'XOR highlights differences between images',
            'AND is useful for applying masks',
            'Results depend on pixel bit patterns'
          ]
        });
  });
  
  cmd.action(async (input: string, options: BooleanOptions) => {
      const spinner = ora('Processing image...').start();

      try {
        // Validate operand file exists (single file)
        if (!options.operand || !fs.existsSync(options.operand)) {
          spinner.fail(chalk.red(`Operand image not found: ${options.operand}`));
          process.exit(1);
        }

        const validOperations = ['and', 'or', 'eor'];
        const operation = options.operation.toLowerCase();
        if (!validOperations.includes(operation)) {
          spinner.fail(chalk.red(`Invalid operation. Use: ${validOperations.join(', ')}`));
          process.exit(1);
        }

        // Validate input paths (can be multiple)
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
          suffix: '-boolean',
          preserveStructure: inputFiles.length > 1,
        });

        let successCount = 0;
        let failCount = 0;

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Found ${inputFiles.length} file(s)`));
          console.log(chalk.dim(`  Operand: ${options.operand}`));
          console.log(chalk.dim(`  Operation: ${operation.toUpperCase()}`));
          console.log(chalk.dim(`  Output directory: ${outputDir}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green(`✓ Would perform ${operation.toUpperCase()} operation on ${inputFiles.length} file(s):`));
          inputFiles.forEach(f => console.log(chalk.dim(`  - ${f}`)));
          console.log(chalk.dim(`  Operand: ${options.operand}`));
          return;
        }

        // Preload operand buffer
        const operandBuffer = await createSharpInstance(options.operand).toBuffer();

        // Process all files
        for (const inputFile of inputFiles) {
          try {
            const fileName = path.basename(inputFile);
            const outputPath = outputPaths.get(inputFile)!;
            
            const pipeline = createSharpInstance(inputFile).boolean(operandBuffer, operation as 'and' | 'or' | 'eor');

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline.jpeg({ quality: options.quality || 90 });
            } else if (outputExt === '.png') {
              pipeline.png({ quality: options.quality || 90 });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality: options.quality || 90 });
            }

            await pipeline.toFile(outputPath);

            spinner.succeed(chalk.green(`✓ ${fileName} boolean operation applied`));
            successCount++;
          } catch (error) {
            spinner.fail(chalk.red(`✗ Failed: ${path.basename(inputFile)}`));
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
