import crypto from 'crypto';
import { initialize } from './src/services/pipeline/renderer/CanvasKitRenderer.js';
import { sharedAudioAnalysisEngine } from './src/services/audio/SharedAudioAnalysisEngine.js';
import { sharedVisualizerPipeline } from './src/services/visualizer/VisualizerPipeline.js';
import { renderCanvasKitPrimitives } from './src/services/visualizer/CanvasKitPrimitiveRenderer.js';
import * as classicVertical from './src/visualizers/categories/bars/B01_ClassicVertical.js';

async function runRendererRootCauseAudit() {
  const CanvasKit = await initialize();
  await sharedVisualizerPipeline.loadPlugin(classicVertical);

  const keyframes = [98, 99, 100, 101, 102];
  const width = 1280;
  const height = 720;
  const viewport = { width, height };
  const config = { barCount: 64, colorLeft: '#AB55F7', colorRight: '#F59E0B' };

  const surface = CanvasKit.MakeSurface(width, height);
  const canvas = surface.getCanvas();

  const auditResults = [];

  for (const frameIndex of keyframes) {
    const primitives = sharedVisualizerPipeline.renderFrame(frameIndex, 'export_session', viewport, config);
    const firstPrim = primitives[0];

    // Compute bounding box metrics across all primitives
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, totalArea = 0;
    for (const p of primitives) {
      if (p.x < minX) minX = p.x;
      if (p.x + p.width > maxX) maxX = p.x + p.width;
      if (p.y < minY) minY = p.y;
      if (p.y + p.height > maxY) maxY = p.y + p.height;
      totalArea += (p.width * p.height);
    }

    console.log(`----------------------------------`);
    console.log(`FRAME ${frameIndex}`);
    console.log(`primitive[0]`);
    console.log(`x:         ${firstPrim.x}`);
    console.log(`y:         ${firstPrim.y}`);
    console.log(`width:     ${firstPrim.width}`);
    console.log(`height:    ${firstPrim.height}`);
    console.log(`fillColor: ${firstPrim.fillColor}`);
    console.log(`\nBounding Box Audit:`);
    console.log(`minX:      ${minX}`);
    console.log(`maxX:      ${maxX}`);
    console.log(`minY:      ${minY}`);
    console.log(`maxY:      ${maxY}`);
    console.log(`totalArea: ${totalArea}`);

    // Render Primitives to SkCanvas
    renderCanvasKitPrimitives(CanvasKit, canvas, primitives, true, viewport);

    surface.flush();
    console.log(`surface.flush called`);

    const image = surface.makeImageSnapshot();
    console.log(`snapshot generated`);
    console.log(`snapshot width:  ${image.width()}`);
    console.log(`snapshot height: ${image.height()}`);

    const bytes = image.encodeToBytes(CanvasKit.ImageFormat.PNG, 100);
    const snapshotSHA256 = crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex');
    console.log(`snapshot SHA256: ${snapshotSHA256}`);
    console.log(`----------------------------------\n`);

    image.delete();

    auditResults.push({
      frameIndex,
      firstPrim,
      snapshotSHA256,
      totalArea
    });
  }

  surface.delete();

  // Diagnostic logic
  const firstSHA = auditResults[0].snapshotSHA256;
  const allSHAIdentical = auditResults.every(r => r.snapshotSHA256 === firstSHA);

  const firstY = auditResults[0].firstPrim.y;
  const drawRectParamsChange = auditResults.some(r => r.firstPrim.y !== firstY);

  console.log(`================================================================`);
  console.log(`RENDERER ROOT CAUSE VERDICT`);
  console.log(`================================================================`);
  if (!drawRectParamsChange) {
    console.log(`[VERDICT] CanvasKitPrimitiveRenderer menggunakan object lama.`);
  } else if (allSHAIdentical) {
    console.log(`[VERDICT] CanvasKit Surface Snapshot tidak mengambil surface yang baru digambar.`);
  } else {
    console.log(`[VERDICT] 🟢 SNAPSHOT CHANGED DYNAMICALLY PER FRAME (drawRect params changed & snapshot SHA256 updated per frame).`);
  }
  console.log(`================================================================\n`);
}

runRendererRootCauseAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
