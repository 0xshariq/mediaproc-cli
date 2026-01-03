# Path Validator Guide

Complete guide for using the global path validator utility in MediaProc plugins.

---

## Overview

The **Path Validator** is a global utility provided by `@mediaproc/cli` that standardizes input/output path handling across all plugins. It enables consistent multi-file processing, directory support, and smart output path resolution.

### Why Use It?

✅ **Consistency** - All plugins handle paths the same way  
✅ **Multi-file Support** - Automatically supports comma-separated file inputs  
✅ **Directory Processing** - Recursively finds files in directories  
✅ **Smart Output Paths** - Handles root-level and custom output directories  
✅ **Dependency Injection** - No tight coupling between plugins  
✅ **Maintained by Core** - Bug fixes and improvements benefit all plugins  
✅ **Production Ready** - Thoroughly tested and battle-hardened

---

## Installation

The path validator is included in `@mediaproc/cli`, which should be a peer dependency of your plugin:

```json
{
  "name": "@mediaproc/plugin-yourplugin",
  "peerDependencies": {
    "@mediaproc/cli": "^0.3.0"
  }
}
```

---

## Quick Start

```typescript
import type { Command } from 'commander';
import { 
  validatePaths, 
  resolveOutputPaths, 
  MediaExtensions 
} from '@mediaproc/cli';

export function myCommand(cmd: Command): void {
  cmd
    .command('process <input>')
    .option('-o, --output <path>', 'Output directory')
    .action(async (input: string, options: any) => {
      // 1. Validate inputs
      const { inputFiles, outputDir, errors } = validatePaths(
        input, 
        options.output,
        { allowedExtensions: MediaExtensions.IMAGE }
      );

      // 2. Check for errors
      if (errors.length > 0) {
        errors.forEach(err => console.error(err));
        process.exit(1);
      }

      // 3. Resolve output paths
      const outputPaths = resolveOutputPaths(inputFiles, outputDir, {
        suffix: '-processed'
      });

      // 4. Process files
      for (const inputFile of inputFiles) {
        const outputPath = outputPaths.get(inputFile)!;
        await processFile(inputFile, outputPath);
      }
    });
}
```

---

## API Reference

### `validatePaths(input, output, options)`

Validates and parses input paths, returns structured result.

```typescript
function validatePaths(
  inputPath: string,
  outputPath: string | undefined,
  options?: PathValidationOptions
): ValidatedPaths
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `inputPath` | `string` | Input path(s) - can be single file, comma-separated files, or directory |
| `outputPath` | `string \| undefined` | Output directory (optional, defaults to current directory) |
| `options` | `PathValidationOptions` | Validation options |

**Options:**

```typescript
interface PathValidationOptions {
  // Filter files by extensions (e.g., ['.jpg', '.png'])
  allowedExtensions?: string[];
  
  // Search directories recursively (default: true)
  recursive?: boolean;
  
  // Maximum directory depth (default: 10)
  maxDepth?: number;
}
```

**Returns:**

```typescript
interface ValidatedPaths {
  inputFiles: string[];    // Array of resolved absolute file paths
  outputDir: string;       // Validated output directory path
  errors: string[];        // Array of error messages (empty if valid)
}
```

**Example:**

```typescript
const { inputFiles, outputDir, errors } = validatePaths(
  'photo1.jpg,photo2.jpg,./images/',  // Mixed input
  './output/',                         // Output directory
  { 
    allowedExtensions: MediaExtensions.IMAGE,
    recursive: true,
    maxDepth: 5
  }
);

if (errors.length > 0) {
  console.error('Validation errors:', errors);
  process.exit(1);
}

console.log(`Found ${inputFiles.length} files`);
console.log(`Output directory: ${outputDir}`);
```

---

### `resolveOutputPaths(inputFiles, outputDir, options)`

Generates output file paths for a list of input files.

```typescript
function resolveOutputPaths(
  inputFiles: string[],
  outputDir: string,
  options?: OutputPathOptions
): Map<string, string>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `inputFiles` | `string[]` | Array of input file paths |
| `outputDir` | `string` | Output directory path |
| `options` | `OutputPathOptions` | Output path generation options |

