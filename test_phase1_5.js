import { processM1Job } from './src/services/m1/M1RenderEngine.js';

async function runTests() {
  const updateProgress = (p, m) => {};
  const onComplete = () => {};
  const onError = (e) => console.error(e.message);

  const baseJob = {
    segmentIndex: 0,
    segmentStartSec: 0,
    segmentEndSec: 600,
    quality: '480p',
    bufferSec: 300,
    outputName: 'Test_Valid.mp4',
    watermarkEnabled: true,
    subscribeEnabled: false,
    thumbnail: null,
    inputVideo: 'fake_bg.mp4',
    audioPath: 'fake_audio.mp3',
    outputFolder: 'Test_Output'
  };

  console.log('--- CASE 1: Valid Job ---');
  try {
    // Note: this will fail after validation at fs.mkdir because it's a test script and paths may not exist, 
    // but we only care about seeing the VALIDATION SUCCESS log. We'll catch it.
    await processM1Job(baseJob, updateProgress, onComplete, onError);
  } catch (e) {}

  console.log('\n--- CASE 2: Missing Output Name ---');
  try {
    const job2 = { ...baseJob, outputName: '' };
    await processM1Job(job2, updateProgress, onComplete, onError);
  } catch (e) {}

  console.log('\n--- CASE 3: Invalid Segment ---');
  try {
    const job3 = { ...baseJob, segmentStartSec: 500, segmentEndSec: 300 };
    await processM1Job(job3, updateProgress, onComplete, onError);
  } catch (e) {}
}

runTests();
