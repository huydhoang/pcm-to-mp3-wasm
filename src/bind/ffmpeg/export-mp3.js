// Minimal exports for PCM to MP3 conversion (no ffprobe)
const EXPORTED_FUNCTIONS = ["_ffmpeg", "_abort", "_malloc"];

console.log(EXPORTED_FUNCTIONS.join(","));