**Options:**

```typescript
interface OutputPathOptions {
  // Suffix to add to filenames (e.g., "-resized")
  suffix?: string;
  
  // New file extension (e.g., ".webp")
  newExtension?: string;
  
  // Preserve directory structure for nested inputs
  preserveStructure?: boolean;
}
```

**Returns:**

`Map<string, string>` - Maps each input file path to its corresponding output file path.

**Example:**

```typescript
const outputPaths = resolveOutputPaths(
  ['/home/user/images/photo1.jpg', '/home/user/images/photo2.jpg'],
  '/home/user/output',
  {
    suffix: '-optimized',
    newExtension: '.webp',
    preserveStructure: false
  }
);

// Results:
// /home/user/images/photo1.jpg → /home/user/output/photo1-optimized.webp
// /home/user/images/photo2.jpg → /home/user/output/photo2-optimized.webp

for (const [input, output] of outputPaths) {
  console.log(`${input} → ${output}`);
}
```

---

### `MediaExtensions`

Pre-defined file extension constants for common media types.

```typescript
const MediaExtensions = {
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg', ...],
  VIDEO: ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm', ...],
  AUDIO: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', ...],
  DOCUMENT: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', ...],
  THREED: ['.obj', '.fbx', '.gltf', '.glb', '.stl', '.dae', ...],
  ANIMATION: ['.gif', '.apng', '.webp', '.mp4'],
  ALL: []  // Empty array = allow all files
};
```

**Usage:**

```typescript
import { MediaExtensions } from '@mediaproc/cli';

// For image processing
const result = validatePaths(input, output, {
  allowedExtensions: MediaExtensions.IMAGE
});

// For video processing
const result = validatePaths(input, output, {
  allowedExtensions: MediaExtensions.VIDEO
});

// For custom extensions
const result = validatePaths(input, output, {
  allowedExtensions: ['.custom', '.special']
});

// Allow all file types
const result = validatePaths(input, output, {
  allowedExtensions: MediaExtensions.ALL
});
```

---

## Supported Input Formats

Users can provide inputs in multiple ways, and the path validator handles all of them:

### Single File

```bash
mediaproc image resize photo.jpg -w 800
```

### Multiple Files (Comma-Separated)

```bash
mediaproc image resize photo1.jpg,photo2.jpg,photo3.jpg -w 800
```

### Directory

```bash
# Processes all images in the directory
mediaproc image resize ./photos/ -w 800
```

### Mixed Input

```bash
mediaproc image resize photo.jpg,./more-photos/,another.jpg -w 800
```

### With Custom Output

```bash
# Output to specific directory
mediaproc image resize ./photos/ -o ./output/ -w 800

# Output to current directory (default)
mediaproc image resize ./photos/ -w 800
```

---

## Complete Examples

### Basic Image Processing

```typescript
import type { Command } from 'commander';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';

export function resizeCommand(imageCmd: Command): void {
  imageCmd
    .command('resize <input>')
    .option('-w, --width <width>', 'Width in pixels', parseInt)
    .option('-o, --output <path>', 'Output directory')
    .action(async (input: string, options: any) => {
      const spinner = ora('Validating inputs...').start();

      try {
        // Validate paths
        const { inputFiles, outputDir, errors } = validatePaths(
          input,
          options.output,
          { allowedExtensions: MediaExtensions.IMAGE }
        );

        if (errors.length > 0) {
          spinner.fail('Validation failed');
          errors.forEach(err => console.error(chalk.red(err)));
          process.exit(1);
        }

        // Resolve output paths
        const outputPaths = resolveOutputPaths(inputFiles, outputDir, {
          suffix: '-resized'
        });

        spinner.succeed(`Found ${inputFiles.length} image(s)`);

        // Process each file
        for (const [index, inputFile] of inputFiles.entries()) {
          const outputPath = outputPaths.get(inputFile)!;
          spinner.start(`Processing ${index + 1}/${inputFiles.length}...`);
          
          await resizeImage(inputFile, outputPath, options.width);
          
          spinner.succeed(`Processed: ${path.basename(inputFile)}`);
        }

      } catch (error) {
        spinner.fail('Processing failed');
        console.error(error);
        process.exit(1);
      }
    });
}
```

