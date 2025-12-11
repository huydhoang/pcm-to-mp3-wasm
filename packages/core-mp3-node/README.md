# ffmpeg-mp3-node

A minimal FFmpeg WebAssembly module for converting **PCM audio to MP3** in Node.js. 

- ✅ **Tiny bundle**: ~2MB (vs ~30MB for full ffmpeg.wasm)
- ✅ **Zero dependencies**: No `@ffmpeg/ffmpeg` required
- ✅ **In-memory**: Uses virtual filesystem (MEMFS), no disk I/O
- ✅ **TypeScript**: Full type definitions included
- ✅ **Bundler compatible**: Works with Turbopack, Webpack, Vercel, etc.

> [!NOTE]
> **Architecture**: The WASM binary is embedded as base64 to eliminate `import.meta.url` path resolution issues. This adds ~10-30ms decode time at startup (negligible for server use) but ensures reliable operation across all bundlers and serverless platforms. See [Performance Analysis](https://github.com/huydhoang/pcm-to-mp3-wasm/blob/main/docs/specs/pcm-to-mp3/performance_analysis.md#base64-wasm-embedding-ffmpeg-mp3-node) for trade-offs.

> **For browser/web worker usage**, see the companion package: [`ffmpeg-mp3-worker`](https://www.npmjs.com/package/ffmpeg-mp3-worker)

## Installation

```bash
npm install ffmpeg-mp3-node
```

## Quick Start

```typescript
import { convertPcmToMp3 } from 'ffmpeg-mp3-node';

// One-shot conversion
const mp3Data = await convertPcmToMp3(pcmBuffer, {
  sampleRate: 44100,
  channels: 1,
  bitrate: 128
});
```

## Reusable Converter (Recommended for Servers)

> [!IMPORTANT]
> **For HTTP servers and APIs**: Always use `createConverter()` to pre-load FFmpeg once at startup. 
> The one-shot `convertPcmToMp3()` reloads FFmpeg on every call (~3-10s overhead), while a pre-loaded converter runs in **under 1 second**.

For multiple conversions, create a reusable converter to avoid loading FFmpeg each time:

```typescript
import { createConverter } from 'ffmpeg-mp3-node';

const converter = await createConverter();

// Convert multiple files efficiently
const mp3_1 = await converter.convert(pcm1, { sampleRate: 44100 });
const mp3_2 = await converter.convert(pcm2, { sampleRate: 22050 });

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

- [Next.js Integration Guide](./NEXTJS.md) - Server-side API route patterns

## API Reference

### `convertPcmToMp3(pcmData, options?)`

One-shot conversion. Loads FFmpeg, converts, and releases resources.

- **pcmData**: `Uint8Array | Buffer` - Raw PCM audio data
- **options**: `PcmToMp3Options` - Conversion options
- **Returns**: `Promise<Uint8Array>` - MP3 audio data

### `createConverter(config?)`

Creates a reusable converter instance.

- **config.corePath**: Custom path for ffmpeg-core.js
- **config.wasmPath**: Custom path for ffmpeg-core.wasm
- **Returns**: `Promise<PcmToMp3Converter>`

### `PcmToMp3Converter`

Reusable converter class.

- `.convert(pcmData, options?)` - Convert PCM to MP3
- `.onProgress(callback)` - Set progress callback
- `.onLog(callback)` - Set log callback
- `.terminate()` - Release resources
- `.loaded` - Whether FFmpeg is loaded

## Single-Threaded Design

This package uses a **single-threaded** FFmpeg WASM build by design.

### Why Single-Threaded?

| Factor | Single-Threaded | Multi-Threaded |
|--------|-----------------|----------------|
| **Memory** | 16MB (growable) | 1024MB (fixed) |
| **Bundle Size** | ~1.94 MB | ~2.5 MB (+25%) |
| **Conversion Speed** | Baseline | ~1.5-2x faster |
| **Compatibility** | All Node.js | All Node.js |

For typical audio conversions (up to 10 minutes at 44.1kHz), single-threaded conversion takes **2.5-4 seconds**, which is acceptable for most use cases while offering:

- Lower memory footprint
- Smaller bundle size
- Simpler deployment

For detailed benchmarks and trade-off analysis, see the [Performance Analysis](https://github.com/huydhoang/pcm-to-mp3-wasm/blob/main/docs/specs/pcm-to-mp3/performance_analysis.md).

## Use Cases

This package is ideal for:

- **Server-side TTS processing**: Convert PCM from speech synthesis APIs to MP3
- **Audio file conversion**: Batch processing of audio files
- **Serverless functions**: Lightweight audio processing in cloud functions

## Browser/Web Worker Usage

For client-side audio conversion that runs in a Web Worker (non-blocking), use the companion package:

```bash
npm install ffmpeg-mp3-worker
```

```typescript
import { convertPcmToMp3 } from 'ffmpeg-mp3-worker';

// Same API, but runs in a Web Worker
const mp3Data = await convertPcmToMp3(pcmData, { sampleRate: 44100 });
```

See: [`ffmpeg-mp3-worker`](https://www.npmjs.com/package/ffmpeg-mp3-worker)

## License

GPL-2.0-or-later (due to libmp3lame dependency)
