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

// Save Output File (e.g., thumbnail.jpg, metadata.json, render.json) into Render Output Directory
router.post('/api/m7/save-output-file', (req, res) => {
  try {
    const { outputFolder, filename, base64Data, textContent } = req.body;
    if (!outputFolder || !filename) {
      return res.status(400).json({ success: false, error: 'Missing outputFolder or filename' });
    }

    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    const destPath = path.join(outputFolder, filename);

    if (base64Data) {
      const buf = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(destPath, buf);
      console.log('[M7 API] Saved output media file:', destPath, `(${buf.length} bytes)`);
    } else if (textContent !== undefined) {
      fs.writeFileSync(destPath, textContent, 'utf8');
      console.log('[M7 API] Saved output text file:', destPath);
    }

    res.json({ success: true, filePath: destPath });
  } catch (err) {
    console.error('[M7 API] Save output file error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Compile & Concatenate All Playlist Audio Tracks for Video Export
router.post('/api/m7/compile-playlist', async (req, res) => {
  try {
    const { tracks = [] } = req.body;
    if (!tracks || tracks.length === 0) {
      return res.status(400).json({ success: false, error: 'No tracks provided' });
    }

    if (tracks.length === 1 && fs.existsSync(tracks[0])) {
      return res.json({ success: true, compiledAudioPath: tracks[0] });
    }

    const validTracks = tracks.filter(t => t && fs.existsSync(t));
    if (validTracks.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid disk tracks found' });
    }

    const concatTxtPath = path.join(tempDir, `concat_${Date.now()}.txt`);
    const compiledAudioPath = path.join(tempDir, `m7_compiled_playlist_${Date.now()}.aac`);

    // Write concat file list
    const fileEntries = validTracks.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
    fs.writeFileSync(concatTxtPath, fileEntries, 'utf8');

    const concatArgs = [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatTxtPath,
      '-c:a', 'aac',
      '-b:a', '192k',
      compiledAudioPath
    ];

    console.log('[M7 API] Compiling playlist with FFmpeg:', validTracks.length, 'tracks');

    const proc = spawn(ffmpegBinary, concatArgs, { windowsHide: true });
    
    proc.on('close', (code) => {
      try { fs.unlinkSync(concatTxtPath); } catch(e) {}
      if (code === 0 && fs.existsSync(compiledAudioPath)) {
        console.log('[M7 API] Successfully compiled playlist audio:', compiledAudioPath);
        res.json({ success: true, compiledAudioPath });
      } else {
        console.error('[M7 API] Playlist compilation failed with code:', code);
        // Fallback to first track
        res.json({ success: true, compiledAudioPath: validTracks[0] });
      }
    });

    proc.on('error', (err) => {
      console.error('[M7 API] Playlist compile spawn error:', err);
      res.json({ success: true, compiledAudioPath: validTracks[0] });
    });
  } catch (err) {
    console.error('[M7 API] Compile playlist error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Real-Time FFmpeg Process Session
router.post('/api/m7/spawn', (req, res) => {
  try {
    const { command, args = [] } = req.body;
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const targetBinary = (command === 'ffmpeg' || command === 'ffmpeg.exe' || !command) ? ffmpegBinary : command;

    // Normalize paths and ensure output directory exists
    const normalizedArgs = args.map(arg => {
      if (typeof arg === 'string' && (arg.includes('\\') || arg.includes('/')) && !arg.startsWith('-')) {
        const norm = path.normalize(arg);
        if (arg.endsWith('.mp4') || arg.endsWith('.aac') || arg.endsWith('.webm') || arg.endsWith('.video') || arg.endsWith('.audio')) {
          const dir = path.dirname(norm);
          if (dir && !fs.existsSync(dir)) {
            try {
              fs.mkdirSync(dir, { recursive: true });
              console.log('[M7 API] Created output directory:', dir);
            } catch(e) {}
          }
        }
        return norm;
      }
      return arg;
    });

    console.log('[M7 API] Spawning FFmpeg Session:', sessionId, targetBinary, normalizedArgs.join(' '));

    const proc = spawn(targetBinary, normalizedArgs, {
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

// Scan Folder for Audio Files
router.post('/api/m7/scan-folder', (req, res) => {
  try {
    const { folderPath } = req.body;
    if (!folderPath || !fs.existsSync(folderPath)) {
      return res.status(400).json({ success: false, error: 'Folder path does not exist' });
    }

    const audioExts = new Set(['.mp3', '.wav', '.aac', '.flac', '.m4a', '.ogg', '.opus', '.webm']);
    const files = [];

    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          try { walk(fullPath); } catch(e) {}
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (audioExts.has(ext)) {
            try {
              const stat = fs.statSync(fullPath);
              files.push({
                name: entry.name,
                path: fullPath,
                size: stat.size
              });
            } catch(e) {}
          }
        }
      }
    };

    walk(folderPath);
    res.json({ success: true, files, count: files.length });
  } catch (err) {
    console.error('[M7 API] Scan folder error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Audio Streaming Endpoint for M7 Web Audio Engine
router.get('/api/m7/audio-stream', (req, res) => {
  try {
    const targetPath = req.query.path;
    if (!targetPath || !fs.existsSync(targetPath)) {
      return res.status(404).send('Audio file not found');
    }

    const stat = fs.statSync(targetPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(targetPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(targetPath).pipe(res);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Fetch YouTube Audio Tracks
router.post('/api/m7/youtube-fetch', async (req, res) => {
  try {
    const { url, limit = 15 } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, error: 'YouTube URL is required' });
    }

    const AppPaths = require('../system/AppPaths');
    const cleanUrl = url.trim();
    const ytBin = AppPaths.getYtDlpPath();
    const ffmpegDir = AppPaths.getFFmpegDir();
    const maxItems = Math.min(Math.max(1, parseInt(limit, 10) || 15), 50);

    const outTemplate = path.join(tempDir, 'yt_%(id)s_%(title).40s.%(ext)s').replace(/\\/g, '/');

    const ytArgs = [
      '--no-check-certificates',
      '--force-ipv4',
      '--extractor-args', 'youtube:player_client=android,web',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/144.0.0.0',
      '--no-warnings',
      '--max-downloads', String(maxItems),
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--ffmpeg-location', ffmpegDir,
      '--print-json',
      '-o', outTemplate,
      '--',
      cleanUrl
    ];

    console.log('[M7 API] Fetching YouTube audio:', cleanUrl, 'Max:', maxItems);

    const ytProc = spawn(ytBin, ytArgs);
    let stdoutData = '';
    let stderrData = '';

    ytProc.stdout.on('data', d => stdoutData += d.toString());
    ytProc.stderr.on('data', d => stderrData += d.toString());

    ytProc.on('close', code => {
      const tracks = [];
      const lines = stdoutData.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const info = JSON.parse(line.trim());
          const videoId = info.id;
          const title = info.title || info.fulltitle || 'YouTube Audio';
          const duration = info.duration || 0;
          const hrs = Math.floor(duration / 3600);
          const mins = Math.floor((duration % 3600) / 60);
          const secs = Math.floor(duration % 60);
          const durationStr = hrs > 0 
            ? `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

          let filePath = '';
          try {
            const files = fs.readdirSync(tempDir);
            const matchingFile = files.find(f => f.includes(videoId) && f.endsWith('.mp3'));
            if (matchingFile) {
              filePath = path.join(tempDir, matchingFile);
            }
          } catch(e) {}

          if (!filePath) {
            filePath = path.join(tempDir, `yt_${videoId}_${title.substring(0, 40).replace(/[^a-zA-Z0-9._-]/g, '_')}.mp3`);
          }

          tracks.push({
            id: 'yt_' + videoId + '_' + Date.now(),
            name: title,
            path: filePath,
            duration: duration,
            durationStr: durationStr,
            streamUrl: `/api/m7/audio-stream?path=${encodeURIComponent(filePath)}`
          });
        } catch (e) {
          // Non-JSON line from stdout, ignore
        }
      }

      if (tracks.length > 0) {
        return res.json({ success: true, tracks });
      }

      if (code !== 0) {
        return res.status(500).json({ 
          success: false, 
          error: `YouTube extraction failed (code ${code}): ${stderrData.substring(0, 300)}` 
        });
      }

      res.json({ success: true, tracks: [] });
    });

    ytProc.on('error', err => {
      console.error('[M7 API] yt-dlp spawn error:', err);
      res.status(500).json({ success: false, error: err.message });
    });
  } catch (err) {
    console.error('[M7 API] YouTube fetch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// M7 Full Workspace Autosave & Restore Endpoints
const m7SaveFilePath = path.join(__dirname, '..', 'data', 'm7_autosave_state.json');

router.get('/api/m7/autosave/state', (req, res) => {
  try {
    if (fs.existsSync(m7SaveFilePath)) {
      const content = fs.readFileSync(m7SaveFilePath, 'utf8');
      return res.json({ success: true, state: JSON.parse(content) });
    }
  } catch(e) {
    console.warn('[M7 API] Failed reading autosave state:', e.message);
  }
  res.json({ success: true, state: null });
});

router.post('/api/m7/autosave/state', (req, res) => {
  try {
    const state = req.body || {};
    const dir = path.dirname(m7SaveFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(m7SaveFilePath, JSON.stringify(state, null, 2), 'utf8');
    return res.json({ success: true });
  } catch(e) {
    console.error('[M7 API] Failed saving autosave state:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
