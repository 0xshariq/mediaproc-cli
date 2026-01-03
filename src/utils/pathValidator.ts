import * as fs from 'fs';
import * as path from 'path';

export interface PathValidationOptions {
  /**
   * Allowed file extensions (e.g., ['.jpg', '.png'] for images)
   * If not provided, all files are allowed
   */
  allowedExtensions?: string[];
  
  /**
   * Whether to search directories recursively
   * @default true
   */
  recursive?: boolean;
  
  /**
   * Maximum depth for recursive directory search
   * @default 10
   */
  maxDepth?: number;
}

export interface ValidatedPaths {
  inputFiles: string[];
  outputDir: string;
  errors: string[];
}

/**
 * Parse comma-separated input paths and expand them into individual file paths
 * Supports:
 * - Single file: "photo.jpg"
 * - Multiple files: "photo1.jpg,photo2.jpg,photo3.jpg"
 * - Directories: "./photos/" (finds all matching files)
 * - Mixed: "photo.jpg,./photos/,another.jpg"
 */
export function parseInputPaths(
  inputPath: string,
  options: PathValidationOptions = {}
): string[] {
  const { allowedExtensions, recursive = true, maxDepth = 10 } = options;
  
  // Split by comma and trim whitespace
  const paths = inputPath.split(',').map(p => p.trim()).filter(p => p.length > 0);
  
  const allFiles: string[] = [];
  
  for (const p of paths) {
    const resolvedPath = path.resolve(p);
    
    // Check if path exists
    if (!fs.existsSync(resolvedPath)) {
      continue; // Skip non-existent paths
    }
    
    const stats = fs.statSync(resolvedPath);
    
    if (stats.isFile()) {
      // Check if file extension is allowed
      if (!allowedExtensions || isAllowedExtension(resolvedPath, allowedExtensions)) {
        allFiles.push(resolvedPath);
      }
    } else if (stats.isDirectory()) {
      // Find all matching files in directory
      const filesInDir = findFilesInDirectory(resolvedPath, {
        allowedExtensions,
        recursive,
        maxDepth,
      });
      allFiles.push(...filesInDir);
    }
  }
  
  // Remove duplicates
  return [...new Set(allFiles)];
}

/**
 * Find all files in a directory that match the allowed extensions
 */
export function findFilesInDirectory(
  dirPath: string,
  options: PathValidationOptions = {},
  currentDepth: number = 0
): string[] {
  const { allowedExtensions, recursive = true, maxDepth = 10 } = options;
  
  if (currentDepth > maxDepth) {
    return [];
  }
  
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isFile()) {
        // Check if file extension is allowed
        if (!allowedExtensions || isAllowedExtension(fullPath, allowedExtensions)) {
          files.push(fullPath);
        }
      } else if (entry.isDirectory() && recursive) {
        // Recursively search subdirectories
        const subFiles = findFilesInDirectory(fullPath, options, currentDepth + 1);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    // Ignore errors (e.g., permission denied)
  }
  
  return files;
}

/**
 * Check if a file has an allowed extension
 */
function isAllowedExtension(filePath: string, allowedExtensions: string[]): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return allowedExtensions.some(allowed => allowed.toLowerCase() === ext);
}

/**
 * Validate and resolve output path
 * - If outputPath is provided and is a directory, use it
 * - If outputPath is provided and doesn't exist, create it as a directory
 * - If outputPath is not provided, use current working directory
 */
export function validateOutputPath(outputPath?: string): string {
  if (!outputPath) {
    // Default to current working directory
    return process.cwd();
  }
  
  const resolvedPath = path.resolve(outputPath);
  
  // If path exists and is a directory, use it
  if (fs.existsSync(resolvedPath)) {
    const stats = fs.statSync(resolvedPath);
    if (stats.isDirectory()) {
      return resolvedPath;
    } else {
      // If it's a file, use its directory
      return path.dirname(resolvedPath);
    }
  }
  
  // Path doesn't exist - create it as a directory
  try {
    fs.mkdirSync(resolvedPath, { recursive: true });
    return resolvedPath;
  } catch (error) {
    // If we can't create the directory, fall back to current directory
    console.warn(`Could not create output directory ${resolvedPath}, using current directory`);
    return process.cwd();
  }
}

