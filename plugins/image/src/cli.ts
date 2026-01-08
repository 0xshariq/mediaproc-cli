#!/usr/bin/env node
import { Command } from 'commander';
import { resizeCommand } from './commands/resize.js';
import { convertCommand } from './commands/convert.js';
import { grayscaleCommand } from './commands/grayscale.js';
import { blurCommand } from './commands/blur.js';
import { sharpenCommand } from './commands/sharpen.js';
import { rotateCommand } from './commands/rotate.js';
import { flipCommand } from './commands/flip.js';
import { cropCommand } from './commands/crop.js';
import { optimizeCommand } from './commands/optimize.js';
import { watermarkCommand } from './commands/watermark.js';
import { thumbnailCommand } from './commands/thumbnail.js';
import { tintCommand } from './commands/tint.js';
import { negateCommand } from './commands/negate.js';
import { normalizeCommand } from './commands/normalize.js';
import { modulateCommand } from './commands/modulate.js';
import { gammaCommand } from './commands/gamma.js';
import { trimCommand } from './commands/trim.js';
import { extendCommand } from './commands/extend.js';
import { medianCommand } from './commands/median.js';
import { compositeCommand } from './commands/composite.js';
import { extractCommand } from './commands/extract.js';
import { borderCommand } from './commands/border.js';
import { statsCommand } from './commands/stats.js';
import { sepiaCommand } from './commands/sepia.js';
import { claheCommand } from './commands/clahe.js';
import { convolveCommand } from './commands/convolve.js';
import { vignetteCommand } from './commands/vignette.js';
import { batchCommand } from './commands/batch.js';
import { smartCropCommand } from './commands/smart-crop.js';
import { pixelateCommand } from './commands/pixelate.js';
import { paletteCommand } from './commands/palette.js';
import { autoEnhanceCommand } from './commands/auto-enhance.js';
import { gridCommand } from './commands/grid.js';
import { splitCommand } from './commands/split.js';
import { metadataCommand } from './commands/metadata-cmd.js';
import { stackCommand } from './commands/stack.js';
import { mirrorCommand } from './commands/mirror.js';
import { dominantColorCommand } from './commands/dominant-color.js';
import { flopCommand } from './commands/flop.js';
import { autoOrientCommand } from './commands/auto-orient.js';
import { affineCommand } from './commands/affine.js';
import { thresholdCommand } from './commands/threshold.js';
import { flattenCommand } from './commands/flatten.js';
import { unflattenCommand } from './commands/unflatten.js';
import { dilateCommand } from './commands/dilate.js';
import { erodeCommand } from './commands/erode.js';
import { booleanCommand } from './commands/boolean.js';
import { linearCommand } from './commands/linear.js';
import { recombCommand } from './commands/recomb.js';
import { compressCommand } from './commands/compress.js';
import { infoCommand } from './commands/info.js';

const program = new Command();

program
  .name('mediaproc-image')
  .description(`
🌄 Image Processing Plugin v1.0.0

Professional image processing powered by Sharp. Transform, optimize, and enhance images with 49+ commands.

✨ Key Features:
  • Transform & Resize (7 commands): resize, crop, rotate, flip, trim, extend, thumbnail
  • Color & Tone (6 commands): modulate, gamma, tint, grayscale, negate, normalize
  • Effects & Filters (9 commands): blur, sharpen, median, sepia, vignette, pixelate, threshold, dilate, erode
  • Advanced Operations (6 commands): composite, extract, border, clahe, convolve, boolean
  • Smart/AI Operations (6 commands): smart-crop, auto-enhance, palette, dominant-color, grid, batch
  • Utility (10 commands): compress, convert, optimize, info, watermark, stats, split, stack, mirror, metadata

📂 Format Support:
  Input:  JPG, PNG, WebP, AVIF, TIFF, GIF, SVG, HEIF
  Output: JPG, PNG, WebP, AVIF, TIFF, GIF
  Modern: WebP (25-35% smaller), AVIF (50% smaller)

🚀 Usage:
  mediaproc-image <command> [options]
  mediaproc-image resize image.jpg -w 1920
  mediaproc-image convert image.jpg --format webp
  mediaproc-image optimize images/ -o output/

📚 Use 'mediaproc-image <command> --help' for detailed command documentation.
  `)
  .version('1.0.0');

// Register all commands directly (no "image" prefix in standalone mode)
resizeCommand(program);
convertCommand(program);
grayscaleCommand(program);
blurCommand(program);
sharpenCommand(program);
rotateCommand(program);
flipCommand(program);
cropCommand(program);
optimizeCommand(program);
watermarkCommand(program);
thumbnailCommand(program);
tintCommand(program);
negateCommand(program);
normalizeCommand(program);
modulateCommand(program);
gammaCommand(program);
trimCommand(program);
extendCommand(program);
medianCommand(program);
compositeCommand(program);
extractCommand(program);
borderCommand(program);
statsCommand(program);
sepiaCommand(program);
claheCommand(program);
convolveCommand(program);
vignetteCommand(program);
batchCommand(program);
smartCropCommand(program);
pixelateCommand(program);
paletteCommand(program);
autoEnhanceCommand(program);
gridCommand(program);
splitCommand(program);
metadataCommand(program);
stackCommand(program);
mirrorCommand(program);
dominantColorCommand(program);
flopCommand(program);
autoOrientCommand(program);
affineCommand(program);
thresholdCommand(program);
flattenCommand(program);
unflattenCommand(program);
dilateCommand(program);
erodeCommand(program);
booleanCommand(program);
linearCommand(program);
recombCommand(program);
compressCommand(program);
infoCommand(program);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
