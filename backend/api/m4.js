const express = require('express');
const router = express.Router();
const path = require('path');
const fsSync = require('fs');
const { exec } = require('child_process');
const M4RenderEngine = require('../m4/M4RenderEngine');
const AppPaths = require('../system/AppPaths');

router.get('/api/m4/stream', (req, res) => {
    let filePath = req.query.path;
    if (filePath && fsSync.existsSync(filePath)) {
        if (fsSync.statSync(filePath).isDirectory()) {
            const files = fsSync.readdirSync(filePath).filter(f => f.match(/\.(mp3|wav|flac|m4a)$/i));
            if (files.length > 0) filePath = path.join(filePath, files[0]);
            else return res.status(404).end();
        }
        res.sendFile(path.resolve(filePath));
    } else {
        res.status(404).end();
    }
});

router.post('/api/m4/generate-preview', async (req, res) => {
    try {
        const { videoPath, loopMode } = req.body;
        if (!videoPath || !fsSync.existsSync(videoPath)) return res.status(400).json({ error: 'Video not found' });
        if (loopMode === 'Seamless Stream Loop') return res.json({ path: videoPath });

        const durStr = await new Promise((resolve, reject) => {
            const ffprobeExe = AppPaths.getFFprobePath();
            exec(`"${ffprobeExe}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`, (err, stdout) => {
                if (err) resolve("0"); else resolve(stdout);
            });
        });
        const dur = parseFloat(durStr);
        if (dur <= 0) return res.status(400).json({ error: 'Invalid duration' });

        const outDir = path.join(AppPaths.getAmbientOutputDir(), 'Previews');
        if (!fsSync.existsSync(outDir)) fsSync.mkdirSync(outDir, { recursive: true });
        
        const tempPath = path.join(outDir, `preview_${Date.now()}.mp4`);
        let filter = '';
        if (loopMode === 'Crossfade Blend') {
            const x = Math.min(2, dur / 3);
            const offset = dur - 2 * x;
            filter = `[0:v]trim=start=0:end=${x},setpts=PTS-STARTPTS[v1];[0:v]trim=start=${x}:end=${dur},setpts=PTS-STARTPTS[v2];[v2][v1]xfade=transition=fade:duration=${x}:offset=${offset}[vout]`;
        } else if (loopMode === 'Ping-Pong Boomerang') {
            filter = `[0:v]reverse[r];[0:v][r]concat=n=2:v=1[vout]`;
        }

        const pArgs = [
            '-y', '-i', videoPath,
            '-filter_complex', filter,
            '-map', '[vout]',
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-an',
            tempPath
        ];

        const { spawn } = require('child_process');
        const ffmpegExe = AppPaths.getFFmpegPath();
        const p = spawn(ffmpegExe, pArgs);
        p.on('close', (code) => {
            if (code === 0) res.json({ path: tempPath });
            else res.status(500).json({ error: 'FFmpeg failed' });
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const m4Jobs = new Map();

function getDuration(filePath) {
    return new Promise((resolve, reject) => {
        exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, (error, stdout) => {
            if (error) return reject(error);
            const dur = parseFloat(stdout);
            resolve(isNaN(dur) ? 0 : dur);
        });
    });
}

function formatDuration(sec) {
    const d = new Date(sec * 1000);
    return d.toISOString().substr(11, 8);
}

router.post('/api/m4/metadata', async (req, res) => {
    try {
        const filePath = req.body.path;
        if (!fsSync.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        const stat = fsSync.statSync(filePath);
        if (stat.isDirectory()) {
            const files = fsSync.readdirSync(filePath).filter(f => f.match(/\.(mp3|wav|flac|m4a)$/i));
            let folderDuration = 0;
            if (files.length > 0) {
                const firstFileDur = Math.round(await getDuration(path.join(filePath, files[0])));
                folderDuration = firstFileDur * files.length;
            }
            return res.json({
                path: filePath,
                name: path.basename(filePath) + " (Folder)",
                isFolder: true,
                fileCount: files.length,
                durationSec: folderDuration,
                durationDisplay: formatDuration(folderDuration) + ` (${files.length} Files)`
            });
        }
        
        const durationSec = Math.round(await getDuration(filePath));
        const durationDisplay = formatDuration(durationSec);
        
        res.json({
            path: filePath,
            name: path.basename(filePath),
            isFolder: false,
            durationSec,
            durationDisplay
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/api/m4/dialog/video', (req, res) => {
    const pyScript = `import tkinter as tk\nfrom tkinter import filedialog\nroot = tk.Tk()\nroot.attributes('-topmost', True)\nroot.withdraw()\nfile_path = filedialog.askopenfilename(parent=root, title='Select Background Video', filetypes=[('Video Files', '*.mp4;*.mov;*.mkv;*.webm'), ('All Files', '*.*')])\nif file_path:\n    print(file_path)`;
    const encoded = Buffer.from(pyScript).toString('base64');
    exec(`python -c "import base64; exec(base64.b64decode('${encoded}').decode('utf-8'))"`, (err, stdout) => {
        let pathStr = stdout ? stdout.replace(/^\uFEFF/, '').trim() : null;
        if (!pathStr || err) {
            const psCommand = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = "Video Files|*.mp4;*.mov;*.mkv;*.webm|All Files|*.*"; $form = New-Object System.Windows.Forms.Form; $form.TopMost = $true; $form.Add_Shown({$form.Hide()}); if ($f.ShowDialog($form) -eq 'OK') { $f.FileName }`;
            exec(`powershell -sta -command "${psCommand}"`, (err2, stdout2) => {
                pathStr = stdout2 ? stdout2.replace(/^\uFEFF/, '').trim() : null;
                res.json({ path: pathStr || null });
            });
        } else {
            res.json({ path: pathStr });
        }
    });
});

router.get('/api/m4/ambients', (req, res) => {
    const ambientsDir = path.join(process.cwd(), 'public', 'ambients');
    if (!fsSync.existsSync(ambientsDir)) return res.json({ ambients: [] });
    const files = fsSync.readdirSync(ambientsDir).filter(f => f.endsWith('.mp3'));
    const presets = files.map(f => {
        let label = f.replace('ambient_', '').replace('.mp3', '').replace(/_/g, ' ');
        label = label.charAt(0).toUpperCase() + label.slice(1);
        return {
            name: label,
            path: path.join(ambientsDir, f)
        };
    });
    res.json({ ambients: presets });
});

router.post('/api/m4/dialog/audio', (req, res) => {
    const pyScript = `import tkinter as tk\nfrom tkinter import filedialog\nroot = tk.Tk()\nroot.attributes('-topmost', True)\nroot.withdraw()\nfile_path = filedialog.askopenfilename(parent=root, title='Select Audio File', filetypes=[('Audio Files', '*.mp3;*.wav;*.flac;*.m4a'), ('All Files', '*.*')])\nif file_path:\n    print(file_path)`;
    const encoded = Buffer.from(pyScript).toString('base64');
    exec(`python -c "import base64; exec(base64.b64decode('${encoded}').decode('utf-8'))"`, (err, stdout) => {
        let pathStr = stdout ? stdout.replace(/^\uFEFF/, '').trim() : null;
        if (!pathStr || err) {
            const psCommand = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = "Audio Files|*.mp3;*.wav;*.flac;*.m4a|All Files|*.*"; $form = New-Object System.Windows.Forms.Form; $form.TopMost = $true; $form.Add_Shown({$form.Hide()}); if ($f.ShowDialog($form) -eq 'OK') { $f.FileName }`;
            exec(`powershell -sta -command "${psCommand}"`, (err2, stdout2) => {
                pathStr = stdout2 ? stdout2.replace(/^\uFEFF/, '').trim() : null;
                res.json({ path: pathStr || null });
            });
        } else {
            res.json({ path: pathStr });
        }
    });
});

router.post('/api/m4/dialog/folder', (req, res) => {
    const pyScript = `import tkinter as tk\nfrom tkinter import filedialog\nroot = tk.Tk()\nroot.attributes('-topmost', True)\nroot.withdraw()\nfolder_path = filedialog.askdirectory(parent=root, title='Select Audio Folder')\nif folder_path:\n    print(folder_path)`;
    const encoded = Buffer.from(pyScript).toString('base64');
    exec(`python -c "import base64; exec(base64.b64decode('${encoded}').decode('utf-8'))"`, (err, stdout) => {
        let pathStr = stdout ? stdout.replace(/^\uFEFF/, '').trim() : null;
        if (!pathStr || err) {
            const psCommand = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = "Select Audio Folder"; $form = New-Object System.Windows.Forms.Form; $form.TopMost = $true; $form.Add_Shown({$form.Hide()}); if ($f.ShowDialog($form) -eq 'OK') { $f.SelectedPath }`;
            exec(`powershell -sta -command "${psCommand}"`, (err2, stdout2) => {
                pathStr = stdout2 ? stdout2.replace(/^\uFEFF/, '').trim() : null;
                res.json({ path: pathStr || null });
            });
        } else {
            res.json({ path: pathStr });
        }
    });
});

router.post('/api/m4/render', (req, res) => {
    const job = req.body;
    
    if (!job || !job.m4Payload) {
        return res.status(400).json({ error: 'Invalid Job Payload' });
    }
    
    const startTime = Date.now();
    
    m4Jobs.set(job.id, {
        status: 'RENDERING',
        progress: 0,
        stage: 'Looping Video & Audio',
        currentFFmpegTime: '00:00:00',
        OUTPUT_PATH: null,
        FFMPEG_COMMAND: '',
        FILE_SIZE: 0,
        RENDER_DURATION: 0,
        failureReason: null
    });
    
    M4RenderEngine.render(
        job, 
        (progress, timeString) => {
            const j = m4Jobs.get(job.id);
            if (j) {
                j.progress = progress;
                j.currentFFmpegTime = timeString;
            }
        },
        (outPath) => {
            const j = m4Jobs.get(job.id);
            if (j) {
                j.status = 'COMPLETED';
                j.progress = 100;
                j.OUTPUT_PATH = outPath;
                j.RENDER_DURATION = (Date.now() - startTime) / 1000;
                try {
                    const stats = fsSync.statSync(outPath);
                    j.FILE_SIZE = stats.size;
                } catch(e) {}
            }
        },
        (err) => {
            const j = m4Jobs.get(job.id);
            if (j) {
                j.status = 'FAILED';
                j.failureReason = err.message;
            }
        }
    );
    
    res.json({ success: true, jobId: job.id });
});

router.get('/api/m4/render/:id', (req, res) => {
    const job = m4Jobs.get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not found' });
    res.json(job);
});

module.exports = { router };
