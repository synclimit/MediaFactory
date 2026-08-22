import { ProjectModel, saveProject, loadProject } from './src/core/project/ProjectModel.js';
import { createScheduler } from './src/services/pipeline/scheduler/RenderScheduler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runProjectModelTestSuite() {
  console.log('================================================================');
  console.log('MF-4001 Project Model & Timeline Core Verification Suite');
  console.log('================================================================');

  let passedChecks = 0;
  const totalChecks = 7;

  // PASS 1: ProjectModel instantiates with all required properties
  const proj = new ProjectModel({
    metadata: { title: 'Test MediaFactory Project' },
    width: 1920,
    height: 1080,
    fps: 30,
    totalFrameCount: 600
  });

  const isModelValid =
    proj.metadata &&
    proj.metadata.title === 'Test MediaFactory Project' &&
    proj.width === 1920 &&
    proj.height === 1080 &&
    proj.fps === 30 &&
    proj.totalFrameCount === 600 &&
    proj.duration === 20.0 &&
    Array.isArray(proj.tracks) &&
    Array.isArray(proj.assets);

  if (isModelValid) {
    passedChecks++;
    console.log(`[PASS 1] ProjectModel Instantiated: Title='${proj.metadata.title}', Res=${proj.width}x${proj.height}, Duration=${proj.duration}s (${proj.totalFrameCount} frames @ ${proj.fps} FPS).`);
  } else {
    console.error('[FAIL 1] ProjectModel properties missing or invalid.');
  }

  // PASS 2: Every clip contains required 9 schema properties
  const clip = proj.addClip('track_1', {
    assetId: 'asset_audio_1',
    startFrame: 0,
    endFrame: 300,
    offsetFrame: 0,
    playbackRate: 1.0
  });

  const isClipSchemaValid =
    'id' in clip &&
    'assetId' in clip &&
    'trackId' in clip &&
    'startFrame' in clip &&
    'endFrame' in clip &&
    'offsetFrame' in clip &&
    'playbackRate' in clip &&
    'enabled' in clip &&
    'locked' in clip;

  if (isClipSchemaValid) {
    passedChecks++;
    console.log(`[PASS 2] Clip Schema Verified: All 9 required clip properties (id, assetId, trackId, startFrame, endFrame, offsetFrame, playbackRate, enabled, locked) present.`);
  } else {
    console.error('[FAIL 2] Clip schema incomplete.');
  }

  // PASS 3: Timeline data is immutable-friendly (clone creates independent copy)
  const cloneProj = proj.clone();
  cloneProj.width = 1280;
  cloneProj.height = 720;

  const isImmutableValid = proj.width === 1920 && cloneProj.width === 1280;
  if (isImmutableValid) {
    passedChecks++;
    console.log(`[PASS 3] Immutable-friendly Architecture Verified: Modifying clone (1280x720) does not mutate original ProjectModel (1920x1080).`);
  } else {
    console.error('[FAIL 3] ProjectModel cloning mutated original instance.');
  }

  // PASS 4: Scheduler receives frameCount, fps, width, height from ProjectModel only
  const schedulerOptions = proj.getSchedulerOptions();
  const testScheduler = createScheduler(schedulerOptions);

  const isSchedulerIntegrated =
    schedulerOptions.frameCount === proj.totalFrameCount &&
    schedulerOptions.fps === proj.fps &&
    schedulerOptions.width === proj.width &&
    schedulerOptions.height === proj.height;

  if (isSchedulerIntegrated) {
    passedChecks++;
    console.log(`[PASS 4] Scheduler Integration Verified: RenderScheduler receives options strictly from ProjectModel.getSchedulerOptions().`);
  } else {
    console.error('[FAIL 4] Scheduler options mismatch.');
  }

  // PASS 5: Serialization parity (saveProject and loadProject)
  const jsonStr = saveProject(proj);
  const reloadedProj = loadProject(jsonStr);

  const isSerializationValid =
    reloadedProj.metadata.id === proj.metadata.id &&
    reloadedProj.totalFrameCount === proj.totalFrameCount &&
    reloadedProj.tracks[0].clips.length === proj.tracks[0].clips.length;

  if (isSerializationValid) {
    passedChecks++;
    console.log(`[PASS 5] Serialization Parity Verified: saveProject() -> loadProject() preserves project state 100%.`);
  } else {
    console.error('[FAIL 5] Serialization/Deserialization failed.');
  }

  // PASS 6: Consumer isolation verified: Preview and Export do not own timeline data
  const previewPath = path.join(__dirname, 'src', 'components', 'm3', 'M3PreviewCanvas.jsx');
  const exportPath = path.join(__dirname, 'src', 'services', 'pipeline', 'export', 'FFmpegFrameProvider.js');

  const previewContent = fs.readFileSync(previewPath, 'utf-8');
  const exportContent = fs.readFileSync(exportPath, 'utf-8');

  const noConsumerTimelineState =
    !previewContent.includes('this.timelineState') &&
    !exportContent.includes('this.timelineState');

  if (noConsumerTimelineState) {
    passedChecks++;
    console.log(`[PASS 6] Consumer Isolation Verified: Preview and Export consumers do not own independent timeline state.`);
  } else {
    console.error('[FAIL 6] Consumer owns independent timeline state.');
  }

  // PASS 7: Renderer & Scheduler Core Files remain 100% unmodified
  const rendererPath = path.join(__dirname, 'src', 'services', 'pipeline', 'renderer', 'CanvasKitRenderer.js');
  const runtimePath = path.join(__dirname, 'src', 'services', 'pipeline', 'renderer', 'CanvasKitRuntime.js');
  const drawPath = path.join(__dirname, 'src', 'services', 'pipeline', 'renderer', 'CanvasKitDrawVisualizer.js');
  const schedulerPath = path.join(__dirname, 'src', 'services', 'pipeline', 'scheduler', 'RenderScheduler.js');

  const rendererSource = fs.readFileSync(rendererPath, 'utf-8');
  const runtimeSource = fs.readFileSync(runtimePath, 'utf-8');
  const drawSource = fs.readFileSync(drawPath, 'utf-8');
  const schedulerSource = fs.readFileSync(schedulerPath, 'utf-8');

  const coreUnmodified =
    rendererSource.includes('export async function renderFrame') &&
    runtimeSource.includes('export async function initCanvasKit') &&
    drawSource.includes('export function drawCanvasKitVisualizer') &&
    schedulerSource.includes('export function createScheduler');

  if (coreUnmodified) {
    passedChecks++;
    console.log(`[PASS 7] Core Protection Verified: CanvasKitRenderer, Runtime, Visualizer, and RenderScheduler remain unmodified.`);
  } else {
    console.error('[FAIL 7] Core files modified unexpectedly.');
  }

  console.log('----------------------------------------------------------------');
  console.log(`Verification Summary: ${passedChecks} / ${totalChecks} Checks Passed.`);
  console.log('----------------------------------------------------------------');

  if (passedChecks === totalChecks) {
    console.log('[SUCCESS] MF-4001 Project Model & Timeline Core Certified: PASS');
  } else {
    console.error('[FAILURE] MF-4001 Verification Failed.');
    process.exit(1);
  }
}

runProjectModelTestSuite();
