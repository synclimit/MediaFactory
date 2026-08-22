/**
 * test_sprint24_visual_validation.mjs
 * Sprint 24 — Visual Render Validation Test Suite & PNG Artifact Generator
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initCanvasKit } from './src/services/pipeline/renderer/CanvasKitRuntime.js';
import { CanvasKit2DAdapter } from './src/engine/adapters/CanvasKit2DAdapter.js';
import { createRenderContext } from './src/engine/contracts/RenderContext.js';
import { createAudioState } from './src/engine/audio/AudioState.js';

import { LinearBarEngine } from './src/engine/engines/LinearBarEngine.js';
import { WaveformPathEngine } from './src/engine/engines/WaveformPathEngine.js';
import { RadialPolarEngine } from './src/engine/engines/RadialPolarEngine.js';
import { ParticlePhysicsEngine } from './src/engine/engines/ParticlePhysicsEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateDummyAudio(type = 'sineWave') {
  const freqs = new Float32Array(64);
  const wave = new Float32Array(64);

  if (type === 'sineWave') {
    for (let i = 0; i < 64; i++) {
      freqs[i] = Math.abs(Math.sin(i * 0.1)) * 0.8;
      wave[i] = Math.sin(i * 0.2);
    }
  } else if (type === 'bassHeavy') {
    for (let i = 0; i < 64; i++) {
      freqs[i] = i < 8 ? 0.95 : 0.15;
      wave[i] = Math.sin(i * 0.05) * 0.9;
    }
  } else if (type === 'whiteNoise') {
    for (let i = 0; i < 64; i++) {
      freqs[i] = Math.random() * 0.7;
      wave[i] = (Math.random() - 0.5) * 0.8;
    }
  } else if (type === 'silence') {
    freqs.fill(0);
    wave.fill(0);
  }

  return createAudioState({
    time: 1.5,
    bass: freqs[2] || 0.5,
    treble: freqs[50] || 0.2,
    energy: 0.7,
    frequencies: freqs,
    waveform: wave
  });
}

async function runVisualValidationSuite() {
  console.log('================================================================');
  console.log('SPRINT 24 — Visual Render Validation & PNG Generator');
  console.log('================================================================');

  const artifactDir = path.join(__dirname, 'experiments', 'artifacts', 'sprint24');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const CanvasKit = await initCanvasKit();
  const width = 1920;
  const height = 1080;

  const presetsToValidate = [
    // LinearBarEngine Presets
    { engine: new LinearBarEngine(), filename: 'bars-classic.png', preset: { id: 'bars-classic-vertical', barCount: 64, barWidth: 6, spacing: 3, color: '#00ffcc' }, audioType: 'sineWave' },
    { engine: new LinearBarEngine(), filename: 'bars-staggered.png', preset: { id: 'bars-staggered-center', center: true, barCount: 64, color: '#f59e0b' }, audioType: 'bassHeavy' },
    { engine: new LinearBarEngine(), filename: 'bars-mirror.png', preset: { id: 'bars-mirror', mirror: true, barCount: 64, color: '#ab55f7' }, audioType: 'sineWave' },
    { engine: new LinearBarEngine(), filename: 'bars-rounded.png', preset: { id: 'bars-rounded-pill', borderRadius: 4, barCount: 64, color: '#10b981' }, audioType: 'whiteNoise' },
    { engine: new LinearBarEngine(), filename: 'bars-horizontal.png', preset: { id: 'bars-horizontal', orientation: 'horizontal', barCount: 40, color: '#ec4899' }, audioType: 'sineWave' },

    // WaveformPathEngine Presets
    { engine: new WaveformPathEngine(), filename: 'waves-oscilloscope.png', preset: { id: 'waves-oscilloscope', fill: false, color: '#00ffcc', lineWidth: 4 }, audioType: 'sineWave' },
    { engine: new WaveformPathEngine(), filename: 'waves-filled-sine.png', preset: { id: 'waves-filled-sine', fill: true, color: '#3b82f6', fillColor: 'rgba(59, 130, 246, 0.4)' }, audioType: 'sineWave' },
    { engine: new WaveformPathEngine(), filename: 'waves-symmetrical.png', preset: { id: 'waves-symmetrical-dual', mirrorY: true, color: '#8b5cf6' }, audioType: 'bassHeavy' },
    { engine: new WaveformPathEngine(), filename: 'waves-neon.png', preset: { id: 'waves-neon-glow', lineWidth: 6, color: '#00f3ff' }, audioType: 'whiteNoise' },
    { engine: new WaveformPathEngine(), filename: 'minimal-dot.png', preset: { id: 'minimal-single-dot', sampleCount: 1, dotRadius: 24, color: '#f43f5e' }, audioType: 'sineWave' },

    // RadialPolarEngine Presets
    { engine: new RadialPolarEngine(), filename: 'circle-basic.png', preset: { id: 'circle-basic-circular', radius: 180, barCount: 64, color: '#00ffcc' }, audioType: 'sineWave' },
    { engine: new RadialPolarEngine(), filename: 'circle-inward.png', preset: { id: 'circle-inward-pointing', direction: 'inward', radius: 250, color: '#f59e0b' }, audioType: 'bassHeavy' },
    { engine: new RadialPolarEngine(), filename: 'circle-iris.png', preset: { id: 'circle-reactive-iris', baseRadiusMode: 'bass-reactive', color: '#ec4899' }, audioType: 'bassHeavy' },
    { engine: new RadialPolarEngine(), filename: 'ring-concentric.png', preset: { id: 'ring-basic-concentric', concentricRings: 3, radius: 120, color: '#3b82f6' }, audioType: 'sineWave' },

    // ParticlePhysicsEngine Presets
    { engine: new ParticlePhysicsEngine(), filename: 'particle-burst.png', preset: { id: 'particle-explosion-burst', color: '#f59e0b' }, audioType: 'sineWave' },
    { engine: new ParticlePhysicsEngine(), filename: 'particle-constellation.png', preset: { id: 'particle-constellation-nodes', connectDistance: 120, color: '#00ffcc' }, audioType: 'whiteNoise' },
    { engine: new ParticlePhysicsEngine(), filename: 'particle-fireflies.png', preset: { id: 'particle-rising-fireflies', color: '#10b981' }, audioType: 'sineWave' },
    { engine: new ParticlePhysicsEngine(), filename: 'particle-galaxy.png', preset: { id: 'galaxy-spiral-galaxy', color: '#ab55f7' }, audioType: 'bassHeavy' }
  ];

  const passList = [];
  const failList = [];

  for (const item of presetsToValidate) {
    const surface = CanvasKit.MakeSurface(width, height);
    const canvas = surface.getCanvas();

    // Dark background
    const bgPaint = new CanvasKit.Paint();
    bgPaint.setColor(CanvasKit.Color(12, 14, 20, 255));
    canvas.drawRect(CanvasKit.XYWHRect(0, 0, width, height), bgPaint);
    bgPaint.delete();

    // Wrap canvas with 2D Adapter
    const adapter = new CanvasKit2DAdapter(CanvasKit, canvas);
    const renderContext = createRenderContext({ ctx: adapter, viewport: { width, height } });
    const audioState = generateDummyAudio(item.audioType);

    item.engine.initialize(renderContext);
    const renderResult = item.engine.render(renderContext, audioState, item.preset);

    surface.flush();
    const image = surface.makeImageSnapshot();
    const pngBytes = image.encodeToBytes();

    const filePath = path.join(artifactDir, item.filename);
    fs.writeFileSync(filePath, Buffer.from(pngBytes));

    // Verify non-empty render
    const isValidSize = pngBytes.length > 5000;
    const isPass = isValidSize && renderResult && renderResult.status === 'RENDERED';

    if (isPass) {
      passList.push({ presetId: item.preset.id, filename: item.filename, bytes: pngBytes.length, engine: item.engine.id });
      console.log(`[PASS] ${item.filename} rendered cleanly (${pngBytes.length.toLocaleString()} bytes).`);
    } else {
      failList.push({ presetId: item.preset.id, filename: item.filename, error: 'Empty/Corrupt render' });
      console.error(`[FAIL] ${item.filename} rendering failed.`);
    }

    adapter.dispose();
    image.delete();
    surface.delete();
  }

  console.log('----------------------------------------------------------------');
  console.log(`Visual Validation Summary: ${passList.length} / ${presetsToValidate.length} PASS`);
  console.log('----------------------------------------------------------------');

  const reportContent = {
    suite: "Sprint 24 — Visual Render Validation Report",
    totalPresetsTested: presetsToValidate.length,
    passedCount: passList.length,
    failedCount: failList.length,
    passList,
    failList,
    status: failList.length === 0 ? "ALL_PASS" : "FAILURES_DETECTED"
  };

  fs.writeFileSync(path.join(artifactDir, 'visual_validation_summary.json'), JSON.stringify(reportContent, null, 2));

  if (failList.length === 0) {
    console.log('[SUCCESS] Sprint 24 Visual Render Validation Certified: ALL PASS');
  } else {
    console.error('[FAILURE] Visual validation detected errors.');
    process.exit(1);
  }
}

runVisualValidationSuite();
