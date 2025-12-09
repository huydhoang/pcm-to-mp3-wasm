# Next.js 16+ Integration

Guide for using `pcm-to-mp3-wasm` with Next.js 16+ (Turbopack) and React 19+.

> ⚠️ **Note**: Next.js 16 uses Turbopack by default and has renamed `middleware.ts` to `proxy.ts`.

## Recommended: Serve WASM from `public/`

### 1. Copy WASM Files

Copy the WASM files to your `public/` directory:

```bash
# From your Next.js project root
cp node_modules/pcm-to-mp3-wasm/dist/esm/ffmpeg-core.js public/
cp node_modules/pcm-to-mp3-wasm/dist/esm/ffmpeg-core.wasm public/
```

Or create a postinstall script in `package.json`:

```json
{
  "scripts": {
    "postinstall": "cp node_modules/pcm-to-mp3-wasm/dist/esm/ffmpeg-core.* public/"
  }
}
```

### 2. Use with Custom URLs

```tsx
'use client';

import { useRef, useCallback, useEffect } from 'react';
import { createConverter, type PcmToMp3Converter } from 'pcm-to-mp3-wasm';

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
  const { convertPcmToMp3 } = await import('pcm-to-mp3-wasm');
  return convertPcmToMp3(pcmData, { sampleRate: 44100 });
}
```

## Required Headers (for SharedArrayBuffer)

If you see "SharedArrayBuffer is not defined", add COOP/COEP headers.

Create `proxy.ts` in your project root (renamed from `middleware.ts` in Next.js 16):

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  return response;
}
```

Or in `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

## Migration from Next.js 15

If upgrading from Next.js 15:
- Rename `middleware.ts` → `proxy.ts`
- Rename exported `middleware` function → `proxy`
- Run: `npx @next/codemod@canary upgrade latest`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| WASM not found | Verify files are in `public/` and paths are correct |
| Worker fails to load | Use dynamic import or ensure module workers are supported |
| SharedArrayBuffer error | Add COOP/COEP headers via `proxy.ts` or `next.config.ts` |
