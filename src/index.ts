export { cli } from './cli.js';
export { PluginManager } from './plugin-manager.js';
export type * from './types.js';

// Export path validator utility for plugins to use via dependency injection
export {
  validatePaths,
  parseInputPaths,
  findFilesInDirectory,
  validateOutputPath,
  resolveOutputPaths,
  MediaExtensions,
  type PathValidationOptions,
  type ValidatedPaths
} from './utils/pathValidator.js';
