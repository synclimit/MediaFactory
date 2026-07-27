const M4RenderEngine = require('./backend/m4/M4RenderEngine');
const path = require('path');

const job = {
    id: 'test_job_123',
    totalDurationSec: 10,
    outputFiles: ['test_m4_output.mp4'],
    m4Payload: {
        bgVideo: {
            path: 'C:/Users/Server Abal/Desktop/Infinity_pool_overlooking_ocean_202606030020.mp4',
            isMuted: false,
            cropWatermark: false
        },
        ambientAudio: [
            {
                path: 'D:/MediaFactory/test_audio.mp3', // Wait, does this exist? Let's use a dummy or just empty array
                volume: 80
            }
        ],
        relaxMusic: [],
        loopMode: 'Crossfade Blend'
    }
};

M4RenderEngine.render(
    job,
    (progress, timeStr) => console.log(`Progress: ${progress}% - ${timeStr}`),
    (outPath) => console.log(`Complete: ${outPath}`),
    (err) => console.error(`Error:`, err)
);
