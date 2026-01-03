import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface MirrorOptions {
  input: string;
  mode?: 'horizontal' | 'vertical' | 'both' | 'quad';
  output?: string;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function mirrorCommand(imageCmd: Command): void {
  imageCmd
    .command('mirror <input>')
    .description('Create mirror/kaleidoscope effects')
    .option('-m, --mode <mode>', 'Mirror mode: horizontal, vertical, both, quad (kaleidoscope) (default: horizontal)', 'horizontal')
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for mirror command')
    .action(async (input: string, options: MirrorOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'mirror',
          emoji: '🪞',
          description: 'Create stunning mirror and kaleidoscope effects by reflecting images horizontally, vertically, or in quadrants. Generate artistic symmetrical images.',
          usage: ['mirror <input>', 'mirror <input> --mode vertical', 'mirror photo.jpg -m quad -o kaleidoscope.jpg'],
          options: [
            { flag: '-m, --mode <mode>', description: 'Mirror mode: horizontal, vertical, both, quad (default: horizontal)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-mirror-<mode>.ext)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'mirror photo.jpg', description: 'Horizontal mirror (left-right symmetry)' },
            { command: 'mirror photo.jpg --mode vertical', description: 'Vertical mirror (top-bottom symmetry)' },
            { command: 'mirror photo.jpg --mode both', description: 'Both horizontal and vertical mirroring' },
            { command: 'mirror photo.jpg --mode quad', description: 'Quadrant kaleidoscope effect' },
            { command: 'mirror landscape.jpg -m vertical -o reflection.jpg', description: 'Water reflection effect' }
          ],
          additionalSections: [
            {
              title: 'Mirror Modes',
              items: [
                'horizontal - Mirror left to right (creates left-right symmetry)',
                'vertical - Mirror top to bottom (creates top-bottom symmetry)',
                'both - Mirror both axes (4-way symmetry)',
                'quad - Kaleidoscope (mirrors each quadrant for artistic effect)'
              ]
            },
            {
              title: 'Creative Uses',
              items: [
                'Water reflections (vertical mode)',
                'Symmetrical portraits',
                'Kaleidoscope art (quad mode)',
                'Abstract patterns',
                'Rorschach test style images',
                'Architectural symmetry',
                'Mandala-like designs'
              ]
            },
            {
              title: 'Best Practices',
              items: [
                'Works best with asymmetric input images',
                'Use vertical mode for water/reflection effects',
                'Use quad mode for psychedelic art',
                'Experiment with different modes on the same image',
                'Combine with other effects for unique results'
              ]
            }
          ],
          tips: [
            'Horizontal mode: great for face symmetry',
            'Vertical mode: perfect for reflections',
            'Quad mode: creates mandala-like patterns',
            'Try mirroring already processed images'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Creating mirror effect...').start();

      try {
        // Validate input paths
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

        const mode = options.mode || 'horizontal';
        const validModes = ['horizontal', 'vertical', 'both', 'quad'];
        
        if (!validModes.includes(mode)) {
          spinner.fail(chalk.red(`Invalid mode: ${mode}. Use: ${validModes.join(', ')}`));
          process.exit(1);
        }

        const outputPaths = resolveOutputPaths(inputFiles, outputDir, {
          suffix: `-mirror-${mode}`,
          preserveStructure: inputFiles.length > 1,
        });

        let successCount = 0;
        let failCount = 0;

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Found ${inputFiles.length} file(s)`));
          console.log(chalk.dim(`  Mode: ${mode}`));
          console.log(chalk.dim(`  Output directory: ${outputDir}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green(`✓ Would create ${mode} mirror effect for ${inputFiles.length} file(s):`));
          inputFiles.forEach(f => console.log(chalk.dim(`  - ${f}`)));
          return;
        }

        // Process all files
        for (const inputFile of inputFiles) {
          try {
            const fileName = path.basename(inputFile);
            const outputPath = outputPaths.get(inputFile)!;

            const sharpInstance = createSharpInstance(inputFile);
            const metadata = await sharpInstance.metadata();
            const width = metadata.width!;
            const height = metadata.height!;

            let resultBuffer: Buffer;

            if (mode === 'horizontal') {
              const originalBuffer = await sharpInstance.toBuffer();
              const flippedBuffer = await createSharpInstance(originalBuffer).flop().toBuffer();
              
              resultBuffer = await createSharpInstance({
                create: {
                  width: width * 2,
                  height: height,
                  channels: 4,
                  background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
              })
              .composite([
                { input: originalBuffer, left: 0, top: 0 },
                { input: flippedBuffer, left: width, top: 0 }
              ])
              .toBuffer();

            } else if (mode === 'vertical') {
              const originalBuffer = await sharpInstance.toBuffer();
              const flippedBuffer = await createSharpInstance(originalBuffer).flip().toBuffer();
              
              resultBuffer = await createSharpInstance({
                create: {
                  width: width,
                  height: height * 2,
                  channels: 4,
                  background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
              })
              .composite([
                { input: originalBuffer, left: 0, top: 0 },
                { input: flippedBuffer, left: 0, top: height }
              ])
              .toBuffer();

            } else if (mode === 'both') {
              const originalBuffer = await sharpInstance.toBuffer();
              const flopBuffer = await createSharpInstance(originalBuffer).flop().toBuffer();
              const flipBuffer = await createSharpInstance(originalBuffer).flip().toBuffer();
              const bothBuffer = await createSharpInstance(originalBuffer).flop().flip().toBuffer();
              
              resultBuffer = await createSharpInstance({
                create: {
                  width: width * 2,
                  height: height * 2,
                  channels: 4,
                  background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
              })
              .composite([
                { input: originalBuffer, left: 0, top: 0 },
                { input: flopBuffer, left: width, top: 0 },
                { input: flipBuffer, left: 0, top: height },
                { input: bothBuffer, left: width, top: height }
              ])
              .toBuffer();

            } else { // quad
              const halfWidth = Math.floor(width / 2);
              const halfHeight = Math.floor(height / 2);
              
              const centerBuffer = await sharpInstance
                .extract({ left: halfWidth - Math.floor(halfWidth/2), top: halfHeight - Math.floor(halfHeight/2), width: halfWidth, height: halfHeight })
                .toBuffer();
              
              const flopBuffer = await createSharpInstance(centerBuffer).flop().toBuffer();
              const flipBuffer = await createSharpInstance(centerBuffer).flip().toBuffer();
              const bothBuffer = await createSharpInstance(centerBuffer).flop().flip().toBuffer();
              
              resultBuffer = await createSharpInstance({
                create: {
                  width: halfWidth * 2,
                  height: halfHeight * 2,
                  channels: 4,
                  background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
              })
              .composite([
                { input: centerBuffer, left: 0, top: 0 },
                { input: flopBuffer, left: halfWidth, top: 0 },
                { input: flipBuffer, left: 0, top: halfHeight },
                { input: bothBuffer, left: halfWidth, top: halfHeight }
              ])
              .toBuffer();
            }

            await createSharpInstance(resultBuffer).toFile(outputPath);

            spinner.succeed(chalk.green(`✓ ${fileName} mirror effect created`));
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
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