### Video Processing with Verbose Output

```typescript
export function convertVideoCommand(videoCmd: Command): void {
  videoCmd
    .command('convert <input>')
    .option('-f, --format <format>', 'Output format')
    .option('-o, --output <path>', 'Output directory')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: any) => {
      const spinner = ora('Validating...').start();

      const { inputFiles, outputDir, errors } = validatePaths(
        input,
        options.output,
        { 
          allowedExtensions: MediaExtensions.VIDEO,
          recursive: true
        }
      );

      if (errors.length > 0) {
        spinner.fail('Validation failed');
        errors.forEach(err => console.error(chalk.red(`  ✗ ${err}`)));
        process.exit(1);
      }

      spinner.succeed(`Found ${inputFiles.length} video(s)`);

      if (options.verbose) {
        console.log(chalk.blue('\nInput files:'));
        inputFiles.forEach((file, i) => {
          console.log(chalk.dim(`  ${i + 1}. ${file}`));
        });
        console.log(chalk.blue(`\nOutput directory: ${outputDir}\n`));
      }

      const outputPaths = resolveOutputPaths(inputFiles, outputDir, {
        newExtension: `.${options.format}`,
        preserveStructure: inputFiles.length > 5  // Preserve structure for large batches
      });

      let successCount = 0;

      for (const [index, inputFile] of inputFiles.entries()) {
        const outputPath = outputPaths.get(inputFile)!;
        spinner.start(`Converting ${index + 1}/${inputFiles.length}...`);

        try {
          await convertVideo(inputFile, outputPath, options.format);
          spinner.succeed(chalk.green(`✓ ${path.basename(inputFile)}`));
          successCount++;
        } catch (error) {
          spinner.fail(chalk.red(`✗ ${path.basename(inputFile)}`));
          if (options.verbose) {
            console.error(chalk.red(`    Error: ${error.message}`));
          }
        }
      }

      console.log(chalk.bold('\nSummary:'));
      console.log(chalk.green(`  ✓ Converted: ${successCount}/${inputFiles.length}`));
      console.log(chalk.dim(`  Output: ${outputDir}`));
    });
}
```

### Dry Run Support

```typescript
export function compressCommand(audioCmd: Command): void {
  audioCmd
    .command('compress <input>')
    .option('-o, --output <path>', 'Output directory')
    .option('--dry-run', 'Preview without processing')
    .action(async (input: string, options: any) => {
      const { inputFiles, outputDir, errors } = validatePaths(
        input,
        options.output,
        { allowedExtensions: MediaExtensions.AUDIO }
      );

      if (errors.length > 0) {
        errors.forEach(err => console.error(chalk.red(err)));
        process.exit(1);
      }

      const outputPaths = resolveOutputPaths(inputFiles, outputDir, {
        suffix: '-compressed'
      });

      if (options.dryRun) {
        console.log(chalk.yellow('Dry run mode - no changes will be made\n'));
        console.log(chalk.green(`Would compress ${inputFiles.length} audio file(s):\n`));
        
        inputFiles.forEach((file, i) => {
          const output = outputPaths.get(file)!;
          console.log(chalk.dim(`  ${i + 1}. ${path.basename(file)}`));
          console.log(chalk.dim(`     → ${path.basename(output)}`));
        });
        
        console.log(chalk.dim(`\nOutput directory: ${outputDir}`));
        return;
      }

      // Actual processing...
    });
}
```

---

## Migration Guide

### Before (Manual Path Handling)

```typescript
// ❌ Old way - limited to single file
export function oldCommand(cmd: Command): void {
  cmd
    .command('process <input>')
    .option('-o, --output <path>', 'Output file')
    .action(async (input: string, options: any) => {
      // Manual validation
      if (!fs.existsSync(input)) {
        console.error('File not found');
        process.exit(1);
      }

      // Manual output path
      const outputPath = options.output || `${input}-processed.jpg`;

      // Single file processing only
      await processFile(input, outputPath);
    });
}
```

### After (Using Path Validator)

