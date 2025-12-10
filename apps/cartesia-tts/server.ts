/**
 * HTTP Server test for Node.js PCM-to-MP3 conversion (In-Memory)
 * 
 * This test runs a lightweight HTTP server that:
 * 1. Fetches PCM audio from Cartesia TTS on demand
 * 2. Converts to MP3 using pcm-to-mp3-wasm-node entirely in memory (MEMFS)
 * 3. Streams the MP3 to the browser for playback
 * 
 * Usage: npx tsx server.ts
 * Then open: http://localhost:3456
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import the converter from core-mp3-node package (dist folder has the WASM files)
import { createConverter, type PcmToMp3Converter } from '../../packages/core-mp3-node/dist/esm/index.js';

// Pre-loaded converter instance (loaded once at startup for optimal performance)
let converter: PcmToMp3Converter;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, './.env') });


// Configuration
const PORT = 3456;
const CONFIG = {
    voiceId: 'bf0a246a-8642-498a-9950-80c35e9276b5',
    language: 'en',
    outputFormat: {
        container: 'raw',
        encoding: 'pcm_s16le',
        sample_rate: 44100,
    },
    generationConfig: {
        speed: 0.6,
        volume: 1.5,
        emotion: 'neutral',
    },
};

const API_CONFIG = {
    url: 'https://api.cartesia.ai/tts/sse',
    version: '2024-06-10',
    model: 'sonic-3',
};

interface SSEEvent {
    event: string;
    data: string;
}

function parseSSEStream(chunk: string): SSEEvent[] {
    const events: SSEEvent[] = [];
    const lines = chunk.split('\n');
    let currentEvent = '';
    let currentData = '';

    for (const line of lines) {
        if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
            const dataLine = line.slice(6).trim();
            currentData = currentData ? currentData + '\n' + dataLine : dataLine;
        } else if (line === '' && currentEvent) {
            events.push({ event: currentEvent, data: currentData });
            currentEvent = '';
            currentData = '';
        }
    }
    return events;
}

async function fetchPcmFromCartesia(apiKey: string, text: string): Promise<Buffer> {
    console.log(`📄 Text: "${text}"`);

    const response = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'Cartesia-Version': API_CONFIG.version,
        },
        body: JSON.stringify({
            model_id: API_CONFIG.model,
            transcript: text,
            voice: { mode: 'id', id: CONFIG.voiceId },
            output_format: CONFIG.outputFormat,
            language: CONFIG.language,
            generation_config: CONFIG.generationConfig,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const pcmChunks: Buffer[] = [];  // Collect chunks, single concat at end
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = parseSSEStream(buffer);

        const lastEventEnd = buffer.lastIndexOf('\n\n');
        if (lastEventEnd !== -1) buffer = buffer.slice(lastEventEnd + 2);

        for (const { event, data } of events) {
            if (event === 'chunk' || event === 'audio') {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.data) {
                        pcmChunks.push(Buffer.from(parsed.data, 'base64'));
                    }
                } catch {
                    try {
                        pcmChunks.push(Buffer.from(data, 'base64'));
                    } catch { /* ignore */ }
                }
            } else if (event === 'error') {
                throw new Error(`Cartesia API error: ${data}`);
            }
        }
    }

    if (pcmChunks.length === 0) {
        throw new Error('No audio data received from Cartesia');
    }

    return Buffer.concat(pcmChunks);  // Single allocation at the end
}


