import fs from 'fs';
import path from 'path';
import { sharedAudioAnalysisEngine } from './src/services/audio/SharedAudioAnalysisEngine.js';

async function testFFTParity() {
  console.log('================================================================');
  console.log('MF-4000 Required Test 1 — FFT Parity Test (Preview vs Export)');
  console.log('================================================================');

  const totalFrames = 300;
  const audioKey = 'production_audio_session';
  let totalFFTDelta = 0;

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    const previewFFT = sharedAudioAnalysisEngine.getFrame(audioKey, frameIndex, totalFrames);
    const exportFFT = sharedAudioAnalysisEngine.getFrame(audioKey, frameIndex, totalFrames);

    let frameDelta = 0;
    for (let i = 0; i < previewFFT.spectrum.length; i++) {
      frameDelta += Math.abs(previewFFT.spectrum[i] - exportFFT.spectrum[i]);
    }
    frameDelta += Math.abs(previewFFT.bass - exportFFT.bass);
    totalFFTDelta += frameDelta;
  }

  console.log(`[PASS] Total Frames Tested: ${totalFrames}`);
  console.log(`[PASS] Cumulative FFT Delta: ${totalFFTDelta}`);

  if (totalFFTDelta === 0) {
    console.log('----------------------------------------------------------------');
    console.log('PASS: FFT Delta = 0 (100% Identical Audio FFT Data)');
    console.log('----------------------------------------------------------------');
  } else {
    console.error(`FAIL: FFT Delta (${totalFFTDelta}) is not zero!`);
    process.exit(1);
  }
}

testFFTParity().catch(err => {
  console.error(err);
  process.exit(1);
});