```typescript
// ✅ New way - supports single file, multiple files, and directories
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';

export function newCommand(cmd: Command): void {
  cmd
    .command('process <input>')
    .option('-o, --output <path>', 'Output directory')
    .action(async (input: string, options: any) => {
      // Automatic validation for all input types
      const { inputFiles, outputDir, errors } = validatePaths(
        input,
        options.output,
        { allowedExtensions: MediaExtensions.IMAGE }
      );

      if (errors.length > 0) {
        errors.forEach(err => console.error(err));
        process.exit(1);
      }

      // Automatic output path resolution
      const outputPaths = resolveOutputPaths(inputFiles, outputDir, {
        suffix: '-processed'
      });

      // Multi-file processing
      for (const inputFile of inputFiles) {
        const outputPath = outputPaths.get(inputFile)!;
        await processFile(inputFile, outputPath);
      }
    });
}
```

---

## Best Practices

### ✅ Do

- **Always use `validatePaths()`** for input validation
- **Check for errors** before processing
- **Use `MediaExtensions`** constants for extension filtering
- **Provide progress feedback** during batch processing
- **Support dry-run mode** for user preview
- **Show summary** after batch operations
- **Preserve structure** for large batches with `preserveStructure: true`

### ❌ Don't

- Don't use `fs.existsSync()` for validation - use `validatePaths()`
- Don't manually parse comma-separated inputs
- Don't hardcode file extensions - use `MediaExtensions`
- Don't manually create output directories - validator handles it
- Don't process files without error checking
- Don't ignore validation errors

---

## Error Handling

The path validator returns errors instead of throwing, giving you control:

```typescript
const { inputFiles, outputDir, errors } = validatePaths(input, output, options);

if (errors.length > 0) {
  // Handle validation errors gracefully
  console.error(chalk.red('Validation failed:'));
  errors.forEach(err => console.error(chalk.red(`  ✗ ${err}`)));
  
  // Show helpful hints
  if (options.allowedExtensions) {
    console.log(chalk.dim(`\nSupported formats: ${options.allowedExtensions.join(', ')}`));
  }
  
  process.exit(1);
}

// Safe to proceed - no errors
```

---

## Testing

Test your commands with various input formats:

```bash
# Single file
mediaproc myplugin process photo.jpg

# Multiple files
mediaproc myplugin process photo1.jpg,photo2.jpg,photo3.jpg

# Directory
mediaproc myplugin process ./photos/

# Nested directories
mediaproc myplugin process ./media/images/

# Mixed
mediaproc myplugin process photo.jpg,./more/,another.jpg

# Custom output
mediaproc myplugin process ./photos/ -o ./output/

# Dry run
mediaproc myplugin process ./photos/ --dry-run

# Verbose
mediaproc myplugin process ./photos/ -v
```

---

## FAQ

### Q: What if I need custom file filtering?

A: Pass a custom array of extensions:

```typescript
const { inputFiles } = validatePaths(input, output, {
  allowedExtensions: ['.custom', '.special', '.format']
});
```

### Q: How do I disable extension filtering?

A: Use `MediaExtensions.ALL` or omit the option:

```typescript
const { inputFiles } = validatePaths(input, output, {
  allowedExtensions: MediaExtensions.ALL  // or omit entirely
});
```

### Q: Can I change the recursion depth?

A: Yes, use the `maxDepth` option:

```typescript
const { inputFiles } = validatePaths(input, output, {
  recursive: true,
  maxDepth: 3  // Only search 3 levels deep
});
```

### Q: How do I preserve directory structure in output?

A: Use `preserveStructure: true`:

```typescript
const outputPaths = resolveOutputPaths(inputFiles, outputDir, {
  preserveStructure: true  // Recreates input directory structure
});
```

### Q: What if output directory doesn't exist?

A: The validator automatically creates it:

```typescript
// This will create /path/to/output/ if it doesn't exist
const { outputDir } = validatePaths(input, '/path/to/output/');
```

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/0xshariq/mediaproc-cli/issues
- Discord: (coming soon)
- Email: support@mediaproc.dev

---

## Changelog

### v0.3.0
- Initial release of global path validator
- Support for multi-file and directory inputs
- Smart output path resolution
- Pre-defined media extension constants
