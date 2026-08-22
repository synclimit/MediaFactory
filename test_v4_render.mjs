import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { VisualizerV4Core } from './src/visualizers/v4/VisualizerV4Core.js';
import { VisualizerV4Audio } from './src/visualizers/v4/VisualizerV4Audio.js';

console.log('Testing V4 Full Video Render Pipeline...');

const width = 1920;
const height = 1080;
const fps = 30;
const durationSec = 3;
const totalFrames = fps * durationSec;

const outputFolder = path.join(process.cwd(), 'Output', 'M3_V2');
if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });
const outputPath = path.join(outputFolder, 'Test_V4_Render.mp4');

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
const ffmpeg = spawn(bin, ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

const config = {
  mode: 'spectrum-bars',
  barCount: 64,
  gain: 100,
  colorLeft: '#AB55F7',
  colorRight: '#F59E0B',
  colorMid: '#06B6D4',
  colorMode: '2 Gradient'
};

for (let i = 0; i < totalFrames; i++) {
  const time = i / fps;
  const audio = VisualizerV4Audio.generateSyntheticState(time, 64);

  ctx.fillStyle = '#0b0c10';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(460, 390);
  VisualizerV4Core.renderFrame(ctx, 1000, 300, audio, config);
  ctx.restore();

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

console.log(`[SUCCESS] Test Video successfully rendered: ${outputPath}`);
console.log(`File size: ${fs.statSync(outputPath).size} bytes`);
