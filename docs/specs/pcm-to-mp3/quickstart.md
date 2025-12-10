# PCM-to-MP3 WASM Build Quickstart

Build a minimal FFmpeg WASM module optimized for PCM to MP3 conversion.

## Why This Build?

| Metric | Full FFmpeg WASM | This Build | Savings |
|--------|------------------|------------|---------|
| WASM Size | ~30 MB | **1.61 MB** | **95%** |
| JS Size | ~500 KB | **200 KB** | **60%** |

---

## Prerequisites

- **Docker Desktop** running with `buildx` support
  - On Windows: Ensure Docker Desktop is running (check system tray icon)
  - Verify with: `docker info` (should not show connection errors)
- **Make** (Linux/GitBash only - Windows users should use Docker commands directly)

---

## Quick Build Commands

### Linux / GitBash

```bash
# Worker build (browser/web worker)
make dev-mp3          # Development (with debug symbols)
make prd-mp3          # Production (optimized, smaller)

# Node.js build (server-side)
make dev-mp3-node     # Development
make prd-mp3-node     # Production

# Build all variants
make build-mp3-all
```

### PowerShell 7 (Windows)

> [!NOTE]
> The Makefile uses Unix commands (`rm -rf`) that don't work on Windows.
> Use Docker commands directly instead.

```powershell
# Clean output directory first
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue ./packages/core-mp3/dist

# Production Worker build
docker buildx build `
  --build-arg EXTRA_CFLAGS="-O3 -msimd128" `
  --build-arg FFMPEG_ST=yes `
  -f Dockerfile.prod `
  -o ./packages/core-mp3 .

# Production Node.js build
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue ./packages/core-mp3-node/dist
docker buildx build `
  --build-arg EXTRA_CFLAGS="-O3 -msimd128" `
  --build-arg FFMPEG_ST=yes `
  --build-arg FFMPEG_BUILD_SCRIPT=ffmpeg-wasm-mp3-node.sh `
  -f Dockerfile.prod `
  -o ./packages/core-mp3-node .
```

---

## Build Targets Reference

| Target | Environment | Output | Use Case |
|--------|-------------|--------|----------|
| `dev-mp3` | Worker | `packages/core-mp3` | Browser debugging |
| `prd-mp3` | Worker | `packages/core-mp3` | Browser production |
| `dev-mp3-node` | Node.js | `packages/core-mp3-node` | Server debugging |
| `prd-mp3-node` | Node.js | `packages/core-mp3-node` | Server production |

---

## Development vs Production Builds

| Aspect | Development (`dev-*`) | Production (`prd-*`) |
|--------|----------------------|---------------------|
| CFLAGS | `--profiling` | `-O3 -msimd128` |
| Debug symbols | ✅ Included | ❌ Stripped |
| WASM size | ~2.5 MB | ~1.61 MB |
| Build progress | Verbose (`--progress=plain`) | Quiet |

---

## Worker vs Node.js Builds

| Aspect | Worker Build | Node.js Build |
|--------|--------------|---------------|
| Target | `-sENVIRONMENT=worker` | `-sENVIRONMENT=node` |
| Filesystem | Virtual FS (`workerfs.js`) | Native FS (`NODERAWFS`) |
| Initial Memory | 16 MB (growable) | 32 MB (growable) |
| Use Case | Browser, Web Workers | API routes, CLI |

---

## What's Included

Only formats supported by [Cartesia SSE API](https://docs.cartesia.ai/api-reference/tts/sse):

| Component | Details |
|-----------|---------|
| **Decoders** | `pcm_s16le`, `pcm_f32le`, `pcm_mulaw`, `pcm_alaw` |
| **Encoder** | `libmp3lame` (MP3) |
| **Muxer** | MP3 |
| **Filters** | `aformat`, `anull`, `aresample`, `abuffer`, `abuffersink` |
| **Libraries** | libavcodec, libavformat, libavutil, libswresample, libavfilter, libswscale |

---

## What's Excluded

- ❌ Video codecs (x264, x265, libvpx, AV1)
- ❌ Other audio codecs (Opus, Vorbis, AAC, FLAC)
- ❌ Image libraries (libwebp, zimg)
- ❌ Subtitle libraries (libass, freetype2, fribidi, harfbuzz)
- ❌ Network protocols
- ❌ ffprobe functionality

---

## Underlying Docker Commands

The Makefile targets wrap these Docker commands.

> [!IMPORTANT]
> Ensure Docker Desktop is running before executing these commands.

### Development Build (Worker)

#### Linux / GitBash

```bash
docker buildx build \
  --build-arg EXTRA_CFLAGS="--profiling" \
  --build-arg FFMPEG_ST=yes \
  -f Dockerfile.prod \
  -o ./packages/core-mp3 \
  --progress=plain .
```

#### PowerShell 7

```powershell
docker buildx build `
  --build-arg EXTRA_CFLAGS="--profiling" `
  --build-arg FFMPEG_ST=yes `
  -f Dockerfile.prod `
  -o ./packages/core-mp3 `
  --progress=plain .
```

### Production Build (Worker)

#### Linux / GitBash

```bash
docker buildx build \
  --build-arg EXTRA_CFLAGS="-O3 -msimd128" \
  --build-arg FFMPEG_ST=yes \
  -f Dockerfile.prod \
  -o ./packages/core-mp3 .
```

#### PowerShell 7

