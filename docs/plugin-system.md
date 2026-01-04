# Plugin System Architecture

## Overview

MediaProc uses a dynamic plugin system that allows extending the CLI with specialized media processing capabilities. Each plugin is an independent npm package that can be installed globally or locally.

## How It Works

### 1. Plugin Discovery

When MediaProc starts, it scans for all installed `@mediaproc/*` packages:

```typescript
// Core discovers plugins automatically
const plugins = await discoverPlugins();
```

The plugin manager checks:
- Global npm/pnpm directories
- Local `node_modules/@mediaproc/`
- Workspace packages (development mode)

### 2. Plugin Registration

Each plugin exports a `register()` function that adds commands to the CLI:

```typescript
export function register(program: Command): void {
  const imageCmd = program
    .command('image')
    .description('Image processing commands');
  
  imageCmd
    .command('resize <input>')
    .option('-w, --width <width>', 'Width')
    .option('-h, --height <height>', 'Height')
    .action(async (input, options) => {
      await resize(input, options);
    });
}
```

### 3. Plugin Structure

Every plugin follows this structure:

```
@mediaproc/plugin-name/
├── package.json
├── tsconfig.json
├── bin/
│   └── cli.js          # Standalone executable
├── src/
│   ├── index.ts        # Public exports
│   ├── register.ts     # CLI registration
│   ├── types.ts        # TypeScript types
│   └── commands/
│       ├── command1.ts
│       └── command2.ts
```

## Plugin Registry

The core package maintains a registry that maps short names to full package names:

```typescript
const PLUGIN_REGISTRY = {
  'image': '@mediaproc/image',
  'video': '@mediaproc/video',
  'audio': '@mediaproc/audio',
  // ... more plugins
};
```

This allows users to install plugins with simple names:

```bash
mediaproc add image
# Installs @mediaproc/image
```

## Creating a Plugin

### Step 1: Initialize Package

```bash
mkdir -p plugins/myplugin
cd plugins/myplugin
pnpm init
```

### Step 2: Add Dependencies

```json
{
  "name": "@mediaproc/myplugin",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "dependencies": {
    "@mediaproc/cli": "workspace:*",
    "chalk": "^5.3.0",
    "commander": "^11.1.0"
  }
}
```

### Step 3: Create Registration File

```typescript
// src/register.ts
import { Command } from 'commander';
import chalk from 'chalk';

export const name = 'myplugin';
export const version = '1.0.0';

export function register(program: Command): void {
  const cmd = program
    .command('myplugin')
    .description('My custom plugin');
  
  cmd
    .command('process <input>')
    .description('Process a file')
    .action(async (input) => {
      console.log(chalk.blue('Processing:'), input);
      // Your logic here
    });
}
```

### Step 4: Export Plugin

```typescript
// src/index.ts
export { register, name, version } from './register.js';
export type * from './types.js';
```

### Step 5: Add to Registry

Update `src/plugin-registry.ts` in core:

```typescript
export const PLUGIN_REGISTRY: PluginRegistryEntry[] = [
  // ... existing plugins
  {
    name: 'myplugin',
    package: '@mediaproc/myplugin',
    description: 'My custom media processor',
    category: 'core'
  }
];
```

## Plugin Independence

Each plugin can work in two modes:

### 1. Integrated Mode (with MediaProc CLI)

```bash
mediaproc myplugin process file.txt
```

The plugin is loaded dynamically by the core CLI.

### 2. Standalone Mode

```bash
npx @mediaproc/myplugin process file.txt
# or
mediaproc-myplugin process file.txt
```

The plugin runs independently without the core CLI.

## Installation Scopes

Plugins automatically detect and match the core CLI's installation scope:

- **Global Installation**: Plugins install globally
- **Local Installation**: Plugins install in project's `node_modules`

Override with flags:
```bash
mediaproc add image --global
mediaproc add video --local
```

### Updating Plugins

Keep plugins up-to-date with the `update` command:

