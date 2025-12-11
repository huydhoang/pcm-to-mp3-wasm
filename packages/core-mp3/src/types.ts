/**
 * ffmpeg-mp3-worker - TypeScript type definitions
 */

// PCM format types supported by the converter
export type PcmFormat = 's16le' | 's16be' | 's24le' | 's32le' | 'f32le' | 'f64le' | 'u8';

/**
 * Options for PCM to MP3 conversion
 */
export interface PcmToMp3Options {
    /** Sample rate in Hz (default: 44100) */
    sampleRate?: number;
    /** Number of audio channels (default: 1 for mono) */
    channels?: number;
    /** MP3 bitrate in kbps (default: 128) */
    bitrate?: number;
    /** PCM input format (default: 's16le') */
    format?: PcmFormat;
}

/**
 * Configuration for creating a converter instance
 */
export interface ConverterConfig {
    /** Custom URL for ffmpeg-core.js */
    coreURL?: string;
    /** Custom URL for ffmpeg-core.wasm */
    wasmURL?: string;
}

/**
 * Progress callback for conversion progress updates
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Log event from FFmpeg
 */
export interface LogEvent {
    type: string;
    message: string;
}

/**
 * Progress event from FFmpeg
 */
export interface ProgressEvent {
    progress: number;
    time: number;
}

// Worker message types
export enum MessageType {
    LOAD = 'LOAD',
    CONVERT = 'CONVERT',
    TERMINATE = 'TERMINATE',
    PROGRESS = 'PROGRESS',
    LOG = 'LOG',
    ERROR = 'ERROR',
    RESULT = 'RESULT',
}

/**
 * Message sent to worker
 */
export interface WorkerMessage {
    id: number;
    type: MessageType;
    data?: WorkerMessageData;
}

/**
 * Data payload for worker messages
 */
export type WorkerMessageData =
    | LoadMessageData
    | ConvertMessageData
    | undefined;

export interface LoadMessageData {
    coreURL?: string;
    wasmURL?: string;
}

export interface ConvertMessageData {
    pcmData: Uint8Array;
    options: Required<PcmToMp3Options>;
}

/**
 * Response from worker
 */
export interface WorkerResponse {
    id: number;
    type: MessageType;
    data?: Uint8Array | string | ProgressEvent | LogEvent;
    error?: string;
}
