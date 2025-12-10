/**
 * pcm-to-mp3-wasm
 *
 * A minimal FFmpeg WebAssembly module for converting PCM audio to MP3.
 * Runs in a Web Worker to avoid blocking the main thread.
 *
 * @packageDocumentation
 */
import type { PcmToMp3Options, ConverterConfig, ProgressCallback, LogEvent } from './types.js';
export type { PcmToMp3Options, ConverterConfig, ProgressCallback, PcmFormat } from './types.js';
/**
 * PCM to MP3 Converter class
 *
 * Creates a reusable converter instance that keeps a Web Worker alive
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
     * @param pcmData - Raw PCM audio data as Uint8Array
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
    convert(pcmData: Uint8Array, options?: PcmToMp3Options): Promise<Uint8Array>;
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
    onLog(callback: (event: LogEvent) => void): void;
    /**
     * Terminate the worker and release resources
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
 * Create a reusable PCM to MP3 converter
 *
 * The converter uses a Web Worker to perform conversions without
 * blocking the main thread. Keep the converter instance for multiple
 * conversions to avoid the overhead of loading FFmpeg each time.
 *
 * @param config - Optional configuration for custom core/wasm URLs
 * @returns A converter instance
 *
 * @example
 * ```typescript
 * import { createConverter } from 'pcm-to-mp3-wasm';
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
 * One-shot PCM to MP3 conversion
 *
 * Convenience function that creates a worker, performs the conversion,
 * and terminates the worker. Use createConverter() instead if you need
 * to perform multiple conversions.
 *
 * @param pcmData - Raw PCM audio data as Uint8Array
 * @param options - Conversion options
 * @returns MP3 audio data as Uint8Array
 *
 * @example
 * ```typescript
 * import { convertPcmToMp3 } from 'pcm-to-mp3-wasm';
 *
 * const mp3Data = await convertPcmToMp3(pcmData, {
 *   sampleRate: 44100,
 *   channels: 1,
 *   bitrate: 128
 * });
 * ```
 */
export declare function convertPcmToMp3(pcmData: Uint8Array, options?: PcmToMp3Options): Promise<Uint8Array>;
//# sourceMappingURL=index.d.ts.map