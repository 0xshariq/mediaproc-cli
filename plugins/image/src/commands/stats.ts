import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { validatePaths, MediaExtensions } from '@mediaproc/cli';
import type { StatsOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface StatsOptionsExtended extends StatsOptions {
  help?: boolean;
  dryRun?: boolean;
}

export function statsCommand(imageCmd: Command): void {
  imageCmd
    .command('stats <input>')
    .description('Display detailed image information and statistics')
    .option('-d, --detailed', 'Show detailed EXIF and metadata')
    .option('--histogram', 'Calculate and display color histogram')
    .option('--dry-run', 'Show what would be analyzed without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for stats command')
    .action(async (input: string, options: StatsOptionsExtended) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'stats',
          emoji: '📊',
          description: 'Analyze and display comprehensive image information including dimensions, format, color space, EXIF data, and color statistics.',
          usage: ['stats <input>', 'stats <input> --detailed', 'stats <input> --histogram'],
          options: [
            { flag: '-d, --detailed', description: 'Show detailed EXIF and metadata information' },
            { flag: '--histogram', description: 'Calculate and display color channel statistics' },
            { flag: '-v, --verbose', description: 'Show extra verbose output' }
          ],
          examples: [
            { command: 'stats photo.jpg', description: 'Show basic image information' },
            { command: 'stats image.png --detailed', description: 'Show comprehensive metadata' },
            { command: 'stats photo.jpg --histogram', description: 'Show color distribution stats' },
            { command: 'stats image.raw --detailed --histogram', description: 'Complete image analysis' }
          ],
          additionalSections: [
            {
              title: 'Information Displayed',
              items: [
                'Dimensions (width x height)',
                'File format and size',
                'Color space (sRGB, CMYK, etc.)',
                'Channels and depth',
                'Density/DPI',
                'EXIF data (camera, settings, GPS)',
                'Color profiles (ICC)',
                'Orientation'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Verify image specifications',
                'Check file integrity',
                'Extract camera metadata',
                'Analyze color distribution',
                'Quality assessment',
                'Prepare for processing'
              ]
            }
          ],
          tips: [
            'Use --detailed for EXIF data from cameras',
            '--histogram helps analyze color balance',
            'Check color space for print vs web',
            'Useful for debugging image issues'
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

        spinner.succeed(chalk.green(`Found ${totalFiles} file${totalFiles > 1 ? 's' : ''} to analyze`));

        let successCount = 0;
        let failCount = 0;

        // Process each file
        for (let i = 0; i < inputFiles.length; i++) {
          const inputFile = inputFiles[i];
          const fileNum = `[${i + 1}/${totalFiles}]`;

          if (totalFiles > 1) {
            console.log(chalk.bold.cyan(`\n${'='.repeat(80)}`));
            console.log(chalk.bold.cyan(`${fileNum} ${path.basename(inputFile)}`));
            console.log(chalk.bold.cyan('='.repeat(80)));
          }

          const fileSpinner = ora(`${fileNum} Analyzing image...`).start();

          try {
            const fileStats = fs.statSync(inputFile);
            const metadata = await createSharpInstance(inputFile).metadata();

            fileSpinner.succeed(chalk.green(`${fileNum} Image analysis complete!\n`));

            // Basic information
            console.log(chalk.bold.cyan('📁 File Information:'));
            console.log(chalk.dim(`  Path: ${inputFile}`));
            console.log(chalk.dim(`  Size: ${(fileStats.size / 1024).toFixed(2)} KB (${fileStats.size} bytes)`));
            console.log(chalk.dim(`  Modified: ${fileStats.mtime.toLocaleString()}`));
            console.log('');

            // Image properties
            console.log(chalk.bold.cyan('🖼️  Image Properties:'));
            console.log(chalk.dim(`  Format: ${metadata.format?.toUpperCase() || 'Unknown'}`));
            console.log(chalk.dim(`  Dimensions: ${metadata.width} × ${metadata.height} pixels`));
        console.log(chalk.dim(`  Aspect Ratio: ${metadata.width && metadata.height ? (metadata.width / metadata.height).toFixed(2) : 'N/A'}`));
        console.log(chalk.dim(`  Channels: ${metadata.channels || 'Unknown'}`));
        console.log(chalk.dim(`  Color Space: ${metadata.space || 'Unknown'}`));
        console.log(chalk.dim(`  Bit Depth: ${metadata.depth || 'Unknown'}`));
        if (metadata.density) {
          console.log(chalk.dim(`  Density: ${metadata.density} DPI`));
        }
        if (metadata.hasAlpha) {
          console.log(chalk.dim(`  Alpha Channel: Yes`));
        }
        console.log('');

        // Detailed metadata
        if (options.detailed) {
          console.log(chalk.bold.cyan('📋 Detailed Metadata:'));
          
          if (metadata.orientation) {
            console.log(chalk.dim(`  Orientation: ${metadata.orientation}`));
          }
          
          if (metadata.chromaSubsampling) {
            console.log(chalk.dim(`  Chroma Subsampling: ${metadata.chromaSubsampling}`));
          }
          
          if (metadata.isProgressive !== undefined) {
            console.log(chalk.dim(`  Progressive: ${metadata.isProgressive ? 'Yes' : 'No'}`));
          }
          
          if (metadata.pages) {
            console.log(chalk.dim(`  Pages: ${metadata.pages}`));
          }
          
          if (metadata.pageHeight) {
            console.log(chalk.dim(`  Page Height: ${metadata.pageHeight}`));
          }
          
          if (metadata.loop !== undefined) {
            console.log(chalk.dim(`  Loop: ${metadata.loop}`));
          }
          
          if (metadata.delay) {
            console.log(chalk.dim(`  Delay: ${metadata.delay}ms`));
          }
          
          // Palette bit depth info (if available in future Sharp versions)
          
          // EXIF data
          if (metadata.exif) {
            console.log(chalk.dim('\n  EXIF Data:'));
            const exifBuffer = metadata.exif;
            console.log(chalk.dim(`    Size: ${exifBuffer.length} bytes`));
          }
          
          // ICC profile
          if (metadata.icc) {
            console.log(chalk.dim('\n  ICC Profile:'));
            console.log(chalk.dim(`    Size: ${metadata.icc.length} bytes`));
          }
          
          // XMP data
          if (metadata.xmp) {
            console.log(chalk.dim('\n  XMP Data:'));
            const xmpBuffer = metadata.xmp;
            console.log(chalk.dim(`    Size: ${xmpBuffer.length} bytes`));
          }
          
          // IPTC data
          if (metadata.iptc) {
            console.log(chalk.dim('\n  IPTC Data:'));
            const iptcBuffer = metadata.iptc;
            console.log(chalk.dim(`    Size: ${iptcBuffer.length} bytes`));
          }
          
          console.log('');
        }

            // Histogram statistics
            if (options.histogram) {
              console.log(chalk.bold.cyan('📊 Color Statistics:'));
              
              const stats = await createSharpInstance(inputFile).stats();
          
          if (stats.channels) {
            stats.channels.forEach((channel, index) => {
              const channelNames = ['Red', 'Green', 'Blue', 'Alpha'];
              const channelName = channelNames[index] || `Channel ${index + 1}`;
              
              console.log(chalk.dim(`\n  ${channelName}:`));
              console.log(chalk.dim(`    Min: ${channel.min}`));
              console.log(chalk.dim(`    Max: ${channel.max}`));
              console.log(chalk.dim(`    Mean: ${channel.mean.toFixed(2)}`));
              console.log(chalk.dim(`    Std Dev: ${channel.stdev.toFixed(2)}`));
              if (channel.minX !== undefined && channel.minY !== undefined) {
                console.log(chalk.dim(`    Min at: (${channel.minX}, ${channel.minY})`));
              }
              if (channel.maxX !== undefined && channel.maxY !== undefined) {
                console.log(chalk.dim(`    Max at: (${channel.maxX}, ${channel.maxY})`));
              }
            });
            console.log('');
            
            console.log(chalk.dim('  Overall:'));
            console.log(chalk.dim(`    Dominant Color: RGB(${stats.dominant?.r || 0}, ${stats.dominant?.g || 0}, ${stats.dominant?.b || 0})`));
              console.log(chalk.dim(`    Entropy: ${stats.entropy?.toFixed(2) || 'N/A'}`));
              console.log(chalk.dim(`    Sharpness: ${stats.sharpness?.toFixed(2) || 'N/A'}`));
            }
            }

            successCount++;
          } catch (error) {
            failCount++;
            fileSpinner.fail(chalk.red(`${fileNum} Failed to analyze image`));
            if (options.verbose) {
              console.error(chalk.red('Error details:'), error);
            } else {
              console.error(chalk.red((error as Error).message));
            }
          }
        }

        // Summary
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
