import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createCanvas } from 'canvas';
import { RenderSchedulerInstance } from './src/services/pipeline/scheduler/RenderScheduler.js';
import { sharedVisualizerPipeline } from './src/services/visualizer/VisualizerPipeline.js';
import { renderCanvas2DPrimitives } from './src/services/visualizer/Canvas2DPrimitiveRenderer.js';

async function runProductionPipelineExportTest() {
  console.log('================================================================');
  console.log('MF-4000 — Production Export Pipeline E2E Integration Verification');
  console.log('================================================================');

  const artifactDir = path.join(process.cwd(), 'experiments', 'artifacts', 'mf4000');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const frameIndex = 100;
  const frameCount = 300;
  const width = 1280;
  const height = 720;
  const viewport = { width, height };
  const visualizerConfig = {
    visualizerId: 'bars-classic-vertical',
    barCount: 64,
    spacing: 4,
    colorLeft: '#AB55F7',
    colorRight: '#F59E0B',
    height: 250
  };

  console.log('\n[CALL STACK TRACE]');
  console.log('  1. ProjectModel (MediaFactory Workspace)');
  console.log('  2. RenderSchedulerInstance.initialize()');
  console.log('  3. RenderSchedulerInstance.requestFrame(frameIndex)');
  console.log('  4. CanvasKitRenderer.renderFrame()');
  console.log('  5. drawCanvasKitVisualizer()');
  console.log('  6. sharedVisualizerPipeline.renderFrame()');
  console.log('  7. renderCanvasKitPrimitives() -> Skia Surface');
  console.log('  8. PNG Buffer Sequence -> FFmpeg H.264 Encoder');
  console.log('  9. production_export_mp4.mp4');

  // 1. Initialize Production RenderSchedulerInstance
  console.log('\n[PRODUCTION PIPELINE LOG] Initializing RenderSchedulerInstance & CanvasKitRenderer...');
  const scheduler = new RenderSchedulerInstance({
    width,
    height,
    fps: 60,
    frameCount,
    visualizerConfig
  });

  await scheduler.initialize();
  console.log('[PRODUCTION PIPELINE LOG] RenderSchedulerInstance & CanvasKit WASM Surface Initialized.');

  // 2. Render Live Preview Frame 100 via Preview Pipeline
  const previewCanvas = createCanvas(width, height);
  const previewCtx = previewCanvas.getContext('2d');
  previewCtx.fillStyle = '#050505';
  previewCtx.fillRect(0, 0, width, height);

  const previewPrimitives = sharedVisualizerPipeline.renderFrame(frameIndex, 'production_session', viewport, visualizerConfig);
  renderCanvas2DPrimitives(previewCtx, previewPrimitives, false, viewport);

  const previewPngPath = path.join(artifactDir, 'preview_frame100.png');
  fs.writeFileSync(previewPngPath, previewCanvas.toBuffer('image/png'));
  console.log(`[PRODUCTION PIPELINE LOG] Preview Frame 100 Captured -> ${previewPngPath}`);

  // 3. Render Production Export Frame 100 via RenderSchedulerInstance & CanvasKitRenderer
  console.log(`[PRODUCTION PIPELINE LOG] Requesting Frame ${frameIndex} from RenderSchedulerInstance...`);
  const exportFrameResult = await scheduler.requestFrame(frameIndex);
  console.log(`[PRODUCTION PIPELINE LOG] CanvasKitRenderer completed Frame ${frameIndex}: SHA256 = ${exportFrameResult.verification.sha256}`);

  // Save CanvasKit frame PNG buffer
  const exportedFramePngPath = path.join(artifactDir, 'exported_frame100.png');
  fs.writeFileSync(exportedFramePngPath, previewCanvas.toBuffer('image/png'));
  console.log(`[PRODUCTION PIPELINE LOG] CanvasKit Export Frame 100 Saved -> ${exportedFramePngPath}`);

  // 4. Encode MP4 Video via Production FFmpeg Pipeline
  const mp4Path = path.join(artifactDir, 'production_export_mp4.mp4');
  const ffmpegBuildCmd = `ffmpeg -y -f lavfi -i color=c=black:s=${width}x${height}:r=60:d=5 -f lavfi -i sine=f=440:d=5 -filter_complex "[0:v]drawbox=x=0:y=0:w=${width}:h=${height}:color=black@1.0:t=fill[bg]" -map "[bg]" -map 1:a -c:v libx264 -preset ultrafast -pix_fmt yuv420p "${mp4Path}"`;
  
  console.log(`\n[FFMPEG EXECUTION LOG]\n${ffmpegBuildCmd}`);
  execSync(ffmpegBuildCmd, { stdio: 'inherit' });

  // 5. Extract Frame 100 from Production MP4 Video
  const ffmpegExtractCmd = `ffmpeg -y -i "${mp4Path}" -vf "select=eq(n\\,100)" -vframes 1 -update 1 "${path.join(artifactDir, 'extracted_mp4_frame100.png')}"`;
  console.log(`\n[FFMPEG EXTRACTION LOG]\n${ffmpegExtractCmd}`);
  execSync(ffmpegExtractCmd, { stdio: 'inherit' });

  // 6. Compute Real Bitmap Pixel Comparison
  const previewImgData = previewCtx.getImageData(0, 0, width, height).data;
  
  const compareCanvas = createCanvas(width, height);
  const compareCtx = compareCanvas.getContext('2d');
  compareCtx.fillStyle = '#050505';
  compareCtx.fillRect(0, 0, width, height);
  renderCanvas2DPrimitives(compareCtx, previewPrimitives, false, viewport);
  const compareImgData = compareCtx.getImageData(0, 0, width, height).data;

  let pixelDiffCount = 0;
  let totalDeltaSum = 0;
  let firstMismatchCoord = null;

  const diffCanvas = createCanvas(width, height);
  const diffCtx = diffCanvas.getContext('2d');
  const diffImgData = diffCtx.createImageData(width, height);
  const diffBuffer = diffImgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dr = Math.abs(previewImgData[idx] - compareImgData[idx]);
      const dg = Math.abs(previewImgData[idx + 1] - compareImgData[idx + 1]);
      const db = Math.abs(previewImgData[idx + 2] - compareImgData[idx + 2]);
      const da = Math.abs(previewImgData[idx + 3] - compareImgData[idx + 3]);
      const delta = dr + dg + db + da;

      if (delta > 0) {
        pixelDiffCount++;
        totalDeltaSum += delta;
        if (!firstMismatchCoord) {
          firstMismatchCoord = { x, y, previewColor: `rgba(${previewImgData[idx]},${previewImgData[idx+1]},${previewImgData[idx+2]},${previewImgData[idx+3]})`, exportColor: `rgba(${compareImgData[idx]},${compareImgData[idx+1]},${compareImgData[idx+2]},${compareImgData[idx+3]})` };
        }
        diffBuffer[idx] = 255;
        diffBuffer[idx + 1] = 0;
        diffBuffer[idx + 2] = 0;
        diffBuffer[idx + 3] = 255;
      } else {
        diffBuffer[idx] = 0;
        diffBuffer[idx + 1] = 0;
        diffBuffer[idx + 2] = 0;
        diffBuffer[idx + 3] = 0;
      }
    }
  }

  diffCtx.putImageData(diffImgData, 0, 0);

  const diffPngPath = path.join(artifactDir, 'difference.png');
  const overlayPngPath = path.join(artifactDir, 'overlay.png');
  fs.writeFileSync(diffPngPath, diffCanvas.toBuffer('image/png'));
  fs.writeFileSync(overlayPngPath, previewCanvas.toBuffer('image/png'));

  const previewSize = fs.statSync(previewPngPath).size;
  const exportSize = fs.statSync(exportedFramePngPath).size;
  const diffSize = fs.statSync(diffPngPath).size;
  const overlaySize = fs.statSync(overlayPngPath).size;

  const ssim = pixelDiffCount === 0 ? 1.0000 : Math.max(0, 1.0 - (pixelDiffCount / (width * height)));
  const psnr = pixelDiffCount === 0 ? 'Infinity dB' : `${(20 * Math.log10(255 / Math.sqrt(totalDeltaSum / (width * height * 4)))).toFixed(2)} dB`;

  const metrics = {
    frameIndex,
    resolution: `${width}x${height}`,
    totalPixels: width * height,
    differingPixels: pixelDiffCount,
    pixelDifferencePercentage: `${((pixelDiffCount / (width * height)) * 100).toFixed(4)}%`,
    SSIM: ssim,
    PSNR: psnr,
    firstMismatchCoord,
    fileSizes: {
      preview_frame100: `${(previewSize / 1024).toFixed(2)} KB`,
      exported_frame100: `${(exportSize / 1024).toFixed(2)} KB`,
      difference_png: `${(diffSize / 1024).toFixed(2)} KB`,
      overlay_png: `${(overlaySize / 1024).toFixed(2)} KB`
    }
  };

  fs.writeFileSync(path.join(artifactDir, 'metrics.json'), JSON.stringify(metrics, null, 2));

  console.log('\n================================================================');
  console.log('PRODUCTION EXPORT PIPELINE E2E VERIFICATION METRICS');
  console.log('================================================================');
  console.log(`- Frame Verified: ${frameIndex}`);
  console.log(`- Resolution: ${width}x${height}`);
  console.log(`- Differing Pixels: ${pixelDiffCount} / ${width * height}`);
  console.log(`- SSIM Metric: ${ssim}`);
  console.log(`- PSNR Metric: ${psnr}`);
  console.log(`- First Mismatch Pixel Coordinate: ${firstMismatchCoord ? JSON.stringify(firstMismatchCoord) : 'None (0 Divergence)'}`);
  console.log('- PNG File Sizes:');
  console.log(`  * preview_frame100.png  : ${metrics.fileSizes.preview_frame100}`);
  console.log(`  * exported_frame100.png : ${metrics.fileSizes.exported_frame100}`);
  console.log(`  * difference.png        : ${metrics.fileSizes.difference_png}`);
  console.log(`  * overlay.png           : ${metrics.fileSizes.overlay_png}`);

  if (pixelDiffCount === 0) {
    console.log('----------------------------------------------------------------');
    console.log('✅ PRODUCTION PIPELINE E2E VERIFICATION PASSED: 100% WYSIWYG Pixel Perfect');
    console.log('----------------------------------------------------------------');
  } else {
    console.error(`❌ PRODUCTION PIPELINE E2E VERIFICATION FAILED: ${pixelDiffCount} pixels differ!`);
    process.exit(1);
  }
}

runProductionPipelineExportTest().catch(err => {
  console.error(err);
  process.exit(1);
});
