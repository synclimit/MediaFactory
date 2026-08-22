import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { VisualizerV4Core } from './src/visualizers/v4/VisualizerV4Core.js';
import { VisualizerV4Audio } from './src/visualizers/v4/VisualizerV4Audio.js';

console.log('Testing V4 Background + Transparent PNG Overlay Video Export...');

const width = 1920;
const height = 1080;
const fps = 30;
const durationSec = 3;
const totalFrames = fps * durationSec;

const outputFolder = path.join(process.cwd(), 'Output', 'M3_V2');
if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });
const outputPath = path.join(outputFolder, 'Test_V4_BG_Render.mp4');

const ffmpegPath = path.join(process.cwd(), 'backend', 'bin', 'ffmpeg.exe');
const bin = fs.existsSync(ffmpegPath) ? ffmpegPath : 'ffmpeg';

const ffmpegArgs = [
  '-y',
  '-f', 'rawvideo',
  '-vcodec', 'rawvideo',
  '-pix_fmt', 'bgra',
  '-s', `${width}x${height}`,
  '-r', `${fps}`,
  '-i', '-',
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-preset', 'ultrafast',
  outputPath
];

console.log(`Spawning FFmpeg: ${bin}`);
const ffmpeg = spawn(bin, ffmpegArgs, { stdio: ['pipe', 'ignore', 'ignore'] });

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Create a colorful gradient background to test transparency
const bgCanvas = createCanvas(width, height);
const bgCtx = bgCanvas.getContext('2d');
const bgGrad = bgCtx.createLinearGradient(0, 0, width, height);
bgGrad.addColorStop(0, '#1a0b2e');
bgGrad.addColorStop(0.5, '#111827');
bgGrad.addColorStop(1, '#0f172a');
bgCtx.fillStyle = bgGrad;
bgCtx.fillRect(0, 0, width, height);

// Draw grid pattern on background
bgCtx.strokeStyle = 'rgba(249, 115, 22, 0.15)';
bgCtx.lineWidth = 1;
for (let x = 0; x < width; x += 60) {
  bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, height); bgCtx.stroke();
}
for (let y = 0; y < height; y += 60) {
  bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(width, y); bgCtx.stroke();
}

const objects = [
  { type: 'visualizer4', mode: 'spectrum-bars', x: 960, y: 300, width: 900, height: 250, colorLeft: '#AB55F7', colorRight: '#F59E0B' },
  { type: 'visualizer4', mode: 'circular-pulse', x: 480, y: 750, width: 450, height: 450, colorLeft: '#06B6D4', colorRight: '#EC4899' },
  { type: 'visualizer4', mode: 'cyberpunk-waveform', x: 1440, y: 750, width: 800, height: 220, colorLeft: '#10B981', colorRight: '#3B82F6' },
];

for (let i = 0; i < totalFrames; i++) {
  const time = i / fps;
  const audio = VisualizerV4Audio.generateSyntheticState(time, 64);

  // 1. Draw Background Image
  ctx.drawImage(bgCanvas, 0, 0, width, height);

  // 2. Draw all Visualizer Objects on top WITHOUT clearing background
  for (const obj of objects) {
    const ox = Math.round(obj.x - obj.width / 2);
    const oy = Math.round(obj.y - obj.height / 2);
    ctx.save();
    ctx.translate(ox, oy);
    VisualizerV4Core.renderFrame(ctx, obj.width, obj.height, audio, obj);
    ctx.restore();
  }

  const rawBuf = canvas.toBuffer('raw');
  if (!ffmpeg.stdin.write(rawBuf)) {
    await new Promise(r => ffmpeg.stdin.once('drain', r));
  }
}

ffmpeg.stdin.end();

await new Promise((resolve, reject) => {
  ffmpeg.on('close', code => {
    if (code === 0) resolve();
    else reject(new Error(`FFmpeg exited with code ${code}`));
  });
  ffmpeg.on('error', reject);
});

console.log(`[SUCCESS] Transparent PNG Overlay + Background Video rendered: ${outputPath}`);
console.log(`File size: ${fs.statSync(outputPath).size} bytes`);
