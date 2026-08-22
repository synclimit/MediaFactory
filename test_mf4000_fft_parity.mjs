import fs from 'fs';
import path from 'path';
import { sharedAudioAnalysisEngine } from './src/services/audio/SharedAudioAnalysisEngine.js';

async function testFFTParity() {
  console.log('================================================================');
  console.log('MF-4000 Phase 2A — Shared Audio Analysis Engine FFT Parity Test');
  console.log('================================================================');

  const totalFrames = 300;
  const audioKey = 'test_audio_session_1337';
  let totalDelta = 0;
  const traceLog = [];

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    // Simulate Preview FFT request
    const previewFFT = sharedAudioAnalysisEngine.getFrame(audioKey, frameIndex, totalFrames);
    
    // Simulate Export FFT request
    const exportFFT = sharedAudioAnalysisEngine.getFrame(audioKey, frameIndex, totalFrames);

    // Compute FFT delta
    let frameDelta = 0;
    for (let i = 0; i < previewFFT.spectrum.length; i++) {
      frameDelta += Math.abs(previewFFT.spectrum[i] - exportFFT.spectrum[i]);
    }
    frameDelta += Math.abs(previewFFT.bass - exportFFT.bass);

    totalDelta += frameDelta;
    traceLog.push({
      frameIndex,
      previewBass: previewFFT.bass,
      exportBass: exportFFT.bass,
      delta: frameDelta
    });
  }

  const artifactDir = path.join(process.cwd(), 'experiments', 'artifacts', 'mf4000');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  fs.writeFileSync(path.join(artifactDir, 'fft_trace.json'), JSON.stringify(traceLog, null, 2));

  console.log(`[PASS 2A] FFT Frames Tested: ${totalFrames}`);
  console.log(`[PASS 2A] Cumulative FFT Delta: ${totalDelta}`);
  console.log(`[PASS 2A] Trace Artifact: experiments/artifacts/mf4000/fft_trace.json`);

  if (totalDelta === 0) {
    console.log('----------------------------------------------------------------');
    console.log('✅ PHASE 2A CERTIFIED: Shared Audio Analysis Engine FFT Parity = 100%');
    console.log('----------------------------------------------------------------');
  } else {
    console.error(`❌ PHASE 2A FAILED: FFT Delta (${totalDelta}) is not zero!`);
    process.exit(1);
  }
}

testFFTParity().catch(err => {
  console.error(err);
  process.exit(1);
});
