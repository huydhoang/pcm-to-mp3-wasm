# ffmpeg-mp3-worker

A minimal FFmpeg WebAssembly module for converting **PCM audio to MP3** in the browser.

- ✅ **Tiny bundle**: ~2MB (vs ~30MB for full ffmpeg.wasm)
- ✅ **Zero dependencies**: No `@ffmpeg/ffmpeg` required
- ✅ **Non-blocking**: Runs internally in a Web Worker — never freezes the UI
- ✅ **TypeScript**: Full type definitions included

> [!IMPORTANT]
> This package **automatically uses a Web Worker** internally for all conversions.
> You call the API from your client component (`'use client'`), and the package handles worker creation.
> For server-side Node.js usage, see [`ffmpeg-mp3-node`](https://www.npmjs.com/package/ffmpeg-mp3-node).

## Installation

```bash
npm install ffmpeg-mp3-worker
```

## Build Formats

| Build | Import Path | Use Case |
|-------|-------------|----------|
| **ESM** | `ffmpeg-mp3-worker` | Modern bundlers (Vite, Webpack 5, Next.js, Rollup) |
| **UMD** | `ffmpeg-mp3-worker/dist/umd` | Legacy bundlers, script tags, CommonJS |

## Quick Start

```typescript
import { convertPcmToMp3 } from 'ffmpeg-mp3-worker';

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
import { createConverter } from 'ffmpeg-mp3-worker';

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

- [Next.js Integration Guide](./NEXTJS.md) - Client-side Web Worker patterns

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

## Single-Threaded Design

> [!NOTE]
> **No `SharedArrayBuffer` or special headers (COOP/COEP) required!**
> This package uses a single-threaded build for **maximum browser compatibility**.

### Why Single-Threaded?

| Factor | Single-Threaded | Multi-Threaded |
|--------|-----------------|----------------|
| **Memory** | 16MB (growable) | 1024MB (fixed) |
| **Bundle Size** | ~1.94 MB | ~2.5 MB (+25%) |
| **Conversion Speed** | ⚡ ~2-4s for 10 min | ~1-2s for 10 min |
| **Browser Requirements** | ✅ None | ⚠️ SharedArrayBuffer + COOP/COEP |

For audio-only PCM→MP3 conversion, single-threaded performance is **blazing fast** — the slight speed difference vs multi-threaded doesn't justify the complexity of configuring cross-origin isolation headers.

For detailed benchmarks, see the [Performance Analysis](https://github.com/huydhoang/pcm-to-mp3-wasm/blob/main/docs/specs/pcm-to-mp3/performance_analysis.md).

## Server-Side Node.js Usage

For server-side audio conversion with in-memory filesystem (no disk I/O), use the companion package:

```bash
npm install ffmpeg-mp3-node
```

```typescript
import { convertPcmToMp3 } from 'ffmpeg-mp3-node';

// Same API, optimized for Node.js
const mp3Data = await convertPcmToMp3(pcmBuffer, { sampleRate: 44100 });
```

See: [`ffmpeg-mp3-node`](https://www.npmjs.com/package/ffmpeg-mp3-node)

## Development

Build commands:

```bash
# Worker build (browser/web worker environment)
make dev-mp3           # Development build
make prd-mp3           # Production build (optimized)
```

## License

GPL-2.0-or-later (due to libmp3lame dependency)
