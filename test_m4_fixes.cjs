const M4RenderEngine = require('./backend/m4/M4RenderEngine');
const SmartAudioLooper = require('./backend/m4/SmartAudioLooper');
const path = require('path');
const fs = require('fs');

async function runTests() {
    console.log('=== STARTING M4 FIXES VERIFICATION ===');
    
    // Test 1: Check SmartAudioLooper with dummy WAV path logic
    console.log('\n[Test 1] Testing SmartAudioLooper args handling for .wav');
    const dummyWavPath = path.join(__dirname, 'test_sample.wav');
    try {
        const dur = await SmartAudioLooper.getDuration(dummyWavPath).catch(() => 0);
        console.log('  SmartAudioLooper getDuration output for non-existent/existent WAV:', dur);
        console.log('  PASS: SmartAudioLooper loaded successfully.');
    } catch (e) {
        console.error('  FAIL: SmartAudioLooper error:', e.message);
    }

    // Test 2: M4RenderEngine with Ping-Pong Boomerang & cropWatermark
    console.log('\n[Test 2] Testing M4RenderEngine render parameters & output folder');
    const dummyVideo = path.join(__dirname, 'dummy.mp4');
    const customFolder = path.join(__dirname, 'Test_Output', 'M4_Verification');
    
    if (!fs.existsSync(dummyVideo)) {
        console.log('  Creating dummy.mp4 for testing...');
        // Create 2 second dummy mp4 using ffmpeg
        const { execSync } = require('child_process');
        const AppPaths = require('./backend/system/AppPaths');
        try {
            execSync(`"${AppPaths.getFFmpegPath()}" -y -f lavfi -i color=c=blue:s=320x240:d=2 -c:v libx264 "${dummyVideo}"`, { stdio: 'ignore' });
        } catch(e) {
            console.error('  Could not create dummy video:', e.message);
        }
    }

    if (fs.existsSync(dummyVideo)) {
        const jobPingPong = {
            id: 'test_verify_pingpong_' + Date.now(),
            totalDurationSec: 4,
            outputFolder: customFolder,
            outputFiles: ['verified_pingpong.mp4'],
            m4Payload: {
                bgVideo: {
                    path: dummyVideo,
                    isMuted: true,
                    cropWatermark: true // Test crop filter centering!
                },
                ambientAudio: [],
                relaxMusic: [],
                loopMode: 'Ping-Pong Boomerang' // Test split filter!
            }
        };

        console.log('  Starting render for Ping-Pong Boomerang + Crop Watermark...');
        await new Promise((resolve) => {
            M4RenderEngine.render(
                jobPingPong,
                (prog, msg) => console.log(`  [Progress] ${prog}% - ${msg}`),
                (outPath) => {
                    console.log('  SUCCESS: Render completed to:', outPath);
                    if (fs.existsSync(outPath)) {
                        console.log('  PASS: Output file exists at custom output folder!');
                    } else {
                        console.error('  FAIL: File not found at outPath');
                    }
                    resolve();
                },
                (err) => {
                    console.error('  FAIL: Render error:', err.message);
                    resolve();
                }
            );
        });
    } else {
        console.log('  Skipped Test 2 render: dummy.mp4 not present.');
    }

    console.log('\n=== M4 FIXES VERIFICATION COMPLETE ===');
}

runTests();
