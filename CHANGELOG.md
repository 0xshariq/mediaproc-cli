# Changelog

All notable changes to MediaProc will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.2]

### Added

- ✨ `mediaproc delete` command - Delete/uninstall plugins with confirmation
  - Delete plugin: `mediaproc delete <plugin>`
  - Auto-detects plugin types (official, community, third-party)
  - Auto-detects installation scope (global/local)
  - Confirmation prompt before deletion (skip with `--yes`)
  - Shows plugin type badges (★ OFFICIAL, ◆ COMMUNITY, ◇ THIRD-PARTY)
  - Supports all package managers (npm, pnpm, yarn, bun)
  - Alias: `mediaproc uninstall <plugin>`
  - Verbose mode: `--verbose` flag for detailed output
- ✨ `mediaproc update` command - Update plugins to latest or specific versions
  - Update all plugins: `mediaproc update`
  - Update specific plugin: `mediaproc update <plugin>`
  - Update to specific version: `mediaproc update <plugin> --version 1.2.3`
  - Auto-detects plugin types (official, community, third-party)
  - Auto-detects installation scope (global/local)
  - Shows version changes with plugin type badges (★ OFFICIAL, ◆ COMMUNITY, ◇ THIRD-PARTY)
  - Supports all package managers (npm, pnpm, yarn, bun, deno)
  - Verbose mode: `--verbose` flag for detailed output

### Improved

- 🔄 Path handling in image plugin
  - Supports single file: `image.jpg`
  - Supports multiple files: `img1.jpg,img2.jpg`
  - Supports directories: `input-images/`
  - Explicit output file paths: `-o output.jpg`
  - Output directories: `-o output/`
- 📚 Updated documentation with update command examples

### Architecture

- ✅ Designed plugin-based architecture
- ✅ Implemented plugin discovery and loading system
- ✅ Created plugin registry with short name mapping
- ✅ Built core CLI framework with Commander.js

### Plugins (Scaffolded)

- ✅ Image plugin structure (10 commands)
- ✅ Video plugin structure (6 commands)
- ✅ Audio plugin structure (5 commands)
- ✅ Document plugin structure (5 commands)
- ✅ Animation plugin structure (2 commands)
- ✅ 3D plugin structure (4 commands)
- ✅ Metadata plugin structure (4 commands)
- ✅ Stream plugin structure (3 commands)
- ✅ AI plugin structure (4 commands)
- ✅ Pipeline plugin structure (2 commands)

### Core Commands

- ✅ `add` - Install plugins with auto-detection
- ✅ `remove` - Uninstall plugins
- ✅ `delete` - Delete/uninstall plugins with confirmation
- ✅ `update` - Update plugins to latest or specific versions
- ✅ `list` - List installed plugins
- ✅ `plugins` - Show plugin catalog
- ✅ `run` - Execute pipelines
- ✅ `validate` - Validate media files

### Documentation

- ✅ Plugin system architecture guide
- ✅ Upcoming features roadmap
- ✅ Contributing guidelines
- ✅ Security policy
- ✅ Code of conduct
- ✅ Third-party plugin standards

### Infrastructure

- ✅ TypeScript with strict mode
- ✅ pnpm workspace monorepo
- ✅ Modular project structure
- ✅ Plugin independence (standalone or integrated)

## [0.1.0] - 2025-12-27

### Added

- Initial project structure
- Core CLI framework
- Plugin system architecture
- 10 plugin packages (scaffolded)
- Comprehensive documentation
- Community guidelines

### Status

🚧 **Planning & Development Phase**

- Architecture complete
- Implementation in progress
- Expected beta: Q2 2026

---

## Release Types

- **Major (X.0.0)**: Breaking changes, major features
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, minor improvements

## Categories

- **Added**: New features
- **Changed**: Changes to existing features
- **Deprecated**: Features marked for removal
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
