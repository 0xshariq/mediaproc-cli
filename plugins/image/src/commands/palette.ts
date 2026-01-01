import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface PaletteOptions {
  input: string;
  colors?: number;
  verbose?: boolean;
  help?: boolean;
}

export function paletteCommand(imageCmd: Command): void {
  imageCmd
    .command('palette <input>')
    .description('Extract dominant color palette from image')
    .option('-c, --colors <count>', 'Number of colors to extract 1-10 (default: 5)', parseInt, 5)
    .option('-v, --verbose', 'Verbose output with hex codes')
    .option('--help', 'Display help for palette command')
    .action(async (input: string, options: PaletteOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'palette',
          emoji: '🎨',
          description: 'Extract and display the dominant color palette from an image. Perfect for design inspiration, brand color extraction, and theme generation.',
          usage: ['palette <input>', 'palette <input> --colors 8', 'palette <input> -c 3 -v'],
          options: [
            { flag: '-c, --colors <count>', description: 'Number of colors to extract 1-10 (default: 5)' },
            { flag: '-v, --verbose', description: 'Show detailed output with hex codes and RGB values' }
          ],
          examples: [
            { command: 'palette photo.jpg', description: 'Extract 5 dominant colors' },
            { command: 'palette image.png --colors 8', description: 'Extract 8 colors palette' },
            { command: 'palette brand-logo.jpg -c 3 -v', description: 'Extract 3 brand colors with details' },
            { command: 'palette artwork.png --colors 10', description: 'Full 10-color palette' }
          ],
          additionalSections: [
            {
              title: 'Use Cases',
              items: [
                'Design inspiration - extract colors from photos',
                'Brand identity - get colors from logos',
                'Theme generation - create color schemes',
                'UI/UX design - match website colors',
                'Art analysis - understand color composition',
                'Product design - match product colors'
              ]
            },
            {
              title: 'Output Information',
              items: [
                'Dominant colors ranked by prevalence',
                'RGB values for each color',
                'Hex codes for web/design use',
                'Visual color blocks (in terminal)',
                'Percentage of image coverage'
              ]
            }
          ],
          tips: [
            'Use fewer colors (3-5) for cleaner palettes',
            'More colors (8-10) for complex images',
            'Verbose mode shows hex codes for design',
            'Great for finding complementary colors'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Analyzing image colors...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const colorCount = Math.max(1, Math.min(10, options.colors || 5));

        const metadata = await createSharpInstance(input).metadata();
        const stats = await createSharpInstance(input).stats();

        spinner.succeed(chalk.green('✓ Color palette extracted!\n'));

        console.log(chalk.bold.cyan(`📷 Image: ${path.basename(input)}`));
        console.log(chalk.dim(`   Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`   Format: ${metadata.format?.toUpperCase()}`));
        console.log('');

        console.log(chalk.bold.cyan(`🎨 Dominant Color Palette (${colorCount} colors):\n`));

        // Get dominant color
        if (stats.dominant) {
          const { r, g, b } = stats.dominant;
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
          
          console.log(chalk.bold('  Primary Dominant Color:'));
          console.log(`  ${chalk.rgb(r, g, b)('██████')} RGB(${r}, ${g}, ${b}) ${chalk.dim(hex)}`);
          console.log('');
        }

        // Get channel statistics for additional color information
        if (stats.channels && stats.channels.length >= 3) {
          console.log(chalk.bold('  Channel Analysis:'));
          
          const channels = ['Red', 'Green', 'Blue'];
          stats.channels.slice(0, 3).forEach((channel, index) => {
            const channelName = channels[index];
            const avgValue = Math.round(channel.mean);
            const color = index === 0 ? [avgValue, 0, 0] : index === 1 ? [0, avgValue, 0] : [0, 0, avgValue];
            
            console.log(`  ${channelName.padEnd(6)}: ${chalk.rgb(color[0], color[1], color[2])('██')} Avg: ${avgValue.toString().padStart(3)} (min: ${channel.min}, max: ${channel.max})`);
          });
          console.log('');
        }

        // Calculate additional color info
        if (stats.channels && stats.channels.length >= 3) {
          const avgR = Math.round(stats.channels[0].mean);
          const avgG = Math.round(stats.channels[1].mean);
          const avgB = Math.round(stats.channels[2].mean);
          
          console.log(chalk.bold('  Average Image Tone:'));
          const avgHex = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`.toUpperCase();
          console.log(`  ${chalk.rgb(avgR, avgG, avgB)('██████')} RGB(${avgR}, ${avgG}, ${avgB}) ${chalk.dim(avgHex)}`);
          console.log('');

          // Determine overall tone
          const brightness = (avgR + avgG + avgB) / 3;
          const tone = brightness > 200 ? 'Very Light' : brightness > 150 ? 'Light' : brightness > 100 ? 'Medium' : brightness > 50 ? 'Dark' : 'Very Dark';
          
          console.log(chalk.dim(`  Overall Brightness: ${tone} (${Math.round(brightness)}/255)`));
          
          // Color temperature
          const warmCool = avgR > avgB ? 'Warm' : avgR < avgB ? 'Cool' : 'Neutral';
          console.log(chalk.dim(`  Color Temperature: ${warmCool}`));
          
          // Saturation estimate
          const maxChannel = Math.max(avgR, avgG, avgB);
          const minChannel = Math.min(avgR, avgG, avgB);
          const saturation = maxChannel === 0 ? 0 : ((maxChannel - minChannel) / maxChannel) * 100;
          console.log(chalk.dim(`  Saturation: ${saturation.toFixed(1)}%`));
        }

        if (options.verbose) {
          console.log('');
          console.log(chalk.dim('💡 Tip: Use these colors in your designs, websites, or branding!'));
          console.log(chalk.dim('   Copy hex codes directly for CSS/design tools.'));
        }

      } catch (error) {
        spinner.fail(chalk.red('Failed to extract palette'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