```bash
# Update all plugins to latest
mediaproc update

# Update specific plugin to latest
mediaproc update image
mediaproc update video

# Update to specific version
mediaproc update image --version 1.2.3
mediaproc update video --version 2.0.0-beta.1

# With installation scope
mediaproc update --global          # Update globally installed plugins
mediaproc update image --local     # Update locally installed plugin

# Verbose output
mediaproc update --verbose         # Shows detailed information
mediaproc update image --verbose   # Shows package manager, versions, etc.
```

**Plugin Type Detection:**

The update command automatically detects and handles three types of plugins:

1. **Official Plugins** (`@mediaproc/*`) - Displays as ★ OFFICIAL
   ```bash
   mediaproc update image                    # Short name
   mediaproc update @mediaproc/image        # Full name
   ```

2. **Community Plugins** (`mediaproc-*`) - Displays as ◆ COMMUNITY
   ```bash
   mediaproc update mediaproc-custom-filter  # Full name required
   ```

3. **Third-Party Plugins** - Displays as ◇ THIRD-PARTY
   ```bash
   mediaproc update @company/plugin-name     # Full package name
   ```

**What happens during update:**
1. Detects plugin type (official/community/third-party)
2. Detects plugin installation location (global/local)
3. Checks npm registry for latest version (or uses specified version)
4. Uses appropriate package manager (npm/pnpm/yarn/bun/deno)
5. Shows version changes (old → new) with plugin type badge
6. Automatically reloads updated plugins

**Examples:**

```bash
# Update official plugin to latest
$ mediaproc update image
✓ Detecting plugin type for image...
✓ image ★ OFFICIAL updated successfully (1.2.0 → 1.2.2)

# Update to specific version
$ mediaproc update image --version 1.2.1
✓ image ★ OFFICIAL updated successfully (1.2.0 → 1.2.1)

# Update community plugin
$ mediaproc update mediaproc-watermark
✓ mediaproc-watermark ◆ COMMUNITY updated successfully (0.5.0 → 0.6.1)

# Update third-party plugin
$ mediaproc update @mycompany/media-tools
✓ @mycompany/media-tools ◇ THIRD-PARTY updated successfully

# Update with verbose output
$ mediaproc update image --verbose
ℹ Package manager: pnpm
ℹ Plugin type: ★ OFFICIAL
ℹ Package name: @mediaproc/image
ℹ Current version: 1.2.0
ℹ Running: pnpm add @mediaproc/image
✓ image ★ OFFICIAL updated successfully (1.2.0 → 1.2.2)

# Update all plugins
$ mediaproc update
✓ Finding all installed MediaProc plugins...
✓ All MediaProc plugins updated successfully
```

**Version Flags:**

- `--version <version>`: Update to specific version (e.g., `1.2.3`, `2.0.0-beta.1`)
- Omit `--version`: Updates to `latest` version
- Supports semantic versioning and pre-release versions

## Plugin Categories

Plugins are organized into categories:

- **core**: Essential media types (image, video, audio, document)
- **advanced**: Specialized processing (3d, stream, pipeline)
- **future-proof**: AI and emerging technologies

## Best Practices

1. **Type Safety**: Use TypeScript for all plugin code
2. **Error Handling**: Provide clear error messages with chalk
3. **Progress Indicators**: Use ora spinners for long operations
4. **Options Validation**: Validate user inputs before processing
5. **Documentation**: Document all commands and options
6. **Testing**: Write tests for each command
7. **Dependencies**: Minimize external dependencies
8. **Performance**: Handle large files efficiently

## Plugin API

Core provides utilities for plugin developers:

```typescript
import { createCommand, validateFile, showProgress } from '@mediaproc/cli';

// Create command with standard options
const cmd = createCommand('process')
  .withInput()
  .withOutput()
  .withQuality();

// Validate input file
await validateFile(input, ['jpg', 'png', 'webp']);

// Show progress
const spinner = showProgress('Processing...');
// ... processing
spinner.succeed('Done!');
```

