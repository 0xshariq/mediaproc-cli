import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface PixelateOptions {
  input: string;
  output?: string;
  pixels?: number;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function pixelateCommand(imageCmd: Command): void {
  imageCmd
    .command('pixelate <input>')
    .description('Apply pixelate effect (mosaic/retro style)')
    .option('-p, --pixels <size>', 'Pixel size 2-50 (default: 10)', parseInt, 10)
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for pixelate command')
    .action(async (input: string, options: PixelateOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'pixelate',
          emoji: '🎮',
          description: 'Apply pixelate/mosaic effect to images. Perfect for retro gaming aesthetics, privacy protection, and artistic effects.',
          usage: ['pixelate <input>', 'pixelate <input> --pixels 20', 'pixelate <input> -p 5 -o retro.jpg'],
          options: [
            { flag: '-p, --pixels <size>', description: 'Pixel size 2-50 (default: 10) - larger = more pixelated' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'pixelate photo.jpg', description: 'Apply default pixelation' },
            { command: 'pixelate face.jpg --pixels 20', description: 'Heavy pixelation for privacy' },
            { command: 'pixelate image.png -p 5', description: 'Subtle pixel art effect' },
            { command: 'pixelate game.jpg --pixels 8 -o retro.jpg', description: '8-bit retro gaming style' }
          ],
          additionalSections: [
            {
              title: 'Pixel Size Guide',
              items: [
                '2-5 - Subtle pixelation, retains detail',
                '8-12 - Classic 8-bit/16-bit gaming style',
                '15-25 - Strong effect, good for privacy',
                '30-50 - Extreme pixelation, very blocky'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Retro/vintage gaming aesthetics',
                'Privacy protection (blur faces/text)',
                'Artistic mosaic effects',
                'Censorship/redaction',
                '8-bit style graphics',
                'Low-resolution vintage look'
              ]
            }
          ],
          tips: [
            'Start with 10 and adjust to preference',
            'Larger pixels = stronger effect',
            'Works great for retro game art',
            'Combine with sepia for vintage feel'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Applying pixelate effect...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const pixelSize = Math.max(2, Math.min(50, options.pixels || 10));
        
        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(inputPath.dir, `${inputPath.name}-pixelated${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Pixel size: ${pixelSize}x${pixelSize}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would apply pixelation:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Pixel size: ${pixelSize}x${pixelSize}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const width = metadata.width!;
        const height = metadata.height!;

        // Pixelate by shrinking then enlarging with nearest neighbor
        const shrunkWidth = Math.floor(width / pixelSize);
        const shrunkHeight = Math.floor(height / pixelSize);

        await createSharpInstance(input)
          .resize(shrunkWidth, shrunkHeight, {
            kernel: 'nearest'
          })
          .resize(width, height, {
            kernel: 'nearest'
          })
          .toFile(outputPath);

        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Pixelate effect applied successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${width}x${height}`));
        console.log(chalk.dim(`  Pixel size: ${pixelSize}x${pixelSize}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to apply pixelate effect'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
