const { processM3Job, jobs } = require('./backend/api/m3-render');
const fs = require('fs/promises');
const path = require('path');

async function runPerfTest() {
  console.log('=== STARTING M3 PERF & TELEMETRY VERIFICATION TEST ===');
  const queueId = 'test_perf_' + Date.now();
  
  const payload = {
    queueId,
    id: queueId,
    background: {
      folder: 'public',
      filename: 'cyberpunk_city.jpg',
      type: 'image'
    },
    playlist: [
      { uri: 'd:/MediaFactory/public/acoustic_guitar_chords.mp3', durationSec: 10 },
      { uri: 'd:/MediaFactory/public/drum_loop_80bpm.mp3', durationSec: 10 }
    ],
    metadata: {
      outputName: `Test_Perf_${Date.now()}.mp4`,
      profileId: 'Youtube 1080p',
      renderMode: 'FAST',
      resolution: '1080p',
      fps: '60'
    },
    thumbnail: { saved: false }
  };

  const jobObj = {
    queueId,
    id: queueId,
    status: 'WAITING',
    progress: 1,
    outputFolder: 'Output/M3',
    totalDurationSec: 20,
    m3Payload: payload
  };

  jobs[queueId] = jobObj;

  const startMs = Date.now();
  console.log('Dispatching processM3Job...');
  await processM3Job(jobObj);
  const durationSec = ((Date.now() - startMs) / 1000).toFixed(2);
  
  console.log(`\n=== TEST RESULT ===`);
  console.log(`Status: ${jobObj.status}`);
  console.log(`Progress: ${jobObj.progress}%`);
  console.log(`Total Wall Clock Time: ${durationSec}s`);
  console.log(`Diagnostic Report excerpt:\n${(jobObj.diagnosticReport || '').substring(0, 1000)}`);
  
  if (jobObj.status === 'COMPLETED') {
    console.log('\nSUCCESS: M3 Fast Render completed cleanly and fast!');
  } else {
    console.error('\nFAILED: Render error:', jobObj.error);
  }
}

runPerfTest().catch(console.error);
