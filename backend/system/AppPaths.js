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
    
    // For specific modules
    getAmbientOutputDir() {
        const p = path.join(this.outputDir, 'Ambient');
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        return p;
    }

    getFFmpegPath() {
        if (this.isElectron) {
            // Dalam mode Electron, asumsi ffmpeg.exe ada di folder instalasi (resources/backend/ffmpeg)
            // Namun, untuk amannya, kita baca dari __dirname (yang akan berada di resources/app.asar/backend/system)
            return path.join(__dirname, '..', 'ffmpeg', 'ffmpeg.exe');
        }
        // Dalam mode dev, baca dari folder backend/ffmpeg
        return path.join(process.cwd(), 'backend', 'ffmpeg', 'ffmpeg.exe');
    }

    getFFprobePath() {
        if (this.isElectron) {
            return path.join(__dirname, '..', 'ffmpeg', 'ffprobe.exe');
        }
        return path.join(process.cwd(), 'backend', 'ffmpeg', 'ffprobe.exe');
    }
}

module.exports = new AppPaths();
