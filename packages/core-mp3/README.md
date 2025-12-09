# pcm-to-mp3-wasm

A minimal FFmpeg WebAssembly module for converting **PCM audio to MP3**. 

- ✅ **Tiny bundle**: ~2MB (vs ~30MB for full ffmpeg.wasm)
- ✅ **Zero dependencies**: No `@ffmpeg/ffmpeg` required
- ✅ **Non-blocking**: Runs in a Web Worker
- ✅ **TypeScript**: Full type definitions included

## Installation

```bash
npm install pcm-to-mp3-wasm
```

## Build Formats

| Build | Import Path | Use Case |
|-------|-------------|----------|
| **ESM** | `pcm-to-mp3-wasm` | Modern bundlers (Vite, Webpack 5, Next.js, Rollup), native ES modules |
| **UMD** | `pcm-to-mp3-wasm/dist/umd` | Legacy bundlers, script tags, CommonJS environments |

## Quick Start

```typescript
import { convertPcmToMp3 } from 'pcm-to-mp3-wasm';

// One-shot conversion (creates & terminates worker automatically)
const mp3Data = await convertPcmToMp3(pcmData, {
  sampleRate: 44100,
  channels: 1,
  bitrate: 128
});
```

## Reusable Converter

For multiple conversions, create a reusable converter to avoid loading FFmpeg each time:

```typescript
import { createConverter } from 'pcm-to-mp3-wasm';

const converter = await createConverter();

// Convert multiple files efficiently
const mp3_1 = await converter.convert(pcm1, { sampleRate: 44100 });
const mp3_2 = await converter.convert(pcm2, { sampleRate: 22050 });

// Progress tracking
converter.onProgress((progress) => {
  console.log(`${(progress * 100).toFixed(0)}% complete`);
});

// Clean up when done
converter.terminate();
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sampleRate` | `number` | `44100` | Input sample rate in Hz |
| `channels` | `number` | `1` | Number of audio channels |
| `bitrate` | `number` | `128` | MP3 bitrate in kbps |
| `format` | `string` | `'s16le'` | PCM format |

### Supported PCM Formats

| Format | Description |
|--------|-------------|
| `s16le` | Signed 16-bit little-endian |
| `s16be` | Signed 16-bit big-endian |
| `s24le` | Signed 24-bit little-endian |
| `s32le` | Signed 32-bit little-endian |
| `f32le` | 32-bit float little-endian |
| `f64le` | 64-bit float little-endian |
| `u8` | Unsigned 8-bit |

## Framework Integration

- [Next.js Integration Guide](./NEXTJS.md)

## API Reference

### `convertPcmToMp3(pcmData, options?)`

One-shot conversion. Creates a worker, converts, and terminates.

- **pcmData**: `Uint8Array` - Raw PCM audio data
- **options**: `PcmToMp3Options` - Conversion options
- **Returns**: `Promise<Uint8Array>` - MP3 audio data

### `createConverter(config?)`

Creates a reusable converter instance.

- **config.coreURL**: Custom URL for ffmpeg-core.js
- **config.wasmURL**: Custom URL for ffmpeg-core.wasm
- **Returns**: `Promise<PcmToMp3Converter>`

### `PcmToMp3Converter`

Reusable converter class.

- `.convert(pcmData, options?)` - Convert PCM to MP3
- `.onProgress(callback)` - Set progress callback
- `.onLog(callback)` - Set log callback
- `.terminate()` - Release resources
- `.loaded` - Whether FFmpeg is loaded

## Development

```bash
cd packages/core-mp3
npx tsc
```

## License

GPL-2.0-or-later (due to libmp3lame dependency)
