import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
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
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const mode = options.mode || 'horizontal';
        const validModes = ['horizontal', 'vertical', 'both', 'quad'];
        
        if (!validModes.includes(mode)) {
          spinner.fail(chalk.red(`Invalid mode: ${mode}. Use: ${validModes.join(', ')}`));
          process.exit(1);
        }

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(inputPath.dir, `${inputPath.name}-mirror-${mode}${inputPath.ext}`);

        const sharpInstance = createSharpInstance(input);
        const metadata = await sharpInstance.metadata();
        const width = metadata.width!;
        const height = metadata.height!;

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input} (${width}x${height})`));
          console.log(chalk.dim(`  Mode: ${mode}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green(`✓ Would create ${mode} mirror effect`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          return;
        }

        let resultBuffer: Buffer;

        if (mode === 'horizontal') {
          // Mirror left to right
          const originalBuffer = await sharpInstance.toBuffer();
          const flippedBuffer = await createSharpInstance(originalBuffer).flop().toBuffer();
          
          // Stack side by side
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
          // Mirror top to bottom
          const originalBuffer = await sharpInstance.toBuffer();
          const flippedBuffer = await createSharpInstance(originalBuffer).flip().toBuffer();
          
          // Stack top and bottom
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
          // Mirror both axes (2x2 grid)
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
          // Kaleidoscope: take center portion and mirror in all 4 quadrants
          const halfWidth = Math.floor(width / 2);
          const halfHeight = Math.floor(height / 2);
          
          // Extract center quarter
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

        // Save result
        await createSharpInstance(resultBuffer).toFile(outputPath);

        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Mirror effect created successfully!'));
        console.log(chalk.dim(`  Mode: ${mode}`));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to create mirror effect'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
