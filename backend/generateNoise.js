/**
 * generateNoise.js
 *
 * Generate white/pink/brown noise secara sintetis -> tidak bergantung file
 * eksternal, presisi secara sinyal, dan bebas masalah lisensi/ketuker sumber.
 *
 * TANPA dependency eksternal (WAV header ditulis manual). Jalankan langsung:
 *   node generateNoise.js
 */

const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, "assets", "sounds");

function randomNormal() {
  // Box-Muller transform: ubah 2 random uniform jadi 1 random gaussian
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generateWhiteNoise(durationSec) {
  const n = Math.floor(durationSec * SAMPLE_RATE);
  const samples = new Float32Array(n);
  let max = 0;
  for (let i = 0; i < n; i++) {
    samples[i] = randomNormal();
    if (Math.abs(samples[i]) > max) max = Math.abs(samples[i]);
  }
  for (let i = 0; i < n; i++) samples[i] /= max;
  return samples;
}

function generateBrownNoise(durationSec) {
  const n = Math.floor(durationSec * SAMPLE_RATE);
  const samples = new Float32Array(n);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += randomNormal();
    samples[i] = sum;
  }
  const mean = samples.reduce((a, b) => a + b, 0) / n;
  let max = 0;
  for (let i = 0; i < n; i++) {
    samples[i] -= mean;
    if (Math.abs(samples[i]) > max) max = Math.abs(samples[i]);
  }
  for (let i = 0; i < n; i++) samples[i] /= max;
  return samples;
}

// Pink noise pakai filter Paul Kellet (aproksimasi umum, ringan secara komputasi)
function generatePinkNoise(durationSec) {
  const n = Math.floor(durationSec * SAMPLE_RATE);
  const samples = new Float32Array(n);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let max = 0;
  for (let i = 0; i < n; i++) {
    const white = randomNormal();
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    samples[i] = pink;
    if (Math.abs(pink) > max) max = Math.abs(pink);
  }
  for (let i = 0; i < n; i++) samples[i] /= max;
  return samples;
}

/** Tulis WAV mono 16-bit PCM murni pakai Buffer, tanpa library eksternal. */
function writeWav(filename, floatSamples) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const filepath = path.join(OUT_DIR, filename);

  const numSamples = floatSamples.length;
  const bytesPerSample = 2; // 16-bit
  const dataSize = numSamples * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // audio format = PCM
  buffer.writeUInt16LE(1, 22); // channels = mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, floatSamples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * bytesPerSample);
  }

  fs.writeFileSync(filepath, buffer);
  return filepath;
}

function main() {
  const durationSec = 60;

  const jobs = [
    ["white_noise.wav", generateWhiteNoise(durationSec)],
    ["pink_noise.wav", generatePinkNoise(durationSec)],
    ["brown_noise.wav", generateBrownNoise(durationSec)],
  ];

  for (const [filename, samples] of jobs) {
    const filepath = writeWav(filename, samples);
    console.log(`generated ${filepath}`);
  }
}

main();