## System Requirements

Plugins can specify system dependencies:

```typescript
export const metadata = {
  systemRequirements: [
    'FFmpeg',
    'ImageMagick',
    'Node.js >= 18.0.0'
  ]
};
```

The core CLI checks these before plugin installation.

## Future Enhancements

- **Plugin Marketplace**: Browse and discover plugins
- **Plugin Templates**: Scaffolding for new plugins
- **Plugin Testing Framework**: Standardized testing utilities
- **Plugin Versioning**: Compatibility checks
- **Plugin Dependencies**: Plugins depending on other plugins

---

## Third-Party Plugin Development

MediaProc welcomes third-party plugins! Anyone can create and publish plugins that extend MediaProc's capabilities.

### Plugin Standards & Requirements

#### 1. Package Naming Convention

**Official Plugins** (maintained by core team):
```
@mediaproc/<plugin-name>
```

**Third-Party Plugins** (community):
```
mediaproc-plugin-<plugin-name>
or
@yourscope/mediaproc-plugin-<plugin-name>
```

Examples:
- `mediaproc-plugin-instagram` - Instagram image filters
- `@acme/mediaproc-plugin-custom` - Custom company processor
- `mediaproc-plugin-ascii` - ASCII art generator

#### 2. Required Package Structure

```json
{
  "name": "mediaproc-plugin-yourname",
  "version": "1.0.0",
  "description": "Clear description of what your plugin does",
  "keywords": ["mediaproc", "mediaproc-plugin", "your", "keywords"],
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
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

#### 3. Required Exports

Your plugin MUST export these from `src/index.ts`:

```typescript
// src/index.ts
import type { Command } from 'commander';

// Required exports
export const name: string = 'yourplugin';
export const version: string = '1.0.0';
export const description: string = 'What your plugin does';

// Required: Registration function
export function register(program: Command): void {
  const cmd = program
    .command('yourplugin')
    .description(description);
  
  // Add your commands here
  cmd
    .command('process <input>')
    .description('Process a file')
    .action(async (input, options) => {
      // Your implementation
    });
}

// Optional: Plugin metadata
export const metadata = {
  author: 'Your Name',
  homepage: 'https://github.com/yourname/mediaproc-plugin-yourname',
  repository: 'https://github.com/yourname/mediaproc-plugin-yourname',
  license: 'MIT',
  systemRequirements: ['Optional', 'system', 'dependencies'],
  category: 'community'
};

// Export types for TypeScript users
export type * from './types.js';
```

#### 4. Plugin Discovery

MediaProc discovers plugins in two ways:

**A. Automatic Discovery (Official plugins)**
```bash
# Official plugins are auto-loaded when installed:
npm install -g @mediaproc/image
mediaproc image resize input.jpg --width 1920
```

**B. Environment Variable (Optional)**
```bash
export MEDIAPROC_PLUGINS="mediaproc-plugin-one,mediaproc-plugin-two"
```

### Plugin Development Workflow

#### Step 1: Initialize Project

```bash
mkdir mediaproc-plugin-myprocessor
cd mediaproc-plugin-myprocessor
npm init -y
```

#### Step 2: Install Dependencies

```bash
npm install --save-peer @mediaproc/cli
npm install --save-dev typescript @types/node
npm install chalk commander ora execa
```

#### Step 3: Configure TypeScript

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
  "exclude": ["node_modules", "dist"]
}
```

#### Step 4: Create Plugin Structure

```
mediaproc-plugin-myprocessor/
├── src/
│   ├── index.ts          # Main entry, exports
│   ├── types.ts          # TypeScript types
│   └── commands/
│       └── process.ts    # Command implementations
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

#### Step 5: Implement Plugin

```typescript
// src/index.ts
import { Command } from 'commander';
import { processCommand } from './commands/process.js';

export const name = 'myprocessor';
export const version = '1.0.0';
export const description = 'My custom media processor';

