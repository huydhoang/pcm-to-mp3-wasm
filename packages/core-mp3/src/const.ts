/**
 * pcm-to-mp3-wasm - Constants
 */

import type { PcmToMp3Options } from './types.js';

/**
 * Default conversion options
 */
export const DEFAULT_OPTIONS: Required<PcmToMp3Options> = {
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
