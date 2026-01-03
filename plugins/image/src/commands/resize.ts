import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import type { ResizeOptions } from '../types.js';
import { createSharpInstance, sharp } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';
// Dependency injection: Import global path validator from core
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';

export function resizeCommand(imageCmd: Command): void {
  imageCmd
    .command('resize <input>')
    .description('Resize image to specified dimensions')
    .option('-w, --width <width>', 'Width in pixels', parseInt)
    .option('-h, --height <height>', 'Height in pixels', parseInt)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--fit <fit>', 'Fit mode: cover, contain, fill, inside, outside', 'cover')
    .option('--maintain-aspect-ratio', 'Maintain aspect ratio (default: true)', true)
    .option('--no-maintain-aspect-ratio', 'Do not maintain aspect ratio')
    .option('--position <position>', 'Position for cover/contain: center, top, bottom, left, right, etc.', 'center')
    .option('--background <color>', 'Background color for contain/outside (hex, rgb, or named)', '#ffffff')
    .option('--kernel <kernel>', 'Kernel for resizing: nearest, cubic, mitchell, lanczos2, lanczos3', 'lanczos3')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for resize command')
    .action(async (input: string, options: ResizeOptions) => {
      // Show help if requested
      if (options.help) {
        createStandardHelp({
          commandName: 'resize',
          emoji: '📐',
          description: 'Resize images to specified dimensions with advanced options and filters. Supports multiple fit modes, quality control, and various output formats.',
          usage: [
            'resize <input> -w <width>',
            'resize <input> -h <height>',
            'resize <input> -w <width> -h <height> [options]'
          ],
          options: [
            { flag: '-w, --width <width>', description: 'Width in pixels (auto if not specified)' },
            { flag: '-h, --height <height>', description: 'Height in pixels (auto if not specified)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-resized.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--fit <mode>', description: 'Fit mode: cover, contain, fill, inside, outside (default: cover)' },
            { flag: '--maintain-aspect-ratio', description: 'Maintain aspect ratio (default: true)' },
            { flag: '--no-maintain-aspect-ratio', description: 'Do not maintain aspect ratio (uses fill mode)' },
            { flag: '--position <position>', description: 'Position: center, top, bottom, left, right, etc. (default: center)' },
            { flag: '--background <color>', description: 'Background color for contain/outside (default: #ffffff)' },
            { flag: '--kernel <kernel>', description: 'Resize kernel: nearest, cubic, mitchell, lanczos2, lanczos3 (default: lanczos3)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'resize photo.jpg -w 800', description: 'Resize to 800px width, auto height' },
            { command: 'resize image.png -w 1920 -h 1080', description: 'Resize to Full HD dimensions' },
            { command: 'resize pic.jpg -w 500 -h 500 --fit cover', description: 'Crop to square keeping aspect ratio' },
            { command: 'resize logo.png -w 200 --fit contain --background transparent', description: 'Fit logo in 200px box' },
            { command: 'resize photo.jpg -w 1024 -q 80 -o output/resized.jpg', description: 'Resize with custom quality and output path' },
            { command: 'resize image.png -w 800 --kernel lanczos3 --verbose', description: 'High-quality resize with detailed output' },
            { command: 'resize test.jpg -w 500 -h 500 --dry-run', description: 'Preview resize without making changes' }
          ],
          additionalSections: [
            {
              title: 'Fit Modes Explained',
              items: [
                'cover - Crop to fill dimensions (default)',
                'contain - Fit within dimensions (may add padding)',
                'fill - Stretch to exact dimensions (ignores aspect ratio)',
                'inside - Resize to fit inside dimensions',
                'outside - Resize to fit outside dimensions'
              ]
            },
            {
              title: 'Supported Formats',
              items: [
                'Input: JPG, PNG, WebP, AVIF, TIFF, GIF, SVG',
                'Output: JPG, PNG, WebP, AVIF, TIFF (based on extension)'
              ]
            }
          ],
          tips: [
            'Use --dry-run to preview changes before applying',
            'Omit width or height to maintain aspect ratio automatically',
            'Use lanczos3 kernel for best quality (slower) or nearest for speed',
            'WebP and AVIF formats provide better compression than JPG'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Validating inputs...').start();

      try {
        // Validate dimensions
        if (!options.width && !options.height) {
          spinner.fail(chalk.red('At least one dimension (width or height) must be specified'));
          process.exit(1);
        }

        // Use global path validator (dependency injection)
        const { inputFiles, outputDir, errors } = validatePaths(input, options.output, {
          allowedExtensions: MediaExtensions.IMAGE,
          recursive: true,
        });

        // Check for validation errors
        if (errors.length > 0) {
          spinner.fail(chalk.red('Validation failed:'));
          errors.forEach(err => console.log(chalk.red(`  ✗ ${err}`)));
          process.exit(1);
        }

        if (inputFiles.length === 0) {
          spinner.fail(chalk.red('No valid image files found'));
          process.exit(1);
        }

        // Resolve output paths for all input files
        const outputPaths = resolveOutputPaths(inputFiles, outputDir, {
          suffix: '-resized',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Width: ${options.width || 'auto'}`));
          console.log(chalk.dim(`  Height: ${options.height || 'auto'}`));
          console.log(chalk.dim(`  Quality: ${options.quality}`));
          console.log(chalk.dim(`  Fit: ${options.fit}`));
          console.log(chalk.dim(`  Maintain aspect ratio: ${options.maintainAspectRatio !== false}`));
          console.log(chalk.dim(`  Kernel: ${options.kernel || 'lanczos3'}`));
        }

        // Dry run mode
        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run mode - no changes will be made\n'));
          console.log(chalk.green(`Would resize ${inputFiles.length} image(s):`));
          inputFiles.forEach((inputFile, index) => {
            const outputPath = outputPaths.get(inputFile);
            console.log(chalk.dim(`  ${index + 1}. ${path.basename(inputFile)} → ${path.basename(outputPath!)}`));
          });
          return;
        }

        // Process each input file
        let successCount = 0;
        let failCount = 0;

        for (const [index, inputFile] of inputFiles.entries()) {
          const outputPath = outputPaths.get(inputFile)!;
          const fileName = path.basename(inputFile);

          spinner.start(`Processing ${index + 1}/${inputFiles.length}: ${fileName}...`);

          try {
            // Get input image metadata
            const metadata = await createSharpInstance(inputFile).metadata();

            if (options.verbose) {
              console.log(chalk.dim(`    Original size: ${metadata.width}x${metadata.height}`));
            }

            // Build Sharp resize options
            const resizeOptions: sharp.ResizeOptions = {
              width: options.width,
              height: options.height,
              fit: options.fit as keyof sharp.FitEnum || 'cover',
              position: options.position as any || 'center',
              background: options.background || '#ffffff',
              kernel: options.kernel as keyof sharp.KernelEnum || 'lanczos3',
              withoutEnlargement: false,
            };

            // If maintain aspect ratio is false, use 'fill' fit mode
            if (options.maintainAspectRatio === false) {
              resizeOptions.fit = 'fill';
            }

            // Process image with Sharp
            const pipeline = createSharpInstance(inputFile).resize(resizeOptions);

            // Apply quality settings based on output format
            const outputExt = path.extname(outputPath).toLowerCase();

            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline.jpeg({ quality: options.quality || 90 });
            } else if (outputExt === '.png') {
              pipeline.png({ quality: options.quality || 90, compressionLevel: 9 });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality: options.quality || 90 });
            } else if (outputExt === '.avif') {
              pipeline.avif({ quality: options.quality || 90 });
            }

            // Save the resized image
            await pipeline.toFile(outputPath);

            // Get output metadata
            const outputMetadata = await createSharpInstance(outputPath).metadata();

            spinner.succeed(chalk.green(`✓ ${fileName} resized successfully`));

            if (options.verbose) {
              console.log(chalk.dim(`    New size: ${outputMetadata.width}x${outputMetadata.height}`));
              console.log(chalk.dim(`    Saved to: ${outputPath}`));
            }

            successCount++;
          } catch (error) {
            spinner.fail(chalk.red(`✗ Failed to resize ${fileName}`));
            if (options.verbose && error instanceof Error) {
              console.log(chalk.red(`    Error: ${error.message}`));
            }
            failCount++;
          }
        }

        // Final summary
        console.log(chalk.bold('\nResize Summary:'));
        console.log(chalk.green(`  ✓ Success: ${successCount}`));
        if (failCount > 0) {
          console.log(chalk.red(`  ✗ Failed: ${failCount}`));
        }
        console.log(chalk.dim(`  Output directory: ${outputDir}`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to resize images'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}

