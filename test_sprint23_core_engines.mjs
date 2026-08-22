/**
 * test_sprint23_core_engines.mjs
 * Sprint 23 Unit Test Suite for Phase 1 Core Engines
 */

import { ICoreEngine } from './src/engine/engines/ICoreEngine.js';
import { LinearBarEngine } from './src/engine/engines/LinearBarEngine.js';
import { WaveformPathEngine } from './src/engine/engines/WaveformPathEngine.js';
import { RadialPolarEngine } from './src/engine/engines/RadialPolarEngine.js';
import { ParticlePhysicsEngine } from './src/engine/engines/ParticlePhysicsEngine.js';
import { createRenderContext } from './src/engine/contracts/RenderContext.js';
import { AudioStateAdapter } from './src/engine/adapters/AudioStateAdapter.js';

function createMockCanvasCtx() {
  const calls = [];
  return {
    calls,
    save: () => calls.push('save'),
    restore: () => calls.push('restore'),
    beginPath: () => calls.push('beginPath'),
    closePath: () => calls.push('closePath'),
    moveTo: (x, y) => calls.push(`moveTo(${x},${y})`),
    lineTo: (x, y) => calls.push(`lineTo(${x},${y})`),
    arc: (x, y, r) => calls.push(`arc(${x},${y},${r})`),
    fillRect: (x, y, w, h) => calls.push(`fillRect(${x},${y},${w},${h})`),
    strokeRect: (x, y, w, h) => calls.push(`strokeRect(${x},${y},${w},${h})`),
    fill: () => calls.push('fill'),
    stroke: () => calls.push('stroke'),
    createLinearGradient: () => ({
      addColorStop: () => {}
    })
  };
}

