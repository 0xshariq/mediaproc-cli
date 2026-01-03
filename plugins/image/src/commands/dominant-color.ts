import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { validatePaths, MediaExtensions } from '@mediaproc/cli';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface DominantColorOptions {
  input: string;
  count?: number;
  export?: string;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function dominantColorCommand(imageCmd: Command): void {
  imageCmd
    .command('dominant-color <input>')
    .description('Extract dominant colors from an image')
    .option('-c, --count <number>', 'Number of dominant colors to extract (default: 5)', parseInt, 5)
    .option('--export <path>', 'Export color palette to JSON file')
    .option('--dry-run', 'Show what would be analyzed without executing')
    .option('-v, --verbose', 'Show detailed color information')
    .option('--help', 'Display help for dominant-color command')
    .action(async (input: string, options: DominantColorOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'dominant-color',
          emoji: '🎨',
          description: 'Quickly extract the most dominant colors from an image. Perfect for color palette generation, theme creation, and color analysis.',
          usage: ['dominant-color <input>', 'dominant-color <input> --count 3', 'dominant-color photo.jpg --export colors.json'],
          options: [
            { flag: '-c, --count <number>', description: 'Number of dominant colors to extract (default: 5, max: 10)' },
            { flag: '--export <path>', description: 'Export color palette to JSON file' },
            { flag: '-v, --verbose', description: 'Show detailed RGB/HSL values' }
          ],
          examples: [
            { command: 'dominant-color photo.jpg', description: 'Extract top 5 dominant colors' },
            { command: 'dominant-color photo.jpg --count 3', description: 'Extract top 3 colors' },
            { command: 'dominant-color photo.jpg --export palette.json', description: 'Export colors to JSON' },
            { command: 'dominant-color logo.png -c 2 -v', description: 'Get 2 colors with details' }
          ],
          additionalSections: [
            {
              title: 'Use Cases',
              items: [
                'Generate color palettes for design',
                'Brand color extraction from logos',
                'Theme generation for websites',
                'Color scheme for UI/UX design',
                'Quick color analysis',
                'Match colors across images'
              ]
            },
            {
              title: 'Output Format',
              items: [
                'Hex color code (#RRGGBB)',
                'RGB values (r, g, b)',
                'Percentage of image coverage',
                'Optional HSL values with --verbose'
              ]
            }
          ],
          tips: [
            'Use --count to control number of colors',
            'Export to JSON for use in design tools',
            'Smaller images process faster',
            'Works best with high-contrast images'
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

        const count = Math.min(Math.max(options.count || 5, 1), 10);

        // Process each file
        for (let i = 0; i < inputFiles.length; i++) {
          const inputFile = inputFiles[i];
          const fileNum = `[${i + 1}/${totalFiles}]`;

          if (totalFiles > 1) {
            console.log(chalk.bold.cyan(`\n${'='.repeat(80)}`));
            console.log(chalk.bold.cyan(`${fileNum} ${path.basename(inputFile)}`));
            console.log(chalk.bold.cyan('='.repeat(80)));
          }

          const fileSpinner = ora(`${fileNum} Analyzing colors...`).start();

          try {
            // Get image stats which includes dominant color
            const sharpInstance = createSharpInstance(inputFile);
            const metadata = await sharpInstance.metadata();
            
            // Resize for faster processing
            const smallImage = await sharpInstance
              .resize(100, 100, { fit: 'inside' })
              .raw()
              .toBuffer({ resolveWithObject: true });

            const { data, info } = smallImage;
            const pixels = info.width * info.height;
            const channels = info.channels;

            // Color histogram approach
            const colorMap = new Map<string, number>();

        for (let i = 0; i < data.length; i += channels) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Bucket colors to reduce variations
          const bucketSize = 16;
          const bucketR = Math.floor(r / bucketSize) * bucketSize;
          const bucketG = Math.floor(g / bucketSize) * bucketSize;
          const bucketB = Math.floor(b / bucketSize) * bucketSize;
          
          const key = `${bucketR},${bucketG},${bucketB}`;
          colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        // Sort by frequency
        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, count);

        const dominantColors = sortedColors.map(([rgb, count]) => {
          const [r, g, b] = rgb.split(',').map(Number);
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          const percentage = ((count / pixels) * 100).toFixed(2);
          
          // Calculate HSL
          const rNorm = r / 255;
          const gNorm = g / 255;
          const bNorm = b / 255;
          const max = Math.max(rNorm, gNorm, bNorm);
          const min = Math.min(rNorm, gNorm, bNorm);
          const l = (max + min) / 2;
          let s = 0;
          let h = 0;
          
          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            if (max === rNorm) {
              h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
            } else if (max === gNorm) {
              h = ((bNorm - rNorm) / d + 2) / 6;
            } else {
              h = ((rNorm - gNorm) / d + 4) / 6;
            }
          }
          
            return {
              hex,
              rgb: { r, g, b },
              hsl: {
                h: Math.round(h * 360),
                s: Math.round(s * 100),
                l: Math.round(l * 100)
              },
              percentage: parseFloat(percentage)
            };
          });

            fileSpinner.succeed(chalk.green(`${fileNum} Color analysis complete!\n`));

            console.log(chalk.bold.cyan(`🎨 Top ${dominantColors.length} Dominant Colors:\n`));

            dominantColors.forEach((color, index) => {
              const colorPreview = chalk.bgHex(color.hex)('    ');
              console.log(colorPreview + ' ' + chalk.bold(color.hex) + chalk.dim(` (${color.percentage}%)`));
              
              if (options.verbose) {
                console.log(chalk.dim(`   RGB: (${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`));
                console.log(chalk.dim(`   HSL: (${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%)`));
              }
              
              if (index < dominantColors.length - 1) {
                console.log('');
              }
            });

            // Export to JSON (only for first file or if single file)
            if (options.export && (totalFiles === 1 || i === 0)) {
              const exportData = {
                source: inputFile,
                imageSize: {
                  width: metadata.width,
                  height: metadata.height
                },
                colors: dominantColors
              };
              
              const exportPath = totalFiles > 1 
                ? options.export.replace(/(\.json)?$/, `-${i + 1}.json`)
                : options.export;
              
              fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
              console.log(chalk.dim(`\n✓ Palette exported to: ${exportPath}`));
            }

            successCount++;
          } catch (error) {
            failCount++;
            fileSpinner.fail(chalk.red(`${fileNum} Failed to analyze colors`));
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
