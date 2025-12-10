// Type declarations for the FFmpeg WASM core module
// This ambient module declaration helps TypeScript understand the ffmpeg-core.js module

interface FFmpegLogger {
    type: string;
    message: string;
}

interface FFmpegFS {
    writeFile(path: string, data: Uint8Array): void;
    readFile(path: string): Uint8Array;
    unlink(path: string): void;
}

interface FFmpegCore {
    ready: Promise<void>;
    FS: FFmpegFS;
    exec(...args: string[]): number;
    setLogger(logger: (info: FFmpegLogger) => void): void;
}

type CreateFFmpegCore = () => Promise<FFmpegCore>;

declare const createFFmpegCore: CreateFFmpegCore;
export default createFFmpegCore;