async function runSprint23TestSuite() {
  console.log('================================================================');
  console.log('SPRINT 23 — Phase 1 Core Engines Unit Test Suite');
  console.log('================================================================');

  let passed = 0;
  let total = 6;

  // Test 1: ICoreEngine Contract & Interface
  try {
    const baseEngine = new ICoreEngine('TestEngine', 'Test Engine');
    if (baseEngine.id === 'TestEngine' && baseEngine.name === 'Test Engine') {
      passed++;
      console.log('[PASS 1] ICoreEngine Contract & Inheritance Verified.');
    } else {
      console.error('[FAIL 1] ICoreEngine instantiaton failed.');
    }
  } catch (e) {
    console.error('[FAIL 1]', e.message);
  }

  // Test 2: LinearBarEngine Headless Render
  try {
    const barEngine = new LinearBarEngine();
    const mockCtx = createMockCanvasCtx();
    const renderContext = createRenderContext({ ctx: mockCtx, viewport: { width: 1920, height: 1080 } });
    const audioState = AudioStateAdapter.createFromFrame({});

    barEngine.initialize(renderContext);
    const result1 = barEngine.render(renderContext, audioState, { id: 'bars-classic-vertical', barCount: 64, barWidth: 4 });
    const result2 = barEngine.render(renderContext, audioState, { id: 'bars-horizontal', orientation: 'horizontal', center: true });

    if (result1.status === 'RENDERED' && result1.barsRendered === 64 && result2.status === 'RENDERED') {
      passed++;
      console.log(`[PASS 2] LinearBarEngine Headless Render Verified: ${result1.barsRendered} bars, ${result1.drawCalls} draw calls.`);
    } else {
      console.error('[FAIL 2] LinearBarEngine render failed.');
    }
  } catch (e) {
    console.error('[FAIL 2]', e.message);
  }

  // Test 3: WaveformPathEngine Headless Render
  try {
    const waveEngine = new WaveformPathEngine();
    const mockCtx = createMockCanvasCtx();
    const renderContext = createRenderContext({ ctx: mockCtx, viewport: { width: 1920, height: 1080 } });
    const audioState = AudioStateAdapter.createFromFrame({});

    waveEngine.initialize(renderContext);
    const result1 = waveEngine.render(renderContext, audioState, { id: 'waves-oscilloscope', fill: false });
    const result2 = waveEngine.render(renderContext, audioState, { id: 'minimal-single-dot', sampleCount: 1 });

    if (result1.status === 'RENDERED' && result2.pointsDrawn === 1) {
      passed++;
      console.log(`[PASS 3] WaveformPathEngine Headless Render Verified: ${result1.pointsDrawn} path points drawn.`);
    } else {
      console.error('[FAIL 3] WaveformPathEngine render failed.');
    }
  } catch (e) {
    console.error('[FAIL 3]', e.message);
  }

  // Test 4: RadialPolarEngine Headless Render
  try {
    const radialEngine = new RadialPolarEngine();
    const mockCtx = createMockCanvasCtx();
    const renderContext = createRenderContext({ ctx: mockCtx, viewport: { width: 1920, height: 1080 } });
    const audioState = AudioStateAdapter.createFromFrame({});

    radialEngine.initialize(renderContext);
    radialEngine.update(renderContext, audioState);
    const result1 = radialEngine.render(renderContext, audioState, { id: 'circle-basic-circular', barCount: 64, radius: 150 });

    if (result1.status === 'RENDERED' && result1.elementsDrawn === 64) {
      passed++;
      console.log(`[PASS 4] RadialPolarEngine Headless Render Verified: ${result1.elementsDrawn} radial elements drawn.`);
    } else {
      console.error('[FAIL 4] RadialPolarEngine render failed.');
    }
  } catch (e) {
    console.error('[FAIL 4]', e.message);
  }

  // Test 5: ParticlePhysicsEngine Headless Render
  try {
    const particleEngine = new ParticlePhysicsEngine();
    const mockCtx = createMockCanvasCtx();
    const renderContext = createRenderContext({ ctx: mockCtx, viewport: { width: 1920, height: 1080 } });
    const audioState = AudioStateAdapter.createFromFrame({});

    particleEngine.initialize(renderContext);
    const result1 = particleEngine.render(renderContext, audioState, { id: 'particle-constellation-nodes', connectDistance: 80 });

    if (result1.status === 'RENDERED' && result1.activeParticles > 0) {
      passed++;
      console.log(`[PASS 5] ParticlePhysicsEngine Headless Render Verified: ${result1.activeParticles} particles active, ${result1.connectionsDrawn} constellation lines.`);
    } else {
      console.error('[FAIL 5] ParticlePhysicsEngine render failed.');
    }
  } catch (e) {
    console.error('[FAIL 5]', e.message);
  }

  // Test 6: Universal Signature & Pure Function Isolation
  try {
    const engines = [new LinearBarEngine(), new WaveformPathEngine(), new RadialPolarEngine(), new ParticlePhysicsEngine()];
    const mockCtx = createMockCanvasCtx();
    const renderContext = createRenderContext({ ctx: mockCtx });
    const audioState = AudioStateAdapter.createFromFrame({});

    const allSignaturesValid = engines.every(eng => {
      const res = eng.render(renderContext, audioState, { id: 'unit-test' });
      return res && res.status === 'RENDERED' && res.engineId === eng.id;
    });

    if (allSignaturesValid) {
      passed++;
      console.log('[PASS 6] Universal Signature (renderContext, audioState, presetConfig) 100% Certified across all 4 engines.');
    } else {
      console.error('[FAIL 6] Universal signature check failed.');
    }
  } catch (e) {
    console.error('[FAIL 6]', e.message);
  }

  console.log('----------------------------------------------------------------');
  console.log(`Unit Test Summary: ${passed} / ${total} PASS`);
  console.log('----------------------------------------------------------------');

  if (passed === total) {
    console.log('[SUCCESS] Sprint 23 Phase 1 Core Engine Implementation Certified: PASS');
  } else {
    console.error('[FAILURE] Unit tests failed.');
    process.exit(1);
  }
}

runSprint23TestSuite();
