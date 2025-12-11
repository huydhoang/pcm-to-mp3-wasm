/**
 * ffmpeg-mp3-node
 *
 * A minimal FFmpeg WebAssembly module for converting PCM audio to MP3 in Node.js.
 * Uses in-memory virtual filesystem (MEMFS) for zero disk I/O.
 *
 * The WASM binary is embedded as base64 to eliminate import.meta.url dependencies
 * and ensure compatibility with all bundlers (Turbopack, Webpack, Vercel, etc.)
 *
 * @packageDocumentation
 */
import type { PcmToMp3Options, ConverterConfig, ProgressCallback, LogCallback } from './types.js';
export type { PcmToMp3Options, ConverterConfig, ProgressCallback, LogCallback, PcmFormat } from './types.js';
/**
 * PCM to MP3 Converter class for Node.js
 *
 * Creates a reusable converter instance that keeps the FFmpeg core loaded
 * for multiple conversions.
 *
 * @example
 * ```typescript
 * const converter = await createConverter();
 * const mp3_1 = await converter.convert(pcm1);
 * const mp3_2 = await converter.convert(pcm2);
 * converter.terminate();
 * ```
 */
export declare class PcmToMp3Converter {
    #private;
    /**
     * Create a new converter instance
     * @internal Use createConverter() instead
     */
    constructor(config?: ConverterConfig);
    /**
     * Convert PCM audio data to MP3
     *
     * @param pcmData - Raw PCM audio data as Uint8Array or Buffer
     * @param options - Conversion options (sample rate, channels, bitrate, format)
     * @returns MP3 audio data as Uint8Array
     *
     * @example
     * ```typescript
     * const mp3Data = await converter.convert(pcmData, {
     *   sampleRate: 44100,
     *   channels: 1,
     *   bitrate: 128,
     *   format: 's16le'
     * });
     * ```
     */
    convert(pcmData: Uint8Array | Buffer, options?: PcmToMp3Options): Promise<Uint8Array>;
    /**
     * Set a callback to receive progress updates during conversion
     *
     * @param callback - Function called with progress value (0-1)
     */
    onProgress(callback: ProgressCallback): void;
    /**
     * Set a callback to receive log events from FFmpeg
     *
     * @param callback - Function called with log events
     */
    onLog(callback: LogCallback): void;
    /**
     * Release resources
     *
     * After calling this method, the converter instance cannot be used again.
     */
    terminate(): void;
    /**
     * Check if the converter is loaded and ready
     */
    get loaded(): boolean;
}
/**
 * Create a reusable PCM to MP3 converter for Node.js
 *
 * The converter uses in-memory virtual filesystem (MEMFS) for conversions.
 * Keep the converter instance for multiple conversions to avoid the overhead
 * of loading FFmpeg each time.
 *
 * @param config - Optional configuration for custom core/wasm paths
 * @returns A converter instance
 *
 * @example
 * ```typescript
 * import { createConverter } from 'ffmpeg-mp3-node';
 *
 * const converter = await createConverter();
 *
 * // Convert multiple files efficiently
 * const mp3_1 = await converter.convert(pcm1, { sampleRate: 44100 });
 * const mp3_2 = await converter.convert(pcm2, { sampleRate: 22050 });
 *
 * // Clean up when done
 * converter.terminate();
 * ```
 */
export declare function createConverter(config?: ConverterConfig): Promise<PcmToMp3Converter>;
/**
 * One-shot PCM to MP3 conversion for Node.js
 *
 * Convenience function that loads FFmpeg, performs the conversion,
 * and releases resources. Use createConverter() instead if you need
 * to perform multiple conversions.
 *
 * @param pcmData - Raw PCM audio data as Uint8Array or Buffer
 * @param options - Conversion options
 * @returns MP3 audio data as Uint8Array
 *
 * @example
 * ```typescript
 * import { convertPcmToMp3 } from 'ffmpeg-mp3-node';
 *
 * const mp3Data = await convertPcmToMp3(pcmData, {
 *   sampleRate: 44100,
 *   channels: 1,
 *   bitrate: 128
 * });
 * ```
 */
export declare function convertPcmToMp3(pcmData: Uint8Array | Buffer, options?: PcmToMp3Options): Promise<Uint8Array>;
//# sourceMappingURL=index.d.ts.map