```powershell
docker buildx build `
  --build-arg EXTRA_CFLAGS="-O3 -msimd128" `
  --build-arg FFMPEG_ST=yes `
  -f Dockerfile.prod `
  -o ./packages/core-mp3 .
```

### Production Build (Node.js)

#### Linux / GitBash

```bash
docker buildx build \
  --build-arg EXTRA_CFLAGS="-O3 -msimd128" \
  --build-arg FFMPEG_ST=yes \
  --build-arg FFMPEG_BUILD_SCRIPT=ffmpeg-wasm-mp3-node.sh \
  -f Dockerfile.prod \
  -o ./packages/core-mp3-node .
```

#### PowerShell 7

```powershell
docker buildx build `
  --build-arg EXTRA_CFLAGS="-O3 -msimd128" `
  --build-arg FFMPEG_ST=yes `
  --build-arg FFMPEG_BUILD_SCRIPT=ffmpeg-wasm-mp3-node.sh `
  -f Dockerfile.prod `
  -o ./packages/core-mp3-node .
```

---

## Build Output Structure

```
packages/core-mp3/
├── dist/
│   ├── esm/
│   │   ├── ffmpeg-core.js      (201 KB)
│   │   └── ffmpeg-core.wasm    (1.61 MB)
│   └── umd/
│       ├── ffmpeg-core.js      (201 KB)
│       └── ffmpeg-core.wasm    (1.61MB)
├── package.json
└── README.md
```

---

## Verify Build

### Linux / GitBash

```bash
# Check file sizes
find packages/core-mp3/dist -type f -exec ls -lh {} \;
```

### PowerShell 7

```powershell
# Check file sizes
Get-ChildItem -Path "packages/core-mp3/dist" -Recurse -File | `
  ForEach-Object { Write-Host "$($_.Name): $([math]::Round($_.Length/1MB,2)) MB" }
```

---

## Test App: `apps/cartesia-tts`

The `apps/cartesia-tts` directory contains test applications demonstrating both browser and server-side PCM-to-MP3 conversion using Cartesia TTS as the audio source.

| Test Mode | Package | Filesystem | Use Case |
|-----------|---------|------------|----------|
| **Web Worker** | `pcm-to-mp3-wasm` | MEMFS (virtual) | Browser, Next.js client-side |
| **Node.js Server** | `pcm-to-mp3-wasm-node` | MEMFS (in-memory) | API routes, serverless |

> [!NOTE]
> Both tests use **MEMFS (in-memory filesystem)** with zero disk I/O.
> This makes them ideal for serverless environments like Vercel.

---

## Test 1: Web Worker (Browser)

Test the browser-compatible `pcm-to-mp3-wasm` package with a static HTML page.

```bash
npx http-server -c-1 -p 3333 --cors
```

Navigate to `http://localhost:3333/apps/cartesia-tts/index.html` and test with `sample.pcm`.

---

## Test 2: Node.js Server (In-Memory)

Test the `pcm-to-mp3-wasm-node` package with a Node.js HTTP server that demonstrates **true in-memory conversion** (no disk I/O).

### Prerequisites

1. Set your Cartesia API key in `apps/cartesia-tts/.env`:

```
CARTESIA_API_KEY=your_api_key_here
```

2. Ensure the Node.js build exists in `packages/core-mp3-node/dist/esm/`

### Run the Test Server

```bash
cd apps/cartesia-tts
npx tsx server.ts
```

Then open: **http://localhost:3456**

### What the Test Does

The server:
1. **Pre-loads** the FFmpeg WASM converter at startup (faster subsequent requests)
2. Serves an HTML page with a text input and audio player
3. On button click, fetches PCM from Cartesia TTS via SSE
4. Converts PCM to MP3 using FFmpeg WASM **entirely in memory (MEMFS)**
5. Streams the MP3 back to the browser for playback
6. Displays conversion stats (PCM size, MP3 size, compression ratio)

### Expected Server Output

```
⏳ Pre-loading FFmpeg WASM converter...
✅ Converter loaded in 0.02s

🚀 PCM-to-MP3 WASM Test Server (In-Memory)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Open: http://localhost:3456
💾 Mode: In-memory (MEMFS, no disk I/O)
⚡ Converter: Pre-loaded (fast conversions!)

Waiting for requests...


🎙️  New request...
📄 Text: "Hello! This is a test of the minimal FFmpeg WASM build for PCM to MP3 conversion."
✅ PCM: 840.00 KB (TTS: 5.07s)
warning: unsupported syscall: __syscall_getrusage

⚡ Conversion: 0.09s
✅ MP3: 153.51 KB
📉 Compression: 81.7%
```

### Key Features Demonstrated

- ✅ Real-time streaming from Cartesia TTS SSE endpoint
- ✅ Pre-loaded converter for optimal performance
- ✅ **True in-memory conversion** (MEMFS, no disk I/O)
- ✅ Suitable for serverless/edge environments
- ✅ Serving MP3 audio for browser playback

---

## Related Documentation

- [Performance Analysis](./performance_analysis.md) - Benchmarks, ST vs MT trade-offs
- [pcm-to-mp3-wasm](../../packages/core-mp3/README.md) - Browser/Web Worker package
- [pcm-to-mp3-wasm-node](../../packages/core-mp3-node/README.md) - Node.js package
- [Next.js Guide (Client)](../../packages/core-mp3/NEXTJS.md) - Web Worker integration
- [Next.js Guide (Server)](../../packages/core-mp3-node/NEXTJS.md) - API route patterns
