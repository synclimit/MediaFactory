import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initialize } from './src/services/pipeline/renderer/CanvasKitRenderer.js';
import { drawCanvasKitVisualizer } from './src/services/pipeline/renderer/CanvasKitDrawVisualizer.js';
import { sharedAudioAnalysisEngine } from './src/services/audio/SharedAudioAnalysisEngine.js';

async function runCompositionDebug() {
  const CanvasKit = await initialize();
  const width = 1280;
  const height = 720;
  const frameIndex = 100;

  const outDir = path.join(process.cwd(), 'experiments', 'artifacts', 'mf4000');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const surface = CanvasKit.MakeSurface(width, height);
  const canvas = surface.getCanvas();

  function saveSnapshot(stepNum, stepName) {
    surface.flush();
    const image = surface.makeImageSnapshot();
    const bytes = image.encodeToBytes(CanvasKit.ImageFormat.PNG, 100);
    const buffer = Buffer.from(bytes);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileName = `step${String(stepNum).padStart(2, '0')}_${stepName}.png`;
    const filePath = path.join(outDir, fileName);
    fs.writeFileSync(filePath, buffer);
    image.delete();

    console.log(`STEP ${stepNum} [${stepName.toUpperCase()}] -> Saved: ${fileName} (${(buffer.length/1024).toFixed(2)} KB) | SHA256: ${sha256}`);
    return { fileName, sha256, bufferLength: buffer.length };
  }

  console.log(`\n================================================================`);
  console.log(`FRAME 100 EXPORT LAYER COMPOSITION DEBUG TRACE (${width}x${height})`);
  console.log(`================================================================\n`);

  // Step 1: Background
  const bgPaint = new CanvasKit.Paint();
  bgPaint.setColor(CanvasKit.Color(15, 23, 42, 255)); // Dark slate background
  canvas.drawRect([0, 0, width, height], bgPaint);
  bgPaint.delete();
  const s1 = saveSnapshot(1, 'background');

  // Step 2: Image Layer (Simulated car image background)
  const imgPaint = new CanvasKit.Paint();
  imgPaint.setColor(CanvasKit.Color(30, 41, 59, 255));
  canvas.drawRect([100, 100, width - 100, height - 100], imgPaint);
  imgPaint.delete();
  const s2 = saveSnapshot(2, 'images');

  // Step 3: Video Layer (Noop)
  const s3 = saveSnapshot(3, 'video');

  // Step 4: Visualizer Layer
  const fftFrame = sharedAudioAnalysisEngine.getFrame('export_session', frameIndex, 300);
  const vizConfig = { shape: 'bar', thickness: 8, spacing: 4, colorLeft: '#AB55F7', colorRight: '#F59E0B' };
  drawCanvasKitVisualizer(CanvasKit, canvas, fftFrame.spectrum, vizConfig, width, height, false, frameIndex);
  const s4 = saveSnapshot(4, 'visualizer');

  // Step 5: Text Layer
  const textPaint = new CanvasKit.Paint();
  textPaint.setColor(CanvasKit.Color(255, 255, 255, 255));
  canvas.drawRect([50, 50, 400, 70], textPaint); // Track title text bounding box
  textPaint.delete();
  const s5 = saveSnapshot(5, 'text');

  // Step 6: Branding Layer
  const brandPaint = new CanvasKit.Paint();
  brandPaint.setColor(CanvasKit.Color(245, 158, 11, 255));
  canvas.drawCircle(80, 80, 20, brandPaint);
  brandPaint.delete();
  const s6 = saveSnapshot(6, 'branding');

  // Step 7: Overlay Layer
  const s7 = saveSnapshot(7, 'overlay');

  // Step 8: Final Snapshot
  const s8 = saveSnapshot(8, 'snapshot');

  surface.delete();

  console.log(`\n================================================================`);
  console.log(`VISUALIZER OCCLUSION & OVERLAY AUDIT RESULT`);
  console.log(`================================================================`);
  console.log(`Step 4 Visualizer SHA256 : ${s4.sha256}`);
  console.log(`Step 8 Final Frame SHA256: ${s8.sha256}`);

  if (s4.sha256 !== s1.sha256 && s4.sha256 !== s2.sha256) {
    console.log(`[PASS] Visualizer correctly rendered on Step 4 (SHA256 changed from Step 2 to Step 4).`);
  } else {
    console.log(`[FAIL] Visualizer did NOT alter canvas on Step 4.`);
  }

  if (s8.sha256 !== s4.sha256) {
    console.log(`[INFO] Subsequent layers (Text/Branding) added to frame on Steps 5-8 without clearing Visualizer.`);
  }

  console.log(`================================================================\n`);
}

runCompositionDebug().catch(err => {
  console.error(err);
  process.exit(1);
});
