const { processM3Job, jobs } = require('./backend/api/m3-render');
const path = require('path');

async function testVisualizerRender() {
  console.log('=== TESTING M3 AUDIO VISUALIZER RENDER ===');
  const queueId = 'test_viz_' + Date.now();
  
  const payload = {
    queueId,
    id: queueId,
    background: {
      folder: 'public',
      filename: 'dummy_bg.jpg',
      type: 'image'
    },
    playlist: [
      { uri: 'd:/MediaFactory/public/acoustic_guitar_chords.mp3', durationSec: 5 }
    ],
    objects: [
      {
        id: 'viz-1',
        type: 'visualizer',
        name: 'Spectrum',
        visualizerId: 'bars-classic-vertical',
        x: 0,
        y: 900,
        width: 1920,
        height: 180,
        colorLeft: '#AB55F7',
        colorRight: '#F59E0B',
        visible: true
      }
    ],
    metadata: {
      outputName: `Test_Viz_${Date.now()}.mp4`,
      profileId: 'Youtube 1080p',
      renderMode: 'FAST',
      resolution: '1080p',
      fps: '30'
    },
    thumbnail: { saved: false }
  };

  const jobObj = {
    queueId,
    id: queueId,
    status: 'WAITING',
    progress: 1,
    outputFolder: 'Output/M3',
    totalDurationSec: 5,
    m3Payload: payload
  };

  jobs[queueId] = jobObj;

  console.log('Dispatching processM3Job with visualizer...');
  await processM3Job(jobObj);
  
  console.log(`\nStatus: ${jobObj.status}`);
  console.log(`Diagnostic Report Excerpt:\n${jobObj.diagnosticReport}`);
  console.log(`FFmpeg Command Used:\n${jobObj.FFMPEG_COMMAND}`);
}

testVisualizerRender().catch(console.error);
