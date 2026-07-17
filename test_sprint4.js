import { processM1Job } from './src/services/m1/M1RenderEngine.js';

function updateProgress(percent, status) {
  console.log(`[Progress ${percent}%]: ${status}`);
}

async function runTests() {
  const baseJob = {
    segmentIndex: 0,
    segmentStartSec: 0,
    segmentEndSec: 5, // 5s segment
    playbackSpeed: 0.5, // becomes 10s video loop base
    bufferSec: 2,
    outputFolder: '.',
    metadataPayload: {}
  };

  const tests = [
    {
      name: 'CASE 1: Audio Longer Than Video, No Overlays, 240p',
      job: {
        ...baseJob,
        audioDurationSec: 15, // Target: 15 + 2 = 17s
        quality: '240p',
        watermarkEnabled: false,
        subscribeEnabled: false,
        outputName: 'test_sprint4_case1.mp4',
        outputFiles: ['test_sprint4_case1.mp4'],
        inputVideo: 'test_bg.mp4', // 10s total
        audioPath: 'test_audio.mp3', // 20s total
      }
    },
    {
      name: 'CASE 2: Audio Shorter Than Video, Overlays ON, 480p',
      job: {
        ...baseJob,
        audioDurationSec: 3, // Target: 3 + 2 = 5s
        quality: '480p',
        watermarkEnabled: true,
        subscribeEnabled: true,
        outputName: 'test_sprint4_case2.mp4',
        outputFiles: ['test_sprint4_case2.mp4'],
        inputVideo: 'test_bg.mp4', // 10s total
        audioPath: 'test_audio_short.mp3', // 3s total
      }
    }
  ];

  for (const t of tests) {
    console.log(`\n\n=== RUNNING ${t.name} ===`);
    try {
      await new Promise((resolve, reject) => {
        processM1Job(
          t.job,
          updateProgress,
          (result) => {
            console.log('SUCCESS:', result);
            resolve();
          },
          reject
        );
      });
    } catch (e) {
      console.error('ERROR:', e.message);
    }
  }
}

runTests();
