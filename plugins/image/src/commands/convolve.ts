import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { ConvolveOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface ConvolveOptionsExtended extends ConvolveOptions {
  help?: boolean;
  custom?: string;
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

      const spinner = ora('Validating inputs...').start();

      try {
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
          suffix: `-${kernelName}`,
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        const flatKernel = kernel.flat();
        const kernelSize = Math.sqrt(flatKernel.length);

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Kernel: ${kernelName} (${kernelSize}x${kernelSize})`));
          console.log(chalk.dim(`  Matrix: ${JSON.stringify(kernel)}`));
          if (options.scale !== 1) console.log(chalk.dim(`  Scale: ${options.scale}`));
          if (options.offset !== 0) console.log(chalk.dim(`  Offset: ${options.offset}`));
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
            await createSharpInstance(inputFile)
              .convolve({
                width: kernelSize,
                height: kernelSize,
                kernel: flatKernel,
                scale: options.scale,
                offset: options.offset
              })
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
