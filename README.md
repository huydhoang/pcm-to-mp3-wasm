# ffmpeg-mp3-worker

A minimal FFmpeg WebAssembly build for **PCM to MP3 audio conversion**.

> 🍴 **Fork of [@ffmpeg/ffmpeg](https://github.com/ffmpegwasm/ffmpeg.wasm)** — stripped down to the essentials for audio conversion, resulting in a **95% smaller** bundle size.

## Why This Fork?

| Metric | Full FFmpeg WASM | This Build | Savings |
|--------|------------------|------------|---------|
| WASM Size | ~30 MB | **1.61 MB** | **95%** |
| JS Size | ~500 KB | **200 KB** | **60%** |

This monorepo produces two minimal npm packages optimized for **PCM to MP3 conversion**:

| Package | Environment | Use Case |
|---------|-------------|----------|
| [`ffmpeg-mp3-worker`](https://www.npmjs.com/package/ffmpeg-mp3-worker) | Browser (Web Worker) | Client-side conversion, React/Next.js |
| [`ffmpeg-mp3-node`](https://www.npmjs.com/package/ffmpeg-mp3-node) | Node.js (MEMFS) | API routes, serverless, CLI |

## Single-Threaded by Design ✅

Both packages use a **single-threaded** FFmpeg WASM build for maximum compatibility:

- ✅ No `SharedArrayBuffer` required
- ✅ No special browser headers (COOP/COEP)
- ✅ Works in all modern browsers
- ⚡ Blazing fast for audio-only conversion (~0.1s for typical TTS audio)

For detailed benchmarks and trade-offs, see the [Performance Analysis](./docs/specs/pcm-to-mp3/performance_analysis.md).

## Quick Start

### Browser (Web Worker)

```bash
npm install ffmpeg-mp3-worker
```

```typescript
import { convertPcmToMp3 } from 'ffmpeg-mp3-worker';

const mp3Data = await convertPcmToMp3(pcmData, {
  sampleRate: 44100,
  channels: 1,
  bitrate: 128
});
```

### Node.js (Server-Side)

```bash
npm install ffmpeg-mp3-node
```

```typescript
import { convertPcmToMp3 } from 'ffmpeg-mp3-node';

const mp3Data = await convertPcmToMp3(pcmBuffer, {
  sampleRate: 44100,
  channels: 1,
  bitrate: 128
});
```

## What's Included

Only the codecs needed for PCM to MP3 conversion:

| Component | Details |
|-----------|---------|
| **Decoders** | `pcm_s16le`, `pcm_f32le`, `pcm_mulaw`, `pcm_alaw` |
| **Encoder** | `libmp3lame` (MP3) |
| **Filters** | `aformat`, `aresample`, `anull` |

## What's Excluded

- ❌ Video codecs (x264, x265, libvpx, AV1)
- ❌ Other audio codecs (Opus, Vorbis, AAC, FLAC)
- ❌ Image libraries (libwebp, zimg)
- ❌ Network protocols
- ❌ ffprobe functionality

## Documentation

- [Build Quickstart](./docs/specs/pcm-to-mp3/quickstart.md) — Build commands, Docker setup
- [Performance Analysis](./docs/specs/pcm-to-mp3/performance_analysis.md) — Benchmarks, ST vs MT trade-offs
- [ffmpeg-mp3-worker README](./packages/core-mp3/README.md) — Browser package API
- [ffmpeg-mp3-node README](./packages/core-mp3-node/README.md) — Node.js package API
- [Next.js Guide (Client)](./packages/core-mp3/NEXTJS.md) — Web Worker integration
- [Next.js Guide (Server)](./packages/core-mp3-node/NEXTJS.md) — API route patterns

## Building Locally

Requires Docker Desktop with `buildx` support.

```bash
# Browser/Web Worker build
make prd-mp3

# Node.js build
make prd-mp3-node

# Build all
make build-mp3-all
```

See [Build Quickstart](./docs/specs/pcm-to-mp3/quickstart.md) for detailed instructions.

## Test App

The `apps/cartesia-tts` directory contains a demo that:
1. Fetches PCM audio from Cartesia TTS
2. Converts to MP3 using `ffmpeg-mp3-node`
3. Streams the result for browser playback

```bash
cd apps/cartesia-tts
npx tsx server.ts
# Open http://localhost:3456
```

## License

GPL-2.0-or-later (due to libmp3lame dependency)

## Credits

This project is a fork of [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) by Jerome Wu and contributors.