// HTML page with audio player
const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PCM-to-MP3 WASM Test (In-Memory)</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        h1 {
            color: #fff;
            font-size: 1.5rem;
            margin-bottom: 10px;
            text-align: center;
        }
        .subtitle {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.9rem;
            text-align: center;
            margin-bottom: 30px;
        }
        .badge {
            display: inline-block;
            background: linear-gradient(135deg, #4ade80, #22c55e);
            color: #000;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 600;
        }
        textarea {
            width: 100%;
            padding: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            background: rgba(0, 0, 0, 0.3);
            color: #fff;
            font-size: 1rem;
            resize: vertical;
            min-height: 100px;
            margin-bottom: 20px;
        }
        textarea:focus { outline: none; border-color: #4ade80; }
        button {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 10px;
            background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
            color: #000;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(74, 222, 128, 0.3); }
        button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        #status {
            color: rgba(255, 255, 255, 0.8);
            text-align: center;
            margin-top: 20px;
            min-height: 50px;
        }
        audio {
            width: 100%;
            margin-top: 20px;
            border-radius: 10px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 20px;
        }
        .stat {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-value { color: #4ade80; font-size: 1.2rem; font-weight: bold; }
        .stat-label { color: rgba(255, 255, 255, 0.6); font-size: 0.8rem; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 PCM-to-MP3 WASM <span class="badge">IN-MEMORY</span></h1>
        <p class="subtitle">Converts Cartesia TTS audio using FFmpeg WASM (no disk I/O)</p>
        
        <textarea id="text" placeholder="Enter text to convert to speech...">Hello! This is a test of the minimal FFmpeg WASM build for PCM to MP3 conversion.</textarea>
        <button id="convert" onclick="convert()">🔊 Generate & Convert</button>
        
        <div id="status"></div>
        <audio id="audio" controls style="display: none;"></audio>
        
        <div class="stats" id="stats" style="display: none;">
            <div class="stat">
                <div class="stat-value" id="pcmSize">-</div>
                <div class="stat-label">PCM Size</div>
            </div>
            <div class="stat">
                <div class="stat-value" id="mp3Size">-</div>
                <div class="stat-label">MP3 Size</div>
            </div>
            <div class="stat">
                <div class="stat-value" id="compression">-</div>
                <div class="stat-label">Compression</div>
            </div>
        </div>
    </div>
    <script>
        async function convert() {
            const text = document.getElementById('text').value.trim();
            if (!text) return alert('Please enter some text');
            
            const btn = document.getElementById('convert');
            const status = document.getElementById('status');
            const audio = document.getElementById('audio');
            const stats = document.getElementById('stats');
            
            btn.disabled = true;
            audio.style.display = 'none';
            stats.style.display = 'none';
            status.innerHTML = '🎙️ Fetching audio from Cartesia TTS...';
            
            try {
                const startTime = performance.now();
                const response = await fetch('/convert?text=' + encodeURIComponent(text));
                
                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(error);
                }
                
                const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
                const pcmSize = response.headers.get('X-PCM-Size');
                const mp3Size = response.headers.get('X-MP3-Size');
                const ttsTime = response.headers.get('X-TTS-Time') || '-';
                const convertTime = response.headers.get('X-Convert-Time') || '-';
                
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                
                audio.src = url;
                audio.style.display = 'block';
                audio.play();
                
                // Update stats
                document.getElementById('pcmSize').textContent = pcmSize || '-';
                document.getElementById('mp3Size').textContent = mp3Size || '-';
                const pcmBytes = parseFloat(pcmSize) * 1024;
                const mp3Bytes = parseFloat(mp3Size) * 1024;
                const compressionPct = ((1 - mp3Bytes / pcmBytes) * 100).toFixed(1);
                document.getElementById('compression').textContent = compressionPct + '%';
                stats.style.display = 'grid';
                
                status.innerHTML = '✅ Ready! TTS: ' + ttsTime + ' | Convert: ' + convertTime + ' | Total: ' + totalTime + 's';
            } catch (err) {
                status.innerHTML = '❌ Error: ' + err.message;
            } finally {
                btn.disabled = false;
            }
        }
    </script>
</body>
</html>`;

// Start HTTP server
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    if (url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(HTML_PAGE);
        return;
    }

    if (url.pathname === '/convert') {
        const apiKey = process.env.CARTESIA_API_KEY;
        if (!apiKey) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('CARTESIA_API_KEY not configured');
            return;
        }

        const text = url.searchParams.get('text') || 'Hello world';

        try {
            console.log('\n🎙️  New request...');

            // Fetch PCM (time the TTS API call)
            const ttsStart = performance.now();
            const pcmData = await fetchPcmFromCartesia(apiKey, text);
            const ttsTime = (performance.now() - ttsStart) / 1000;
            console.log(`✅ PCM: ${(pcmData.length / 1024).toFixed(2)} KB (TTS: ${ttsTime.toFixed(2)}s)`);

            // Convert to MP3 (entirely in memory!)
            const convertStart = performance.now();
            const mp3Data = await converter.convert(pcmData, {
                sampleRate: CONFIG.outputFormat.sample_rate,
                channels: 1,
                bitrate: 128
            });
            const convertTime = (performance.now() - convertStart) / 1000;
            console.log(`⚡ Conversion: ${convertTime.toFixed(2)}s`);
            console.log(`✅ MP3: ${(mp3Data.length / 1024).toFixed(2)} KB`);
            console.log(`📉 Compression: ${((1 - mp3Data.length / pcmData.length) * 100).toFixed(1)}%`);

            res.writeHead(200, {
                'Content-Type': 'audio/mpeg',
                'Content-Length': mp3Data.length,
                'X-PCM-Size': (pcmData.length / 1024).toFixed(2) + ' KB',
                'X-MP3-Size': (mp3Data.length / 1024).toFixed(2) + ' KB',
                'X-TTS-Time': ttsTime.toFixed(2) + 's',
                'X-Convert-Time': convertTime.toFixed(2) + 's',
            });
            res.end(mp3Data);
        } catch (err) {
            console.error('❌ Error:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(err instanceof Error ? err.message : 'Unknown error');
        }
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

// Start server with pre-loaded converter
async function startServer() {
    console.log('\n⏳ Pre-loading FFmpeg WASM converter...');
    const loadStart = performance.now();
    converter = await createConverter();
    const loadTime = ((performance.now() - loadStart) / 1000).toFixed(2);
    console.log(`✅ Converter loaded in ${loadTime}s`);

    server.listen(PORT, () => {
        console.log(`\n🚀 PCM-to-MP3 WASM Test Server (In-Memory)`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📌 Open: http://localhost:${PORT}`);
        console.log(`💾 Mode: In-memory (MEMFS, no disk I/O)`);
        console.log(`⚡ Converter: Pre-loaded (fast conversions!)`);
        console.log(`\nWaiting for requests...\n`);
    });
}

startServer().catch(console.error);
