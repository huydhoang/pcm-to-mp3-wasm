# Next.js 16+ Integration (Server-Side)

Guide for using `pcm-to-mp3-wasm-node` in Next.js API routes for **server-side PCM-to-MP3 conversion**.

> 💡 **For client-side conversion**, use the browser package: [`pcm-to-mp3-wasm`](https://www.npmjs.com/package/pcm-to-mp3-wasm) with the [client-side Next.js guide](../core-mp3/NEXTJS.md).

## Why Server-Side?

| Benefit | Description |
|---------|-------------|
| **No browser WASM** | Smaller client bundle, faster page loads |
| **In-memory (MEMFS)** | Zero disk I/O, suitable for serverless |
| **Pre-loaded converter** | Sub-second conversions after startup |
| **No special headers** | Single-threaded build, no COOP/COEP needed |

## Installation

```bash
npm install pcm-to-mp3-wasm-node
```

## Simple Approach (One-Shot)

For occasional conversions, use the simple one-shot API:

```typescript
// app/api/convert/route.ts
import { convertPcmToMp3 } from 'pcm-to-mp3-wasm-node';

export async function POST(request: Request) {
  const pcmData = new Uint8Array(await request.arrayBuffer());
  
  const mp3Data = await convertPcmToMp3(pcmData, {
    sampleRate: 44100,
    channels: 1,
    bitrate: 128,
  });
  
  return new Response(mp3Data, {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}
```

> [!WARNING]
> The one-shot API reloads FFmpeg WASM on every request (~3-5s overhead).
> For production, use the pre-loaded converter approach below.

## Optimized Approach (Pre-Loaded Converter) ⚡

For high-performance scenarios, **pre-load the converter** at application startup to avoid loading FFmpeg WASM on each request:

### Step 1: Create a Singleton Converter

```typescript
// lib/mp3-converter.ts
import { createConverter, type PcmToMp3Converter } from 'pcm-to-mp3-wasm-node';

// Singleton converter instance (loaded once, reused across requests)
let converter: PcmToMp3Converter | null = null;
let loadPromise: Promise<PcmToMp3Converter> | null = null;

export async function getConverter(): Promise<PcmToMp3Converter> {
  if (converter) return converter;
  
  // Prevent multiple simultaneous loads
  if (!loadPromise) {
    loadPromise = createConverter().then((c) => {
      converter = c;
      return c;
    });
  }
  
  return loadPromise;
}

export async function convertToMp3(
  pcmData: Uint8Array | Buffer,
  options: { sampleRate: number; channels?: number; bitrate?: number }
) {
  const conv = await getConverter();
  return conv.convert(pcmData, options);
}
```

### Step 2: Use in API Routes

```typescript
// app/api/convert/route.ts
import { convertToMp3 } from '@/lib/mp3-converter';

export async function POST(request: Request) {
  const pcmData = new Uint8Array(await request.arrayBuffer());
  
  // Uses pre-loaded converter (fast!)
  const mp3Data = await convertToMp3(pcmData, {
    sampleRate: 44100,
    channels: 1,
    bitrate: 128,
  });
  
  return new Response(mp3Data, {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}
```

## Performance Comparison

> [!TIP]
> **Pre-loading makes a huge difference!**

| Approach | First Request | Subsequent Requests |
|----------|---------------|---------------------|
| **One-shot** | ~3-5s | ~3-5s (reloads each time) |
| **Pre-loaded** | ~3-5s (loads WASM) | **~0.3-0.5s** ⚡ |

## Full Working Example

For a complete server implementation with Cartesia TTS integration, see:

[`apps/cartesia-tts/server.ts`](../../apps/cartesia-tts/server.ts)

This example demonstrates:
- Pre-loading the converter at startup
- Fetching PCM from Cartesia TTS SSE endpoint
- Converting to MP3 entirely in memory
- Streaming MP3 to browser for playback

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Slow first request | Expected during WASM loading, use pre-loaded converter |
| Memory issues | Ensure Node.js has sufficient memory (`--max-old-space-size`) |
| Module not found | Verify `pcm-to-mp3-wasm-node` is installed |

## Related

- [Performance Analysis](../../docs/specs/pcm-to-mp3/performance_analysis.md) - Benchmarks and trade-offs
- [Client-Side Guide](../core-mp3/NEXTJS.md) - Browser/Web Worker integration
- [pcm-to-mp3-wasm](https://www.npmjs.com/package/pcm-to-mp3-wasm) - Browser package