export function register(program: Command): void {
  const cmd = program
    .command(name)
    .description(description);
  
  processCommand(cmd);
}

export type * from './types.js';
```

```typescript
// src/commands/process.ts
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

export function processCommand(parent: Command): void {
  parent
    .command('process <input>')
    .description('Process a media file')
    .option('-o, --output <path>', 'Output path')
    .option('-q, --quality <number>', 'Quality (1-100)', '80')
    .action(async (input: string, options: any) => {
      const spinner = ora('Processing...').start();
      
      try {
        // Your processing logic here
        await processFile(input, options);
        
        spinner.succeed(chalk.green('Done!'));
      } catch (error) {
        spinner.fail(chalk.red('Error:'));
        console.error(error);
        process.exit(1);
      }
    });
}

async function processFile(input: string, options: any): Promise<void> {
  // Implementation
}
```

#### Step 6: Build and Test

```bash
# Build
npm run build

# Test locally
npm link
mediaproc myprocessor process test.jpg

# Unlink after testing
npm unlink -g
```

#### Step 7: Publish to npm

```bash
# Make sure you're logged in
npm login

# Publish
npm publish

# Or for scoped packages
npm publish --access public
```

### Plugin Quality Standards

To be featured in the community plugins list, your plugin should:

#### ✅ Required Standards

1. **TypeScript** - Use TypeScript with strict mode
2. **Documentation** - Clear README with usage examples
3. **License** - Open source license (MIT, Apache, GPL, etc.)
4. **Error Handling** - Graceful error handling with clear messages
5. **Type Exports** - Export TypeScript types for users
6. **Versioning** - Follow semantic versioning
7. **Testing** - Basic tests for critical functionality

#### ⭐ Recommended Standards

1. **Performance** - Handle large files efficiently
2. **Progress Indicators** - Use ora for long operations
3. **Memory Management** - Stream large files
4. **Cross-Platform** - Work on Windows, macOS, Linux
5. **Dependencies** - Minimize external dependencies
6. **Examples** - Provide example code and files
7. **CI/CD** - Automated testing and publishing

#### �� Excellence Standards

1. **Comprehensive Tests** - High test coverage
2. **Benchmarks** - Performance benchmarks
3. **Documentation Site** - Dedicated docs website
4. **Examples Repository** - Separate repo with examples
5. **Video Tutorials** - Screen recordings or YouTube
6. **Community Support** - Active issue responses
7. **Internationalization** - Multi-language support

### Plugin Submission Process

Want your plugin featured in the official plugin directory?

#### Step 1: Meet Requirements

- [ ] Published to npm
- [ ] Meets quality standards
- [ ] Has clear documentation
- [ ] Open source with license
- [ ] Follows naming convention
- [ ] No security vulnerabilities

#### Step 2: Submit for Review

Create an issue in the MediaProc repository:

```markdown
Title: [Plugin Submission] mediaproc-plugin-yourname

**Plugin Name:** mediaproc-plugin-yourname
**npm Package:** https://www.npmjs.com/package/mediaproc-plugin-yourname
**Repository:** https://github.com/yourname/mediaproc-plugin-yourname
**Description:** Brief description

**Category:** Choose one
- [ ] Image Processing
- [ ] Video Processing
- [ ] Audio Processing
- [ ] Document Processing
- [ ] Utilities
- [ ] Other: _______

**Checklist:**
- [ ] Published to npm
- [ ] Open source (MIT/Apache/GPL)
- [ ] TypeScript with types
- [ ] Documentation (README)
- [ ] Tests included
- [ ] No security issues
- [ ] Works with latest MediaProc

