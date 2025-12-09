/**
 * pcm-to-mp3-wasm
 *
 * A minimal FFmpeg WebAssembly module for converting PCM audio to MP3.
 * Runs in a Web Worker to avoid blocking the main thread.
 *
 * @packageDocumentation
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PcmToMp3Converter_instances, _PcmToMp3Converter_worker, _PcmToMp3Converter_pending, _PcmToMp3Converter_progressCallback, _PcmToMp3Converter_logCallback, _PcmToMp3Converter_loaded, _PcmToMp3Converter_config, _PcmToMp3Converter_ensureLoaded, _PcmToMp3Converter_send;
import { MessageType } from './types.js';
import { DEFAULT_OPTIONS, getMessageId } from './const.js';
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
    /**
     * Create a new converter instance
     * @internal Use createConverter() instead
     */
    constructor(config) {
        _PcmToMp3Converter_instances.add(this);
        _PcmToMp3Converter_worker.set(this, null);
        _PcmToMp3Converter_pending.set(this, new Map());
        _PcmToMp3Converter_progressCallback.set(this, null);
        _PcmToMp3Converter_logCallback.set(this, null);
        _PcmToMp3Converter_loaded.set(this, false);
        _PcmToMp3Converter_config.set(this, void 0);
        __classPrivateFieldSet(this, _PcmToMp3Converter_config, config, "f");
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
    async convert(pcmData, options) {
        await __classPrivateFieldGet(this, _PcmToMp3Converter_instances, "m", _PcmToMp3Converter_ensureLoaded).call(this);
        const mergedOptions = {
            ...DEFAULT_OPTIONS,
            ...options,
        };
        const result = await __classPrivateFieldGet(this, _PcmToMp3Converter_instances, "m", _PcmToMp3Converter_send).call(this, {
            type: MessageType.CONVERT,
            data: {
                pcmData,
                options: mergedOptions,
            },
        });
        return result;
    }
    /**
     * Set a callback to receive progress updates during conversion
     *
     * @param callback - Function called with progress value (0-1)
     */
    onProgress(callback) {
        __classPrivateFieldSet(this, _PcmToMp3Converter_progressCallback, callback, "f");
    }
    /**
     * Set a callback to receive log events from FFmpeg
     *
     * @param callback - Function called with log events
     */
    onLog(callback) {
        __classPrivateFieldSet(this, _PcmToMp3Converter_logCallback, callback, "f");
    }
    /**
     * Terminate the worker and release resources
     *
     * After calling this method, the converter instance cannot be used again.
     */
    terminate() {
        if (__classPrivateFieldGet(this, _PcmToMp3Converter_worker, "f")) {
            __classPrivateFieldGet(this, _PcmToMp3Converter_worker, "f").terminate();
            __classPrivateFieldSet(this, _PcmToMp3Converter_worker, null, "f");
        }
        __classPrivateFieldGet(this, _PcmToMp3Converter_pending, "f").clear();
        __classPrivateFieldSet(this, _PcmToMp3Converter_loaded, false, "f");
        __classPrivateFieldSet(this, _PcmToMp3Converter_progressCallback, null, "f");
        __classPrivateFieldSet(this, _PcmToMp3Converter_logCallback, null, "f");
    }
    /**
     * Check if the converter is loaded and ready
     */
    get loaded() {
        return __classPrivateFieldGet(this, _PcmToMp3Converter_loaded, "f");
    }
}
_PcmToMp3Converter_worker = new WeakMap(), _PcmToMp3Converter_pending = new WeakMap(), _PcmToMp3Converter_progressCallback = new WeakMap(), _PcmToMp3Converter_logCallback = new WeakMap(), _PcmToMp3Converter_loaded = new WeakMap(), _PcmToMp3Converter_config = new WeakMap(), _PcmToMp3Converter_instances = new WeakSet(), _PcmToMp3Converter_ensureLoaded = 
/**
 * Initialize the worker and load FFmpeg core
 */
async function _PcmToMp3Converter_ensureLoaded() {
    if (__classPrivateFieldGet(this, _PcmToMp3Converter_loaded, "f") && __classPrivateFieldGet(this, _PcmToMp3Converter_worker, "f")) {
        return;
    }
    const config = __classPrivateFieldGet(this, _PcmToMp3Converter_config, "f");
    // Create worker
    __classPrivateFieldSet(this, _PcmToMp3Converter_worker, new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }), "f");
    // Set up message handler
    __classPrivateFieldGet(this, _PcmToMp3Converter_worker, "f").onmessage = (event) => {
        const { id, type, data, error } = event.data;
        // Handle progress/log events (no pending callback)
        if (type === MessageType.PROGRESS && __classPrivateFieldGet(this, _PcmToMp3Converter_progressCallback, "f")) {
            const progressData = data;
            __classPrivateFieldGet(this, _PcmToMp3Converter_progressCallback, "f").call(this, progressData.progress);
            return;
        }
        if (type === MessageType.LOG && __classPrivateFieldGet(this, _PcmToMp3Converter_logCallback, "f")) {
            __classPrivateFieldGet(this, _PcmToMp3Converter_logCallback, "f").call(this, data);
            return;
        }
        // Handle result/error for pending requests
        const pending = __classPrivateFieldGet(this, _PcmToMp3Converter_pending, "f").get(id);
        if (!pending)
            return;
        __classPrivateFieldGet(this, _PcmToMp3Converter_pending, "f").delete(id);
        if (type === MessageType.ERROR) {
            pending.reject(new Error(error || 'Unknown error'));
        }
        else {
            pending.resolve(data);
        }
    };
    __classPrivateFieldGet(this, _PcmToMp3Converter_worker, "f").onerror = (event) => {
        // Reject all pending requests
        for (const [id, pending] of __classPrivateFieldGet(this, _PcmToMp3Converter_pending, "f")) {
            pending.reject(new Error(event.message || 'Worker error'));
            __classPrivateFieldGet(this, _PcmToMp3Converter_pending, "f").delete(id);
        }
    };
    // Load FFmpeg core
    await __classPrivateFieldGet(this, _PcmToMp3Converter_instances, "m", _PcmToMp3Converter_send).call(this, {
        type: MessageType.LOAD,
        data: {
            coreURL: config?.coreURL,
            wasmURL: config?.wasmURL,
        },
    });
    __classPrivateFieldSet(this, _PcmToMp3Converter_loaded, true, "f");
}, _PcmToMp3Converter_send = function _PcmToMp3Converter_send(message) {
    return new Promise((resolve, reject) => {
        if (!__classPrivateFieldGet(this, _PcmToMp3Converter_worker, "f")) {
            reject(new Error('Worker not initialized'));
            return;
        }
        const id = getMessageId();
        __classPrivateFieldGet(this, _PcmToMp3Converter_pending, "f").set(id, { resolve, reject });
        const fullMessage = { id, ...message };
        // Transfer Uint8Array buffer if present
        const transferables = [];
        if (message.data && 'pcmData' in message.data) {
            transferables.push(message.data.pcmData.buffer);
        }
        __classPrivateFieldGet(this, _PcmToMp3Converter_worker, "f").postMessage(fullMessage, transferables);
    });
};
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
export async function createConverter(config) {
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
 * import { convertPcmToMp3 } from 'pcm-to-mp3-wasm';
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
//# sourceMappingURL=index.js.map