export interface VideoOptions {
  input: string;
  output?: string;
  codec?: 'h264' | 'h265' | 'vp9' | 'av1';
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  crf?: number;
  bitrate?: string;
  fps?: number;
  verbose?: boolean;
  dryRun?: boolean;
  // Resize-specific options
  scale?: '480p' | '720p' | '1080p' | '1440p' | '4k';
  width?: number;
  height?: number;
  aspect?: boolean;
  // Trim-specific options
  start?: string;
  duration?: string;
  end?: string;
  fast?: boolean;
}

export interface CompressOptions extends VideoOptions {
  quality?: 'low' | 'medium' | 'high';
}

export interface TranscodeOptions extends VideoOptions {
  format?: 'mp4' | 'webm' | 'mkv' | 'avi';
  audioCodec?: string;
  audioBitrate?: string;
}

export interface ExtractOptions {
  input: string;
  output?: string;
  start?: string;
  end?: string;
  format?: 'jpg' | 'png';
  fps?: number;
  quality?: number;
  verbose?: boolean;
  dryRun?: boolean;
}

export interface TrimOptions {
  input: string;
  output?: string;
  start: string;
  end: string;
}

export interface ResizeOptions {
  input: string;
  output?: string;
  width: number;
  height: number;
  maintainAspectRatio?: boolean;
}

export interface MergeOptions {
  inputs: string[];
  output?: string;
}