# Minimal PCM-to-MP3 WASM Build - Walkthrough

## Summary

Successfully created a minimal ffmpeg.wasm build optimized for **PCM to MP3 conversion only**, achieving a **94% size reduction** (1.94 MB vs ~30 MB for the full build).

## Build Results

| Component | Size |
|-----------|------|
| **ffmpeg-core.wasm** | 1.94 MB |
| **ffmpeg-core.js** | 201 KB |
| **Full @ffmpeg/core** | ~30 MB |
| **Size Reduction** | **~94%** |

## Files Created

### Build Configuration

| File | Purpose |
|------|---------|
| [Dockerfile.mp3](file:///c:/Users/Huy/Downloads/code/ffmpeg.wasm/Dockerfile.mp3) | Minimal Docker build with only lame library |
| [build/ffmpeg-mp3.sh](file:///c:/Users/Huy/Downloads/code/ffmpeg.wasm/build/ffmpeg-mp3.sh) | FFmpeg configure with minimal codecs |
| [build/ffmpeg-wasm-mp3.sh](file:///c:/Users/Huy/Downloads/code/ffmpeg.wasm/build/ffmpeg-wasm-mp3.sh) | WASM linker with required libraries |
| [export-mp3.js](file:///c:/Users/Huy/Downloads/code/ffmpeg.wasm/src/bind/ffmpeg/export-mp3.js) | Minimal exports (no ffprobe) |

### NPM Package

| File | Purpose |
|------|---------|
| [packages/core-mp3/package.json](file:///c:/Users/Huy/Downloads/code/ffmpeg.wasm/packages/core-mp3/package.json) | Package definition with exports |
| [packages/core-mp3/README.md](file:///c:/Users/Huy/Downloads/code/ffmpeg.wasm/packages/core-mp3/README.md) | Usage documentation |

### Makefile

render_diffs(file:///c:/Users/Huy/Downloads/code/ffmpeg.wasm/Makefile)

## Build Output

```
packages/core-mp3/
├── dist/
│   ├── esm/
│   │   ├── ffmpeg-core.js (201 KB)
│   │   └── ffmpeg-core.wasm (1.94 MB)
│   └── umd/
│       ├── ffmpeg-core.js (201 KB)
│       └── ffmpeg-core.wasm (1.94 MB)
├── package.json
└── README.md
```

## What Was Included

- **Decoders**: PCM (s16le, s16be, s24le, s32le, f32le, f64le, u8)
- **Encoder**: libmp3lame (MP3)
- **Muxer**: MP3
- **Filters**: aformat, anull, aresample, abuffer, abuffersink
- **Libraries**: libavcodec, libavformat, libavutil, libswresample, libavfilter, libswscale

## What Was Excluded

- Video codecs (x264, x265, libvpx)
- Other audio codecs (opus, vorbis, theora)
- Image libraries (libwebp, zimg)
- Subtitle libraries (libass, freetype2, fribidi, harfbuzz)
- Network protocols
- ffprobe functionality

## Next Steps

1. **Test the build**:
   ```javascript
   import { FFmpeg } from '@ffmpeg/ffmpeg';
   // Load the minimal core
   const ffmpeg = new FFmpeg();
   await ffmpeg.load({
     coreURL: './dist/esm/ffmpeg-core.js',
     wasmURL: './dist/esm/ffmpeg-core.wasm'
   });
   ```

2. **Publish to npm**:
   ```bash
   cd packages/core-mp3
   npm publish --access public
   ```

## Build Command

```powershell
docker buildx build `
  --build-arg EXTRA_CFLAGS="--profiling" `
  --build-arg FFMPEG_ST=yes `
  -f Dockerfile.mp3 `
  -o ./packages/core-mp3 `
  --progress=plain .
```

### Production Build (Optimized):

To get an even smaller build with full optimizations:

```powershell
docker buildx build `
  --build-arg EXTRA_CFLAGS="-O3 -msimd128" `
  --build-arg FFMPEG_ST=yes `
  -f Dockerfile.mp3 `
  -o ./packages/core-mp3 .
```

### Verify Build Output And Bundle Size

```powershell
Get-ChildItem -Path "packages/core-mp3/dist" -Recurse -File | ForEach-Object { Write-Host "$($_.Name): $([math]::Round($_.Length/1MB,2)) MB ($([math]::Round($_.Length/1KB,2)) KB)" }
```

### Test Build

```powershell
npx http-server -c-1 -p 3333 --cors
```
Navigate to test-pcm-to-mp3/index.html in your browser and select the sample.pcm file to convert it to mp3.