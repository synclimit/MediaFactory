const path = require('path');
const os = require('os');
const fs = require('fs');

class AppPaths {
    constructor() {
        // Deteksi apakah sedang berjalan di Electron
        this.isElectron = !!(process.versions && process.versions.electron);
        
        const installDir = this.getAppInstallDir();
        const appDataRoot = path.join(installDir, '.mediafactory_data');

        this.workspaceDir = path.join(installDir, 'Workspaces');
        this.diagnosticsDir = path.join(appDataRoot, 'Diagnostics');
        this.cacheDir = path.join(appDataRoot, 'Cache');
        this.cacheCleanupMode = 'never'; // Default
        this.outputDir = path.join(installDir, 'Output');
        this.settingsFile = path.join(appDataRoot, 'system_settings.json');

        if (fs.existsSync(this.settingsFile)) {
            try {
                const settings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf8'));
                if (settings.workspaceDir) {
                    this.workspaceDir = settings.workspaceDir;
                }
                if (settings.outputDir) {
                    this.outputDir = settings.outputDir;
                }
                if (settings.cacheDir) {
                    this.cacheDir = settings.cacheDir;
                }
                if (settings.cacheCleanupMode) {
                    this.cacheCleanupMode = settings.cacheCleanupMode;
                }
            } catch (e) { console.error('Failed to load system settings:', e); }
        }

        this._ensureDirs();
    }

    _ensureDirs() {
        [this.workspaceDir, this.diagnosticsDir, this.cacheDir, this.outputDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
            }
        });
    }

    getAppInstallDir() {
        if (process.resourcesPath) {
            return path.resolve(process.resourcesPath, '..');
        }
        return process.cwd();
    }

    getWorkspaceBase() { return this.workspaceDir; }
    getDiagnosticsBase() { return this.diagnosticsDir; }
    getCacheBase() { return this.cacheDir; }
    getCacheCleanupMode() { return this.cacheCleanupMode; }
    getOutputBase() { return this.outputDir; }
    getMediaFactoryDataDir() { return path.dirname(this.cacheDir); }

    setWorkspaceBase(newPath) {
        if (!newPath) return false;
        this.workspaceDir = newPath;
        if (!fs.existsSync(this.workspaceDir)) {
            try { fs.mkdirSync(this.workspaceDir, { recursive: true }); } catch (e) {}
        }
        try {
            let settings = {};
            if (fs.existsSync(this.settingsFile)) {
                settings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf8'));
            }
            settings.workspaceDir = newPath;
            fs.writeFileSync(this.settingsFile, JSON.stringify(settings, null, 2));
            return true;
        } catch (e) {
            console.error('Failed to save system settings:', e);
            return false;
        }
    }

    setCacheBase(newPath, cleanupMode = 'never') {
        if (!newPath) return false;
        this.cacheDir = newPath;
        this.cacheCleanupMode = cleanupMode;
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        try {
            let settings = {};
            if (fs.existsSync(this.settingsFile)) {
                settings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf8'));
            }
            settings.cacheDir = newPath;
            settings.cacheCleanupMode = cleanupMode;
            fs.writeFileSync(this.settingsFile, JSON.stringify(settings, null, 2));
            return true;
        } catch (e) {
            console.error('Failed to save system settings:', e);
            return false;
        }
    }
    
    // For specific modules
    getAmbientOutputDir() {
        const p = path.join(this.outputDir, 'Ambient');
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        return p;
    }

    getFFmpegPath() {
        const candidatePaths = [
            process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'bin', 'ffmpeg.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'app', 'backend', 'bin', 'ffmpeg.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'bin', 'ffmpeg.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'ffmpeg', 'ffmpeg.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'bin', 'ffmpeg.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'app', 'bin', 'ffmpeg.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe') : '',
            path.join(__dirname, '..', 'bin', 'ffmpeg.exe'),
            path.join(__dirname, '..', 'ffmpeg', 'ffmpeg.exe'),
            path.join(__dirname, '..', '..', 'backend', 'bin', 'ffmpeg.exe'),
            path.join(__dirname, '..', '..', 'backend', 'ffmpeg', 'ffmpeg.exe'),
            path.join(process.cwd(), 'backend', 'bin', 'ffmpeg.exe'),
            path.join(process.cwd(), 'backend', 'ffmpeg', 'ffmpeg.exe'),
            path.join(process.cwd(), 'bin', 'ffmpeg.exe')
        ];
        for (const p of candidatePaths) {
            if (p && fs.existsSync(p)) return p;
        }
        return 'ffmpeg';
    }

    getFFprobePath() {
        const candidatePaths = [
            process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'bin', 'ffprobe.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'app', 'backend', 'bin', 'ffprobe.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'bin', 'ffprobe.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'ffmpeg', 'ffprobe.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'bin', 'ffprobe.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'app', 'bin', 'ffprobe.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'ffmpeg', 'ffprobe.exe') : '',
            path.join(__dirname, '..', 'bin', 'ffprobe.exe'),
            path.join(__dirname, '..', 'ffmpeg', 'ffprobe.exe'),
            path.join(__dirname, '..', '..', 'backend', 'bin', 'ffprobe.exe'),
            path.join(__dirname, '..', '..', 'backend', 'ffmpeg', 'ffprobe.exe'),
            path.join(process.cwd(), 'backend', 'bin', 'ffprobe.exe'),
            path.join(process.cwd(), 'backend', 'ffmpeg', 'ffprobe.exe'),
            path.join(process.cwd(), 'bin', 'ffprobe.exe')
        ];
        for (const p of candidatePaths) {
            if (p && fs.existsSync(p)) return p;
        }
        return 'ffprobe';
    }

    getFFmpegDir() {
        const ffmpegPath = this.getFFmpegPath();
        if (ffmpegPath && ffmpegPath !== 'ffmpeg' && fs.existsSync(ffmpegPath)) {
            return path.dirname(ffmpegPath);
        }
        const candidateDirs = [
            process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'bin') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'app', 'backend', 'bin') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'bin') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'bin') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'app', 'bin') : '',
            path.join(process.cwd(), 'backend', 'bin'),
            path.join(process.cwd(), 'bin')
        ];
        for (const d of candidateDirs) {
            if (d && fs.existsSync(d)) return d;
        }
        return process.cwd();
    }

    getYtDlpPath() {
        const candidatePaths = [
            process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'bin', 'yt-dlp.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'app', 'backend', 'bin', 'yt-dlp.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'bin', 'yt-dlp.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'ffmpeg', 'yt-dlp.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'bin', 'yt-dlp.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'app', 'bin', 'yt-dlp.exe') : '',
            path.join(__dirname, '..', 'bin', 'yt-dlp.exe'),
            path.join(__dirname, '..', 'ffmpeg', 'yt-dlp.exe'),
            path.join(__dirname, '..', '..', 'backend', 'bin', 'yt-dlp.exe'),
            path.join(__dirname, '..', '..', 'backend', 'ffmpeg', 'yt-dlp.exe'),
            path.join(process.cwd(), 'backend', 'bin', 'yt-dlp.exe'),
            path.join(process.cwd(), 'backend', 'ffmpeg', 'yt-dlp.exe'),
            path.join(process.cwd(), 'bin', 'yt-dlp.exe')
        ];
        for (const p of candidatePaths) {
            if (p && fs.existsSync(p)) return p;
        }
        return 'yt-dlp';
    }
}

module.exports = new AppPaths();