/**
 * Generate output file paths for a list of input files
 * @param inputFiles - Array of input file paths
 * @param outputDir - Directory where output files should be placed
 * @param suffix - Suffix to add to output filenames (e.g., "-resized")
 * @param newExtension - New extension for output files (e.g., ".webp")
 * @param preserveStructure - Whether to preserve directory structure for nested inputs
 */
export function resolveOutputPaths(
  inputFiles: string[],
  outputDir: string,
  options: {
    suffix?: string;
    newExtension?: string;
    preserveStructure?: boolean;
  } = {}
): Map<string, string> {
  const { suffix = '', newExtension, preserveStructure = false } = options;
  
  const outputMap = new Map<string, string>();
  
  // Find common base path if preserving structure
  let basePath = '';
  if (preserveStructure && inputFiles.length > 1) {
    basePath = findCommonBasePath(inputFiles);
  }
  
  for (const inputFile of inputFiles) {
    const inputPath = path.parse(inputFile);
    
    // Determine output filename
    const ext = newExtension || inputPath.ext;
    const outputFilename = `${inputPath.name}${suffix}${ext}`;
    
    // Determine output directory
    let finalOutputDir = outputDir;
    if (preserveStructure && basePath) {
      const relativePath = path.relative(basePath, inputPath.dir);
      finalOutputDir = path.join(outputDir, relativePath);
      
      // Create nested directories if needed
      if (!fs.existsSync(finalOutputDir)) {
        fs.mkdirSync(finalOutputDir, { recursive: true });
      }
    }
    
    const outputPath = path.join(finalOutputDir, outputFilename);
    outputMap.set(inputFile, outputPath);
  }
  
  return outputMap;
}

/**
 * Find the common base path for a list of file paths
 */
function findCommonBasePath(files: string[]): string {
  if (files.length === 0) return '';
  if (files.length === 1) return path.dirname(files[0]);
  
  const dirs = files.map(f => path.dirname(f));
  const parts = dirs.map(d => d.split(path.sep));
  
  const minLength = Math.min(...parts.map(p => p.length));
  const commonParts: string[] = [];
  
  for (let i = 0; i < minLength; i++) {
    const part = parts[0][i];
    if (parts.every(p => p[i] === part)) {
      commonParts.push(part);
    } else {
      break;
    }
  }
  
  return commonParts.join(path.sep) || '/';
}

/**
 * Validate paths and return structured result with errors
 * This is a convenience function that combines all validation steps
 */
export function validatePaths(
  inputPath: string,
  outputPath: string | undefined,
  options: PathValidationOptions = {}
): ValidatedPaths {
  const errors: string[] = [];
  
  // Parse and validate input paths
  const inputFiles = parseInputPaths(inputPath, options);
  
  if (inputFiles.length === 0) {
    errors.push(`No valid input files found matching the criteria`);
    if (options.allowedExtensions) {
      errors.push(`Allowed extensions: ${options.allowedExtensions.join(', ')}`);
    }
  }
  
  // Validate output directory
  const outputDir = validateOutputPath(outputPath);
  
  return {
    inputFiles,
    outputDir,
    errors,
  };
}

/**
 * Common file extension sets for different media types
 * Plugins can use these or define their own
 */
export const MediaExtensions = {
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif', '.svg', '.ico', '.heic', '.heif'],
  VIDEO: ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm', '.m4v', '.mpg', '.mpeg', '.3gp'],
  AUDIO: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.opus', '.ape', '.alac'],
  DOCUMENT: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.md', '.html', '.xml'],
  THREED: ['.obj', '.fbx', '.gltf', '.glb', '.stl', '.dae', '.3ds', '.blend', '.ply'],
  ANIMATION: ['.gif', '.apng', '.webp', '.mp4'],
  ALL: [], // Empty array means all files are allowed
};