**Additional Info:**
Any other relevant information
```

#### Step 3: Review Process

1. **Automated Checks** - CI runs basic validation
2. **Code Review** - Maintainer reviews code quality
3. **Security Scan** - Check for vulnerabilities
4. **Testing** - Test with current MediaProc version
5. **Approval** - Added to community plugins list

#### Step 4: Get Listed

Once approved, your plugin will be:
- Listed in `mediaproc plugins --community`
- Added to website plugin directory (coming soon)
- Featured in monthly plugin spotlight
- Added to this documentation

### Plugin Categories

Organize your plugin under the appropriate category:

#### Core Categories
- **image** - Image manipulation and conversion
- **video** - Video processing and encoding
- **audio** - Audio processing and conversion
- **document** - Document processing (PDF, DOCX, etc.)

#### Extended Categories
- **animation** - GIF, WebP, Lottie animations
- **3d** - 3D models and spatial media
- **metadata** - EXIF, XMP, IPTC metadata
- **streaming** - HLS, DASH, adaptive streaming

#### Utility Categories
- **compression** - File size optimization
- **conversion** - Format conversions
- **analysis** - Media analysis tools
- **automation** - Workflow automation

#### Community Categories
- **filters** - Creative filters and effects
- **social** - Social media optimizations
- **accessibility** - Accessibility features
- **ai** - AI/ML powered features
- **other** - Miscellaneous tools

### Example Third-Party Plugins

Here are some example plugin ideas to inspire you:

#### Simple Plugins
- `mediaproc-plugin-ascii` - Convert images to ASCII art
- `mediaproc-plugin-qrcode` - Generate/read QR codes
- `mediaproc-plugin-palette` - Extract color palettes
- `mediaproc-plugin-hash` - Generate media hashes

#### Medium Complexity
- `mediaproc-plugin-instagram` - Instagram-style filters
- `mediaproc-plugin-meme` - Meme generator
- `mediaproc-plugin-subtitle` - Subtitle generation/editing
- `mediaproc-plugin-slideshow` - Create video slideshows

#### Advanced Plugins
- `mediaproc-plugin-upscale` - AI image upscaling
- `mediaproc-plugin-deepfake` - Deepfake detection
- `mediaproc-plugin-transcribe` - Audio transcription
- `mediaproc-plugin-realtime` - Real-time processing server

### Plugin Testing

#### Unit Testing

```typescript
// src/__tests__/plugin.test.ts
import { describe, it, expect } from 'vitest';
import { register, name, version } from '../index.js';

describe('Plugin', () => {
  it('should export required properties', () => {
    expect(name).toBeDefined();
    expect(version).toBeDefined();
    expect(register).toBeTypeOf('function');
  });
  
  it('should register commands', () => {
    const mockProgram = {
      command: vi.fn().mockReturnThis(),
      description: vi.fn().mockReturnThis(),
    };
    
    register(mockProgram as any);
    expect(mockProgram.command).toHaveBeenCalled();
  });
});
```

#### Integration Testing

```typescript
// src/__tests__/integration.test.ts
import { describe, it, expect } from 'vitest';
import { execa } from 'execa';
import { readFile } from 'fs/promises';

describe('Integration', () => {
  it('should process file successfully', async () => {
    await execa('mediaproc', ['yourplugin', 'process', 'test.jpg']);
    const output = await readFile('output.jpg');
    expect(output).toBeDefined();
  });
});
```

### Support & Resources

- **Documentation**: https://docs.mediaproc.dev (coming soon)
- **Examples**: https://github.com/0xshariq/mediaproc-examples (coming soon)
- **Plugin Template**: https://github.com/0xshariq/mediaproc-plugin-template (coming soon)
- **Discord**: Join our community (coming soon)
- **GitHub Discussions**: Ask questions

### Plugin Marketplace (Coming Soon)

We're building a plugin marketplace where users can:
- Browse all available plugins
- See ratings and reviews
- Install with one click
- Support plugin developers
- Report issues
- Request features

---

**Ready to build your plugin?** Start with our [Plugin Template](https://github.com/0xshariq/mediaproc-plugin-template) (coming soon) or check out [Example Plugins](https://github.com/0xshariq/mediaproc-examples) (coming soon).
