const path = require('path');
const { processJob, jobs } = require('./backend/api/m2-render.js');

const job = {
    queueId: 'TEST_123',
    status: 'WAITING',
    progress: 0,
    renderName: 'Test Compilation',
    totalDurationSec: 300,
    tracks: [
        'C:\\Users\\Server Abal\\Downloads\\maman fvndy\\DJ CALON MANTU I DAMAN SLOW VIRAL TIKTOK FULL SONG MAMAN FVNDY 2025.mp3'
    ],
    masteringSettings: {
        targetLufs: -9,
        outputGain: '1.5',
        compressor: true,
        limiter: true
    }
};
jobs['TEST_123'] = job;

(async () => {
    console.log('Starting job...');
    
    // Check progress every 500ms
    const interval = setInterval(() => {
        console.log(`Progress: ${jobs['TEST_123'].progress}%, Status: ${jobs['TEST_123'].status}`);
    }, 500);

    try {
        await processJob(jobs['TEST_123']);
        console.log('Job finished successfully!');
    } catch (e) {
        console.error('Job failed:', e);
    } finally {
        clearInterval(interval);
        console.log('Final Status:', jobs['TEST_123']);
    }
})();
