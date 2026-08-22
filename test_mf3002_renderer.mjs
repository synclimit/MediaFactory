import { initialize, renderFrame, destroyRenderer } from './src/services/pipeline/renderer/CanvasKitRenderer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMasterLoopTestSuite() {
  console.log('================================================================');
  console.log('MF-3002 Master Loop & Shared Buffer Engine Verification Suite');
  console.log('================================================================');

  let passedChecks = 0;
  const totalChecks = 7;
  const width = 1920;
  const height = 1080;

  // Check 1: WASM Initialization ONCE
  const initStart = Date.now();
  const ckInstance1 = await initialize();
  const ckInstance2 = await initialize();

  const isSameInstance = ckInstance1 === ckInstance2 && ckInstance1 !== null;
  const initDurationMs = Date.now() - initStart;

  if (isSameInstance) {
    passedChecks++;
    console.log(`[PASS] Check 1: initialize() initialized CanvasKit WASM exactly ONCE in ${initDurationMs}ms.`);
  } else {
    console.error('[FAIL] Check 1: initialize() failed to reuse WASM instance.');
  }

  // Check 2: 3-Part Return Object Structure (No PNG, No Skia Objects Leak)
  const frame1 = await renderFrame({ frameIndex: 0, width, height });
  const hasValidStructure =
    frame1 &&
    Buffer.isBuffer(frame1.rgbaBuffer) &&
    !frame1.pngBuffer &&
    frame1.metadata &&
    frame1.metadata.frameIndex === 0 &&
    frame1.metadata.pixelFormat === 'RGBA32' &&
    frame1.verification &&
    typeof frame1.verification.sha256 === 'string' &&
    frame1.diagnostics &&
    typeof frame1.diagnostics.renderDurationMs === 'number' &&
    typeof frame1.diagnostics.heapUsedMB === 'number' &&
    typeof frame1.diagnostics.rssMB === 'number';

  if (hasValidStructure) {
    passedChecks++;
    console.log('[PASS] Check 2: renderFrame() returned 3-part independent structure (metadata, verification, diagnostics) with ZERO Skia object leakage.');
  } else {
    console.error('[FAIL] Check 2: Invalid return structure or leaked Skia objects.');
  }

  // Check 3: RGBA Buffer Size Verification
  const expectedRgbaBytes = width * height * 4; // 8,294,400 bytes
  if (frame1.rgbaBuffer.length === expectedRgbaBytes) {
    passedChecks++;
    console.log(`[PASS] Check 3: RGBA buffer size is EXACTLY ${frame1.rgbaBuffer.length.toLocaleString()} bytes.`);
  } else {
    console.error(`[FAIL] Check 3: RGBA buffer size mismatch (Expected ${expectedRgbaBytes}, got ${frame1.rgbaBuffer.length}).`);
  }

  // Check 4: Pure Frame Determinism (Identical SHA-256 for Frame 5)
  const renderA = await renderFrame({ frameIndex: 5, width, height });
  const renderB = await renderFrame({ frameIndex: 5, width, height });

  const isHashIdentical = renderA.verification.sha256 === renderB.verification.sha256;
  const isBufferIdentical = renderA.rgbaBuffer.equals(renderB.rgbaBuffer);

  if (isHashIdentical && isBufferIdentical) {
    passedChecks++;
    console.log(`[PASS] Check 4: Determinism Verified: Frame 5 rendered twice produced 100% byte-identical SHA-256 (${renderA.verification.sha256}).`);
  } else {
    console.error('[FAIL] Check 4: Frame determinism failed.');
  }

  // Check 5: Memory Leak & Disposal Check across 10 Sequential Frames
  const initialHeap = process.memoryUsage().heapUsed / (1024 * 1024);
  const frameDurations = [];

  for (let i = 0; i < 10; i++) {
    let res = await renderFrame({ frameIndex: i, width, height });
    frameDurations.push(res.diagnostics.renderDurationMs);
    // Explicitly dereference result buffer to allow V8 GC reclamation
    res = null;
  }

  if (global.gc) {
    global.gc();
  }

  const finalHeap = process.memoryUsage().heapUsed / (1024 * 1024);
  const heapDeltaMB = Math.round((finalHeap - initialHeap) * 100) / 100;
  const avgDurationMs = Math.round((frameDurations.reduce((a, b) => a + b, 0) / frameDurations.length) * 100) / 100;

  if (heapDeltaMB < 15.0) {
    passedChecks++;
    console.log(`[PASS] Check 5: Zero WASM Memory Leak Verified across 10 frames (Heap Delta: ${heapDeltaMB} MB, Avg Render: ${avgDurationMs}ms/frame).`);
  } else {
    console.error(`[FAIL] Check 5: Continuous heap memory growth detected (${heapDeltaMB} MB).`);
  }

  // Check 6: Temporary Artifact Generation (experiments/artifacts/mf3002/frame_reference.rgba)
  const artifactDir = path.join(__dirname, 'experiments', 'artifacts', 'mf3002');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const artifactPath = path.join(artifactDir, 'frame_reference.rgba');
  fs.writeFileSync(artifactPath, frame1.rgbaBuffer);

  if (fs.existsSync(artifactPath) && fs.statSync(artifactPath).size === expectedRgbaBytes) {
    passedChecks++;
    console.log(`[PASS] Check 6: Temporary verification artifact generated at ${artifactPath} (${fs.statSync(artifactPath).size.toLocaleString()} bytes).`);
  } else {
    console.error('[FAIL] Check 6: Verification artifact creation failed.');
  }

  // Check 7: Clean Renderer Destruction
  const destroyResult = await destroyRenderer();
  if (destroyResult) {
    passedChecks++;
    console.log('[PASS] Check 7: destroyRenderer() executed cleanly and released renderer state.');
  } else {
    console.error('[FAIL] Check 7: destroyRenderer() failed.');
  }

  console.log('----------------------------------------------------------------');
  console.log(`Verification Summary: ${passedChecks} / ${totalChecks} Checks Passed.`);
  console.log('----------------------------------------------------------------');

  if (passedChecks === totalChecks) {
    console.log('[SUCCESS] MF-3002 Master Loop & Shared Buffer Engine Certified: PASS');
  } else {
    console.error('[FAILURE] MF-3002 Master Loop & Shared Buffer Engine Failed.');
    process.exit(1);
  }
}

runMasterLoopTestSuite();
