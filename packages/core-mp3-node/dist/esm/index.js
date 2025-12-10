/**
 * pcm-to-mp3-wasm-node
 *
 * A minimal FFmpeg WebAssembly module for converting PCM audio to MP3 in Node.js.
 * Uses in-memory virtual filesystem (MEMFS) for zero disk I/O.
 *
 * @packageDocumentation
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile } from 'node:fs/promises';
// Platform-agnostic path resolution (works on Windows, Mac, and Linux)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Use createRequire to load the FFmpeg core - bundlers ignore require()
const require = createRequire(import.meta.url);
// Resolve paths using join() for platform-agnostic paths
// Windows: C:\Users\...\ffmpeg-core.wasm
// Linux:   /home/.../ffmpeg-core.wasm
const wasmPath = join(__dirname, 'ffmpeg-core.wasm');
const coreJsPath = join(__dirname, 'ffmpeg-core.js');
/**
 * Default conversion options
 */
const DEFAULT_OPTIONS = {
    sampleRate: 44100,
    channels: 1,
    bitrate: 128,
    format: 's16le',
};
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
export class PcmToMp3Converter {
    #ffmpeg = null;
    #loaded = false;
    #config;
    #progressCallback = null;
    #logCallback = null;
    /**
     * Create a new converter instance
     * @internal Use createConverter() instead
     */
    constructor(config) {
        this.#config = config;
    }
    /**
     * Load the FFmpeg core module
     */
    async #ensureLoaded() {
        if (this.#loaded && this.#ffmpeg) {
            return;
        }
        // Read the WASM file directly using Node.js fs - avoids all path resolution issues
        const wasmBinary = await readFile(wasmPath);
        // Load FFmpeg core using require() - bundlers ignore require()
        let createFFmpegCore;
        if (this.#config?.corePath) {
            createFFmpegCore = require(this.#config.corePath).default;
        }
        else {
            // Require from the platform-agnostic path
            createFFmpegCore = require(coreJsPath).default;
        }
        // Pass wasmBinary directly instead of letting FFmpeg fetch it
        this.#ffmpeg = await createFFmpegCore({ wasmBinary });
        await this.#ffmpeg.ready;
        // Set up logging
        this.#ffmpeg.setLogger(({ type, message }) => {
            if (this.#logCallback) {
                this.#logCallback({ type, message });
            }
        });
        this.#loaded = true;
    }
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
    async convert(pcmData, options) {
        await this.#ensureLoaded();
        if (!this.#ffmpeg) {
            throw new Error('FFmpeg core not loaded');
        }
        const mergedOptions = {
            ...DEFAULT_OPTIONS,
            ...options,
        };
        // Ensure we have a Uint8Array
        const inputData = pcmData instanceof Buffer
            ? new Uint8Array(pcmData)
            : pcmData;
        // Skip empty conversions
        if (inputData.length === 0) {
            return new Uint8Array(0);
        }
        // Use virtual filesystem (MEMFS)
        const inputPath = '/input.pcm';
        const outputPath = '/output.mp3';
        // Write PCM data to virtual filesystem
        this.#ffmpeg.FS.writeFile(inputPath, inputData);
        // Run FFmpeg conversion
        const result = this.#ffmpeg.exec('-f', mergedOptions.format, '-ar', String(mergedOptions.sampleRate), '-ac', String(mergedOptions.channels), '-i', inputPath, '-codec:a', 'libmp3lame', '-b:a', `${mergedOptions.bitrate}k`, outputPath);
        if (result !== 0) {
            // Cleanup on error
            try {
                this.#ffmpeg.FS.unlink(inputPath);
            }
            catch { /* ignore */ }
            throw new Error(`FFmpeg conversion failed with code ${result}`);
        }
        // Read MP3 from virtual filesystem
        const mp3Data = this.#ffmpeg.FS.readFile(outputPath);
        // Cleanup virtual filesystem
        this.#ffmpeg.FS.unlink(inputPath);
        this.#ffmpeg.FS.unlink(outputPath);
        return mp3Data;
    }
    /**
     * Set a callback to receive progress updates during conversion
     *
     * @param callback - Function called with progress value (0-1)
     */
    onProgress(callback) {
        this.#progressCallback = callback;
    }
    /**
     * Set a callback to receive log events from FFmpeg
     *
     * @param callback - Function called with log events
     */
    onLog(callback) {
        this.#logCallback = callback;
    }
    /**
     * Release resources
     *
     * After calling this method, the converter instance cannot be used again.
     */
    terminate() {
        this.#ffmpeg = null;
        this.#loaded = false;
        this.#progressCallback = null;
        this.#logCallback = null;
    }
    /**
     * Check if the converter is loaded and ready
     */
    get loaded() {
        return this.#loaded;
    }
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
 * import { createConverter } from 'pcm-to-mp3-wasm-node';
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
export async function createConverter(config) {
    const converter = new PcmToMp3Converter(config);
    // Pre-load FFmpeg core
    await converter.convert(new Uint8Array(0)).catch(() => {
        // Ignore empty conversion error, we just want to trigger load
    });
    return converter;
}
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
 * import { convertPcmToMp3 } from 'pcm-to-mp3-wasm-node';
 *
 * const mp3Data = await convertPcmToMp3(pcmData, {
 *   sampleRate: 44100,
 *   channels: 1,
 *   bitrate: 128
 * });
 * ```
 */
export async function convertPcmToMp3(pcmData, options) {
    const converter = new PcmToMp3Converter();
    try {
        return await converter.convert(pcmData, options);
    }
    finally {
        converter.terminate();
    }
}
