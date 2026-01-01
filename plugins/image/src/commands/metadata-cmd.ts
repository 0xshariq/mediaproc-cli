import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface MetadataCommandOptions {
  input: string;
  remove?: boolean;
  removeAll?: boolean;
  export?: string;
  output?: string;
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

      const spinner = ora('Reading metadata...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const metadata = await createSharpInstance(input).metadata();

        // Remove metadata mode
        if (options.remove || options.removeAll) {
          spinner.text = 'Removing metadata...';
          
          const inputPath = path.parse(input);
          const outputPath = options.output || path.join(inputPath.dir, `${inputPath.name}-clean${inputPath.ext}`);

          await createSharpInstance(input)
            .withMetadata({
              // Remove all metadata
              exif: {},
              icc: undefined,
              xmp: undefined
            } as any)
            .toFile(outputPath);

          const inputStats = fs.statSync(input);
          const outputStats = fs.statSync(outputPath);
          const savedBytes = inputStats.size - outputStats.size;

          spinner.succeed(chalk.green('✓ Metadata removed successfully!'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Original size: ${(inputStats.size / 1024).toFixed(2)}KB`));
          console.log(chalk.dim(`  New size: ${(outputStats.size / 1024).toFixed(2)}KB`));
          console.log(chalk.dim(`  Saved: ${(savedBytes / 1024).toFixed(2)}KB (${((savedBytes / inputStats.size) * 100).toFixed(1)}%)`));
          return;
        }

        // Export metadata mode
        if (options.export) {
          spinner.text = 'Exporting metadata...';
          
          const metadataObj = {
            file: {
              path: input,
              size: fs.statSync(input).size,
              modified: fs.statSync(input).mtime
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

          fs.writeFileSync(options.export, JSON.stringify(metadataObj, null, 2));

          spinner.succeed(chalk.green('✓ Metadata exported!'));
          console.log(chalk.dim(`  Exported to: ${options.export}`));
          return;
        }

        // View metadata mode (default)
        spinner.succeed(chalk.green('✓ Metadata retrieved!\n'));

        console.log(chalk.bold.cyan('📁 File Information:'));
        console.log(chalk.dim(`  Path: ${input}`));
        const fileStats = fs.statSync(input);
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

      } catch (error) {
        spinner.fail(chalk.red('Failed to process metadata'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
