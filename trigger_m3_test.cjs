const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Create dummy background image
try {
  execSync('ffmpeg -y -f lavfi -i color=c=black:s=1920x1080 -frames:v 1 D:\\MediaFactory\\dummy_bg.jpg');
} catch (e) {
  console.log("Failed to create dummy bg:", e.message);
}

// 2. Prepare Payload
const payload = {
  queueId: 'test_m3_' + Date.now(),
  background: {
    folder: 'D:\\MediaFactory',
    filename: 'dummy_bg.jpg',
    type: 'image'
  },
  playlist: [
    { uri: 'D:\\MediaFactory\\public\\acoustic_guitar_chords.mp3', durationSec: 180 },
    { uri: 'D:\\MediaFactory\\public\\drum_loop_80bpm.mp3', durationSec: 180 },
    { uri: 'D:\\MediaFactory\\public\\lofi_ambience_crackle.mp3', durationSec: 180 },
    { uri: 'D:\\MediaFactory\\public\\synth_pad_c_minor.mp3', durationSec: 180 }
  ],
  metadata: {
    outputName: 'Test_M3_Render_Perf_Audit',
    profileId: 'Youtube 1080p'
  },
  thumbnail: {
    saved: true,
    base64Data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//Z'
  }
};

// 3. Send request
const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 5177,
  path: '/api/m3/render',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Started:", data);
    poll(payload.queueId);
  });
});

req.on('error', e => console.error(e));
req.write(JSON.stringify(payload));
req.end();

function poll(id) {
  const intv = setInterval(() => {
    http.get(`http://localhost:5177/api/m3/render/${id}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        console.log(`Polling... Status: ${json.status} | Stage: ${json.stage} | Prog: ${json.progress}`);
        if (json.status === 'COMPLETED' || json.status === 'FAILED') {
          clearInterval(intv);
          fs.writeFileSync('D:\\MediaFactory\\diagnostic_result.txt', json.diagnosticReport || 'No report');
          console.log("Done. Saved to D:\\MediaFactory\\diagnostic_result.txt");
        }
      });
    });
  }, 3000);
}
