import * as fs from 'fs';
import * as path from 'path';

/**
 * Supported video file extensions
 */
export const VIDEO_EXTENSIONS = [
  '.mp4',
  '.avi',
  '.mkv',
  '.mov',
  '.webm',
  '.flv',
  '.wmv',
  '.mpg',
  '.mpeg',
  '.m4v',
  '.3gp',
  '.f4v',
  '.ts',
  '.mts',
  '.m2ts',
];

/**
 * Parse input path and return array of files
 * Supports:
 * - Single file: "video.mp4"
 * - Multiple files with commas: "video1.mp4,video2.mp4,video3.mp4"
 * - Directory: "input-videos/" (finds all matching files)
 */
export function parseInputPaths(
  inputPath: string,
  allowedExtensions: string[] = VIDEO_EXTENSIONS
): string[] {
  const files: string[] = [];

  // Split by comma for multiple files
  const paths = inputPath.split(',').map(p => p.trim());

  for (const p of paths) {
    const resolvedPath = path.resolve(p);

    // Check if path exists
    if (!fs.existsSync(resolvedPath)) {
      continue; // Skip non-existent paths
    }

    const stats = fs.statSync(resolvedPath);

    if (stats.isFile()) {
      // Check if file has allowed extension
      const ext = path.extname(resolvedPath).toLowerCase();
      if (allowedExtensions.includes(ext)) {
        files.push(resolvedPath);
      }
    } else if (stats.isDirectory()) {
      // Recursively find all files in directory
      const dirFiles = findFilesInDirectory(resolvedPath, allowedExtensions);
      files.push(...dirFiles);
    }
  }

  return files;
}

/**
 * Recursively find all files with allowed extensions in a directory
 */
function findFilesInDirectory(
  dir: string,
  allowedExtensions: string[]
): string[] {
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        files.push(...findFilesInDirectory(fullPath, allowedExtensions));
      } else if (entry.isFile()) {
        const ext = path.extname(fullPath).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Ignore directories that can't be read
  }

  return files;
}

/**
 * Resolve output paths for input files
 * 
 * Logic:
 * 1. Single file + output has extension (e.g., output.mp4) = Use exact file path
 * 2. Multiple files + output has extension = Invalid (error)
 * 3. No output provided = Use current directory
 * 4. Output directory provided = Use that directory
 * 
 * @param inputFiles - Array of input file paths
 * @param outputPath - Output path (file or directory, or undefined for current dir)
 * @param suffix - Suffix to add to filenames (default: empty)
 * @param newExtension - New extension for output files (default: same as input)
 */
export function resolveOutputPaths(
  inputFiles: string[],
  outputPath: string | undefined,
  options: {
    suffix?: string;
    newExtension?: string;
  } = {}
): Map<string, string> {
  const { suffix = '', newExtension } = options;
  const outputMap = new Map<string, string>();

  // No input files - return empty map
  if (inputFiles.length === 0) {
    return outputMap;
  }

  // Determine output directory or file
  let outputDir: string;
  let isExplicitFile = false;

  if (!outputPath) {
    // No output provided - use current directory
    outputDir = process.cwd();
  } else {
    const resolvedOutput = path.resolve(outputPath);
    const outputExt = path.extname(resolvedOutput).toLowerCase();

    if (outputExt) {
      // Output has extension - it's a file path
      if (inputFiles.length > 1) {
        throw new Error('Cannot specify a file output path for multiple input files. Use a directory instead.');
      }
      // Single file with explicit output file
      isExplicitFile = true;
      outputDir = resolvedOutput;
    } else {
      // No extension - it's a directory path
      outputDir = resolvedOutput;
    }
  }

  // Case 1: Single file with explicit output file path
  if (isExplicitFile && inputFiles.length === 1) {
    // Create parent directory if needed
    const parentDir = path.dirname(outputDir);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    outputMap.set(inputFiles[0], outputDir);
    return outputMap;
  }

  // Case 2: Multiple files or directory output
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Map each input file to output path
  for (const inputFile of inputFiles) {
    const inputParsed = path.parse(inputFile);
    const ext = newExtension || inputParsed.ext;
    const outputFilename = `${inputParsed.name}${suffix}${ext}`;
    const outputFilePath = path.join(outputDir, outputFilename);
    outputMap.set(inputFile, outputFilePath);
  }

  return outputMap;
}

/**
 * Validate input and output paths
 * Returns validated input files, output directory, and any errors
 */
export function validatePaths(
  inputPath: string,
  outputPath: string | undefined,
  options: {
    allowedExtensions?: string[];
    suffix?: string;
    newExtension?: string;
  } = {}
): {
  inputFiles: string[];
  outputPath: string | undefined;
  errors: string[];
} {
  const { allowedExtensions = VIDEO_EXTENSIONS } = options;
  const errors: string[] = [];

  // Parse input files
  const inputFiles = parseInputPaths(inputPath, allowedExtensions);

  if (inputFiles.length === 0) {
    errors.push(`No valid video files found. Supported extensions: ${allowedExtensions.join(', ')}`);
  }

  // Validate output path if provided
  if (outputPath) {
    const resolvedOutput = path.resolve(outputPath);
    const outputExt = path.extname(resolvedOutput).toLowerCase();

    // If output has extension but multiple input files
    if (outputExt && inputFiles.length > 1) {
      errors.push('Cannot specify a file output path for multiple input files. Use a directory instead.');
    }
  }

  return {
    inputFiles,
    outputPath,
    errors,
  };
}

/**
 * Get file name from path
 */
export function getFileName(filePath: string): string {
  return path.basename(filePath);
}

/**
 * Generate default output filename with suffix
 */
export function generateOutputFilename(
  inputPath: string,
  suffix: string,
  extension?: string
): string {
  const parsed = path.parse(inputPath);
  const ext = extension || parsed.ext;
  return `${parsed.name}${suffix}${ext}`;
}

/**
 * Check if file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Create directory if it doesn't exist
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
