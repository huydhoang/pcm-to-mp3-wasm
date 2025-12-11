/**
 * ffmpeg-mp3-worker
 * 
 * A minimal FFmpeg WebAssembly module for converting PCM audio to MP3.
 * Runs in a Web Worker to avoid blocking the main thread.
 * 
 * @packageDocumentation
 */

import type {
    PcmToMp3Options,
    ConverterConfig,
    ProgressCallback,
    LogEvent,
    ProgressEvent,
    WorkerMessage,
    WorkerResponse,
} from './types.js';
import { MessageType } from './types.js';
import { DEFAULT_OPTIONS, getMessageId } from './const.js';

// Re-export types
export type { PcmToMp3Options, ConverterConfig, ProgressCallback, PcmFormat } from './types.js';

/**
 * Callbacks pending resolution
 */
interface PendingCallback {
    resolve: (data: unknown) => void;
    reject: (error: Error) => void;
}

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
export class PcmToMp3Converter {
    #worker: Worker | null = null;
    #pending: Map<number, PendingCallback> = new Map();
    #progressCallback: ProgressCallback | null = null;
    #logCallback: ((event: LogEvent) => void) | null = null;
    #loaded = false;
    #config?: ConverterConfig;

    /**
     * Create a new converter instance
     * @internal Use createConverter() instead
     */
    constructor(config?: ConverterConfig) {
        this.#config = config;
    }

    /**
     * Initialize the worker and load FFmpeg core
     */
    async #ensureLoaded(): Promise<void> {
        if (this.#loaded && this.#worker) {
            return;
        }
        const config = this.#config;

        // Create worker
        this.#worker = new Worker(
            new URL('./worker.js', import.meta.url),
            { type: 'module' }
        );

        // Set up message handler
        this.#worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { id, type, data, error } = event.data;

            // Handle progress/log events (no pending callback)
            if (type === MessageType.PROGRESS && this.#progressCallback) {
                const progressData = data as ProgressEvent;
                this.#progressCallback(progressData.progress);
                return;
            }

            if (type === MessageType.LOG && this.#logCallback) {
                this.#logCallback(data as LogEvent);
                return;
            }

            // Handle result/error for pending requests
            const pending = this.#pending.get(id);
            if (!pending) return;

            this.#pending.delete(id);

            if (type === MessageType.ERROR) {
                pending.reject(new Error(error || 'Unknown error'));
            } else {
                pending.resolve(data);
            }
        };

        this.#worker.onerror = (event) => {
            // Reject all pending requests
            for (const [id, pending] of this.#pending) {
                pending.reject(new Error(event.message || 'Worker error'));
                this.#pending.delete(id);
            }
        };

        // Load FFmpeg core
        await this.#send({
            type: MessageType.LOAD,
            data: {
                coreURL: config?.coreURL,
                wasmURL: config?.wasmURL,
            },
        });

        this.#loaded = true;
    }

    /**
     * Send message to worker and wait for response
     */
    #send(message: Omit<WorkerMessage, 'id'>): Promise<unknown> {
        return new Promise((resolve, reject) => {
            if (!this.#worker) {
                reject(new Error('Worker not initialized'));
                return;
            }

            const id = getMessageId();
            this.#pending.set(id, { resolve, reject });

            const fullMessage: WorkerMessage = { id, ...message };

            // Transfer Uint8Array buffer if present
            const transferables: Transferable[] = [];
            if (message.data && 'pcmData' in message.data) {
                transferables.push((message.data as { pcmData: Uint8Array }).pcmData.buffer);
            }

            this.#worker.postMessage(fullMessage, transferables);
        });
    }

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
    async convert(pcmData: Uint8Array, options?: PcmToMp3Options): Promise<Uint8Array> {
        await this.#ensureLoaded();

        const mergedOptions = {
            ...DEFAULT_OPTIONS,
            ...options,
        };

        const result = await this.#send({
            type: MessageType.CONVERT,
            data: {
                pcmData,
                options: mergedOptions,
            },
        });

        return result as Uint8Array;
    }

    /**
     * Set a callback to receive progress updates during conversion
     * 
     * @param callback - Function called with progress value (0-1)
     */
    onProgress(callback: ProgressCallback): void {
        this.#progressCallback = callback;
    }

    /**
     * Set a callback to receive log events from FFmpeg
     * 
     * @param callback - Function called with log events
     */
    onLog(callback: (event: LogEvent) => void): void {
        this.#logCallback = callback;
    }

    /**
     * Terminate the worker and release resources
     * 
     * After calling this method, the converter instance cannot be used again.
     */
    terminate(): void {
        if (this.#worker) {
            this.#worker.terminate();
            this.#worker = null;
        }
        this.#pending.clear();
        this.#loaded = false;
        this.#progressCallback = null;
        this.#logCallback = null;
    }

    /**
     * Check if the converter is loaded and ready
     */
    get loaded(): boolean {
        return this.#loaded;
    }
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
 * import { createConverter } from 'ffmpeg-mp3-worker';
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
export async function createConverter(config?: ConverterConfig): Promise<PcmToMp3Converter> {
    const converter = new PcmToMp3Converter(config);
    // Force load to validate configuration
    await converter.convert(new Uint8Array(0), { sampleRate: 8000 }).catch(() => {
        // Ignore empty conversion error, we just want to trigger load
    });
    return converter;
}

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
 * import { convertPcmToMp3 } from 'ffmpeg-mp3-worker';
 * 
 * const mp3Data = await convertPcmToMp3(pcmData, {
 *   sampleRate: 44100,
 *   channels: 1,
 *   bitrate: 128
 * });
 * ```
 */
export async function convertPcmToMp3(
    pcmData: Uint8Array,
    options?: PcmToMp3Options
): Promise<Uint8Array> {
    const converter = new PcmToMp3Converter();
    try {
        return await converter.convert(pcmData, options);
    } finally {
        converter.terminate();
    }
}
