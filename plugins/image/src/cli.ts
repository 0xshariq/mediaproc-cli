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

const program = new Command();

program
  .name('mediaproc-image')
  .description('Image processing CLI powered by Sharp')
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

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
