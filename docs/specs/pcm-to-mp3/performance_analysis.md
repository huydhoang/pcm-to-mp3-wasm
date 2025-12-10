# PCM to MP3 Conversion: Performance Analysis

Reference document for file size estimations, conversion time benchmarks, and single-threaded vs multi-threaded trade-offs.

## Cartesia TTS SSE Endpoint Specifications

Based on the [Cartesia SSE API docs](https://docs.cartesia.ai/api-reference/tts/sse):

> **Why SSE?** The SSE endpoint is required for word-level timestamps (`add_timestamps: true`), which enables synchronized text highlighting during audio playback.

| Setting | Options |
|---------|---------|
| **Container** | `raw` only (no `wav` or `mp3`) |
| **Encoding** | `pcm_f32le` (32-bit float), `pcm_s16le` (16-bit), `pcm_mulaw`, `pcm_alaw` |
| **Sample Rate** | 8000, 16000, 22050, 24000, 44100, 48000 Hz |
| **Timestamps** | `add_timestamps: true` for word-level timing |

> **Important**: Since the SSE endpoint only outputs raw PCM (no MP3 container), post-processing conversion to MP3 is **required** for efficient storage and delivery.

---


## PCM File Size Estimations

### Formula

```
Size (bytes) = sample_rate × bytes_per_sample × channels × duration_seconds
```

### For `pcm_s16le` (16-bit signed, 2 bytes/sample)

| Sample Rate | Channels | 10 min Duration |
|-------------|----------|-----------------|
| 24000 Hz | Mono | **28.8 MB** |
| 44100 Hz | Mono | **52.9 MB** |
| 44100 Hz | Stereo | **105.8 MB** |

### For `pcm_f32le` (32-bit float, 4 bytes/sample)

| Sample Rate | Channels | 10 min Duration |
|-------------|----------|-----------------|
| 24000 Hz | Mono | **57.6 MB** |
| 44100 Hz | Mono | **105.8 MB** |
| 44100 Hz | Stereo | **211.7 MB** |

---

## Audio Duration for Text

Average speaking rates for TTS:

| Speaking Rate | Words/Min | 1600 Words Duration |
|---------------|-----------|---------------------|
| Fast TTS | 180 wpm | ~8.9 minutes |
| Normal TTS | 150 wpm | ~10.7 minutes |
| Slow/Academic | 130 wpm | ~12.3 minutes |

---

## FFmpeg WASM Conversion Time

Based on [ffmpeg.wasm benchmarks](https://ffmpegwasm.netlify.app/), multi-threaded builds achieve **~2x speedup** over single-threaded for video transcoding. For audio-only encoding, the speedup is **1.5-2x**.

### Estimated Conversion Times (44.1kHz mono s16le, ~53 MB for 10 min)

| Build Type | Conversion Time | Speedup |
|------------|-----------------|---------|
| **Single-threaded (ST)** | 2.5-4 seconds | baseline |
| **Multi-threaded (MT)** | 1.3-2 seconds | ~1.5-2x |

### By PCM Configuration

| Cartesia Config | 10 min PCM Size | ST Time | MT Time |
|-----------------|-----------------|---------|---------|
| 24kHz mono s16le | 28.8 MB | ~1.5-2.5s | ~0.8-1.3s |
| 44.1kHz mono s16le | 52.9 MB | ~2.5-4s | ~1.3-2s |
| 44.1kHz mono f32le | 105.8 MB | ~4-7s | ~2-3.5s |
| 44.1kHz stereo f32le | 211.7 MB | ~7-12s | ~3.5-6s |

---

## Single-Threaded vs Multi-Threaded Trade-offs

| Factor | Single-Threaded | Multi-Threaded |
|--------|-----------------|----------------|
| **WASM Bundle Size** | ~1.94 MB | ~2.5 MB (+25%) |
| **JS Size** | ~200 KB | ~250-280 KB |
| **Initial Memory** | 16MB (growable) | 1024MB (fixed) |
| **Conversion Speed** | Baseline | ~1.5-2x faster |
| **Browser Requirements** | None | SharedArrayBuffer + COOP/COEP |
| **Server Compatibility** | All Node.js | All Node.js |

### Browser Headers Required for MT

Multi-threaded builds require Cross-Origin Isolation headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

---

## Recommendations

### For Browser/Worker Builds

| Use Case | Recommendation |
|----------|----------------|
| Short audio (<5 min) | Single-threaded (ST) |
| Long audio (>10 min) + fast UX needed | Multi-threaded (MT) |
| Maximum compatibility | Single-threaded (ST) |

### For Server/Node.js Builds

| Use Case | Recommendation |
|----------|----------------|
| Single conversions | Single-threaded (ST) |
| Batch processing | Multi-threaded (MT) |
| Memory-constrained | Single-threaded (ST) |

### For 1600-word Academic Readings (~10 min audio)

**Recommended: Single-threaded build**

- Conversion time of 2.5-4 seconds is acceptable
- Avoids SharedArrayBuffer complexity
- Smaller bundle size
- Flexible memory allocation

---

## References

- [Cartesia TTS API](https://docs.cartesia.ai/api-reference/tts/bytes)
- [FFmpeg WASM Benchmarks](https://ffmpegwasm.netlify.app/)
- [Build Report](./build_report.md)
