/**
 * ffmpeg-mp3-worker - Constants
 */
/**
 * Default conversion options
 */
export const DEFAULT_OPTIONS = {
    sampleRate: 44100,
    channels: 1,
    bitrate: 128,
    format: 's16le',
};
/**
 * Generate unique message ID for worker communication
 */
export const getMessageId = (() => {
    let id = 0;
    return () => id++;
})();
//# sourceMappingURL=const.js.map