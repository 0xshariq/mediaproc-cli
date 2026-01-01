import { Command } from 'commander';

export interface MediaProcPlugin {
  name: string;
  version: string;
  register: (program: Command) => void | Promise<void>;
  isOfficial?: boolean; // Flag to indicate if plugin is official
}

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  apiVersion: string;
}

export interface CommandOptions {
  input?: string;
  output?: string;
  quality?: number;
  format?: string;
  verbose?: boolean;
  dryRun?: boolean;
  workers?: number;
}

export interface ProcessingResult {
  success: boolean;
  input: string;
  output?: string;
  error?: string;
  duration?: number;
  inputSize?: number;
  outputSize?: number;
}

export interface PluginConfig {
  enabled: boolean;
  options?: Record<string, any>;
}
