import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface MetadataCommandOptions {
  input: string;
  remove?: boolean;
  removeAll?: boolean;
  export?: string;
  output?: string;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function metadataCommand(imageCmd: Command): void {
  imageCmd
    .command('metadata <input>')
    .description('View, export, or remove image metadata/EXIF data')
    .option('--remove', 'Remove all metadata (create clean copy)')
    .option('--remove-all', 'Alias for --remove')
    .option('--export <path>', 'Export metadata to JSON file')
    .option('-o, --output <path>', 'Output file (when removing metadata)')
    .option('--dry-run', 'Show what would be analyzed without executing')
    .option('-v, --verbose', 'Show detailed metadata')
    .option('--help', 'Display help for metadata command')
    .action(async (input: string, options: MetadataCommandOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'metadata',
          emoji: '🏷️',
          description: 'View, export, or remove image metadata including EXIF, IPTC, XMP, and ICC profile data. Essential for privacy and optimization.',
          usage: ['metadata <input>', 'metadata <input> --remove', 'metadata <input> --export data.json'],
          options: [
            { flag: '--remove', description: 'Remove all metadata and create clean copy' },
            { flag: '--remove-all', description: 'Alias for --remove' },
            { flag: '--export <path>', description: 'Export metadata to JSON file' },
            { flag: '-o, --output <path>', description: 'Output file path (when removing metadata)' },
            { flag: '-v, --verbose', description: 'Show detailed metadata information' }
          ],
          examples: [
            { command: 'metadata photo.jpg', description: 'View basic metadata' },
            { command: 'metadata photo.jpg -v', description: 'View detailed metadata' },
            { command: 'metadata photo.jpg --remove', description: 'Remove all metadata' },
            { command: 'metadata photo.jpg --export metadata.json', description: 'Export metadata to JSON' },
            { command: 'metadata photo.jpg --remove -o clean.jpg', description: 'Save clean copy without metadata' }
          ],
          additionalSections: [
            {
              title: 'Metadata Types',
              items: [
                'EXIF - Camera settings, date, GPS location',
                'IPTC - Copyright, caption, keywords',
                'XMP - Extended metadata',
                'ICC - Color profile information',
                'Orientation - Image rotation data'
              ]
            },
            {
              title: 'Why Remove Metadata?',
              items: [
                'Privacy - Remove GPS location data',
                'File size - Metadata can be large',
                'Security - Remove camera/device info',
                'Web optimization - Smaller files',
                'Clean sharing - Remove personal data'
              ]
            },
            {
              title: 'Common EXIF Fields',
              items: [
                'Camera Make/Model',
                'Date/Time taken',
                'GPS Coordinates',
                'Aperture, Shutter Speed, ISO',
                'Focal Length',
                'Copyright information',
                'Software used'
              ]
            }
          ],
          tips: [
            'Always remove GPS data before sharing online',
            'Backup originals before removing metadata',
            'Export metadata for record-keeping',
            'Metadata removal reduces file size'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Validating input...').start();

      try {
        // Validate input paths
        const { inputFiles, errors } = validatePaths(input, undefined, {
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

        const totalFiles = inputFiles.length;

        // Dry-run mode
        if (options.dryRun) {
          spinner.info(chalk.blue('🔍 Dry run - files that would be analyzed:'));
          inputFiles.forEach((file: string, index: number) => {
            console.log(chalk.dim(`  [${index + 1}/${totalFiles}] ${file}`));
          });
          console.log(chalk.dim(`\n  Total files: ${totalFiles}`));
          process.exit(0);
        }

        spinner.succeed(chalk.green(`Found ${totalFiles} file${totalFiles > 1 ? 's' : ''} to process`));

        let successCount = 0;
        let failCount = 0;

        // Remove metadata mode
        if (options.remove || options.removeAll) {
          // Use resolveOutputPaths for remove mode since it writes files
          const outputPaths = resolveOutputPaths(inputFiles, options.output || '.', {
            suffix: '-clean',
            preserveStructure: inputFiles.length > 1,
          });

          for (let i = 0; i < inputFiles.length; i++) {
            const inputFile = inputFiles[i];
            const outputPath = outputPaths.get(inputFile)!;
            const fileNum = `[${i + 1}/${totalFiles}]`;

            if (totalFiles > 1) {
              console.log(chalk.bold.cyan(`\n${'='.repeat(80)}`));
              console.log(chalk.bold.cyan(`${fileNum} ${path.basename(inputFile)}`));
              console.log(chalk.bold.cyan('='.repeat(80)));
            }

            const fileSpinner = ora(`${fileNum} Removing metadata...`).start();

            try {
              await createSharpInstance(inputFile)
                .withMetadata({
                  // Remove all metadata
                  exif: {},
                  icc: undefined,
                  xmp: undefined
                } as any)
                .toFile(outputPath);

              const inputStats = fs.statSync(inputFile);
              const outputStats = fs.statSync(outputPath);
              const savedBytes = inputStats.size - outputStats.size;

              fileSpinner.succeed(chalk.green(`${fileNum} Metadata removed successfully!`));
              console.log(chalk.dim(`  Input: ${inputFile}`));
              console.log(chalk.dim(`  Output: ${outputPath}`));
              console.log(chalk.dim(`  Original size: ${(inputStats.size / 1024).toFixed(2)}KB`));
              console.log(chalk.dim(`  New size: ${(outputStats.size / 1024).toFixed(2)}KB`));
              console.log(chalk.dim(`  Saved: ${(savedBytes / 1024).toFixed(2)}KB (${((savedBytes / inputStats.size) * 100).toFixed(1)}%)`));
              
              successCount++;
            } catch (error) {
              failCount++;
              fileSpinner.fail(chalk.red(`${fileNum} Failed to remove metadata`));
              if (options.verbose) {
                console.error(chalk.red('Error details:'), error);
              } else {
                console.error(chalk.red((error as Error).message));
              }
            }
          }

          // Summary for remove mode
          if (totalFiles > 1) {
            console.log(chalk.bold.cyan(`\n${'='.repeat(80)}`));
            console.log(chalk.bold.green('\n✓ Processing Summary:'));
            console.log(chalk.dim(`  Processed: ${successCount}/${totalFiles}`));
            if (failCount > 0) {
              console.log(chalk.dim(`  Failed: ${failCount}`));
            }
          }

          if (failCount > 0 && failCount === totalFiles) {
            process.exit(1);
          }
          return;
        }

        // Export metadata mode
        if (options.export) {
          for (let i = 0; i < inputFiles.length; i++) {
            const inputFile = inputFiles[i];
            const fileNum = `[${i + 1}/${totalFiles}]`;

            if (totalFiles > 1) {
              console.log(chalk.bold.cyan(`\n${'='.repeat(80)}`));
              console.log(chalk.bold.cyan(`${fileNum} ${path.basename(inputFile)}`));
              console.log(chalk.bold.cyan('='.repeat(80)));
            }

            const fileSpinner = ora(`${fileNum} Exporting metadata...`).start();

            try {
              const metadata = await createSharpInstance(inputFile).metadata();
              
              const metadataObj = {
                file: {
                  path: inputFile,
                  size: fs.statSync(inputFile).size,
                  modified: fs.statSync(inputFile).mtime
                },
                image: {
                  format: metadata.format,
                  width: metadata.width,
                  height: metadata.height,
                  space: metadata.space,
                  channels: metadata.channels,
                  depth: metadata.depth,
                  density: metadata.density,
                  hasAlpha: metadata.hasAlpha,
                  orientation: metadata.orientation,
                  isProgressive: metadata.isProgressive
                },
                exif: metadata.exif ? Buffer.from(metadata.exif).toString('base64') : null,
                icc: metadata.icc ? Buffer.from(metadata.icc).toString('base64') : null,
                iptc: metadata.iptc ? Buffer.from(metadata.iptc).toString('base64') : null,
                xmp: metadata.xmp ? Buffer.from(metadata.xmp).toString('base64') : null
              };

              const exportPath = totalFiles > 1 
                ? options.export.replace(/(\.json)?$/, `-${i + 1}.json`)
                : options.export;

              fs.writeFileSync(exportPath, JSON.stringify(metadataObj, null, 2));

              fileSpinner.succeed(chalk.green(`${fileNum} Metadata exported!`));
              console.log(chalk.dim(`  Exported to: ${exportPath}`));
              
              successCount++;
            } catch (error) {
              failCount++;
              fileSpinner.fail(chalk.red(`${fileNum} Failed to export metadata`));
              if (options.verbose) {
                console.error(chalk.red('Error details:'), error);
              } else {
                console.error(chalk.red((error as Error).message));
              }
            }
          }

          // Summary for export mode
          if (totalFiles > 1) {
            console.log(chalk.bold.cyan(`\n${'='.repeat(80)}`));
            console.log(chalk.bold.green('\n✓ Export Summary:'));
            console.log(chalk.dim(`  Exported: ${successCount}/${totalFiles}`));
            if (failCount > 0) {
              console.log(chalk.dim(`  Failed: ${failCount}`));
            }
          }

          if (failCount > 0 && failCount === totalFiles) {
            process.exit(1);
          }
          return;
        }

        // View metadata mode (default)
        for (let i = 0; i < inputFiles.length; i++) {
          const inputFile = inputFiles[i];
          const fileNum = `[${i + 1}/${totalFiles}]`;

          if (totalFiles > 1) {
            console.log(chalk.bold.cyan(`\n${'='.repeat(80)}`));
            console.log(chalk.bold.cyan(`${fileNum} ${path.basename(inputFile)}`));
            console.log(chalk.bold.cyan('='.repeat(80)));
          }

          const fileSpinner = ora(`${fileNum} Reading metadata...`).start();

          try {
            const metadata = await createSharpInstance(inputFile).metadata();

            fileSpinner.succeed(chalk.green(`${fileNum} Metadata retrieved!\n`));

            console.log(chalk.bold.cyan('📁 File Information:'));
            console.log(chalk.dim(`  Path: ${inputFile}`));
            const fileStats = fs.statSync(inputFile);
            console.log(chalk.dim(`  Size: ${(fileStats.size / 1024).toFixed(2)} KB`));
            console.log(chalk.dim(`  Modified: ${fileStats.mtime.toLocaleString()}`));
            console.log('');

            console.log(chalk.bold.cyan('🖼️  Image Properties:'));
            console.log(chalk.dim(`  Format: ${metadata.format?.toUpperCase()}`));
            console.log(chalk.dim(`  Dimensions: ${metadata.width} × ${metadata.height} pixels`));
            console.log(chalk.dim(`  Color Space: ${metadata.space}`));
            console.log(chalk.dim(`  Channels: ${metadata.channels}`));
            console.log(chalk.dim(`  Bit Depth: ${metadata.depth}`));
            if (metadata.density) {
              console.log(chalk.dim(`  Density: ${metadata.density} DPI`));
            }
            if (metadata.hasAlpha) {
              console.log(chalk.dim(`  Alpha Channel: Yes`));
            }
            if (metadata.orientation) {
              console.log(chalk.dim(`  Orientation: ${metadata.orientation}`));
            }
            console.log('');

            console.log(chalk.bold.cyan('📋 Metadata Summary:'));
            console.log(chalk.dim(`  EXIF Data: ${metadata.exif ? `${metadata.exif.length} bytes` : 'None'}`));
            console.log(chalk.dim(`  ICC Profile: ${metadata.icc ? `${metadata.icc.length} bytes` : 'None'}`));
            console.log(chalk.dim(`  IPTC Data: ${metadata.iptc ? `${metadata.iptc.length} bytes` : 'None'}`));
            console.log(chalk.dim(`  XMP Data: ${metadata.xmp ? `${metadata.xmp.length} bytes` : 'None'}`));

            const totalMetadataSize = 
              (metadata.exif?.length || 0) + 
              (metadata.icc?.length || 0) + 
              (metadata.iptc?.length || 0) + 
              (metadata.xmp?.length || 0);
            
            if (totalMetadataSize > 0) {
              console.log(chalk.dim(`  Total Metadata: ${(totalMetadataSize / 1024).toFixed(2)} KB (${((totalMetadataSize / fileStats.size) * 100).toFixed(1)}% of file)`));
            }

            if (options.verbose && metadata.exif) {
              console.log('');
              console.log(chalk.yellow('💡 Tip: Use --export to save metadata to JSON file'));
              console.log(chalk.yellow('💡 Tip: Use --remove to create a clean copy without metadata'));
            }

            if (!metadata.exif && !metadata.iptc && !metadata.xmp) {
              console.log('');
              console.log(chalk.yellow('ℹ️  This image has no embedded metadata'));
            }

            successCount++;
          } catch (error) {
            failCount++;
            fileSpinner.fail(chalk.red(`${fileNum} Failed to read metadata`));
            if (options.verbose) {
              console.error(chalk.red('Error details:'), error);
            } else {
              console.error(chalk.red((error as Error).message));
            }
          }
        }

        // Summary for view mode
        if (totalFiles > 1) {
          console.log(chalk.bold.cyan(`\n${'='.repeat(80)}`));
          console.log(chalk.bold.green('\n✓ Analysis Summary:'));
          console.log(chalk.dim(`  Analyzed: ${successCount}/${totalFiles}`));
          if (failCount > 0) {
            console.log(chalk.dim(`  Failed: ${failCount}`));
          }
        }

        if (failCount > 0 && failCount === totalFiles) {
          process.exit(1);
        }

      } catch (error) {
        spinner.fail(chalk.red('Failed to validate input'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
