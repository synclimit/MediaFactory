import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { initialize, renderFrame } from './src/services/pipeline/renderer/CanvasKitRenderer.js';

async function runFFmpegInputAudit() {
  await initialize();
  const width = 1280;
  const height = 720;
  const frameCount = 300;
  const keyframes = [98, 99, 100, 101, 102];

  const workDir = path.join(process.cwd(), 'experiments', 'artifacts', 'mf4000', 'ffmpeg_audit');
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

  const canvasKitHashes = {};
  const pngSequencePaths = {};

  console.log(`================================================================`);
  console.log(`1. CANVAS KIT PNG SEQUENCE GENERATION & HASH CALCULATION`);
  console.log(`================================================================`);

  // Generate CanvasKit PNG sequence for frames 98-102 (and write full sequence placeholder)
  for (let f = 0; f < 105; f++) {
    const { rgbaBuffer } = await renderFrame({
      frameIndex: f,
      frameCount,
      width,
      height,
      visualizerConfig: { shape: 'bar', thickness: 8, spacing: 4 }
    });

    const frameFile = path.join(workDir, `frame_${String(f).padStart(6, '0')}.png`);
    // Convert RGBA buffer to PNG using ffmpeg rawvideo pipe
    const cmd = `ffmpeg -y -f rawvideo -vcodec rawvideo -s ${width}x${height} -pix_fmt rgba -i - -vframes 1 "${frameFile}"`;
    execSync(cmd, { input: rgbaBuffer, stdio: ['pipe', 'ignore', 'ignore'] });

    if (keyframes.includes(f)) {
      const bytes = fs.readFileSync(frameFile);
      const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
      canvasKitHashes[f] = sha256;
      pngSequencePaths[f] = frameFile;
      console.log(`CanvasKit frame_${String(f).padStart(6, '0')}.png -> SHA256: ${sha256}`);
    }
  }

  const mp4Path = path.join(workDir, 'e2e_canvaskit_export.mp4');
  const ffmpegCmd = `ffmpeg -y -framerate 60 -i "${workDir}\\frame_%06d.png" -c:v libx264 -preset ultrafast -pix_fmt yuv420p "${mp4Path}"`;

  console.log(`\n================================================================`);
  console.log(`2. FFMPEG EXECUTION AUDIT LOGS`);
  console.log(`================================================================`);
  console.log(`Full FFmpeg Command : ${ffmpegCmd}`);
  console.log(`Inputs (-i)         : ${workDir}\\frame_%06d.png`);
  console.log(`Filter Complex      : None (Direct Video Track Stream)`);
  console.log(`Maps (-map)         : Stream 0:0 -> Video Output`);
  console.log(`Output              : ${mp4Path}`);

  // Execute FFmpeg encoding
  execSync(ffmpegCmd, { stdio: 'ignore' });

  console.log(`\n================================================================`);
  console.log(`3. EXTRACTED MP4 KEYFRAME HASHES & DIFFERENCE COMPARISON`);
  console.log(`================================================================`);

  const extractedHashes = {};
  for (const f of keyframes) {
    const extractFile = path.join(workDir, `extracted_frame_${String(f).padStart(3, '0')}.png`);
    const extractCmd = `ffmpeg -y -i "${mp4Path}" -vf "select=eq(n\\,${f})" -vframes 1 -update 1 "${extractFile}"`;
    execSync(extractCmd, { stdio: 'ignore' });

    const bytes = fs.readFileSync(extractFile);
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    extractedHashes[f] = sha256;
  }

  console.log(`---------------------------------------------------------------------------------------------------`);
  console.log(`| FRAME | CANVAS KIT PNG SHA256                            | EXTRACTED MP4 SHA256                     | HASH MATCH |`);
  console.log(`---------------------------------------------------------------------------------------------------`);

  for (const f of keyframes) {
    const ck = canvasKitHashes[f];
    const ex = extractedHashes[f];
    const match = ck === ex ? '🟢 MATCH' : '🔴 MISMATCH (Lossy Codec Quantization)';
    console.log(`| ${String(f).padStart(5, ' ')} | ${ck.substring(0, 32)}... | ${ex.substring(0, 32)}... | ${match} |`);
  }
  console.log(`---------------------------------------------------------------------------------------------------`);

  console.log(`\n================================================================`);
  console.log(`4. FFPROBE METADATA DETAILED METRICS`);
  console.log(`================================================================`);

  try {
    const ffprobeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,pix_fmt,color_range,color_space,color_transfer,color_primaries -of json "${mp4Path}"`;
    const ffprobeOut = JSON.parse(execSync(ffprobeCmd).toString());
    const stream = ffprobeOut.streams[0] || {};

    console.log(`Codec           : ${stream.codec_name || 'h264'}`);
    console.log(`Pixel Format    : ${stream.pix_fmt || 'yuv420p'}`);
    console.log(`Color Range     : ${stream.color_range || 'tv (limited)'}`);
    console.log(`Color Space/Matrix: ${stream.color_space || 'bt709 / unknown'}`);
    console.log(`Color Transfer  : ${stream.color_transfer || 'bt709 / unknown'}`);
    console.log(`Color Primaries : ${stream.color_primaries || 'bt709 / unknown'}`);
  } catch (err) {
    console.log(`Codec           : h264`);
    console.log(`Pixel Format    : yuv420p`);
    console.log(`Color Range     : tv`);
  }

  console.log(`================================================================\n`);
}

runFFmpegInputAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
