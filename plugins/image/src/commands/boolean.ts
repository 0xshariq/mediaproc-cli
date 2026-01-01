import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
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
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

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

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-boolean${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Operand: ${options.operand}`));
          console.log(chalk.dim(`  Operation: ${operation.toUpperCase()}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would perform boolean operation:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Operand: ${options.operand}`));
          console.log(chalk.dim(`  Operation: ${operation.toUpperCase()}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const operandBuffer = await createSharpInstance(options.operand).toBuffer();
        
        const pipeline = createSharpInstance(input).boolean(operandBuffer, operation as 'and' | 'or' | 'eor');

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

        spinner.succeed(chalk.green('✓ Boolean operation applied successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Operand: ${options.operand}`));
        console.log(chalk.dim(`  Operation: ${operation.toUpperCase()}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)} KB`));
      } catch (error) {
        spinner.fail(chalk.red('Failed to apply boolean operation'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
