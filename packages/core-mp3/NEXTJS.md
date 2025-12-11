# Next.js 16+ Integration (Web Worker)

Guide for using `ffmpeg-mp3-worker` with Next.js 16+ (Turbopack) and React 19+.

> [!IMPORTANT]
> This package runs **internally in a Web Worker** to prevent blocking the UI during conversion.
> You call the API from your client component, and the package handles worker creation automatically.

> [!NOTE]
> Next.js 16 uses Turbopack by default and has renamed `middleware.ts` to `proxy.ts`.

> 💡 **Server-side Alternative**: For server-side conversion in API routes, use [`ffmpeg-mp3-node`](https://www.npmjs.com/package/ffmpeg-mp3-node). See [Server-Side Conversion](#server-side-conversion) section below.


## Recommended: Serve WASM from `public/`

### 1. Copy WASM Files

Copy the WASM files to your `public/` directory:

```bash
# From your Next.js project root
cp node_modules/ffmpeg-mp3-worker/dist/esm/ffmpeg-core.js public/
cp node_modules/ffmpeg-mp3-worker/dist/esm/ffmpeg-core.wasm public/
```

Or create a postinstall script in `package.json`:

```json
{
  "scripts": {
    "postinstall": "cp node_modules/ffmpeg-mp3-worker/dist/esm/ffmpeg-core.* public/"
  }
}
```

### 2. Use with Custom URLs

```tsx
'use client';

import { useRef, useCallback, useEffect } from 'react';
import { createConverter, type PcmToMp3Converter } from 'ffmpeg-mp3-worker';

export function AudioConverter() {
  const converterRef = useRef<PcmToMp3Converter | null>(null);

  const getConverter = useCallback(async () => {
    if (!converterRef.current) {
      converterRef.current = await createConverter({
        coreURL: '/ffmpeg-core.js',
        wasmURL: '/ffmpeg-core.wasm',
      });
    }
    return converterRef.current;
  }, []);

  const convertToMp3 = useCallback(async (pcmData: Uint8Array) => {
    const converter = await getConverter();
    return converter.convert(pcmData, {
      sampleRate: 44100,
      channels: 1,
      bitrate: 128,
    });
  }, [getConverter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => converterRef.current?.terminate();
  }, []);

  return <div>{/* Your UI */}</div>;
}
```

## Alternative: Dynamic Import

For simpler one-off conversions:

```tsx
'use client';

async function convertPcm(pcmData: Uint8Array) {
  const { convertPcmToMp3 } = await import('ffmpeg-mp3-worker');
  return convertPcmToMp3(pcmData, { sampleRate: 44100 });
}
```

## No Special Headers Required ✅

> [!NOTE]
> **This package uses a single-threaded build** — no `SharedArrayBuffer` or special browser headers are needed!

Unlike multi-threaded FFmpeg WASM builds that require Cross-Origin Isolation (COOP/COEP headers), this package is **single-threaded by design**:

| Aspect | This Package | Multi-threaded FFmpeg |
|--------|--------------|----------------------|
| **SharedArrayBuffer** | ✅ Not needed | ❌ Required |
| **COOP/COEP headers** | ✅ Not needed | ❌ Required |
| **Browser compatibility** | ✅ All modern browsers | ⚠️ Limited |
| **Conversion speed** | ⚡ ~2-4s for 10 min audio | ~1-2s for 10 min audio |

**Why single-threaded?**

For audio-only PCM→MP3 conversion, single-threaded performance is **blazing fast** (2-4 seconds for 10 minutes of audio). The slight speed difference vs multi-threaded doesn't justify the complexity of configuring cross-origin isolation headers.

See [Performance Analysis](../../docs/specs/pcm-to-mp3/performance_analysis.md) for detailed benchmarks.

## Server-Side Conversion

For server-side conversion in API routes, use the Node.js package instead:

```bash
npm install ffmpeg-mp3-node
```

See: [ffmpeg-mp3-node Next.js Guide](https://github.com/huydhoang/pcm-to-mp3-wasm/blob/main/packages/core-mp3-node/NEXTJS.md)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| WASM not found | Verify files are in `public/` and paths are correct |
| Worker fails to load | Use dynamic import or ensure module workers are supported |
| Large file performance | Use server-side conversion with `ffmpeg-mp3-node` |
