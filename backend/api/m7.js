const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const standaloneDir = path.resolve(__dirname, '../../astrofox-standalone');
const m7Dir = path.resolve(__dirname, '../../m7-astrofox');
const ffmpegBinary = path.resolve(m7Dir, 'bin', 'ffmpeg.exe');
const outputDir = path.resolve(__dirname, '../../Output');
const tempDir = path.resolve(outputDir, 'Temp');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

let activeProcesses = {
  standalone: null,
  m7: null,
};

const ffmpegSessions = new Map();

// Check Status of Astrofox Runtimes
router.get('/api/m7/status', (req, res) => {
  const standaloneReady = fs.existsSync(path.join(standaloneDir, 'app', 'index.html')) && fs.existsSync(path.join(standaloneDir, 'bin', 'ffmpeg.exe'));
  const m7Ready = fs.existsSync(path.join(m7Dir, 'app', 'index.html')) && fs.existsSync(ffmpegBinary);

  res.json({
    success: true,
    version: '1.4.0 (Baseline)',
    standalone: {
      ready: standaloneReady,
      running: activeProcesses.standalone !== null && !activeProcesses.standalone.killed,
      path: standaloneDir,
    },
    m7: {
      ready: m7Ready,
      running: activeProcesses.m7 !== null && !activeProcesses.m7.killed,
      path: m7Dir,
      ffmpeg: ffmpegBinary,
      outputDir: outputDir
    }
  });
});

// Save Temp Media File from Frontend
router.post('/api/m7/save-temp-file', (req, res) => {
  try {
    const { filename, base64Data } = req.body;
    if (!filename || !base64Data) {
      return res.status(400).json({ success: false, error: 'Missing filename or base64Data' });
    }

    const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const destPath = path.join(tempDir, `m7_${Date.now()}_${cleanName}`);
    const buf = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(destPath, buf);

    console.log('[M7 API] Saved temporary media file:', destPath, `(${buf.length} bytes)`);
    res.json({ success: true, filePath: destPath });
  } catch (err) {
    console.error('[M7 API] Save temp file error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Real-Time FFmpeg Process Session
router.post('/api/m7/spawn', (req, res) => {
  try {
    const { command, args = [] } = req.body;
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const targetBinary = (command === 'ffmpeg' || command === 'ffmpeg.exe' || !command) ? ffmpegBinary : command;

    console.log('[M7 API] Spawning FFmpeg Session:', sessionId, targetBinary, args.join(' '));

    const proc = spawn(targetBinary, args, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const session = {
      id: sessionId,
      proc,
      sseRes: null,
      eventQueue: []
    };

    proc.stdout.on('data', data => {
      const msg = { type: 'stdout', data: data.toString() };
      if (session.sseRes) {
        session.sseRes.write(`data: ${JSON.stringify(msg)}\n\n`);
      } else {
        session.eventQueue.push(msg);
      }
    });

    proc.stderr.on('data', data => {
      const msg = { type: 'stderr', data: data.toString() };
      if (session.sseRes) {
        session.sseRes.write(`data: ${JSON.stringify(msg)}\n\n`);
      } else {
        session.eventQueue.push(msg);
      }
    });

    proc.on('close', (code, signal) => {
      console.log('[M7 API] Session process closed:', sessionId, code, signal);
      const msg = { type: 'close', code, signal };
      if (session.sseRes) {
        session.sseRes.write(`data: ${JSON.stringify(msg)}\n\n`);
        try { session.sseRes.end(); } catch(e) {}
      } else {
        session.eventQueue.push(msg);
      }
      ffmpegSessions.delete(sessionId);
    });

    proc.on('error', err => {
      console.error('[M7 API] Session process error:', sessionId, err);
      const msg = { type: 'error', error: err.message };
      if (session.sseRes) {
        session.sseRes.write(`data: ${JSON.stringify(msg)}\n\n`);
      } else {
        session.eventQueue.push(msg);
      }
    });

    ffmpegSessions.set(sessionId, session);
    res.json({ success: true, sessionId });
  } catch (err) {
    console.error('[M7 API] Spawn error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// SSE Events Stream for FFmpeg Session
router.get('/api/m7/events/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = ffmpegSessions.get(sessionId);

  if (!session) {
    return res.status(404).send('Session not found');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  session.sseRes = res;

  // Flush queued events
  while (session.eventQueue.length > 0) {
    const msg = session.eventQueue.shift();
    res.write(`data: ${JSON.stringify(msg)}\n\n`);
  }

  req.on('close', () => {
    session.sseRes = null;
  });
});

// Push Raw Video Frame Chunk into FFmpeg Stdin
router.post('/api/m7/push/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = ffmpegSessions.get(sessionId);

    if (!session || !session.proc || !session.proc.stdin || !session.proc.stdin.writable) {
      return res.status(400).json({ success: false, error: 'Session not active or stdin closed' });
    }

    const { base64Chunk } = req.body;
    if (base64Chunk) {
      const buffer = Buffer.from(base64Chunk, 'base64');
      session.proc.stdin.write(buffer);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// End FFmpeg Stdin
router.post('/api/m7/end/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = ffmpegSessions.get(sessionId);

    if (session && session.proc && session.proc.stdin) {
      session.proc.stdin.end();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Kill FFmpeg Session
router.post('/api/m7/kill/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = ffmpegSessions.get(sessionId);

    if (session && session.proc) {
      try { session.proc.kill('SIGTERM'); } catch(e) {}
    }
    ffmpegSessions.delete(sessionId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Launch Astrofox Standalone Window
router.post('/api/m7/launch-standalone', (req, res) => {
  try {
    if (activeProcesses.standalone && !activeProcesses.standalone.killed) {
      return res.json({ success: true, message: 'Astrofox Standalone is already running.' });
    }

    const proc = spawn('npx', ['electron', './app'], {
      cwd: standaloneDir,
      shell: true,
      detached: true,
      stdio: 'ignore'
    });
    proc.unref();
    activeProcesses.standalone = proc;

    res.json({ success: true, message: 'Astrofox Standalone launched successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Launch Astrofox M7 Window
router.post('/api/m7/launch-m7', (req, res) => {
  try {
    if (activeProcesses.m7 && !activeProcesses.m7.killed) {
      return res.json({ success: true, message: 'Astrofox M7 is already running.' });
    }

    const proc = spawn('npx', ['electron', './app'], {
      cwd: m7Dir,
      shell: true,
      detached: true,
      stdio: 'ignore'
    });
    proc.unref();
    activeProcesses.m7 = proc;

    res.json({ success: true, message: 'Astrofox M7 launched successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
