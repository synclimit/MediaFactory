const path = require('path');
const os = require('os');
const fs = require('fs');

class AppPaths {
    constructor() {
        // Deteksi apakah sedang berjalan di Electron
        this.isElectron = !!(process.versions && process.versions.electron);
        
        let userDataPath;
        let documentsPath;

        if (this.isElectron) {
            const { app } = require('electron');
            // If called from main process, app is available
            if (app) {
                userDataPath = path.join(app.getPath('userData'), 'MediaFactoryData');
                documentsPath = path.join(app.getPath('documents'), 'MediaFactory');
            } else {
                // If somehow called from renderer or worker without app access
                userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactory', 'MediaFactoryData');
                documentsPath = path.join(os.homedir(), 'Documents', 'MediaFactory');
            }
        } else {
            // Jika dev mode Node.js biasa
            userDataPath = path.join(process.cwd(), '.mediafactory_data');
            documentsPath = path.join(process.cwd(), 'Output');
        }

        this.workspaceDir = path.join(userDataPath, 'Workspaces');
        this.diagnosticsDir = path.join(userDataPath, 'Diagnostics');
        this.cacheDir = path.join(userDataPath, 'Cache');
        this.cacheCleanupMode = 'never'; // Default
        this.outputDir = documentsPath;
        this.settingsFile = path.join(userDataPath, 'system_settings.json');

        if (fs.existsSync(this.settingsFile)) {
            try {
                const settings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf8'));
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
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    getWorkspaceBase() { return this.workspaceDir; }
    getDiagnosticsBase() { return this.diagnosticsDir; }
    getCacheBase() { return this.cacheDir; }
    getCacheCleanupMode() { return this.cacheCleanupMode; }
    getOutputBase() { return this.outputDir; }
    getMediaFactoryDataDir() { return path.dirname(this.cacheDir); }

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
            path.join(__dirname, '..', 'ffmpeg', 'ffmpeg.exe'),
            path.join(__dirname, '..', '..', 'backend', 'ffmpeg', 'ffmpeg.exe'),
            process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'ffmpeg', 'ffmpeg.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe') : '',
            path.join(process.cwd(), 'backend', 'ffmpeg', 'ffmpeg.exe')
        ];
        for (const p of candidatePaths) {
            if (p && fs.existsSync(p)) return p;
        }
        return 'ffmpeg';
    }

    getFFprobePath() {
        const candidatePaths = [
            path.join(__dirname, '..', 'ffmpeg', 'ffprobe.exe'),
            path.join(__dirname, '..', '..', 'backend', 'ffmpeg', 'ffprobe.exe'),
            process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'ffmpeg', 'ffprobe.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'ffmpeg', 'ffprobe.exe') : '',
            path.join(process.cwd(), 'backend', 'ffmpeg', 'ffprobe.exe')
        ];
        for (const p of candidatePaths) {
            if (p && fs.existsSync(p)) return p;
        }
        return 'ffprobe';
    }

    getYtDlpPath() {
        const candidatePaths = [
            path.join(__dirname, '..', 'bin', 'yt-dlp.exe'),
            path.join(__dirname, '..', 'ffmpeg', 'yt-dlp.exe'),
            path.join(__dirname, '..', '..', 'backend', 'bin', 'yt-dlp.exe'),
            path.join(__dirname, '..', '..', 'backend', 'ffmpeg', 'yt-dlp.exe'),
            process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'bin', 'yt-dlp.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'ffmpeg', 'yt-dlp.exe') : '',
            process.resourcesPath ? path.join(process.resourcesPath, 'bin', 'yt-dlp.exe') : '',
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
