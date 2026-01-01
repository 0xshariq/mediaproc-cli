import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface VignetteOptions {
  input: string;
  output?: string;
  strength?: number;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function vignetteCommand(imageCmd: Command): void {
  imageCmd
    .command('vignette <input>')
    .description('Add vignette effect (darkened edges)')
    .option('-s, --strength <value>', 'Vignette strength 0-100 (default: 50)', parseFloat, 50)
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for vignette command')
    .action(async (input: string, options: VignetteOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'vignette',
          emoji: '🌓',
          description: 'Add vignette effect by darkening or lightening the edges of an image. Creates focus on the center and adds artistic mood.',
          usage: ['vignette <input>', 'vignette <input> -s 70', 'vignette <input> -o artistic.jpg'],
          options: [
            { flag: '-s, --strength <value>', description: 'Vignette strength 0-100 (default: 50)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'vignette photo.jpg', description: 'Apply default vignette' },
            { command: 'vignette portrait.png -s 80', description: 'Strong vignette effect' },
            { command: 'vignette landscape.jpg -s 30', description: 'Subtle edge darkening' },
            { command: 'vignette image.jpg -o artistic.jpg', description: 'Save with vignette' }
          ],
          additionalSections: [
            {
              title: 'Strength Guide',
              items: [
                '0-20 - Very subtle, barely noticeable',
                '30-50 - Moderate, natural look (recommended)',
                '60-80 - Strong, dramatic effect',
                '90-100 - Very intense, artistic'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Portrait photography - focus on subject',
                'Vintage/retro effects',
                'Artistic mood creation',
                'Direct viewer attention to center',
                'Wedding and event photography',
                'Social media posts'
              ]
            }
          ],
          tips: [
            'Start with 50 and adjust to taste',
            'Works great with portraits',
            'Combine with sepia for vintage look',
            'Lower strength for natural results'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Adding vignette...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const strength = Math.max(0, Math.min(100, options.strength || 50)) / 100;
        
        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(inputPath.dir, `${inputPath.name}-vignette${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Strength: ${(strength * 100).toFixed(0)}%`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would add vignette:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Strength: ${(strength * 100).toFixed(0)}%`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const width = metadata.width!;
        const height = metadata.height!;

        // Create radial gradient for vignette
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

        if (options.verbose) {
          console.log(chalk.dim(`  Center: (${centerX}, ${centerY})`));
          console.log(chalk.dim(`  Max radius: ${maxRadius.toFixed(2)}px`));
          console.log(chalk.dim(`  Strength: ${strength}`));
        }

        // Create vignette overlay using SVG
        const vignetteOverlay = Buffer.from(`
          <svg width="${width}" height="${height}">
            <defs>
              <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
                <stop offset="40%" style="stop-color:white;stop-opacity:0" />
                <stop offset="100%" style="stop-color:black;stop-opacity:${strength}" />
              </radialGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#vignette)" />
          </svg>
        `);

        await createSharpInstance(input)
          .composite([{
            input: vignetteOverlay,
            blend: 'multiply'
          }])
          .toFile(outputPath);

        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Vignette added successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${width}x${height}`));
        console.log(chalk.dim(`  Strength: ${(strength * 100).toFixed(0)}%`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to add vignette'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
