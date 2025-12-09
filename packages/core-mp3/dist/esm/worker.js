/// <reference lib="webworker" />
import { MessageType } from './types.js';
let ffmpeg = null;
let currentMessageId = null;
/**
 * Send response back to main thread
 */
function respond(response) {
    const trans = [];
    if (response.data instanceof Uint8Array) {
        trans.push(response.data.buffer);
    }
    self.postMessage(response, trans);
}
/**
 * Load FFmpeg core
 */
async function load(data) {
    if (ffmpeg) {
        return false; // Already loaded
    }
    let coreURL = data?.coreURL;
    let wasmURL = data?.wasmURL;
    // Default to relative paths if not specified
    if (!coreURL) {
        coreURL = new URL('./ffmpeg-core.js', import.meta.url).href;
    }
    if (!wasmURL) {
        wasmURL = coreURL.replace(/\.js$/, '.wasm');
    }
    try {
        // Try module import first (ESM)
        const module = await import(/* @vite-ignore */ coreURL);
        self.createFFmpegCore = module.default;
    }
    catch {
        // Fallback to importScripts (UMD) - won't work in module workers
        try {
            importScripts(coreURL);
        }
        catch {
            throw new Error(`Failed to load ffmpeg-core.js from ${coreURL}`);
        }
    }
    if (!self.createFFmpegCore) {
        throw new Error('Failed to initialize FFmpeg core factory');
    }
    // Encode wasmURL in the mainScriptUrlOrBlob for the core to locate
    ffmpeg = await self.createFFmpegCore({
        mainScriptUrlOrBlob: `${coreURL}#${btoa(JSON.stringify({ wasmURL, workerURL: '' }))}`,
    });
    // Set up logging
    ffmpeg.setLogger((data) => {
        if (currentMessageId !== null) {
            respond({
                id: currentMessageId,
                type: MessageType.LOG,
                data: data,
            });
        }
    });
    // Set up progress
    ffmpeg.setProgress((data) => {
        if (currentMessageId !== null) {
            respond({
                id: currentMessageId,
                type: MessageType.PROGRESS,
                data: data,
            });
        }
    });
    return true;
}
/**
 * Convert PCM to MP3
 */
function convert(data) {
    if (!ffmpeg) {
        throw new Error('FFmpeg not loaded. Call load() first.');
    }
    const { pcmData, options } = data;
    const inputFile = 'input.pcm';
    const outputFile = 'output.mp3';
    // Write PCM data to virtual filesystem
    ffmpeg.FS.writeFile(inputFile, pcmData);
    // Build FFmpeg command
    const args = [
        '-f', options.format,
        '-ar', String(options.sampleRate),
        '-ac', String(options.channels),
        '-i', inputFile,
        '-b:a', `${options.bitrate}k`,
        '-y', // Overwrite output
        outputFile,
    ];
    // Execute FFmpeg
    ffmpeg.exec(...args);
    const exitCode = ffmpeg.ret;
    ffmpeg.reset();
    if (exitCode !== 0) {
        // Cleanup input file
        try {
            ffmpeg.FS.unlink(inputFile);
        }
        catch { /* ignore */ }
        throw new Error(`FFmpeg exited with code ${exitCode}`);
    }
    // Read output
    const mp3Data = ffmpeg.FS.readFile(outputFile);
    // Cleanup
    try {
        ffmpeg.FS.unlink(inputFile);
    }
    catch { /* ignore */ }
    try {
        ffmpeg.FS.unlink(outputFile);
    }
    catch { /* ignore */ }
    return mp3Data;
}
/**
 * Handle messages from main thread
 */
self.onmessage = async (event) => {
    const { id, type, data } = event.data;
    currentMessageId = id;
    try {
        switch (type) {
            case MessageType.LOAD: {
                const result = await load(data);
                respond({ id, type: MessageType.RESULT, data: result ? 'loaded' : 'already_loaded' });
                break;
            }
            case MessageType.CONVERT: {
                const mp3Data = convert(data);
                respond({ id, type: MessageType.RESULT, data: mp3Data });
                break;
            }
            case MessageType.TERMINATE: {
                ffmpeg = null;
                respond({ id, type: MessageType.RESULT, data: 'terminated' });
                self.close();
                break;
            }
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    }
    catch (error) {
        respond({
            id,
            type: MessageType.ERROR,
            error: error instanceof Error ? error.message : String(error),
        });
    }
    finally {
        currentMessageId = null;
    }
};
//# sourceMappingURL=worker.js.map