import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import type { ConvertOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';
// Dependency injection: Import global path validator from core
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';

interface ConvertOptionsExtended extends ConvertOptions {
  help?: boolean;
}

export function convertCommand(imageCmd: Command): void {
  imageCmd
    .command('convert <input>')
    .description('Convert image to different format')
    .option('-f, --format <format>', 'Output format: jpg, png, webp, avif, tiff, gif', 'webp')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--compression <level>', 'PNG compression level (0-9)', parseInt, 9)
    .option('--progressive', 'Use progressive/interlaced format')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for convert command')
    .action(async (input: string, options: ConvertOptionsExtended) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'convert',
          emoji: '🔄',
          description: 'Convert images between different formats. Supports modern formats like WebP and AVIF for better compression and quality.',
          usage: ['convert <input> -f <format>', 'convert <input> -f <format> -o <output>', 'convert <input> -f webp -q 85'],
          options: [
            { flag: '-f, --format <format>', description: 'Output format: jpg, png, webp, avif, tiff, gif (default: webp)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>.<format>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--compression <level>', description: 'PNG compression level 0-9 (default: 9)' },
            { flag: '--progressive', description: 'Use progressive/interlaced format' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'convert photo.jpg -f webp', description: 'Convert JPG to WebP (modern, smaller)' },
            { command: 'convert image.png -f avif -q 80', description: 'Convert to AVIF with quality 80' },
            { command: 'convert pic.webp -f jpg', description: 'Convert WebP back to JPG' },
            { command: 'convert photo.jpg -f png --compression 9', description: 'Convert to PNG with max compression' },
            { command: 'convert image.png -f jpg --progressive', description: 'Convert to progressive JPG' }
          ],
          additionalSections: [
            {
              title: 'Format Guide',
              items: [
                'WebP - Modern format, 25-35% smaller than JPG/PNG',
                'AVIF - Newest format, even smaller than WebP',
                'JPG - Best for photos, lossy compression',
                'PNG - Best for graphics/transparency, lossless',
                'TIFF - Professional/print, very large files',
                'GIF - Animations, limited colors'
              ]
            }
          ],
          tips: [
            'WebP and AVIF offer best compression for web',
            'Use PNG for images with transparency',
            'AVIF may not be supported in all browsers yet',
            'Progressive JPGs load gradually (better for web)'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Validating inputs...').start();

      try {
        const validFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'tiff', 'gif'];
        if (!validFormats.includes(options.format)) {
          spinner.fail(chalk.red(`Invalid format. Supported: ${validFormats.join(', ')}`));
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
          newExtension: `.${options.format}`,
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Format: ${options.format.toUpperCase()}`));
          console.log(chalk.dim(`  Quality: ${options.quality || 90}`));
          if (options.compression) {
            console.log(chalk.dim(`  Compression: ${options.compression}`));
          }
          if (options.progressive) {
            console.log(chalk.dim(`  Progressive: enabled`));
          }
        }

        // Dry run mode
        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run mode - no changes will be made\n'));
          console.log(chalk.green(`Would convert ${inputFiles.length} image(s) to ${options.format.toUpperCase()}:`));
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
            const metadata = await createSharpInstance(inputFile).metadata();
            let pipeline = createSharpInstance(inputFile);

            // Apply format-specific options
            if (options.format === 'jpg' || options.format === 'jpeg') {
              pipeline.jpeg({ quality: options.quality || 90, progressive: options.progressive || false });
            } else if (options.format === 'png') {
              pipeline.png({ quality: options.quality || 90, compressionLevel: options.compression || 9, progressive: options.progressive || false });
            } else if (options.format === 'webp') {
              pipeline.webp({ quality: options.quality || 90 });
            } else if (options.format === 'avif') {
              pipeline.avif({ quality: options.quality || 90 });
            } else if (options.format === 'tiff') {
              pipeline.tiff({ quality: options.quality || 90 });
            } else if (options.format === 'gif') {
              pipeline.gif();
            }

            await pipeline.toFile(outputPath);

            spinner.succeed(chalk.green(`✓ ${fileName} converted to ${options.format.toUpperCase()}`));
            
            if (options.verbose) {
              console.log(chalk.dim(`    Original format: ${metadata.format?.toUpperCase()}`));
              console.log(chalk.dim(`    Size: ${metadata.width}x${metadata.height}`));
              console.log(chalk.dim(`    Saved to: ${outputPath}`));
            }

            successCount++;
          } catch (error) {
            spinner.fail(chalk.red(`✗ Failed to convert ${fileName}`));
            if (options.verbose && error instanceof Error) {
              console.log(chalk.red(`    Error: ${error.message}`));
            }
            failCount++;
          }
        }

        // Final summary
        console.log(chalk.bold('\nConvert Summary:'));
        console.log(chalk.green(`  ✓ Success: ${successCount}`));
        if (failCount > 0) {
          console.log(chalk.red(`  ✗ Failed: ${failCount}`));
        }
        console.log(chalk.dim(`  Output directory: ${outputDir}`));
        console.log(chalk.dim(`  Target format: ${options.format.toUpperCase()}`));

        console.log(chalk.dim(`  Output directory: ${outputDir}`));
        console.log(chalk.dim(`  Target format: ${options.format.toUpperCase()}`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to convert images'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
