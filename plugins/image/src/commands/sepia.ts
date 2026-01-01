import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface SepiaOptions {
  input: string;
  output?: string;
  intensity?: number;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function sepiaCommand(imageCmd: Command): void {
  imageCmd
    .command('sepia <input>')
    .description('Apply sepia tone effect (vintage/antique look)')
    .option('-i, --intensity <value>', 'Sepia intensity 0-100 (default: 80)', parseFloat, 80)
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for sepia command')
    .action(async (input: string, options: SepiaOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'sepia',
          emoji: '📜',
          description: 'Apply sepia tone effect to create vintage, antique, or nostalgic photographs. Converts colors to warm brown tones.',
          usage: ['sepia <input>', 'sepia <input> -i 90', 'sepia <input> -o vintage.jpg'],
          options: [
            { flag: '-i, --intensity <value>', description: 'Sepia intensity 0-100 (default: 80)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'sepia photo.jpg', description: 'Apply default sepia effect' },
            { command: 'sepia image.png -i 100', description: 'Maximum sepia intensity' },
            { command: 'sepia pic.jpg -i 50', description: 'Subtle sepia tone' },
            { command: 'sepia photo.jpg -o vintage.jpg', description: 'Save as vintage photo' }
          ],
          additionalSections: [
            {
              title: 'Intensity Guide',
              items: [
                '0-30 - Subtle warm tint',
                '40-60 - Moderate vintage look',
                '70-85 - Classic sepia (recommended)',
                '90-100 - Strong antique effect'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Create vintage photograph effects',
                'Historical photo restoration style',
                'Artistic nostalgic looks',
                'Wedding photo albums',
                'Heritage collections'
              ]
            }
          ],
          tips: [
            'Start with 80 intensity for classic look',
            'Combine with vignette for enhanced vintage feel',
            'Works great on portraits and landscapes',
            'Lower intensity for subtle warmth'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Applying sepia tone...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const intensity = Math.max(0, Math.min(100, options.intensity || 80)) / 100;
        
        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(inputPath.dir, `${inputPath.name}-sepia${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Intensity: ${(intensity * 100).toFixed(0)}%`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would apply sepia tone:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Intensity: ${(intensity * 100).toFixed(0)}%`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();

        // Sepia tone matrix (standard sepia transformation)
        // Adjusted by intensity
        const sepiaMatrix = [
          [0.393 * intensity + (1 - intensity), 0.769 * intensity, 0.189 * intensity],
          [0.349 * intensity, 0.686 * intensity + (1 - intensity), 0.168 * intensity],
          [0.272 * intensity, 0.534 * intensity, 0.131 * intensity + (1 - intensity)]
        ];

        await createSharpInstance(input)
          .recomb(sepiaMatrix as [[number, number, number], [number, number, number], [number, number, number]])
          .toFile(outputPath);

        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Sepia tone applied successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  Intensity: ${(intensity * 100).toFixed(0)}%`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to apply sepia tone'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
