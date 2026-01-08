import type { Command } from 'commander';
import { compressCommand } from './commands/compress.js';
import { convertCommand } from './commands/convert.js';
import { transcodeCommand } from './commands/transcode.js';
import { extractCommand } from './commands/extract.js';
import { trimCommand } from './commands/trim.js';
import { resizeCommand } from './commands/resize.js';
import { mergeCommand } from './commands/merge.js';

export const name = '@mediaproc/video';
export const version = '1.0.0';

export function register(program: Command): void {
  // Register commands directly without 'video' subcommand
  compressCommand(program);
  convertCommand(program);
  transcodeCommand(program);
  extractCommand(program);
  trimCommand(program);
  resizeCommand(program);
  mergeCommand(program);
}
