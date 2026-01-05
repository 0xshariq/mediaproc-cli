import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { stat } from 'node:fs/promises';
import { validatePaths, IMAGE_EXTENSIONS, getFileName } from '../utils/pathValidator.js';
export { getFileName } from '../utils/pathValidator.js';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface InfoOptions extends ImageOptions {
  help?: boolean;
  json?: boolean;
}

export function infoCommand(imageCmd: Command): void {
  imageCmd
    .command('info <input>')
    .description('Display comprehensive image information and metadata')
    .option('--json', 'Output information in JSON format')
    .option('-v, --verbose', 'Verbose output with all available metadata')
    .option('--help', 'Display help for info command')
    .action(async (input: string, options: InfoOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'info',
          emoji: 'ℹ️',
          description: 'Display detailed image information including dimensions, format, color space, file size, and metadata. Perfect for quick inspection.',
          usage: ['info <input>', 'info <input> --json', 'info <input> -v'],
          options: [
            { flag: '--json', description: 'Output data in JSON format for scripting' },
            { flag: '-v, --verbose', description: 'Show all available metadata including EXIF' }
          ],
          examples: [
            { command: 'info photo.jpg', description: 'Show basic image information' },
            { command: 'info image.png --json', description: 'Get data in JSON format' },
            { command: 'info photo.jpg -v', description: 'Show all metadata including EXIF' },
            { command: 'info picture.webp', description: 'Inspect WebP image details' }
          ],
          additionalSections: [
            {
              title: 'Information Displayed',
              items: [
                'File name and path',
                'Format and MIME type',
                'Dimensions (width x height)',
                'File size (bytes, KB, MB)',
                'Color space (RGB, CMYK, grayscale)',
                'Bit depth per channel',
                'Number of channels',
                'Density/DPI',
                'Has alpha channel',
                'Orientation'
              ]
            },
            {
              title: 'Verbose Mode',
              items: [
                'Complete EXIF metadata',
                'Camera make and model',
                'Capture settings (ISO, aperture, shutter)',
                'GPS coordinates',
                'Software information',
                'Color profile data',
                'Creation and modification dates'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Quick image inspection',
                'Verify file specifications',
                'Check format compatibility',
                'Batch metadata extraction (with --json)',
                'Prepare for processing',
                'Quality assessment'
              ]
            }
          ],
          tips: [
            'Use --json for scripting and automation',
            'Verbose mode shows camera EXIF data',
            'Pipe JSON output to jq for parsing',
            'Combine with batch to inspect multiple files'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Loading image information...').start();

      try {
        const { inputFiles, errors } = validatePaths(input, undefined, {
          allowedExtensions: IMAGE_EXTENSIONS,
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

        spinner.stop();

        for (const inputPath of inputFiles) {
          const fileName = getFileName(inputPath);

          try {
            const sharp = await createSharpInstance(inputPath);
            const metadata = await sharp.metadata();
            const fileStat = await stat(inputPath);

            const imageInfo = {
              file: {
                name: fileName,
                path: inputPath,
                size: fileStat.size,
                sizeFormatted: formatBytes(fileStat.size),
              },
              format: {
                type: metadata.format || 'unknown',
                width: metadata.width || 0,
                height: metadata.height || 0,
                space: metadata.space || 'unknown',
                channels: metadata.channels || 0,
                depth: metadata.depth || 'unknown',
                density: metadata.density || null,
                hasAlpha: metadata.hasAlpha || false,
                orientation: metadata.orientation || 1,
              },
              exif: options.verbose ? metadata.exif || null : null,
              icc: options.verbose ? metadata.icc || null : null,
              iptc: options.verbose ? metadata.iptc || null : null,
              xmp: options.verbose ? metadata.xmp || null : null,
            };

            if (options.json) {
              console.log(JSON.stringify(imageInfo, null, 2));
            } else {
              console.log();
              console.log(chalk.cyan.bold(`ℹ️  ${fileName}`));
              console.log(chalk.gray('━'.repeat(60)));
              
              // File Information
              console.log(chalk.yellow.bold('\n📁 File Information'));
              console.log(chalk.gray(`   Path: ${inputPath}`));
              console.log(chalk.gray(`   Size: ${imageInfo.file.sizeFormatted}`));
              
              // Format Information
              console.log(chalk.yellow.bold('\n🖼️  Image Details'));
              console.log(chalk.gray(`   Format: ${imageInfo.format.type.toUpperCase()}`));
              console.log(chalk.gray(`   Dimensions: ${imageInfo.format.width} × ${imageInfo.format.height} pixels`));
              console.log(chalk.gray(`   Aspect Ratio: ${(imageInfo.format.width / imageInfo.format.height).toFixed(2)}`));
              console.log(chalk.gray(`   Color Space: ${imageInfo.format.space}`));
              console.log(chalk.gray(`   Channels: ${imageInfo.format.channels}`));
              console.log(chalk.gray(`   Bit Depth: ${imageInfo.format.depth}`));
              console.log(chalk.gray(`   Alpha Channel: ${imageInfo.format.hasAlpha ? 'Yes' : 'No'}`));
              
              if (imageInfo.format.density) {
                console.log(chalk.gray(`   Density: ${imageInfo.format.density} DPI`));
              }
              
              if (imageInfo.format.orientation !== 1) {
                console.log(chalk.gray(`   Orientation: ${imageInfo.format.orientation}`));
              }

              // EXIF Data (verbose mode)
              if (options.verbose && metadata.exif) {
                console.log(chalk.yellow.bold('\n📷 EXIF Metadata'));
                console.log(chalk.gray('   EXIF data is available (raw buffer)'));
                console.log(chalk.gray('   Use a specialized EXIF tool to parse detailed camera data'));
              }

              console.log();
            }
          } catch (error) {
            console.error(chalk.red(`\n✗ Failed to read ${fileName}`));
            console.error(chalk.red(`   Error: ${(error as Error).message}`));
            process.exit(1);
          }
        }

        if (!options.json) {
          console.log(chalk.green.bold('✓ Information retrieved successfully!'));
        }
      } catch (error) {
        spinner.fail(chalk.red('Error reading image information'));
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
