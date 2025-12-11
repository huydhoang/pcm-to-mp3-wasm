/**
 * ffmpeg-mp3-node - TypeScript type definitions
 */
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
    /** Custom path/URL for ffmpeg-core.js */
    corePath?: string;
    /** Custom path/URL for ffmpeg-core.wasm */
    wasmPath?: string;
}
/**
 * Log event from FFmpeg
 */
export interface LogEvent {
    type: string;
    message: string;
}
/**
 * Progress callback for conversion progress updates
 */
export type ProgressCallback = (progress: number) => void;
/**
 * Log callback for FFmpeg log events
 */
export type LogCallback = (event: LogEvent) => void;
//# sourceMappingURL=types.d.ts.map