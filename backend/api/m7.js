const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const standaloneDir = path.resolve(__dirname, '../../astrofox-standalone');
const m7Dir = path.resolve(__dirname, '../../m7-astrofox');

let activeProcesses = {
  standalone: null,
  m7: null,
};

// Check Status of Astrofox Runtimes
router.get('/api/m7/status', (req, res) => {
  const standaloneReady = fs.existsSync(path.join(standaloneDir, 'app', 'index.html')) && fs.existsSync(path.join(standaloneDir, 'bin', 'ffmpeg.exe'));
  const m7Ready = fs.existsSync(path.join(m7Dir, 'app', 'index.html')) && fs.existsSync(path.join(m7Dir, 'bin', 'ffmpeg.exe'));

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
    }
  });
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
