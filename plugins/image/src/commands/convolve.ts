import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ConvolveOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface ConvolveOptionsExtended extends ConvolveOptions {
  help?: boolean;
}

// Predefined kernels
const KERNELS = {
  sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
  emboss: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]],
  'edge-detect': [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]],
  'box-blur': [[1/9, 1/9, 1/9], [1/9, 1/9, 1/9], [1/9, 1/9, 1/9]],
  'gaussian-blur': [[1/16, 2/16, 1/16], [2/16, 4/16, 2/16], [1/16, 2/16, 1/16]],
  laplacian: [[0, 1, 0], [1, -4, 1], [0, 1, 0]],
  'high-pass': [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]]
};

export function convolveCommand(imageCmd: Command): void {
  imageCmd
    .command('convolve <input>')
    .description('Apply custom convolution kernel (advanced filtering)')
    .option('-k, --kernel <preset>', `Predefined kernel: ${Object.keys(KERNELS).join(', ')}`)
    .option('--custom <matrix>', 'Custom kernel as JSON array: "[[1,2,1],[2,4,2],[1,2,1]]"')
    .option('--scale <value>', 'Kernel scale factor', parseFloat, 1)
    .option('--offset <value>', 'Kernel offset', parseFloat, 0)
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for convolve command')
    .action(async (input: string, options: ConvolveOptionsExtended) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'convolve',
          emoji: '🔬',
          description: 'Apply custom convolution kernels for advanced image filtering. Create edge detection, embossing, custom blurs, and more.',
          usage: ['convolve <input> --kernel sharpen', 'convolve <input> --kernel emboss', 'convolve <input> --custom "[[1,2,1],[2,4,2],[1,2,1]]"'],
          options: [
            { flag: '-k, --kernel <preset>', description: 'Predefined: sharpen, emboss, edge-detect, box-blur, gaussian-blur, laplacian, high-pass' },
            { flag: '--custom <matrix>', description: 'Custom kernel as JSON array' },
            { flag: '--scale <value>', description: 'Kernel scale factor (default: 1)' },
            { flag: '--offset <value>', description: 'Kernel offset value (default: 0)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'convolve image.jpg --kernel emboss', description: 'Apply emboss effect' },
            { command: 'convolve photo.png --kernel edge-detect', description: 'Detect edges' },
            { command: 'convolve pic.jpg --kernel gaussian-blur', description: 'Apply Gaussian blur' },
            { command: 'convolve image.jpg --custom "[[0,-1,0],[-1,5,-1],[0,-1,0]]"', description: 'Custom sharpening kernel' },
            { command: 'convolve photo.jpg --kernel laplacian --scale 2', description: 'Enhanced Laplacian with scale' }
          ],
          additionalSections: [
            {
              title: 'Predefined Kernels',
              items: [
                'sharpen - Enhance edges and details',
                'emboss - Create 3D raised effect',
                'edge-detect - Highlight edges',
                'box-blur - Simple average blur',
                'gaussian-blur - Smooth weighted blur',
                'laplacian - Edge detection (2nd derivative)',
                'high-pass - Emphasize high frequencies'
              ]
            },
            {
              title: 'Custom Kernels',
              items: [
                'Must be 3x3 or 5x5 matrix',
                'Format: JSON array of arrays',
                'Values typically sum to 1 (or use scale)',
                'Negative values create special effects',
                'Center value is key reference point'
              ]
            }
          ],
          tips: [
            'Start with predefined kernels',
            'Use scale to normalize custom kernels',
            'Emboss works great on textures',
            'Edge detection useful for analysis'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Applying convolution...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        let kernel: number[][];
        let kernelName: string;

        // Determine kernel to use
        if (options.kernel) {
          const kernelStr = String(options.kernel);
          if (!(kernelStr in KERNELS)) {
            spinner.fail(chalk.red(`Invalid kernel. Available: ${Object.keys(KERNELS).join(', ')}`));
            process.exit(1);
          }
          kernel = KERNELS[kernelStr as keyof typeof KERNELS];
          kernelName = kernelStr;
        } else if (options.custom) {
          try {
            kernel = JSON.parse(options.custom);
            kernelName = 'custom';
          } catch (e) {
            spinner.fail(chalk.red('Invalid custom kernel JSON format'));
            process.exit(1);
          }
        } else {
          spinner.fail(chalk.red('Please specify --kernel or --custom'));
          process.exit(1);
        }

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(inputPath.dir, `${inputPath.name}-${kernelName}${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Kernel: ${kernelName}`));
          console.log(chalk.dim(`  Matrix: ${JSON.stringify(kernel)}`));
          if (options.scale !== 1) console.log(chalk.dim(`  Scale: ${options.scale}`));
          if (options.offset !== 0) console.log(chalk.dim(`  Offset: ${options.offset}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would apply convolution:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Kernel: ${kernelName}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();

        // Flatten kernel for Sharp (expects 1D array)
        const flatKernel = kernel.flat();
        const kernelSize = Math.sqrt(flatKernel.length);

        await createSharpInstance(input)
          .convolve({
            width: kernelSize,
            height: kernelSize,
            kernel: flatKernel,
            scale: options.scale,
            offset: options.offset
          })
          .toFile(outputPath);

        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Convolution applied successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  Kernel: ${kernelName} (${kernelSize}x${kernelSize})`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to apply convolution'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
