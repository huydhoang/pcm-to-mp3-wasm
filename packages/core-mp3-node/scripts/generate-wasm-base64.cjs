/**
 * Generates a TypeScript file with the WASM binary embedded as base64.
 * 
 * This eliminates the need for import.meta.url and file system path resolution,
 * making the package compatible with all bundlers (Turbopack, Webpack, Vercel, etc.)
 * 
 * Run: node scripts/generate-wasm-base64.cjs
 */

const fs = require('fs');
const path = require('path');

const WASM_SOURCE = path.join(__dirname, '..', 'dist', 'esm', 'ffmpeg-core.wasm');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'wasm-base64.ts');

// Read the WASM binary
console.log(`Reading WASM from: ${WASM_SOURCE}`);
const wasmBuffer = fs.readFileSync(WASM_SOURCE);
const wasmBase64 = wasmBuffer.toString('base64');

console.log(`WASM size: ${(wasmBuffer.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`Base64 size: ${(wasmBase64.length / 1024 / 1024).toFixed(2)} MB`);

// Generate TypeScript file
const tsContent = `/**
 * Auto-generated file containing the FFmpeg WASM binary as base64.
 * 
 * DO NOT EDIT MANUALLY - regenerate with: npm run generate:wasm
 * 
 * Generated: ${new Date().toISOString()}
 * Original WASM size: ${(wasmBuffer.length / 1024 / 1024).toFixed(2)} MB
 * Base64 size: ${(wasmBase64.length / 1024 / 1024).toFixed(2)} MB
 */

export const WASM_BASE64 = "${wasmBase64}";
`;

fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf8');
console.log(`Generated: ${OUTPUT_FILE}`);
