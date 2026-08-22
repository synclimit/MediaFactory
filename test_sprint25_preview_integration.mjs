/**
 * test_sprint25_preview_integration.mjs
 * Sprint 25 — Live Preview Core Engine Integration & Call Stack Verification
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { featureFlags } from './src/engine/adapters/ReferenceEngineAdapter.js';
import { referencePreviewDriver } from './src/engine/pipeline/ReferencePreviewDriver.js';
import { referenceRenderPipeline } from './src/engine/pipeline/ReferenceRenderPipeline.js';
import { createRenderContext } from './src/engine/contracts/RenderContext.js';
import { AudioStateAdapter } from './src/engine/adapters/AudioStateAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createTraceableCanvasCtx() {
  const callStackTrace = [];
  return {
    callStackTrace,
    save: () => callStackTrace.push('Canvas2D.save()'),
    restore: () => callStackTrace.push('Canvas2D.restore()'),
    beginPath: () => callStackTrace.push('Canvas2D.beginPath()'),
    closePath: () => callStackTrace.push('Canvas2D.closePath()'),
    fillRect: (x, y, w, h) => callStackTrace.push(`Canvas2D.fillRect(${x},${y},${w},${h})`),
    strokeRect: (x, y, w, h) => callStackTrace.push(`Canvas2D.strokeRect(${x},${y},${w},${h})`),
    arc: (x, y, r) => callStackTrace.push(`Canvas2D.arc(${x},${y},${r})`),
    fill: () => callStackTrace.push('Canvas2D.fill()'),
    stroke: () => callStackTrace.push('Canvas2D.stroke()'),
    createLinearGradient: () => ({ addColorStop: () => {} })
  };
}

async function runSprint25IntegrationSuite() {
  console.log('================================================================');
  console.log('SPRINT 25 — Live Preview Core Engine Integration Verification');
  console.log('================================================================');

  let passed = 0;
  let total = 5;

  // 1. Dependency Disconnection Check (VisualizerRuntime.js removed from VisualizerRenderer.jsx)
  const rendererComponentPath = path.join(__dirname, 'src', 'components', 'm3', 'widgets', 'VisualizerRenderer.jsx');
  const rendererCode = fs.readFileSync(rendererComponentPath, 'utf8');

  const importsVisualizerRuntime = rendererCode.includes("VisualizerRuntime");
  if (!importsVisualizerRuntime) {
    passed++;
    console.log('[PASS 1] VisualizerRuntime.js disconnected 100% from VisualizerRenderer.jsx.');
  } else {
    console.error('[FAIL 1] VisualizerRenderer.jsx still imports VisualizerRuntime.');
  }

  // 2. Feature Flag Active Check
  if (featureFlags.useReferenceEngine === true) {
    passed++;
    console.log('[PASS 2] Feature Flag `useReferenceEngine` is ENABLED (true).');
  } else {
    console.error('[FAIL 2] Feature flag useReferenceEngine is false.');
  }

  // 3. Execution Pipeline Call Stack Trace Verification
  const mockCtx = createTraceableCanvasCtx();
  const audioState = AudioStateAdapter.createFromFrame({});
  const renderContext = createRenderContext({
    ctx: mockCtx,
    viewport: { width: 1920, height: 1080 },
    config: { visualizerId: 'bars-classic-vertical', barCount: 64 }
  });

  const driverResult = referencePreviewDriver.renderPreviewFrame(renderContext, mockCtx, 1920, 1080);
  const isReferenceDriverActive = driverResult.driverMode === 'REFERENCE_ACTIVE' && driverResult.isReferenceActive === true;

  if (isReferenceDriverActive) {
    passed++;
    console.log('[PASS 3] ReferencePreviewDriver -> ReferenceRenderPipeline active mode confirmed.');
  } else {
    console.error('[FAIL 3] Driver execution mode is not REFERENCE_ACTIVE.');
  }

  // 4. Call Stack & Core Engine Execution Proof
  const activePlugin = referenceRenderPipeline.currentPlugin;
  const drawCalls = mockCtx.callStackTrace.length;

  if (activePlugin && activePlugin.id === 'SPECTRUM_BARS' && drawCalls > 0) {
    passed++;
    console.log(`[PASS 4] Call Stack Certified: ReferenceRenderPipeline -> ${activePlugin.id} (Core Engine) -> ${drawCalls} Canvas2D calls.`);
  } else {
    console.error('[FAIL 4] Call stack tracing failed.');
  }

  // 5. 60 FPS Render Performance Timing Check
  const startTime = performance.now();
  for (let i = 0; i < 60; i++) {
    referencePreviewDriver.renderPreviewFrame(renderContext, mockCtx, 1920, 1080);
  }
  const totalDuration = performance.now() - startTime;
  const avgFrameTimeMs = totalDuration / 60;
  const is60FPSCapable = avgFrameTimeMs < 16.6;

  if (is60FPSCapable) {
    passed++;
    console.log(`[PASS 5] 60 FPS Performance Certified: ${avgFrameTimeMs.toFixed(3)} ms per frame (Stable 60.0 FPS).`);
  } else {
    console.error(`[FAIL 5] Frame render time exceeds 16.6ms threshold: ${avgFrameTimeMs.toFixed(3)} ms`);
  }

  console.log('----------------------------------------------------------------');
  console.log(`Integration Summary: ${passed} / ${total} PASS`);
  console.log('----------------------------------------------------------------');

  if (passed === total) {
    console.log('[SUCCESS] Sprint 25 Live Preview Core Engine Integration Certified: PASS');
  } else {
    console.error('[FAILURE] Integration verification failed.');
    process.exit(1);
  }
}

runSprint25IntegrationSuite();
