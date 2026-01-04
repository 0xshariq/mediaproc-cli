# Third-Party Plugin Integration Guide

Complete guide for developers who want to create and publish plugins for MediaProc.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Plugin Architecture](#plugin-architecture)
- [Step-by-Step Tutorial](#step-by-step-tutorial)
- [Plugin Standards](#plugin-standards)
- [Testing Your Plugin](#testing-your-plugin)
- [Publishing](#publishing)
- [Getting Featured](#getting-featured)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

---

## Overview

MediaProc welcomes community plugins! This guide will walk you through creating, testing, and publishing your own plugin that extends MediaProc's capabilities.

### What You'll Learn

- How to create a MediaProc plugin from scratch
- Plugin architecture and structure
- Required exports and interfaces
- Testing and debugging
- Publishing to npm
- Getting your plugin featured

### What You Can Build

Examples of plugin types:
- **Filters & Effects** - Instagram-style filters, artistic effects
- **Format Converters** - Specialized format conversions
- **Social Media Tools** - Platform-specific optimizations
- **Analysis Tools** - Media analysis and reporting
- **Automation** - Workflow and batch processing
- **Integration** - Cloud services, CDN, storage
- **AI/ML** - Machine learning powered features

---

## Prerequisites

### Required Knowledge

- **JavaScript/TypeScript** - Basic to intermediate level
- **Node.js** - Understanding of npm packages and modules
- **Command Line** - Basic terminal usage
- **Git** - Version control basics

### Required Tools

```bash
# Node.js (version 18 or higher)
node --version  # Should be >= 18.0.0

# npm or pnpm
npm --version

# TypeScript (will be installed per project)
# Git for version control
git --version
```

### Recommended Tools

- **VS Code** - With TypeScript extension
- **GitHub Account** - For hosting your plugin
- **npm Account** - For publishing

---

## Quick Start

Get a plugin running in 5 minutes:

```bash
# 1. Create directory
mkdir mediaproc-plugin-hello
cd mediaproc-plugin-hello

# 2. Initialize package
npm init -y

# 3. Install dependencies
npm install --save-peer @mediaproc/cli
npm install --save-dev typescript @types/node
npm install chalk commander

# 4. Create TypeScript config
cat > tsconfig.json << 'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true
  }
}
TSCONFIG

# 5. Create source directory
mkdir src

# 6. Create plugin file
cat > src/index.ts << 'PLUGIN'
import { Command } from 'commander';
import chalk from 'chalk';

export const name = 'hello';
export const version = '1.0.0';
export const description = 'Hello World plugin';

export function register(program: Command): void {
  const cmd = program
    .command('hello')
    .description('Hello World plugin');
  
  cmd
    .command('greet [name]')
    .description('Greet someone')
    .action((name: string = 'World') => {
      console.log(chalk.blue('Hello,'), chalk.green(name + '!'));
    });
}
PLUGIN

# 7. Update package.json
cat > package.json << 'PKG'
{
  "name": "mediaproc-plugin-hello",
  "version": "1.0.0",
  "description": "Hello World plugin for MediaProc",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "keywords": ["mediaproc", "mediaproc-plugin", "hello"],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "@mediaproc/cli": ">=0.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.4",
    "typescript": "^5.3.3"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^11.1.0"
  }
}
PKG

# 8. Build
npm run build

# 9. Test locally
npm link
mediaproc hello greet Alice

# 10. Unlink after testing
npm unlink -g
```

---

## Plugin Architecture

### Core Concepts

MediaProc plugins follow a simple architecture:

```
Plugin Package
    ↓
Exports: name, version, description, register()
    ↓
register() function receives Commander.js program
    ↓
Plugin adds commands to program
    ↓
MediaProc discovers and loads plugin automatically
```

### Plugin Discovery

MediaProc discovers plugins in three ways:

**1. Automatic Discovery (Recommended)**

Plugins with names matching these patterns are auto-discovered:
- `mediaproc-plugin-*`
- `@scope/mediaproc-plugin-*`

```bash
# Install plugin
npm install -g mediaproc-plugin-instagram

# Use immediately (auto-discovered)
mediaproc instagram filter photo.jpg --style vintage
```

**2. Environment Variable**

```bash
export MEDIAPROC_PLUGINS="mediaproc-plugin-one,mediaproc-plugin-two"
mediaproc --help
```

### Loading Process

```
1. MediaProc starts
2. Auto-loads installed official @mediaproc/* packages
3. Dynamically imports each plugin
4. Calls register() function for each plugin
5. Plugin commands are now available
```

---

## Step-by-Step Tutorial

Let's build a real plugin: **mediaproc-plugin-ascii** that converts images to ASCII art.

### Step 1: Project Setup

```bash
mkdir mediaproc-plugin-ascii
cd mediaproc-plugin-ascii
npm init -y
```

### Step 2: Install Dependencies

```bash
# Peer dependency
npm install --save-peer @mediaproc/cli

# Dev dependencies
npm install --save-dev typescript @types/node

# Runtime dependencies
npm install chalk commander ora image-to-ascii
```

### Step 3: Configure TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Step 4: Create Source Structure

```bash
mkdir -p src/commands
touch src/index.ts
touch src/types.ts
touch src/commands/convert.ts
```

### Step 5: Define Types

```typescript
// src/types.ts
export interface ConvertOptions {
  output?: string;
  width?: number;
  colored?: boolean;
  bg?: boolean;
}

export interface PluginMetadata {
  author: string;
  homepage: string;
  license: string;
  systemRequirements?: string[];
}
```

### Step 6: Implement Command

```typescript
// src/commands/convert.ts
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import imageToAscii from 'image-to-ascii';
import { writeFile } from 'fs/promises';
import type { ConvertOptions } from '../types.js';

export function convertCommand(parent: Command): void {
  parent
    .command('convert <input>')
    .description('Convert image to ASCII art')
    .option('-o, --output <path>', 'Output file path')
    .option('-w, --width <number>', 'ASCII art width', '80')
    .option('-c, --colored', 'Use colors in output', false)
    .option('-b, --bg', 'Use background colors', false)
    .action(async (input: string, options: ConvertOptions) => {
      const spinner = ora('Converting to ASCII...').start();
      
      try {
        const ascii = await convertToAscii(input, options);
        
        if (options.output) {
          await writeFile(options.output, ascii);
          spinner.succeed(chalk.green(`ASCII art saved to: ${options.output}`));
        } else {
          spinner.stop();
          console.log('\n' + ascii + '\n');
        }
      } catch (error) {
        spinner.fail(chalk.red('Conversion failed'));
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}

async function convertToAscii(
  imagePath: string,
  options: ConvertOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    imageToAscii(imagePath, {
      size: {
        width: parseInt(options.width?.toString() || '80')
      },
      colored: options.colored || false,
      bg: options.bg || false
    }, (err: Error | null, ascii: string) => {
      if (err) reject(err);
      else resolve(ascii);
    });
  });
}
```

### Step 7: Create Main Entry Point

```typescript
// src/index.ts
import { Command } from 'commander';
import { convertCommand } from './commands/convert.js';
import type { PluginMetadata } from './types.js';

export const name = 'ascii';
export const version = '1.0.0';
export const description = 'Convert images to ASCII art';

export const metadata: PluginMetadata = {
  author: 'Your Name',
  homepage: 'https://github.com/yourusername/mediaproc-plugin-ascii',
  license: 'MIT',
  systemRequirements: []
};

export function register(program: Command): void {
  const cmd = program
    .command(name)
    .description(description);
  
  convertCommand(cmd);
}

// Export types for TypeScript users
export type * from './types.js';
```

### Step 8: Configure Package

```json
{
  "name": "mediaproc-plugin-ascii",
  "version": "1.0.0",
  "description": "Convert images to ASCII art",
  "keywords": ["mediaproc", "mediaproc-plugin", "ascii", "image", "art"],
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "prepublishOnly": "npm run build"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/mediaproc-plugin-ascii"
  },
  "author": "Your Name",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "peerDependencies": {
    "@mediaproc/cli": ">=0.1.0"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "image-to-ascii": "^3.2.0",
    "ora": "^7.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.4",
    "typescript": "^5.3.3"
  },
  "mediaproc": {
    "pluginName": "ascii",
    "pluginVersion": "1.0.0",
    "category": "community"
  }
}
```

### Step 9: Create README

```markdown
# mediaproc-plugin-ascii

Convert images to ASCII art using MediaProc.

## Installation

```bash
npm install -g mediaproc-plugin-ascii
```

## Usage

```bash
# Convert image to ASCII
mediaproc ascii convert photo.jpg

# Save to file
mediaproc ascii convert photo.jpg -o art.txt

# Colored output
mediaproc ascii convert photo.jpg --colored

# Custom width
mediaproc ascii convert photo.jpg --width 120
```

## Options

- `-o, --output <path>` - Output file path
- `-w, --width <number>` - ASCII art width (default: 80)
- `-c, --colored` - Use colors in output
- `-b, --bg` - Use background colors

## License

MIT
```

### Step 10: Build and Test

```bash
# Build
npm run build

# Link locally
npm link

# Test
mediaproc ascii convert test-image.jpg
mediaproc ascii convert test-image.jpg -o output.txt
mediaproc ascii convert test-image.jpg --colored --width 120

# Unlink
npm unlink -g
```

---

## Plugin Standards

### Naming Convention

**Official Plugins:**
```
@mediaproc/<plugin-name>
```

**Community Plugins:**
```
mediaproc-plugin-<plugin-name>
@yourscope/mediaproc-plugin-<plugin-name>
```

Examples:
- ✅ `mediaproc-plugin-ascii`
- ✅ `mediaproc-plugin-instagram`
- ✅ `@acme/mediaproc-plugin-custom`
- ❌ `my-ascii-plugin` (won't be auto-discovered)

### Required Exports

```typescript
// Required exports from src/index.ts
export const name: string;          // Plugin command name
export const version: string;       // Plugin version
export const description: string;   // Short description
export function register(program: Command): void;  // Registration function

// Optional but recommended
export const metadata: {
  author: string;
  homepage: string;
  license: string;
  systemRequirements?: string[];
};
```

### Package.json Requirements

```json
{
  "name": "mediaproc-plugin-yourname",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "keywords": ["mediaproc", "mediaproc-plugin"],
  "engines": {
    "node": ">=18.0.0"
  },
  "peerDependencies": {
    "@mediaproc/cli": ">=0.1.0"
  },
  "mediaproc": {
    "pluginName": "yourname",
    "pluginVersion": "1.0.0",
    "category": "community"
  }
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "declaration": true,
    "strict": true
  }
}
```

---

## Testing Your Plugin

### Local Testing

```bash
# Build
npm run build

# Link globally
npm link

# Test commands
mediaproc --help  # Should show your plugin
mediaproc yourplugin --help
mediaproc yourplugin command input.file

# Unlink when done
npm unlink -g
```

### Unit Testing (Vitest)

```typescript
// src/__tests__/plugin.test.ts
import { describe, it, expect, vi } from 'vitest';
import { register, name, version } from '../index.js';

describe('Plugin', () => {
  it('exports required properties', () => {
    expect(name).toBeDefined();
    expect(version).toBeDefined();
    expect(register).toBeTypeOf('function');
  });
  
  it('registers commands', () => {
    const mockProgram = {
      command: vi.fn().mockReturnThis(),
      description: vi.fn().mockReturnThis(),
    };
    
    register(mockProgram as any);
    expect(mockProgram.command).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
// src/__tests__/integration.test.ts
import { describe, it, expect } from 'vitest';
import { execa } from 'execa';

describe('Integration', () => {
  it('runs command successfully', async () => {
    const { stdout } = await execa('mediaproc', [
      'yourplugin',
      'command',
      'test-input.txt'
    ]);
    
    expect(stdout).toContain('Success');
  });
});
```

---

## Publishing

### Pre-publish Checklist

- [ ] Plugin works locally with `npm link`
- [ ] README.md with usage examples
- [ ] LICENSE file (MIT recommended)
- [ ] package.json properly configured
- [ ] TypeScript types included
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Version number updated
- [ ] Git repository initialized
- [ ] Changes committed

### Publishing to npm

```bash
# Login to npm (first time only)
npm login

# Run tests
npm test

# Build
npm run build

# Publish
npm publish

# For scoped packages
npm publish --access public
```

### GitHub Repository

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/mediaproc-plugin-yourname.git
git push -u origin main
```

---

## Getting Featured

### Submission Process

1. **Ensure Quality Standards**
   - Published to npm
   - Open source license
   - TypeScript with types
   - Documentation
   - Working examples

2. **Create Submission Issue**

Go to https://github.com/0xshariq/mediaproc/issues/new and create:

```markdown
Title: [Plugin Submission] mediaproc-plugin-yourname

**Plugin Information**
- Name: mediaproc-plugin-yourname
- npm: https://www.npmjs.com/package/mediaproc-plugin-yourname
- GitHub: https://github.com/yourusername/mediaproc-plugin-yourname
- Description: Brief description of what it does

**Category**
- [ ] Image Processing
- [ ] Video Processing
- [ ] Audio Processing
- [ ] Document Processing
- [ ] Filters & Effects
- [ ] Utilities
- [ ] Other: _______

**Checklist**
- [ ] Published to npm
- [ ] Open source (MIT/Apache/GPL)
- [ ] TypeScript with type definitions
- [ ] README with examples
- [ ] Tests included
- [ ] No known security issues
- [ ] Works with MediaProc >= 0.1.0

**Additional Information**
Any other relevant details
```

3. **Review Process**
   - Automated checks run
   - Maintainer reviews code
   - Security scan performed
   - Testing with current MediaProc version

4. **Approval & Listing**
   - Added to plugin directory
   - Featured in community plugins
   - Listed on website (when available)

---

## Examples

### Example 1: Simple Text Processor

```typescript
// mediaproc-plugin-textify
export const name = 'textify';
export const version = '1.0.0';
export const description = 'Text processing utilities';

export function register(program: Command): void {
  const cmd = program.command('textify').description(description);
  
  cmd
    .command('uppercase <file>')
    .description('Convert file contents to uppercase')
    .action(async (file) => {
      const content = await readFile(file, 'utf-8');
      console.log(content.toUpperCase());
    });
  
  cmd
    .command('lowercase <file>')
    .description('Convert file contents to lowercase')
    .action(async (file) => {
      const content = await readFile(file, 'utf-8');
      console.log(content.toLowerCase());
    });
}
```

### Example 2: QR Code Generator

```typescript
// mediaproc-plugin-qrcode
import QRCode from 'qrcode';

export const name = 'qrcode';
export const version = '1.0.0';
export const description = 'QR code generation';

export function register(program: Command): void {
  const cmd = program.command('qrcode').description(description);
  
  cmd
    .command('generate <text>')
    .option('-o, --output <path>', 'Output image path', 'qrcode.png')
    .option('-s, --size <number>', 'Image size', '300')
    .action(async (text, options) => {
      await QRCode.toFile(options.output, text, {
        width: parseInt(options.size)
      });
      console.log(`QR code saved to ${options.output}`);
    });
}
```

### Example 3: Instagram Filters

```typescript
// mediaproc-plugin-instagram
import Sharp from 'sharp';

export const name = 'instagram';
export const version = '1.0.0';
export const description = 'Instagram-style filters';

const filters = {
  vintage: { saturation: 0.8, brightness: 1.1, contrast: 0.9 },
  cold: { saturation: 1.2, temperature: 0.8 },
  warm: { saturation: 1.1, temperature: 1.2 },
};

export function register(program: Command): void {
  const cmd = program.command('instagram').description(description);
  
  cmd
    .command('filter <input>')
    .option('-s, --style <name>', 'Filter style', 'vintage')
    .option('-o, --output <path>', 'Output path')
    .action(async (input, options) => {
      const style = filters[options.style];
      if (!style) throw new Error(`Unknown style: ${options.style}`);
      
      await Sharp(input)
        .modulate({
          brightness: style.brightness,
          saturation: style.saturation
        })
        .toFile(options.output || 'filtered.jpg');
    });
}
```

---

## Best Practices

### Code Quality

✅ **Use TypeScript** - Type safety prevents bugs  
✅ **Handle errors** - Always use try/catch  
✅ **Validate inputs** - Check file paths, options  
✅ **Use async/await** - Modern promise handling  
✅ **Stream large files** - Don't load everything into memory  
✅ **Clean up temp files** - Remove temporary files after processing

### User Experience

✅ **Clear error messages** - Help users fix issues  
✅ **Progress indicators** - Use ora for long operations  
✅ **Helpful --help text** - Document all options  
✅ **Sensible defaults** - Work without many flags  
✅ **Exit codes** - Return 0 for success, 1 for errors

### Performance

✅ **Lazy loading** - Import heavy dependencies only when needed  
✅ **Streaming** - Process large files in chunks  
✅ **Parallelization** - Use worker threads for CPU-intensive tasks  
✅ **Caching** - Cache expensive computations  
✅ **Resource cleanup** - Close file handles, clear buffers

### Documentation

✅ **README with examples** - Show common use cases  
✅ **JSDoc comments** - Document all public APIs  
✅ **Changelog** - Track version changes  
✅ **Contributing guide** - Help others contribute  
✅ **License file** - Clear licensing

---

## Troubleshooting

### Plugin Not Discovered

```bash
# Check plugin name
npm ls -g | grep mediaproc-plugin

# Verify package.json name
cat package.json | grep "name"

# Should match: mediaproc-plugin-*
```

### TypeScript Errors

```bash
# Install types
npm install --save-dev @types/node

# Check tsconfig.json
cat tsconfig.json

# Rebuild
rm -rf dist
npm run build
```

### Import Errors

```typescript
// ❌ Wrong (CommonJS)
const { Command } = require('commander');

// ✅ Correct (ESM)
import { Command } from 'commander';
```

```json
// Ensure package.json has:
{
  "type": "module"
}
```

### Plugin Command Not Showing

```bash
# Unlink and relink
npm unlink -g
npm link

# Check if MediaProc can find it
mediaproc --help | grep yourplugin

# Enable debug mode
DEBUG=mediaproc:* mediaproc --help
```

---

## Resources

### Official Documentation

- **Plugin System Guide**: [plugin-system.md](./plugin-system.md)
- **Configuration Guide**: [configuration.md](./configuration.md)
- **Main README**: [../README.md](../README.md)

### GitHub Resources

- **MediaProc Repository**: https://github.com/0xshariq/mediaproc
- **Report Issues**: https://github.com/0xshariq/mediaproc/issues
- **Discussions**: https://github.com/0xshariq/mediaproc/discussions
- **Submit Plugin**: https://github.com/0xshariq/mediaproc/issues/new

### Example Resources (Coming Soon)

- **Plugin Template**: https://github.com/0xshariq/mediaproc-plugin-template
- **Example Plugins**: https://github.com/0xshariq/mediaproc-examples
- **Starter Kits**: https://github.com/0xshariq/mediaproc-starters

### NPM Packages

- **Commander.js**: https://www.npmjs.com/package/commander
- **Chalk**: https://www.npmjs.com/package/chalk
- **Ora**: https://www.npmjs.com/package/ora
- **Execa**: https://www.npmjs.com/package/execa

### Learning Resources

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Node.js ES Modules**: https://nodejs.org/api/esm.html
- **Publishing npm packages**: https://docs.npmjs.com/packages-and-modules/

---

## Support

Need help building your plugin?

- **Ask Questions**: [GitHub Discussions](https://github.com/0xshariq/mediaproc/discussions)
- **Report Bugs**: [GitHub Issues](https://github.com/0xshariq/mediaproc/issues)
- **Email**: support@mediaproc.dev (coming soon)

---

**Ready to build your plugin?** Start with the [Quick Start](#quick-start) or dive into the [Step-by-Step Tutorial](#step-by-step-tutorial)!

Good luck, and happy coding! 🚀
