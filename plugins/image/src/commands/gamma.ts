import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface GammaOptions extends FilterOptions {
  gamma?: number;
  gammaOut?: number;
  help?: boolean;
}

export function gammaCommand(imageCmd: Command): void {
  imageCmd
    .command('gamma <input>')
    .description('Apply gamma correction')
    .option('-g, --gamma <value>', 'Gamma value (1-3, default: 2.2)', parseFloat, 2.2)
    .option('--gamma-out <value>', 'Output gamma (optional)', parseFloat)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for gamma command')
    .action(async (input: string, options: GammaOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'gamma',
          emoji: '🌓',
          description: 'Apply gamma correction to adjust image midtones without affecting shadows/highlights. Essential for color correction and monitor calibration.',
          usage: ['gamma <input>', 'gamma <input> -g <value>', 'gamma <input> -g 2.2 --gamma-out 1.8'],
          options: [
            { flag: '-g, --gamma <value>', description: 'Gamma value 1-3 (default: 2.2, standard sRGB)' },
            { flag: '--gamma-out <value>', description: 'Output gamma value (optional, for specific workflows)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-gamma.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'gamma photo.jpg -g 2.2', description: 'Standard sRGB gamma correction' },
            { command: 'gamma image.png -g 1.5', description: 'Brighten midtones' },
            { command: 'gamma pic.jpg -g 2.8', description: 'Darken midtones' },
            { command: 'gamma photo.jpg -g 2.2 --gamma-out 1.8', description: 'Convert between gamma spaces' }
          ],
          additionalSections: [
            {
              title: 'Gamma Values',
              items: [
                '1.0 - Linear (no correction)',
                '1.5 - Lighter midtones',
                '2.2 - Standard sRGB (most common)',
                '2.4 - Rec. 709 (video)',
                '2.8 - Darker midtones'
              ]
            },
            {
              title: 'Understanding Gamma',
              items: [
                'Lower gamma (<2.2) - Brightens image',
                'Higher gamma (>2.2) - Darkens image',
                'Gamma 2.2 - Standard for web/sRGB',
                'Affects midtones more than extremes',
                'Essential for color accuracy'
              ]
            }
          ],
          tips: [
            'Use 2.2 for standard web images',
            'Lower values brighten without washing out',
            'Higher values darken without crushing blacks',
            'Different from brightness - affects midtones'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Processing image...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-gamma${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Gamma: ${options.gamma || 2.2}`));
          if (options.gammaOut) {
            console.log(chalk.dim(`  Gamma out: ${options.gammaOut}`));
          }
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would apply gamma correction:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          console.log(chalk.dim(`  Gamma: ${options.gamma || 2.2}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input).gamma(
          options.gamma || 2.2,
          options.gammaOut
        );

        const outputExt = path.extname(outputPath).toLowerCase();
        if (outputExt === '.jpg' || outputExt === '.jpeg') {
          pipeline.jpeg({ quality: options.quality || 90 });
        } else if (outputExt === '.png') {
          pipeline.png({ quality: options.quality || 90 });
        } else if (outputExt === '.webp') {
          pipeline.webp({ quality: options.quality || 90 });
        }

        await pipeline.toFile(outputPath);

        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Gamma correction applied successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  Gamma: ${options.gamma || 2.2}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to apply gamma correction'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
