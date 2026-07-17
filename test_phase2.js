import { processM1Job } from './src/services/m1/M1RenderEngine.js';

async function runTests() {
  const updateProgress = (p, m) => {};
  const onComplete = () => {};
  const onError = (e) => { console.log('ERROR:', e.message); };

  const baseJob = {
    segmentIndex: 0,
    segmentStartSec: 0,
    segmentEndSec: 10, // 10 seconds segment of the 10s video
    playbackSpeed: 0.5,
    quality: '480p',
    bufferSec: 0,
    outputName: 'real_render.mp4',
    watermarkEnabled: false,
    subscribeEnabled: false,
    thumbnail: null,
    inputVideo: 'test_bg.mp4',
    audioPath: 'test_audio.mp3',
    tracks: ['test_audio.mp3'],
    outputFiles: ['real_render.mp4'],
    outputFolder: '.',
    metadataPayload: {} // Fix the crash
  };

  console.log('\n--- RUNTIME RENDER TEST (0.5x) ---');
  try {
    await new Promise((resolve, reject) => {
      processM1Job(baseJob, updateProgress, resolve, reject);
    });
    console.log('Render script completed execution block.');
  } catch (e) { console.error('ERROR:', e.message); }
}

runTests();
