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
        this.outputDir = documentsPath;
        this.settingsFile = path.join(userDataPath, 'system_settings.json');

        if (fs.existsSync(this.settingsFile)) {
            try {
                const settings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf8'));
                if (settings.cacheDir) {
                    this.cacheDir = settings.cacheDir;
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
    getOutputBase() { return this.outputDir; }

    setCacheBase(newPath) {
        if (!newPath) return false;
        this.cacheDir = newPath;
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        try {
            let settings = {};
            if (fs.existsSync(this.settingsFile)) {
                settings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf8'));
            }
            settings.cacheDir = newPath;
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
        let p;
        if (this.isElectron) {
            p = path.join(__dirname, '..', 'ffmpeg', 'ffmpeg.exe');
        } else {
            p = path.join(process.cwd(), 'backend', 'ffmpeg', 'ffmpeg.exe');
        }
        return require('fs').existsSync(p) ? p : 'ffmpeg';
    }

    getFFprobePath() {
        let p;
        if (this.isElectron) {
            p = path.join(__dirname, '..', 'ffmpeg', 'ffprobe.exe');
        } else {
            p = path.join(process.cwd(), 'backend', 'ffmpeg', 'ffprobe.exe');
        }
        return require('fs').existsSync(p) ? p : 'ffprobe';
    }
}

module.exports = new AppPaths();
