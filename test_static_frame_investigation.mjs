import crypto from 'crypto';
import { initialize, renderFrame } from './src/services/pipeline/renderer/CanvasKitRenderer.js';
import { sharedAudioAnalysisEngine } from './src/services/audio/SharedAudioAnalysisEngine.js';
import { sharedVisualizerPipeline } from './src/services/visualizer/VisualizerPipeline.js';
import * as classicVertical from './src/visualizers/categories/bars/B01_ClassicVertical.js';

async function runStaticFrameInvestigation() {
  await initialize();
  await sharedVisualizerPipeline.loadPlugin(classicVertical);

  const keyframes = [98, 99, 100, 101, 102];
  const fps = 60;
  const totalFrames = 300;
  const viewport = { width: 1280, height: 720 };
  const config = { barCount: 64, colorLeft: '#AB55F7', colorRight: '#F59E0B' };

  console.log(`================================================================`);
  console.log(`MF-4000 STATIC FRAME ROOT CAUSE DIAGNOSTIC (FRAMES 98..102)`);
  console.log(`================================================================\n`);

  const results = [];

  for (const frameIndex of keyframes) {
    const normalizedTime = (frameIndex / fps).toFixed(4);
    const audioTimestamp = (frameIndex / fps).toFixed(4) + 's';

    // 1. Fetch FFT Frame from Shared Engine
    const fftFrame = sharedAudioAnalysisEngine.getFrame('export_session', frameIndex, totalFrames, fps);
    const fftChecksum = crypto.createHash('sha256').update(Buffer.from(fftFrame.spectrum)).digest('hex');

    // 2. Generate Primitives from VisualizerPipeline
    const primitives = sharedVisualizerPipeline.renderFrame(frameIndex, 'export_session', viewport, config);
    const primStr = primitives.map(p => `${p.x},${p.y},${p.width},${p.height},${p.fillColor}`).join(';');
    const primitiveChecksum = crypto.createHash('sha256').update(primStr).digest('hex');

    // 3. Render CanvasKit Frame Buffer
    const { rgbaBuffer } = await renderFrame({
      frameIndex,
      frameCount: totalFrames,
      width: viewport.width,
      height: viewport.height,
      visualizerConfig: config
    });
    const pngSHA256 = crypto.createHash('sha256').update(rgbaBuffer).digest('hex');

    results.push({
      frameIndex,
      normalizedTime,
      audioTimestamp,
      fftFrameIndex: fftFrame.frameIndex,
      fftChecksum,
      primitiveCount: primitives.length,
      primitiveChecksum,
      pngSHA256
    });

    console.log(`----------------------------------`);
    console.log(`FRAME ${frameIndex}`);
    console.log(`frameIndex:        ${frameIndex}`);
    console.log(`normalizedTime:    ${normalizedTime}`);
    console.log(`audioTimestamp:    ${audioTimestamp}`);
    console.log(`fftFrameIndex:     ${fftFrame.frameIndex}`);
    console.log(`fftChecksum:       ${fftChecksum}`);
    console.log(`primitiveCount:    ${primitives.length}`);
    console.log(`primitiveChecksum: ${primitiveChecksum}`);
    console.log(`canvasSnapshot:    ${pngSHA256}`);
    console.log(`----------------------------------\n`);
  }

  // Diagnostic Assertions
  const firstFFT = results[0].fftChecksum;
  const allFFTSame = results.every(r => r.fftChecksum === firstFFT);

  const firstPrim = results[0].primitiveChecksum;
  const allPrimSame = results.every(r => r.primitiveChecksum === firstPrim);

  const firstPNG = results[0].pngSHA256;
  const allPNGSame = results.every(r => r.pngSHA256 === firstPNG);

  console.log(`================================================================`);
  console.log(`DIAGNOSTIC VERDICT`);
  console.log(`================================================================`);
  if (allFFTSame) {
    console.log(`[VERDICT] SharedAudioAnalysisEngine selalu mengembalikan frame yang sama.`);
  } else if (allPrimSame) {
    console.log(`[VERDICT] generateGeometry() tidak menggunakan FFT secara benar.`);
  } else if (allPNGSame) {
    console.log(`[VERDICT] CanvasKit renderer tidak menggambar perubahan.`);
  } else {
    console.log(`[VERDICT] 🟢 ALL FRAMES VARY DYNAMICALLY PER FRAME (FFT, GEOMETRY & CANVASKIT PNG ALL CHANGE PER FRAME).`);
  }
  console.log(`================================================================\n`);
}

runStaticFrameInvestigation().catch(err => {
  console.error(err);
  process.exit(1);
});
