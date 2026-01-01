import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface BatchOptions {
  input: string;
  operation: string;
  output?: string;
  pattern?: string;
  recursive?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
  // Operation-specific options
  [key: string]: any;
}

export function batchCommand(imageCmd: Command): void {
  imageCmd
    .command('batch <directory>')
    .description('Process multiple images in batch with any operation')
    .requiredOption('-op, --operation <operation>', 'Operation: resize, convert, optimize, grayscale, etc.')
    .option('-o, --output <directory>', 'Output directory (default: ./output)')
    .option('-p, --pattern <glob>', 'File pattern (default: *.{jpg,jpeg,png,webp,gif})')
    .option('-r, --recursive', 'Process subdirectories recursively')
    .option('--width <pixels>', 'Width for resize operations', parseInt)
    .option('--height <pixels>', 'Height for resize operations', parseInt)
    .option('-f, --format <format>', 'Output format for convert operations')
    .option('-q, --quality <quality>', 'Quality for optimization', parseInt)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for batch command')
    .action(async (directory: string, options: BatchOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'batch',
          emoji: '📦',
          description: 'Process multiple images at once with any operation. Perfect for bulk processing, batch conversions, and automated workflows.',
          usage: ['batch <directory> --operation resize --width 800', 'batch <directory> -op convert --format webp', 'batch <directory> -op optimize -q 85'],
          options: [
            { flag: '-op, --operation <operation>', description: 'Operation: resize, convert, optimize, grayscale, blur, etc. (required)' },
            { flag: '-o, --output <directory>', description: 'Output directory (default: ./output)' },
            { flag: '-p, --pattern <glob>', description: 'File pattern (default: *.{jpg,jpeg,png,webp,gif})' },
            { flag: '-r, --recursive', description: 'Process subdirectories recursively' },
            { flag: '--width <pixels>', description: 'Width for resize operations' },
            { flag: '--height <pixels>', description: 'Height for resize operations' },
            { flag: '-f, --format <format>', description: 'Output format for convert operations' },
            { flag: '-q, --quality <quality>', description: 'Quality for optimization/conversion' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'batch ./photos --operation resize --width 1920', description: 'Resize all images to 1920px wide' },
            { command: 'batch ./images -op convert --format webp -q 90', description: 'Convert all to WebP format' },
            { command: 'batch ./pics -op optimize -q 85 -o ./optimized', description: 'Optimize images to 85% quality' },
            { command: 'batch ./gallery -op grayscale -r', description: 'Convert all to grayscale recursively' },
            { command: 'batch ./folder -op thumbnail --width 200 --height 200', description: 'Generate thumbnails' }
          ],
          additionalSections: [
            {
              title: 'Supported Operations',
              items: [
                'resize - Resize images (requires --width and/or --height)',
                'convert - Convert format (requires --format)',
                'optimize - Optimize file size (optional --quality)',
                'grayscale - Convert to grayscale',
                'blur - Apply blur effect',
                'sharpen - Sharpen images',
                'thumbnail - Generate thumbnails',
                'sepia - Apply sepia tone',
                'normalize - Auto-normalize colors'
              ]
            },
            {
              title: 'Output Structure',
              items: [
                'Preserves original directory structure',
                'Creates output directory if not exists',
                'Maintains original filenames',
                'Adds operation suffix to avoid overwrites'
              ]
            }
          ],
          tips: [
            'Use --dry-run to preview before processing',
            'Recursive mode processes all subdirectories',
            'Output directory preserves folder structure',
            'Combine with quality settings for optimization'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Scanning directory...').start();

      try {
        if (!fs.existsSync(directory)) {
          spinner.fail(chalk.red(`Directory not found: ${directory}`));
          process.exit(1);
        }

        if (!fs.statSync(directory).isDirectory()) {
          spinner.fail(chalk.red(`Path is not a directory: ${directory}`));
          process.exit(1);
        }

        const outputDir = options.output || path.join(directory, 'output');
        const pattern = options.pattern || '*.{jpg,jpeg,png,webp,gif,avif,tiff}';

        if (options.verbose) {
          console.log(chalk.dim(`  File pattern: ${pattern}`));
        }

        // Find all image files
        const imageFiles: string[] = [];
        
        function scanDirectory(dir: string) {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory() && options.recursive) {
              scanDirectory(fullPath);
            } else if (entry.isFile()) {
              const ext = path.extname(entry.name).toLowerCase();
              if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.tiff'].includes(ext)) {
                imageFiles.push(fullPath);
              }
            }
          }
        }

        scanDirectory(directory);

        if (imageFiles.length === 0) {
          spinner.fail(chalk.yellow('No image files found'));
          process.exit(0);
        }

        spinner.text = `Found ${imageFiles.length} images`;

        if (options.verbose) {
          spinner.info(chalk.blue(`Configuration:`));
          console.log(chalk.dim(`  Input directory: ${directory}`));
          console.log(chalk.dim(`  Output directory: ${outputDir}`));
          console.log(chalk.dim(`  Operation: ${options.operation}`));
          console.log(chalk.dim(`  Files found: ${imageFiles.length}`));
          console.log(chalk.dim(`  Recursive: ${options.recursive ? 'Yes' : 'No'}`));
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green(`✓ Would process ${imageFiles.length} images:`));
          imageFiles.slice(0, 10).forEach(file => {
            console.log(chalk.dim(`  - ${path.relative(directory, file)}`));
          });
          if (imageFiles.length > 10) {
            console.log(chalk.dim(`  ... and ${imageFiles.length - 10} more`));
          }
          return;
        }

        // Create output directory
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Process images
        let processed = 0;
        let failed = 0;

        for (const inputFile of imageFiles) {
          try {
            const relativePath = path.relative(directory, inputFile);
            const parsedPath = path.parse(relativePath);
            const outputPath = path.join(outputDir, parsedPath.dir, `${parsedPath.name}-${options.operation}${parsedPath.ext}`);
            
            // Create subdirectories if needed
            const outputSubdir = path.dirname(outputPath);
            if (!fs.existsSync(outputSubdir)) {
              fs.mkdirSync(outputSubdir, { recursive: true });
            }

            spinner.text = `Processing ${processed + 1}/${imageFiles.length}: ${path.basename(inputFile)}`;

            let pipeline = createSharpInstance(inputFile);

            // Apply operation
            switch (options.operation.toLowerCase()) {
              case 'resize':
                if (options.width || options.height) {
                  pipeline = pipeline.resize(options.width, options.height, { fit: 'inside' });
                }
                break;
              
              case 'convert':
                if (options.format) {
                  pipeline = pipeline.toFormat(options.format as any, { quality: options.quality || 90 });
                }
                break;
              
              case 'optimize':
                pipeline = pipeline.toFormat(path.extname(inputFile).slice(1) as any, { 
                  quality: options.quality || 85 
                });
                break;
              
              case 'grayscale':
                pipeline = pipeline.grayscale();
                break;
              
              case 'blur':
                pipeline = pipeline.blur(options.sigma || 5);
                break;
              
              case 'sharpen':
                pipeline = pipeline.sharpen();
                break;
              
              case 'thumbnail':
                pipeline = pipeline.resize(options.width || 200, options.height || 200, { fit: 'cover' });
                break;
              
              case 'sepia':
                const intensity = 0.8;
                pipeline = pipeline.recomb([
                  [0.393 * intensity + (1 - intensity), 0.769 * intensity, 0.189 * intensity],
                  [0.349 * intensity, 0.686 * intensity + (1 - intensity), 0.168 * intensity],
                  [0.272 * intensity, 0.534 * intensity, 0.131 * intensity + (1 - intensity)]
                ]);
                break;
              
              case 'normalize':
                pipeline = pipeline.normalize();
                break;
              
              default:
                throw new Error(`Unknown operation: ${options.operation}`);
            }

            await pipeline.toFile(outputPath);
            processed++;

          } catch (error) {
            failed++;
            if (options.verbose) {
              console.error(chalk.red(`  Failed: ${inputFile}`), error);
            }
          }
        }

        spinner.succeed(chalk.green(`✓ Batch processing complete!`));
        console.log(chalk.dim(`  Processed: ${processed}/${imageFiles.length}`));
        if (failed > 0) {
          console.log(chalk.yellow(`  Failed: ${failed}`));
        }
        console.log(chalk.dim(`  Output directory: ${outputDir}`));

      } catch (error) {
        spinner.fail(chalk.red('Batch processing failed'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
