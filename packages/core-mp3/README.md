# pcm-to-mp3-wasm

A minimal FFmpeg WebAssembly build optimized for **PCM to MP3 conversion only**.

## Features

- **Tiny bundle size**: ~1-2MB (vs ~30MB for full ffmpeg.wasm)
- **PCM input support**: s16le, s16be, s24le, s32le, f32le, f64le, u8
- **MP3 output**: High-quality MP3 encoding via libmp3lame

## Installation

```bash
npm install pcm-to-mp3-wasm @ffmpeg/ffmpeg
```

## Usage

```javascript
import { FFmpeg } from '@ffmpeg/ffmpeg';
import coreURL from 'pcm-to-mp3-wasm?url';
import wasmURL from 'pcm-to-mp3-wasm/wasm?url';

const ffmpeg = new FFmpeg();
await ffmpeg.load({ coreURL, wasmURL });

// Write PCM data (16-bit signed little-endian, mono, 44100Hz)
ffmpeg.writeFile('audio.pcm', pcmData);

// Convert to MP3
await ffmpeg.exec([
  '-f', 's16le',        // Input format
  '-ar', '44100',       // Sample rate
  '-ac', '1',           // Channels (mono)
  '-i', 'audio.pcm',    // Input file
  '-b:a', '128k',       // Bitrate
  'output.mp3'          // Output file
]);

const mp3Data = await ffmpeg.readFile('output.mp3');
```

## Supported PCM Formats

| Format | Description |
|--------|-------------|
| `s16le` | Signed 16-bit little-endian |
| `s16be` | Signed 16-bit big-endian |
| `s24le` | Signed 24-bit little-endian |
| `s32le` | Signed 32-bit little-endian |
| `f32le` | 32-bit float little-endian |
| `f64le` | 64-bit float little-endian |
| `u8` | Unsigned 8-bit |

## License

GPL-2.0-or-later (due to libmp3lame dependency)
