/**
 * Plugin Registry - Maps short names to full package names
 * This allows users to type: mediaproc add image
 * Instead of: mediaproc add @mediaproc/image
 */

export interface PluginRegistryEntry {
  name: string;
  package: string;
  description: string;
  category: 'core' | 'advanced' | 'future-proof';
  type: 'official' | 'community'; // Plugin type
  dependencies?: string[];
  systemRequirements?: string[];
}

export const PLUGIN_REGISTRY: Record<string, PluginRegistryEntry> = {
  // Core Media Plugins
  'image': {
    name: 'image',
    package: '@mediaproc/image',
    description: 'Image processing (resize, convert, filters, effects)',
    category: 'core',
    type: 'official',
    systemRequirements: ['Sharp (auto-installed)'],
  },
  
  'video': {
    name: 'video',
    package: '@mediaproc/video',
    description: 'Video processing (transcode, compress, extract)',
    category: 'core',
    type: 'official',
    systemRequirements: ['FFmpeg'],
  },
  
  'audio': {
    name: 'audio',
    package: '@mediaproc/audio',
    description: 'Audio processing (convert, normalize, extract)',
    category: 'core',
    type: 'official',
    systemRequirements: ['FFmpeg'],
  },
  
  // Document Media (Very Important)
  'document': {
    name: 'document',
    package: '@mediaproc/document',
    description: 'PDF/DOCX/PPTX/EPUB processing, OCR, compression',
    category: 'core',
    type: 'official',
    systemRequirements: ['Ghostscript', 'Tesseract OCR', 'Poppler'],
  },
  
  'doc': {
    name: 'doc',
    package: '@mediaproc/document',
    description: 'Alias for document plugin',
    category: 'core',
    type: 'official',
  },
  
  // Animation & Motion Media
  'animation': {
    name: 'animation',
    package: '@mediaproc/animation',
    description: 'GIF/APNG/WebP animations, Lottie, SVG animations',
    category: 'core',
    type: 'official',
    systemRequirements: ['FFmpeg'],
  },
  
  'anim': {
    name: 'anim',
    package: '@mediaproc/animation',
    description: 'Alias for animation plugin',
    category: 'core',
    type: 'official',
  },
  
  // 3D & Spatial Media (Advanced)
  '3d': {
    name: '3d',
    package: '@mediaproc/3d',
    description: '3D models (GLTF, GLB, OBJ), textures, HDRI, AR/VR assets',
    category: 'advanced',
    type: 'official',
    systemRequirements: ['gltf-transform'],
  },
  
  'spatial': {
    name: 'spatial',
    package: '@mediaproc/3d',
    description: 'Alias for 3d plugin',
    category: 'advanced',
    type: 'official',
  },
  
  // Metadata-only Processing (Underrated but Powerful)
  'metadata': {
    name: 'metadata',
    package: '@mediaproc/metadata',
    description: 'EXIF cleanup, GPS removal, codec inspection, compliance checks',
    category: 'core',
    type: 'official',
    systemRequirements: ['ExifTool'],
  },
  
  'meta': {
    name: 'meta',
    package: '@mediaproc/metadata',
    description: 'Alias for metadata plugin',
    category: 'core',
    type: 'official',
  },
  
  'inspect': {
    name: 'inspect',
    package: '@mediaproc/metadata',
    description: 'Alias for metadata plugin',
    category: 'core',
    type: 'official',
  },
  
  // Streaming & Packaging Media (Advanced, Industry-Relevant)
  'stream': {
    name: 'stream',
    package: '@mediaproc/stream',
    description: 'HLS/DASH packaging, chunking, encryption, manifests',
    category: 'advanced',
    type: 'official',
    systemRequirements: ['FFmpeg', 'Shaka Packager (optional)'],
  },
  
  'streaming': {
    name: 'streaming',
    package: '@mediaproc/stream',
    description: 'Alias for stream plugin',
    category: 'advanced',
    type: 'official',
  },
  
  // AI-Assisted Media (Future-Proof)
  'ai': {
    name: 'ai',
    package: '@mediaproc/ai',
    description: 'Auto-captioning, scene detection, face blur, background removal, speech-to-text',
    category: 'future-proof',
    type: 'official',
    systemRequirements: ['TensorFlow/ONNX Runtime (optional)', 'Whisper (optional)'],
  },
  
  'ml': {
    name: 'ml',
    package: '@mediaproc/ai',
    description: 'Alias for ai plugin',
    category: 'future-proof',
    type: 'official',
  },
  
  // Media Pipelines (Highest Level)
  'pipeline': {
    name: 'pipeline',
    package: '@mediaproc/pipeline',
    description: 'Declarative YAML-based media processing workflows',
    category: 'advanced',
    type: 'official',
    dependencies: ['Can use any installed plugins'],
  },
};

/**
 * Resolve short name to full package name
 * Handles three types of plugins:
 * 1. Official: @mediaproc/<name> (e.g., @mediaproc/image)
 * 2. Community: mediaproc-<name> (e.g., mediaproc-super-filters)
 * 3. Third-party: any npm package (e.g., my-custom-mediaproc-plugin)
 */
export function resolvePluginPackage(shortName: string): string {
  // Already a full package name - return as-is
  if (shortName.includes('/') || shortName.startsWith('mediaproc-')) {
    return shortName;
  }
  
  // Look up in official registry first
  const entry = PLUGIN_REGISTRY[shortName.toLowerCase()];
  if (entry) {
    return entry.package;
  }
  
  // Not in registry - could be community or third-party
  // Assume community format: mediaproc-<name>
  return `mediaproc-${shortName}`;
}

/**
 * Detect plugin type from package name
 */
export function detectPluginType(packageName: string): 'official' | 'community' | 'third-party' {
  if (packageName.startsWith('@mediaproc/')) {
    return 'official';
  }
  if (packageName.startsWith('mediaproc-')) {
    return 'community';
  }
  return 'third-party';
}

/**
 * Get all available plugins grouped by category
 */
export function getPluginsByCategory(): Record<string, PluginRegistryEntry[]> {
  const grouped: Record<string, PluginRegistryEntry[]> = {
    core: [],
    advanced: [],
    'future-proof': [],
  };
  
  const seen = new Set<string>();
  
  for (const entry of Object.values(PLUGIN_REGISTRY)) {
    if (!seen.has(entry.package)) {
      grouped[entry.category].push(entry);
      seen.add(entry.package);
    }
  }
  
  return grouped;
}

/**
 * Check if a plugin exists in registry
 */
export function isValidPlugin(name: string): boolean {
  return name.startsWith('@mediaproc/') || name.toLowerCase() in PLUGIN_REGISTRY;
}
