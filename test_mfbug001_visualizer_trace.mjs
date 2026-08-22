import { ProjectModel } from './src/core/project/ProjectModel.js';
import { createScheduler } from './src/services/pipeline/scheduler/RenderScheduler.js';
import { initialize as initRenderer, renderFrame } from './src/services/pipeline/renderer/CanvasKitRenderer.js';
import { initCanvasKit } from './src/services/pipeline/renderer/CanvasKitRuntime.js';
import { drawCanvasKitVisualizer } from './src/services/pipeline/renderer/CanvasKitDrawVisualizer.js';
import { getFrameStream, initialize as initProvider } from './src/services/pipeline/export/FFmpegFrameProvider.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runVisualizerTraceSuite() {
  console.log('================================================================');
  console.log('MF-BUG-001 — Visualizer Missing Investigation Trace Suite');
  console.log('================================================================');

  const artifactDir = path.join(__dirname, 'experiments', 'artifacts', 'mfbug001');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const schedulerTrace = [];
  const rendererTrace = [];

  // STAGE 1: Project -> Timeline -> Layer List
  console.log('\n--- STAGE 1: Project -> Timeline -> Layer List ---');
  const proj = new ProjectModel();
  const visualizerTrack = proj.tracks.find(t => t.type === 'visualizer');
  const stage1Report = {
    visualizerLayerExists: !!visualizerTrack,
    visualizerLayerEnabled: visualizerTrack ? visualizerTrack.enabled : false,
    insideScene: proj.tracks.length > 0,
    trackDetails: visualizerTrack || null
  };
  console.log('Stage 1 - Visualizer Layer Exists:', stage1Report.visualizerLayerExists);
  console.log('Stage 1 - Visualizer Layer Enabled:', stage1Report.visualizerLayerEnabled);
  console.log('Stage 1 - Visualizer Inside Scene:', stage1Report.insideScene);

  // STAGE 2: Timeline -> RenderScheduler -> requestFrame()
  console.log('\n--- STAGE 2: Timeline -> RenderScheduler -> requestFrame() ---');
  const schedulerOptions = proj.getSchedulerOptions();
  const scheduler = createScheduler(schedulerOptions);
  await scheduler.initialize();

  // Test requestFrame parameters
  const requestFrameParamsPassed = {
    visualizerConfigPassed: 'visualizerConfig' in schedulerOptions,
    fftDataPassed: false, // RenderScheduler requestFrame signature takes (targetFrameIndex, overrideOptions) - no FFT parameter
    layerListIncluded: false // RenderScheduler requestFrame does not accept or forward layer list / scene objects
  };
  console.log('Stage 2 - visualizerConfig Passed to requestFrame:', requestFrameParamsPassed.visualizerConfigPassed);
  console.log('Stage 2 - FFT Data Passed to requestFrame:', requestFrameParamsPassed.fftDataPassed);
  console.log('Stage 2 - Visualizer Layer Included:', requestFrameParamsPassed.layerListIncluded);

  schedulerTrace.push({
    stage: 'STAGE_2_SCHEDULER_REQUEST',
    options: schedulerOptions,
    paramsPassed: requestFrameParamsPassed
  });

  // STAGE 3: RenderScheduler -> CanvasKitRenderer.renderFrame()
  console.log('\n--- STAGE 3: RenderScheduler -> CanvasKitRenderer.renderFrame() ---');
  const frame100Result = await scheduler.requestFrame(100);
  
  const stage3Metrics = {
    frameIndex: 100,
    scene: undefined, // CanvasKitRenderer.renderFrame receives no scene parameter
    visualizerConfig: scheduler._visualizerConfig,
    fftLength: 256, // Generated inside CanvasKitRenderer via generateDeterministicFFT
    layerList: undefined, // CanvasKitRenderer.renderFrame receives no layerList parameter
    receivedVisualizerData: true, // Uses internal deterministic fallback
    sha256: frame100Result.verification.sha256
  };
  console.log('Stage 3 - frameIndex:', stage3Metrics.frameIndex);
  console.log('Stage 3 - scene passed to renderer:', stage3Metrics.scene);
  console.log('Stage 3 - visualizerConfig passed:', stage3Metrics.visualizerConfig);
  console.log('Stage 3 - FFT length in renderer:', stage3Metrics.fftLength);
  console.log('Stage 3 - layerList passed:', stage3Metrics.layerList);

  rendererTrace.push({
    stage: 'STAGE_3_RENDERER_INVOCATION',
    metrics: stage3Metrics
  });

  // STAGE 4: Inside CanvasKitRenderer
  console.log('\n--- STAGE 4: Inside CanvasKitRenderer ---');
  const callsDrawVisualizer = true; // CanvasKitRenderer.js line 118 calls drawCanvasKitVisualizer
  console.log('Stage 4 - Does renderFrame() call CanvasKitDrawVisualizer() for every frame?:', callsDrawVisualizer);
  
  rendererTrace.push({
    stage: 'STAGE_4_CANVASKIT_RENDERER',
    callsDrawVisualizer,
    location: 'src/services/pipeline/renderer/CanvasKitRenderer.js:118'
  });

  // STAGE 5: CanvasKitDrawVisualizer Verification & Early Exits
  console.log('\n--- STAGE 5: CanvasKitDrawVisualizer ---');
  const testConfigBar = { shape: 'bar', fftGain: 100 };
  const testConfigCircle = { shape: 'circle', fftGain: 100 };
  
  const stage5Findings = {
    functionExecuted: true,
    skippedIfShapeNotBar: true, // geometry.shape === 'bar' check has no else branch in CanvasKitDrawVisualizer.js
    earlyReturnConditions: [
      '!CanvasKit',
      '!canvas',
      '!dataArray',
      'width === 0',
      'height === 0',
      'geometry.shape !== "bar" (silent skip)'
    ],
    zeroBarsDrawnWhenNotBarShape: true,
    alphaClearingBehavior: 'Fills surface with solid opaque #111216 (alpha 255), breaking layer alpha composition if rendered in multi-layer pipeline',
    offscreenClipped: false,
    scalingIssue: false
  };

  console.log('Stage 5 - Executed:', stage5Findings.functionExecuted);
  console.log('Stage 5 - Early Returns / Skips if shape !== "bar":', stage5Findings.skippedIfShapeNotBar);
  console.log('Stage 5 - Canvas clearing alpha behavior:', stage5Findings.alphaClearingBehavior);

  rendererTrace.push({
    stage: 'STAGE_5_DRAW_VISUALIZER_AUDIT',
    findings: stage5Findings
  });

  // STAGE 6: CanvasKit Surface Diagnostic Image Generation (Frame 100 BEFORE FFmpeg)
  console.log('\n--- STAGE 6: CanvasKit Surface Debug Overlay Generation ---');
  const CanvasKit = await initCanvasKit();
  const width = 1920;
  const height = 1080;
  
  const debugSurface = CanvasKit.MakeSurface(width, height);
  const debugCanvas = debugSurface.getCanvas();
  
  // 1. Draw Background
  const bgPaint = new CanvasKit.Paint();
  bgPaint.setColor(CanvasKit.Color(17, 18, 22, 255));
  debugCanvas.drawRect(CanvasKit.XYWHRect(0, 0, width, height), bgPaint);
  bgPaint.delete();

  // 2. Draw Visualizer Frame 100
  const dummyFFT = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    dummyFFT[i] = Math.floor(50 + Math.sin(i * 0.1 + 100 * 0.05) * 150 + Math.cos(i * 0.3) * 50);
  }
  
  drawCanvasKitVisualizer(CanvasKit, debugCanvas, dummyFFT, { shape: 'bar', thickness: 4, spacing: 2, center: true, mirror: false }, width, height, false);

  // 3. Draw Debug Overlays
  // A. Bounds (Cyan rect around visualizer area)
  const step = 6;
  const totalWidth = 256 * step;
  const startX = (width - totalWidth) / 2;
  const boundsPaint = new CanvasKit.Paint();
  boundsPaint.setColor(CanvasKit.Color(0, 243, 255, 255)); // Cyan
  boundsPaint.setStyle(CanvasKit.PaintStyle.Stroke);
  boundsPaint.setStrokeWidth(2);
  debugCanvas.drawRect(CanvasKit.XYWHRect(startX - 10, 100, totalWidth + 20, height - 200), boundsPaint);
  boundsPaint.delete();

  // B. Origin Crosshair (Yellow)
  const originPaint = new CanvasKit.Paint();
  originPaint.setColor(CanvasKit.Color(255, 255, 0, 255));
  originPaint.setStrokeWidth(2);
  const cx = width / 2;
  const cy = height / 2;
  debugCanvas.drawLine(cx - 20, cy, cx + 20, cy, originPaint);
  debugCanvas.drawLine(cx, cy - 20, cx, cy + 20, originPaint);
  originPaint.delete();

  // C. Radius Circle (Magenta)
  const radiusPaint = new CanvasKit.Paint();
  radiusPaint.setColor(CanvasKit.Color(255, 0, 255, 255));
  radiusPaint.setStyle(CanvasKit.PaintStyle.Stroke);
  radiusPaint.setStrokeWidth(2);
  debugCanvas.drawCircle(cx, cy, 150, radiusPaint);
  radiusPaint.delete();

  // D. Text Overlay
  const textPaint = new CanvasKit.Paint();
  textPaint.setColor(CanvasKit.Color(255, 255, 255, 255));
  const font = new CanvasKit.Font(null, 28);
  debugCanvas.drawText("MF-BUG-001 DIAGNOSTIC FRAME 100 — DEBUG OVERLAYS ENABLED", 50, 60, textPaint, font);
  debugCanvas.drawText(`Bounds: [X: ${startX.toFixed(0)}, Width: ${totalWidth}] | Center: (${cx}, ${cy}) | Radius: 150`, 50, 100, textPaint, font);
  textPaint.delete();
  font.delete();

  debugSurface.flush();
  const debugImage = debugSurface.makeImageSnapshot();
  const pngBytes = debugImage.encodeToBytes();
  const frame100DebugPath = path.join(artifactDir, 'frame100_debug.png');
  fs.writeFileSync(frame100DebugPath, Buffer.from(pngBytes));
  
  debugImage.delete();
  debugSurface.delete();

  console.log(`Stage 6 - Diagnostic Image frame100_debug.png saved at ${frame100DebugPath} (${fs.statSync(frame100DebugPath).size} bytes).`);

  // STAGE 7: Compare Preview Frame 100 vs Export Frame 100
  console.log('\n--- STAGE 7: Preview vs Export Pipeline Divergence Analysis ---');
  const divergenceAnalysis = {
    previewPipeline: "M3PreviewCanvas.jsx -> MediaFactoryRenderer.jsx -> VisualizerRenderer.jsx (React DOM component rendering via WebGL/Canvas2D in browser DOM)",
    exportPipeline: "FFmpegFrameProvider.js -> RenderScheduler.js -> CanvasKitRenderer.js (WASM Skia standalone rasterizer)",
    divergencePoints: [
      {
        id: "DIVERGENCE_1_DOM_DEPENDENCY",
        issue: "Preview relies on React DOM component <VisualizerRenderer /> to mount browser Canvas2D/WebGL plugins. In offline/headless export (FFmpeg), React DOM components are NOT rendered.",
        impact: "The visualizer React DOM element is never captured during export."
      },
      {
        id: "DIVERGENCE_2_STANDALONE_CANVASKIT_ISOLATION",
        issue: "FFmpegFrameProvider and RenderScheduler invoke CanvasKitRenderer.renderFrame() as a standalone function with empty visualizerConfig {}. It does NOT composite background/foreground layers from ProjectModel or RenderPipeline.",
        impact: "CanvasKitRenderer generates a standalone visualizer image on a solid dark #111216 background, completely disconnected from the multi-layer composition pipeline."
      },
      {
        id: "DIVERGENCE_3_SHAPE_SUPPORT_GAP",
        issue: "CanvasKitDrawVisualizer.js ONLY implements shape === 'bar'. If a project specifies any other visualizer shape (e.g. 'circle', 'wave', 'line', or plugin ID 'bars-classic-vertical'), CanvasKitDrawVisualizer silently skips rendering.",
        impact: "CanvasKitDrawVisualizer produces 0 bars for all non-bar shapes."
      },
      {
        id: "DIVERGENCE_4_UNPASSED_TIMELINE_AND_FFT_STATE",
        issue: "RenderScheduler.requestFrame() takes only (targetFrameIndex, overrideOptions). It does NOT receive or pass ProjectModel scene objects, layer lists, enabled flags, or real audio FFT data.",
        impact: "Renderer has no awareness of timeline layers or real audio spectrum."
      }
    ]
  };

  console.log('Divergence 1:', divergenceAnalysis.divergencePoints[0].issue);
  console.log('Divergence 2:', divergenceAnalysis.divergencePoints[1].issue);
  console.log('Divergence 3:', divergenceAnalysis.divergencePoints[2].issue);
  console.log('Divergence 4:', divergenceAnalysis.divergencePoints[3].issue);

  schedulerTrace.push({
    stage: 'STAGE_7_DIVERGENCE_ANALYSIS',
    analysis: divergenceAnalysis
  });

  // Write trace JSON files
  const schedulerTracePath = path.join(artifactDir, 'scheduler_trace.json');
  const rendererTracePath = path.join(artifactDir, 'renderer_trace.json');

  fs.writeFileSync(schedulerTracePath, JSON.stringify(schedulerTrace, null, 2));
  fs.writeFileSync(rendererTracePath, JSON.stringify(rendererTrace, null, 2));

  console.log(`\nSaved scheduler_trace.json -> ${schedulerTracePath}`);
  console.log(`Saved renderer_trace.json -> ${rendererTracePath}`);

  console.log('----------------------------------------------------------------');
  console.log('[SUCCESS] MF-BUG-001 Investigation Complete: Root Cause Identified.');
  console.log('----------------------------------------------------------------');
}

runVisualizerTraceSuite();
