import sharp from 'sharp';
import type { Sharp } from 'sharp';

/**
 * Create a sharp instance for the given input
 * @param input - Path to input image file, Buffer, or create options
 * @returns Sharp instance
 */
export function createSharpInstance(input: string | Buffer | { create: { width: number; height: number; channels: 3 | 4; background?: string | object } }): Sharp {
    return sharp(input as any);
}

/**
 * Get sharp library reference for direct usage
 */
export { sharp };