# PCM-to-MP3 WASM Build Quickstart

Build a minimal FFmpeg WASM module optimized for PCM to MP3 conversion.

## Why This Build?

| Metric | Full FFmpeg WASM | This Build | Savings |
|--------|------------------|------------|---------|
| WASM Size | ~30 MB | **1.61 MB** | **95%** |
| JS Size | ~500 KB | **200 KB** | **60%** |

---

## Prerequisites

- Docker with `buildx` support
- Make

---

## Quick Build Commands

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

The Makefile targets wrap these Docker commands:

### Development Build (Worker)

```bash
docker buildx build \
  --build-arg EXTRA_CFLAGS="--profiling" \
  --build-arg FFMPEG_ST=yes \
  -f Dockerfile.prod \
  -o ./packages/core-mp3 \
  --progress=plain .
```

### Production Build (Worker)

```bash
docker buildx build \
  --build-arg EXTRA_CFLAGS="-O3 -msimd128" \
  --build-arg FFMPEG_ST=yes \
  -f Dockerfile.prod \
  -o ./packages/core-mp3 .
```

### Production Build (Node.js)

```bash
docker buildx build \
  --build-arg EXTRA_CFLAGS="-O3 -msimd128" \
  --build-arg FFMPEG_ST=yes \
  --build-arg FFMPEG_BUILD_SCRIPT=ffmpeg-wasm-mp3-node.sh \
  -f Dockerfile.prod \
  -o ./packages/core-mp3-node .
```

---

## Build Output Structure

```
packages/core-mp3/
├── dist/
│   ├── esm/
│   │   ├── ffmpeg-core.js      (200 KB)
│   │   └── ffmpeg-core.wasm    (1.61 MB)
│   └── umd/
│       ├── ffmpeg-core.js      (201 KB)
│       └── ffmpeg-core.wasm    (1.94 MB)
├── package.json
└── README.md
```

---

## Verify Build

```powershell
# Check file sizes
Get-ChildItem -Path "packages/core-mp3/dist" -Recurse -File | `
  ForEach-Object { Write-Host "$($_.Name): $([math]::Round($_.Length/1MB,2)) MB" }
```

---

## Test in Browser

```bash
npx http-server -c-1 -p 3333 --cors
```

Navigate to `http://localhost:3333/test-pcm-to-mp3/index.html` and test with `sample.pcm`.

---

## Related Documentation

- [Performance Analysis](./performance_analysis.md) - File sizes, conversion times, ST vs MT trade-offs
- [README](../../packages/core-mp3/README.md) - API usage and integration
- [Next.js Guide](../../packages/core-mp3/NEXTJS.md) - Framework integration
