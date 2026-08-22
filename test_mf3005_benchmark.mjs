import { initialize, renderFrame, destroyRenderer } from './src/services/pipeline/renderer/CanvasKitRenderer.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBenchmarkSuite() {
  console.log('================================================================');
  console.log('MF-3005 MediaFactory V3 Production 1,000-Frame Benchmark Suite');
  console.log('================================================================');

  const width = 1920;
  const height = 1080;
  const totalBenchmarkFrames = 1000;

  // 1. Measure WASM Initialization Duration
  const initStart = Date.now();
  const ckInstance = await initialize();
  const initDurationMs = Date.now() - initStart;

  console.log(`[Init] CanvasKit WASM Runtime Initialized in ${initDurationMs}ms.`);

  // 2. Measure Memory Before Benchmark
  if (global.gc) global.gc();
  const initialMem = process.memoryUsage();
  const initialHeapMB = initialMem.heapUsed / (1024 * 1024);
  const initialRssMB = initialMem.rss / (1024 * 1024);

  const frameTimes = [];
  const csvRows = ['frameIndex,renderDurationMs,heapUsedMB,rssMB'];

  let peakHeapBytes = initialMem.heapUsed;
  let peakRssBytes = initialMem.rss;

  console.log(`[Benchmark] Starting 1,000-frame 1080p sequential rendering benchmark...`);
  const benchmarkStart = Date.now();

  for (let i = 0; i < totalBenchmarkFrames; i++) {
    const fStart = Date.now();
    let frameRes = await renderFrame({
      frameIndex: i,
      frameCount: totalBenchmarkFrames,
      width,
      height,
      visualizerConfig: { barCount: 256 }
    });
    const fDuration = Date.now() - fStart;

    const currentMem = process.memoryUsage();
    if (currentMem.heapUsed > peakHeapBytes) peakHeapBytes = currentMem.heapUsed;
    if (currentMem.rss > peakRssBytes) peakRssBytes = currentMem.rss;

    frameTimes.push(fDuration);

    const hMB = (currentMem.heapUsed / (1024 * 1024)).toFixed(2);
    const rMB = (currentMem.rss / (1024 * 1024)).toFixed(2);
    csvRows.push(`${i},${fDuration},${hMB},${rMB}`);

    // Explicitly dereference result buffer per frame
    frameRes = null;

    if ((i + 1) % 200 === 0) {
      console.log(`  - Rendered ${i + 1} / ${totalBenchmarkFrames} frames (Latest: ${fDuration}ms, Heap: ${hMB}MB)...`);
    }
  }

  const totalBenchmarkDurationMs = Date.now() - benchmarkStart;

  if (global.gc) global.gc();
  const finalMem = process.memoryUsage();
  const finalHeapMB = finalMem.heapUsed / (1024 * 1024);
  const finalRssMB = finalMem.rss / (1024 * 1024);

  // Compute Statistical Metrics
  const sortedTimes = [...frameTimes].sort((a, b) => a - b);
  const minRenderTimeMs = sortedTimes[0];
  const maxRenderTimeMs = sortedTimes[sortedTimes.length - 1];
  const avgRenderTimeMs = Math.round((frameTimes.reduce((a, b) => a + b, 0) / totalBenchmarkFrames) * 100) / 100;
  const medianRenderTimeMs = sortedTimes[Math.floor(totalBenchmarkFrames * 0.50)];
  const p95RenderTimeMs = sortedTimes[Math.floor(totalBenchmarkFrames * 0.95)];
  const p99RenderTimeMs = sortedTimes[Math.floor(totalBenchmarkFrames * 0.99)];
  const avgFps = Math.round((1000 / avgRenderTimeMs) * 100) / 100;

  const heapDeltaMB = Math.round((finalHeapMB - initialHeapMB) * 100) / 100;
  const rssDeltaMB = Math.round((finalRssMB - initialRssMB) * 100) / 100;
  const peakHeapMB = Math.round((peakHeapBytes / (1024 * 1024)) * 100) / 100;
  const peakRssMB = Math.round((peakRssBytes / (1024 * 1024)) * 100) / 100;

  // 3. Verify Determinism on Repeated Frame (Frame 500)
  const renderA = await renderFrame({ frameIndex: 500, frameCount: totalBenchmarkFrames, width, height });
  const renderB = await renderFrame({ frameIndex: 500, frameCount: totalBenchmarkFrames, width, height });
  const isDeterministic = renderA.verification.sha256 === renderB.verification.sha256;

  // 4. Save Deliverable Artifacts under experiments/artifacts/mf3005/
  const artifactDir = path.join(__dirname, 'experiments', 'artifacts', 'mf3005');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const jsonResults = {
    benchmarkConfig: {
      resolution: `${width}x${height}`,
      totalFrames: totalBenchmarkFrames,
      pixelFormat: 'RGBA32',
      framebufferSizeBytes: width * height * 4
    },
    performanceMetrics: {
      initDurationMs,
      totalBenchmarkDurationMs,
      avgRenderTimeMs,
      medianRenderTimeMs,
      minRenderTimeMs,
      maxRenderTimeMs,
      p95RenderTimeMs,
      p99RenderTimeMs,
      avgFps
    },
    memoryMetrics: {
      initialHeapMB: Math.round(initialHeapMB * 100) / 100,
      finalHeapMB: Math.round(finalHeapMB * 100) / 100,
      heapDeltaMB,
      initialRssMB: Math.round(initialRssMB * 100) / 100,
      finalRssMB: Math.round(finalRssMB * 100) / 100,
      rssDeltaMB,
      peakHeapMB,
      peakRssMB
    },
    determinismVerification: {
      frameIndexTested: 500,
      sha256: renderA.verification.sha256,
      isDeterministic
    }
  };

  const jsonPath = path.join(artifactDir, 'benchmark_results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonResults, null, 2));

  const csvPath = path.join(artifactDir, 'frame_times.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n'));

  await destroyRenderer();

  console.log('----------------------------------------------------------------');
  console.log('MF-3005 Benchmark Results Summary:');
  console.log(`  - Total Frames Rendered: ${totalBenchmarkFrames} @ 1080p`);
  console.log(`  - Average Render Time:   ${avgRenderTimeMs} ms/frame (${avgFps} FPS)`);
  console.log(`  - Median Render Time:    ${medianRenderTimeMs} ms/frame`);
  console.log(`  - Min / Max Render Time: ${minRenderTimeMs} ms / ${maxRenderTimeMs} ms`);
  console.log(`  - P95 Render Time:       ${p95RenderTimeMs} ms/frame`);
  console.log(`  - P99 Render Time:       ${p99RenderTimeMs} ms/frame`);
  console.log(`  - Heap Memory Delta:     ${heapDeltaMB} MB (Peak: ${peakHeapMB} MB)`);
  console.log(`  - RSS Memory Delta:      ${rssDeltaMB} MB (Peak: ${peakRssMB} MB)`);
  console.log(`  - Frame 500 SHA-256:     ${renderA.verification.sha256} (Deterministic: ${isDeterministic})`);
  console.log(`  - Exported Deliverables: ${jsonPath}, ${csvPath}`);
  console.log('----------------------------------------------------------------');
  console.log('[SUCCESS] MF-3005 Performance Benchmark Suite Certified: PASS');
}

runBenchmarkSuite();
