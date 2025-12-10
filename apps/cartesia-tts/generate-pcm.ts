/**
 * Generate PCM audio from Cartesia TTS API
 * 
 * Usage: npx tsx generate-pcm.ts [optional text]
 * Output: sample.pcm (16-bit signed little-endian, 44100Hz, mono)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
const CONFIG = {
    text: process.argv[2] || 'Hello! This is a test of the minimal ffmpeg wasm build for PCM to MP3 conversion.',
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

async function main(): Promise<void> {
    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
        console.error('❌ CARTESIA_API_KEY not found in ../.env');
        process.exit(1);
    }

    console.log('🎙️  Generating PCM audio from Cartesia TTS...');
    console.log(`📄 Text: "${CONFIG.text}"`);

    const response = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'Cartesia-Version': API_CONFIG.version,
        },
        body: JSON.stringify({
            model_id: API_CONFIG.model,
            transcript: CONFIG.text,
            voice: { mode: 'id', id: CONFIG.voiceId },
            output_format: CONFIG.outputFormat,
            language: CONFIG.language,
            generation_config: CONFIG.generationConfig,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API error: ${response.status} ${response.statusText}`);
        console.error(errorText);
        process.exit(1);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let pcmData = Buffer.alloc(0);
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
                        pcmData = Buffer.concat([pcmData, Buffer.from(parsed.data, 'base64')]);
                    }
                } catch {
                    try {
                        pcmData = Buffer.concat([pcmData, Buffer.from(data, 'base64')]);
                    } catch { /* ignore */ }
                }
            } else if (event === 'error') {
                console.error(`❌ API error: ${data}`);
                process.exit(1);
            }
        }
    }

    if (pcmData.length === 0) {
        console.error('❌ No audio data received');
        process.exit(1);
    }

    const outputPath = path.join(__dirname, 'sample.pcm');
    fs.writeFileSync(outputPath, pcmData);

    console.log(`\n✅ PCM saved: ${outputPath}`);
    console.log(`📊 Size: ${(pcmData.length / 1024).toFixed(2)} KB`);
    console.log(`🎵 Format: 16-bit signed LE, 44100Hz, mono`);
    console.log(`\n📝 Now open http://localhost:3333/test-pcm-to-mp3/ and load sample.pcm`);
}

main().catch(console.error);
