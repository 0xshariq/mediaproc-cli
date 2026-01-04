# MediaProc Monorepo Structure

## 📁 Complete Architecture

```
mediaproc/
├── README.md                    # Main documentation
├── STRUCTURE.md                 # This file
├── package.json                 # Root package with workspace config
├── pnpm-workspace.yaml          # pnpm workspace definition
├── tsconfig.base.json           # Base TypeScript config
│
└── packages/
    │
    ├── core/                    # 🎯 Core CLI & Plugin System
    │   ├── src/
    │   │   ├── cli.ts           # Main CLI entry point
    │   │   ├── plugin-manager.ts      # Plugin discovery & loading
    │   │   ├── plugin-registry.ts     # Plugin name→package mapping
    │   │   ├── types.ts         # TypeScript interfaces
    │   │   └── commands/
    │   │       ├── add.ts       # Install plugins (with registry lookup)
    │   │       ├── remove.ts    # Uninstall plugins
    │   │       ├── delete.ts    # Delete/uninstall plugins
    │   │       ├── update.ts    # Update plugins
    │   │       ├── list.ts      # List installed plugins
    │   │       ├── help.ts      # Show plugin catalog
    │   │       ├── run.ts       # Run pipelines
    │   │       └── validate.ts  # Validate media files
    │   ├── bin/
    │   │   └── mediaproc.js     # Executable entry
    │   └── package.json
    │
    ├── image/                   # 📷 Image Processing (Sharp)
    │   ├── src/
    │   │   ├── register.ts      # Plugin registration
    │   │   ├── types.ts
    │   │   └── commands/
    │   │       ├── resize.ts
    │   │       ├── convert.ts
    │   │       ├── grayscale.ts
    │   │       ├── blur.ts
    │   │       ├── sharpen.ts
    │   │       ├── rotate.ts
    │   │       ├── flip.ts
    │   │       ├── crop.ts
    │   │       ├── optimize.ts
    │   │       └── watermark.ts
    │   ├── bin/cli.js           # Standalone mode
    │   └── package.json
    │
    ├── video/                   # 🎬 Video Processing (FFmpeg)
    │   ├── src/commands/
    │   │   ├── compress.ts
    │   │   ├── transcode.ts
    │   │   ├── extract.ts       # Extract frames
    │   │   ├── trim.ts
    │   │   ├── resize.ts
    │   │   └── merge.ts
    │   └── ...
    │
    ├── audio/                   # 🎵 Audio Processing (FFmpeg)
    │   ├── src/commands/
    │   │   ├── convert.ts
    │   │   ├── normalize.ts
    │   │   ├── trim.ts
    │   │   ├── merge.ts
    │   │   └── extract.ts       # Extract from video
    │   └── ...
    │
    ├── document/                # 📄 Document Processing
    │   ├── src/commands/
    │   │   ├── compress.ts      # PDF compression
    │   │   ├── extract.ts       # Page extraction
    │   │   ├── ocr.ts           # OCR text extraction
    │   │   ├── merge.ts
    │   │   └── split.ts
    │   └── ...
    │
    ├── animation/               # 🎨 Animation Processing
    │   ├── src/commands/
    │   │   ├── gifify.ts        # Video → GIF
    │   │   └── optimize.ts      # GIF/WebP optimization
    │   └── ...
    │
    ├── 3d/                      # 🎮 3D & Spatial Media
    │   ├── src/commands/
    │   │   ├── optimize.ts      # Model optimization
    │   │   ├── compress-textures.ts
    │   │   ├── convert.ts       # Format conversion
    │   │   └── generate-lod.ts  # LOD generation
    │   └── ...
    │
    ├── metadata/                # 🔍 Metadata Processing
    │   ├── src/commands/
    │   │   ├── inspect.ts       # Inspect media
    │   │   ├── strip.ts         # Strip all metadata
    │   │   ├── remove-gps.ts    # Remove GPS data
    │   │   └── compliance.ts    # Compliance checks
    │   └── ...
    │
    ├── stream/                  # 📡 Streaming & Packaging
    │   ├── src/commands/
    │   │   ├── pack.ts          # HLS/DASH packaging
    │   │   ├── chunk.ts         # Segment chunking
    │   │   └── encrypt.ts       # Segment encryption
    │   └── ...
    │
    ├── ai/                      # 🤖 AI-Assisted Processing
    │   ├── src/commands/
    │   │   ├── blur-faces.ts    # Face detection & blur
    │   │   ├── caption.ts       # Auto-captioning
    │   │   ├── scene-detection.ts
    │   │   └── remove-background.ts
    │   └── ...
    │
    └── pipeline/                # ⚙️ Pipeline Workflows
        ├── src/commands/
        │   ├── run.ts           # Run YAML/JSON pipelines
        │   └── validate.ts      # Validate pipeline config
        └── ...
```

## 🔧 Plugin Registry

The core package includes a `plugin-registry.ts` that maps short names to full package names:

```typescript
// User types:     mediaproc add image
// Actually runs:  pnpm add -g @mediaproc/image

PLUGIN_REGISTRY = {
  'image':     '@mediaproc/image',
  'video':     '@mediaproc/video',
  'audio':     '@mediaproc/audio',
  'document':  '@mediaproc/document',
  'doc':       '@mediaproc/document',  // Alias
  'animation': '@mediaproc/animation',
  'anim':      '@mediaproc/animation', // Alias
  '3d':        '@mediaproc/3d',
  'metadata':  '@mediaproc/metadata',
  'meta':      '@mediaproc/metadata',  // Alias
  'stream':    '@mediaproc/stream',
  'ai':        '@mediaproc/ai',
  'pipeline':  '@mediaproc/pipeline',
}
```

## 🎯 Key Features

### 1. Plugin Independence
- Each plugin has its own `package.json`
- Each plugin can work standalone: `npm install -g @mediaproc/image`
- Each plugin auto-registers when installed with core

### 2. Smart Installation
- Auto-detects if core is global/local
- Installs plugins in matching scope
- Supports both pnpm and npm

### 3. TypeScript Throughout
- Full type safety
- Shared types via `@mediaproc/core`
- Build with `pnpm build`

### 4. Command Structure
```
mediaproc <command>              # Core commands
mediaproc <plugin> <subcommand>  # Plugin commands

Examples:
mediaproc add image              # Install image plugin
mediaproc list                   # List installed plugins
mediaproc image resize photo.jpg # Use image plugin
mediaproc video compress vid.mp4 # Use video plugin
```

## 📊 Plugin Categories

### Core Plugins (Essential)
- **image** - Image processing
- **video** - Video processing
- **audio** - Audio processing
- **document** - PDF/DOCX processing
- **animation** - GIF/WebP animations

### Advanced Plugins
- **3d** - 3D models & textures
- **metadata** - Metadata inspection
- **stream** - HLS/DASH packaging
- **pipeline** - Workflow automation

### Future-Proof
- **ai** - AI-assisted processing

## 🚀 Development Workflow

```bash
# Setup
cd mediaproc
pnpm install
pnpm build

# Link core globally
cd packages/core
pnpm link --global

# Test
mediaproc --version
mediaproc plugins
mediaproc add image
```

## 📝 Adding New Plugins

1. Create folder: `packages/myplugin/`
2. Add package.json with `@mediaproc/core` dependency
3. Create `src/register.ts` with `register()` function
4. Add to `plugin-registry.ts` in core
5. Build and publish

---

**Status**: ✅ Complete scaffold - Ready for implementation
**All commands are placeholders** - Implement based on requirements
