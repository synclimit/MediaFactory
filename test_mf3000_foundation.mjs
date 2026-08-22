import { initCanvasKit, renderPOCFrame } from './src/services/pipeline/renderer/CanvasKitRuntime.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runFoundationTestSuite() {
  console.log('================================================================');
  console.log('MF-3000 CanvasKit Foundation POC — Automated Verification Suite');
  console.log('================================================================');

  let passedTests = 0;
  let totalTests = 5;

  // Test 1: CanvasKit Initialization
  const t1Start = Date.now();
  let ckInstance = null;
  try {
    ckInstance = await initCanvasKit();
    if (ckInstance && typeof ckInstance.MakeSurface === 'function') {
      passedTests++;
      console.log(`[PASS] Check 1: CanvasKit WASM initialized successfully in ${Date.now() - t1Start}ms.`);
    } else {
      console.error('[FAIL] Check 1: CanvasKit instance missing MakeSurface method.');
    }
  } catch (err) {
    console.error('[FAIL] Check 1: CanvasKit WASM initialization error:', err.message);
  }

  // Test 2: Frame Rendering Execution
  let renderResult = null;
  try {
    renderResult = await renderPOCFrame({ width: 1920, height: 1080 });
    if (renderResult && renderResult.rgbaBuffer && renderResult.pngBuffer && renderResult.metadata) {
      passedTests++;
      console.log(`[PASS] Check 2: renderPOCFrame() executed successfully in ${renderResult.metadata.renderDurationMs}ms.`);
    } else {
      console.error('[FAIL] Check 2: renderPOCFrame() output missing required buffer keys.');
    }
  } catch (err) {
    console.error('[FAIL] Check 2: Frame rendering error:', err.message);
  }

  // Test 3: RGBA Buffer Size Verification
  const expectedSize = 1920 * 1080 * 4; // 8,294,400 bytes
  if (renderResult && renderResult.rgbaBuffer && renderResult.rgbaBuffer.length === expectedSize) {
    passedTests++;
    console.log(`[PASS] Check 3: RGBA buffer size is EXACTLY ${expectedSize.toLocaleString()} bytes (1920x1080x4).`);
  } else {
    const actualSize = renderResult?.rgbaBuffer?.length || 0;
    console.error(`[FAIL] Check 3: RGBA buffer size mismatch (Expected ${expectedSize}, got ${actualSize}).`);
  }

  // Test 4: PNG Buffer Verification
  if (renderResult && renderResult.pngBuffer && renderResult.pngBuffer.length > 0) {
    passedTests++;
    console.log(`[PASS] Check 4: PNG image buffer generated successfully (${renderResult.pngBuffer.length.toLocaleString()} bytes).`);
  } else {
    console.error('[FAIL] Check 4: PNG image buffer empty or invalid.');
  }

  // Test 5: Metadata Integrity & SHA-256 Fingerprint
  if (
    renderResult &&
    renderResult.metadata &&
    renderResult.metadata.width === 1920 &&
    renderResult.metadata.height === 1080 &&
    renderResult.metadata.stride === 7680 &&
    renderResult.metadata.pixelFormat === 'RGBA32' &&
    typeof renderResult.metadata.sha256 === 'string' &&
    renderResult.metadata.sha256.length === 64
  ) {
    passedTests++;
    console.log(`[PASS] Check 5: Metadata & SHA-256 fingerprint verified: ${renderResult.metadata.sha256}`);
  } else {
    console.error('[FAIL] Check 5: Metadata integrity check failed.');
  }

  console.log('----------------------------------------------------------------');
  console.log(`Verification Summary: ${passedTests} / ${totalTests} Checks Passed.`);
  console.log('----------------------------------------------------------------');

  if (passedTests === totalTests) {
    console.log('[SUCCESS] MF-3000 CanvasKit Foundation POC Certified: PASS');
  } else {
    console.error('[FAILURE] MF-3000 CanvasKit Foundation POC Failed.');
    process.exit(1);
  }
}

runFoundationTestSuite();
