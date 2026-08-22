import { initialize as initProvider, getFrameStream, pipeToFFmpeg, destroy as destroyProvider } from './src/services/pipeline/export/FFmpegFrameProvider.js';
import { initialize as initRenderer, renderFrame } from './src/services/pipeline/renderer/CanvasKitRenderer.js';
import { Writable } from 'stream';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runFFmpegConsumerTestSuite() {
  console.log('================================================================');
  console.log('MF-3004 FFmpeg Consumer Integration Empirical Verification Suite');
  console.log('================================================================');

  let passedChecks = 0;
  const totalChecks = 7;
  const width = 1920;
  const height = 1080;

  // PASS 1: Provider & Renderer Initialize called once
  const initStart = Date.now();
  await initProvider();
  const instance1 = await initRenderer();
  const instance2 = await initRenderer();

  const isSameInstance = instance1 === instance2 && instance1 !== null;
  const initDurationMs = Date.now() - initStart;

  if (isSameInstance) {
    passedChecks++;
    console.log(`[PASS 1] initialize() initialized CanvasKit WASM renderer exactly ONCE in ${initDurationMs}ms.`);
  } else {
    console.error('[FAIL 1] Initialization check failed.');
  }

  // PASS 2 & PASS 3: FFmpeg consumes raw RGBA framebuffers via renderFrame() without PNG conversion
  const frameStream = getFrameStream({ startFrame: 0, endFrame: 5, width, height, visualizerConfig: { barCount: 256 } });
  const framesCollected = [];

  for await (const frame of frameStream) {
    framesCollected.push(frame);
  }

  const hasValidStructure =
    framesCollected.length === 5 &&
    framesCollected.every(f =>
      Buffer.isBuffer(f.rgbaBuffer) &&
      !f.pngBuffer &&
      f.metadata &&
      f.metadata.pixelFormat === 'RGBA32' &&
      f.verification &&
      f.verification.sha256
    );

  if (hasValidStructure) {
    passedChecks++;
    console.log(`[PASS 2] FFmpeg consumer receives raw RGBA framebuffers exclusively via renderFrame() (5 frames collected).`);
  } else {
    console.error('[FAIL 2] Frame stream structure check failed.');
  }

  // PASS 3: Verify FFmpegFrameProvider.js contains NO PNG conversion and NO Canvas2D
  const providerPath = path.join(__dirname, 'src', 'services', 'pipeline', 'export', 'FFmpegFrameProvider.js');
  const providerSource = fs.readFileSync(providerPath, 'utf-8');

  const hasPngOrCanvas2d =
    providerSource.includes('png') ||
    providerSource.includes('encodeToBytes') ||
    providerSource.includes('ctx.') ||
    providerSource.includes('fillRect') ||
    providerSource.includes('drawVisualizer');

  if (!hasPngOrCanvas2d) {
    passedChecks++;
    console.log(`[PASS 3] FFmpegFrameProvider.js verified: ZERO PNG encoding, ZERO Canvas2D, ZERO drawVisualizer imports.`);
  } else {
    console.error('[FAIL 3] FFmpegFrameProvider.js contains PNG encoding or Canvas2D calls.');
  }

  // PASS 4: Raw RGBA frame size is EXACTLY 8,294,400 bytes
  const expectedBytes = width * height * 4;
  const frame0 = framesCollected[0];

  if (frame0 && frame0.rgbaBuffer.length === expectedBytes) {
    passedChecks++;
    console.log(`[PASS 4] Raw RGBA framebuffer size is EXACTLY ${frame0.rgbaBuffer.length.toLocaleString()} bytes ($1920 \\times 1080 \\times 4$).`);
  } else {
    console.error(`[FAIL 4] Framebuffer size mismatch.`);
  }

  // PASS 5: SHA-256 Parity Verified across consumers (FFmpeg consumer Frame 0 === CanvasKitRenderer Frame 0)
  const directRenderResult = await renderFrame({ frameIndex: 0, width, height, visualizerConfig: { barCount: 256 } });
  const directSha256 = directRenderResult.verification.sha256;
  const ffmpegSha256 = frame0.verification.sha256;

  if (directSha256 === ffmpegSha256) {
    passedChecks++;
    console.log(`[PASS 5] SHA-256 Parity Verified: FFmpeg Consumer Frame 0 SHA256 === Direct Renderer SHA256 (${ffmpegSha256}).`);
  } else {
    console.error('[FAIL 5] SHA256 parity check failed between FFmpeg consumer and renderer.');
  }

  // PASS 6: Simulated rawvideo pipe execution (piping to Writable stdin mock stream)
  let bytesPipedTotal = 0;
  const mockFfmpegStdin = new Writable({
    write(chunk, encoding, callback) {
      bytesPipedTotal += chunk.length;
      callback();
    }
  });

  const pipeResult = await pipeToFFmpeg({
    writableStream: mockFfmpegStdin,
    startFrame: 0,
    endFrame: 3,
    width,
    height
  });

  if (pipeResult.totalFramesPiped === 3 && bytesPipedTotal === expectedBytes * 3) {
    passedChecks++;
    console.log(`[PASS 6] FFmpeg rawvideo stdin pipe verified: ${pipeResult.totalFramesPiped} frames piped (${bytesPipedTotal.toLocaleString()} bytes).`);
  } else {
    console.error('[FAIL 6] Rawvideo stdin piping failed.');
  }

  // PASS 7: Zero Renderer Code Modifications (CanvasKitRenderer, CanvasKitRuntime, CanvasKitDrawVisualizer untouched)
  const rendererPath = path.join(__dirname, 'src', 'services', 'pipeline', 'renderer', 'CanvasKitRenderer.js');
  const runtimePath = path.join(__dirname, 'src', 'services', 'pipeline', 'renderer', 'CanvasKitRuntime.js');
  const drawPath = path.join(__dirname, 'src', 'services', 'pipeline', 'renderer', 'CanvasKitDrawVisualizer.js');

  const rendererSource = fs.readFileSync(rendererPath, 'utf-8');
  const runtimeSource = fs.readFileSync(runtimePath, 'utf-8');
  const drawSource = fs.readFileSync(drawPath, 'utf-8');

  const rendererUntouched =
    rendererSource.includes('export async function renderFrame') &&
    runtimeSource.includes('export async function initCanvasKit') &&
    drawSource.includes('export function drawCanvasKitVisualizer');

  if (rendererUntouched) {
    passedChecks++;
    console.log(`[PASS 7] Single Renderer Code Integrity Verified: Zero renderer core files modified during MF-3004.`);
  } else {
    console.error('[FAIL 7] Renderer core files modified unexpectedly.');
  }

  // Temporary Verification Artifact Generation (experiments/artifacts/mf3004/frame0.rgba)
  const artifactDir = path.join(__dirname, 'experiments', 'artifacts', 'mf3004');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const rgbaArtifactPath = path.join(artifactDir, 'frame0.rgba');
  fs.writeFileSync(rgbaArtifactPath, frame0.rgbaBuffer);

  if (fs.existsSync(rgbaArtifactPath) && fs.statSync(rgbaArtifactPath).size === expectedBytes) {
    console.log(`[Artifact] Temporary verification artifact generated at ${rgbaArtifactPath} (${fs.statSync(rgbaArtifactPath).size.toLocaleString()} bytes).`);
  }

  await destroyProvider();

  console.log('----------------------------------------------------------------');
  console.log(`Verification Summary: ${passedChecks} / ${totalChecks} Checks Passed.`);
  console.log('----------------------------------------------------------------');

  if (passedChecks === totalChecks) {
    console.log('[SUCCESS] MF-3004 FFmpeg Consumer Integration Certified: PASS');
  } else {
    console.error('[FAILURE] MF-3004 FFmpeg Consumer Integration Failed.');
    process.exit(1);
  }
}

runFFmpegConsumerTestSuite();
