import type { Command } from 'commander';
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

export const name = '@mediaproc/image';
export const version = '1.0.0';

export function register(program: Command): void {
  const imageCmd = program
    .command('image')
    .description('Image processing commands (powered by Sharp)');

  // Transform operations
  resizeCommand(imageCmd);
  cropCommand(imageCmd);
  rotateCommand(imageCmd);
  flipCommand(imageCmd);
  trimCommand(imageCmd);
  extendCommand(imageCmd);
  thumbnailCommand(imageCmd);
  
  // Format operations
  convertCommand(imageCmd);
  optimizeCommand(imageCmd);
  
  // Color adjustments
  modulateCommand(imageCmd);
  gammaCommand(imageCmd);
  tintCommand(imageCmd);
  grayscaleCommand(imageCmd);
  negateCommand(imageCmd);
  normalizeCommand(imageCmd);
  
  // Effects and filters
  blurCommand(imageCmd);
  sharpenCommand(imageCmd);
  medianCommand(imageCmd);
  sepiaCommand(imageCmd);
  vignetteCommand(imageCmd);
  
  // Advanced operations
  compositeCommand(imageCmd);
  extractCommand(imageCmd);
  watermarkCommand(imageCmd);
  borderCommand(imageCmd);
  claheCommand(imageCmd);
  convolveCommand(imageCmd);
  
  // Smart/AI operations
  smartCropCommand(imageCmd);
  autoEnhanceCommand(imageCmd);
  pixelateCommand(imageCmd);
  paletteCommand(imageCmd);
  gridCommand(imageCmd);
  dominantColorCommand(imageCmd);
  
  // Batch operations
  batchCommand(imageCmd);
  
  // Utility operations
  splitCommand(imageCmd);
  stackCommand(imageCmd);
  mirrorCommand(imageCmd);
  metadataCommand(imageCmd);
  
  // Information
  statsCommand(imageCmd);
}
