const path = require('path');
const os = require('os');
const fs = require('fs');

function isDirWritable(dirPath) {
    if (!dirPath || typeof dirPath !== 'string') return false;
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        const testFile = path.join(dirPath, `.mf_write_test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
        fs.writeFileSync(testFile, 'ok');
        fs.unlinkSync(testFile);
        return true;
    } catch (e) {
        return false;
    }
}

class AppPaths {
    constructor() {
        // Deteksi apakah sedang berjalan di Electron
        this.isElectron = !!(process.versions && process.versions.electron);
        
        const installDir = this.getAppInstallDir();
        const isProgramFiles = installDir.toLowerCase().includes('program files');

        // Resolve writable AppData root
        let appDataRoot = null;
        if (!isProgramFiles) {
            const localRoot = path.join(installDir, '.mediafactory_data');
            if (isDirWritable(localRoot)) {
                appDataRoot = localRoot;
            }
        }
        if (!appDataRoot) {
            const roaming = process.env.APPDATA || (os.homedir() ? path.join(os.homedir(), 'AppData', 'Roaming') : null);
            if (roaming && isDirWritable(path.join(roaming, 'MediaFactory', 'MediaFactoryData'))) {
                appDataRoot = path.join(roaming, 'MediaFactory', 'MediaFactoryData');
            } else if (roaming && isDirWritable(path.join(roaming, 'MediaFactory'))) {
                appDataRoot = path.join(roaming, 'MediaFactory');
            } else {
                const localApp = process.env.LOCALAPPDATA || (os.homedir() ? path.join(os.homedir(), 'AppData', 'Local') : null);
                if (localApp && isDirWritable(path.join(localApp, 'MediaFactory'))) {
                    appDataRoot = path.join(localApp, 'MediaFactory');
                } else {
                    appDataRoot = path.join(os.homedir(), '.mediafactory_data');
                    isDirWritable(appDataRoot);
                }
            }
        }
        this.appDataRoot = appDataRoot;

        // Resolve writable Workspace directory
        let defaultWorkspace = path.join(installDir, 'Workspaces');
        if (isProgramFiles || !isDirWritable(defaultWorkspace)) {
            if (fs.existsSync('D:\\') && isDirWritable('D:\\MediaFactory\\Workspaces')) {
                defaultWorkspace = 'D:\\MediaFactory\\Workspaces';
            } else {
                const docDir = path.join(os.homedir(), 'Documents', 'MediaFactory', 'Workspaces');
                if (isDirWritable(docDir)) {
                    defaultWorkspace = docDir;
                } else {
                    defaultWorkspace = path.join(appDataRoot, 'Workspaces');
                    isDirWritable(defaultWorkspace);
                }
            }
        }
        this.workspaceDir = defaultWorkspace;

        // Resolve writable Output directory
        let defaultOutput = path.join(installDir, 'Output');
        if (isProgramFiles || !isDirWritable(defaultOutput)) {
            if (fs.existsSync('D:\\') && isDirWritable('D:\\MediaFactory\\Output')) {
                defaultOutput = 'D:\\MediaFactory\\Output';
            } else {
                const vidDir = path.join(os.homedir(), 'Videos', 'MediaFactory');
                if (isDirWritable(vidDir)) {
                    defaultOutput = vidDir;
                } else {
                    defaultOutput = path.join(appDataRoot, 'Output');
                    isDirWritable(defaultOutput);
                }
            }
        }
        this.outputDir = defaultOutput;

        this.diagnosticsDir = path.join(appDataRoot, 'Diagnostics');
        this.cacheDir = path.join(appDataRoot, 'Cache');
        this.cacheCleanupMode = 'never'; // Default
        this.settingsFile = path.join(appDataRoot, 'system_settings.json');
        this.knownWorkspaces = {}; // Map of { [name]: folderPath }
        this.activeWorkspace = null;

        const candidateSettingsFiles = [
            this.settingsFile,
            path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactory', 'system_settings.json'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactory', 'MediaFactoryData', 'system_settings.json'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'mediafactory', 'MediaFactoryData', 'system_settings.json'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactoryData', 'system_settings.json'),
            'd:/MediaFactory/.mediafactory_data/system_settings.json',
            'c:/.mediafactory_data/system_settings.json'
        ];

        for (const sf of candidateSettingsFiles) {
            if (fs.existsSync(sf)) {
                try {
                    const settings = JSON.parse(fs.readFileSync(sf, 'utf8'));
                    if (settings.workspaceDir && fs.existsSync(settings.workspaceDir)) {
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
                    if (settings.knownWorkspaces && typeof settings.knownWorkspaces === 'object') {
                        this.knownWorkspaces = { ...this.knownWorkspaces, ...settings.knownWorkspaces };
                    }
                    if (settings.activeWorkspace) {
                        this.activeWorkspace = settings.activeWorkspace;
                    }
                } catch (e) { console.error('Failed to load system settings:', e); }
            }
        }

        // Also load dedicated workspaces_registry.json
        for (const rf of this._getRegistryTargets()) {
            if (fs.existsSync(rf)) {
                try {
                    const reg = JSON.parse(fs.readFileSync(rf, 'utf8'));
                    if (reg && typeof reg === 'object') {
                        this.knownWorkspaces = { ...this.knownWorkspaces, ...reg };
                    }
                } catch(e) {}
            }
        }

        this._ensureDirs();
    }

    _getRegistryTargets() {
        const targets = [
            path.join(this.appDataRoot, 'workspaces_registry.json'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactory', 'workspaces_registry.json'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactory', 'MediaFactoryData', 'workspaces_registry.json'),
            path.join(os.homedir(), '.mediafactory', 'workspaces_registry.json')
        ];
        if (!this.getAppInstallDir().toLowerCase().includes('program files')) {
            targets.push('d:/MediaFactory/.mediafactory_data/workspaces_registry.json');
        }
        return targets;
    }

    _saveWorkspacesRegistry() {
        const targets = this._getRegistryTargets();
        for (const target of targets) {
            try {
                const targetDir = path.dirname(target);
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                fs.writeFileSync(target, JSON.stringify(this.knownWorkspaces, null, 2));
            } catch(e) {}
        }
    }

    _ensureDirs() {
        [this.workspaceDir, this.diagnosticsDir, this.cacheDir, this.outputDir, this.appDataRoot].forEach(dir => {
            if (dir && !fs.existsSync(dir)) {
                try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
            }
        });
    }

    _saveSettings(updater) {
        try {
            let settings = {};
            if (fs.existsSync(this.settingsFile)) {
                try { settings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf8')); } catch(e) {}
            }
            if (typeof updater === 'function') {
                updater(settings);
            }
            // Ensure values are always populated
            settings.workspaceDir = this.workspaceDir;
            settings.outputDir = this.outputDir;
            settings.cacheDir = this.cacheDir;
            settings.cacheCleanupMode = this.cacheCleanupMode;
            settings.knownWorkspaces = this.knownWorkspaces;
            if (this.activeWorkspace) settings.activeWorkspace = this.activeWorkspace;

            const targets = [
                this.settingsFile,
                path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactory', 'system_settings.json')
            ];
            if (!this.getAppInstallDir().toLowerCase().includes('program files')) {
                targets.push('d:/MediaFactory/.mediafactory_data/system_settings.json');
            }

            for (const target of targets) {
                try {
                    const targetDir = path.dirname(target);
                    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                    fs.writeFileSync(target, JSON.stringify(settings, null, 2));
                } catch(e) {}
            }
            this._saveWorkspacesRegistry();
            return true;
        } catch (e) {
            console.error('Failed to save system settings:', e);
            return false;
        }
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
    getMediaFactoryDataDir() { return this.appDataRoot || path.dirname(this.cacheDir); }

    getKnownWorkspaces() {
        const merged = { ...(this.knownWorkspaces || {}) };
        for (const rf of this._getRegistryTargets()) {
            if (fs.existsSync(rf)) {
                try {
                    const reg = JSON.parse(fs.readFileSync(rf, 'utf8'));
                    if (reg && typeof reg === 'object') {
                        for (const [k, v] of Object.entries(reg)) {
                            if (v && fs.existsSync(v)) {
                                merged[k] = v;
                                this.knownWorkspaces[k] = v;
                            }
                        }
                    }
                } catch(e) {}
            }
        }
        return merged;
    }

    registerWorkspacePath(name, folderPath) {
        if (!name || !folderPath) return false;
        const norm = path.normalize(folderPath).trim();
        if (!this.knownWorkspaces) this.knownWorkspaces = {};
        this.knownWorkspaces[name] = norm;
        this._saveWorkspacesRegistry();
        return this._saveSettings(s => {
            if (!s.knownWorkspaces) s.knownWorkspaces = {};
            s.knownWorkspaces[name] = norm;
        });
    }

    bulkRegisterWorkspaces(mapping) {
        if (!mapping || typeof mapping !== 'object') return false;
        if (!this.knownWorkspaces) this.knownWorkspaces = {};
        let changed = false;
        for (const [name, p] of Object.entries(mapping)) {
            if (name && p && typeof p === 'string') {
                const norm = path.normalize(p).trim();
                if (fs.existsSync(norm) && this.knownWorkspaces[name] !== norm) {
                    this.knownWorkspaces[name] = norm;
                    changed = true;
                }
            }
        }
        if (changed) {
            this._saveWorkspacesRegistry();
            this._saveSettings(s => {
                if (!s.knownWorkspaces) s.knownWorkspaces = {};
                s.knownWorkspaces = { ...s.knownWorkspaces, ...this.knownWorkspaces };
            });
        }
        return true;
    }

    unregisterWorkspacePath(name) {
        if (!name || !this.knownWorkspaces) return false;
        delete this.knownWorkspaces[name];
        return this._saveSettings(s => {
            if (s.knownWorkspaces) delete s.knownWorkspaces[name];
        });
    }

    setActiveWorkspace(name) {
        this.activeWorkspace = name;
        return this._saveSettings(s => {
            s.activeWorkspace = name;
        });
    }

    getActiveWorkspace() {
        return this.activeWorkspace;
    }

    setWorkspaceBase(newPath) {
        if (!newPath) return false;
        this.workspaceDir = newPath;
        if (!fs.existsSync(this.workspaceDir)) {
            try { fs.mkdirSync(this.workspaceDir, { recursive: true }); } catch (e) {}
        }
        return this._saveSettings(s => {
            s.workspaceDir = newPath;
        });
    }

    setCacheBase(newPath, cleanupMode = 'never') {
        if (!newPath) return false;
        this.cacheDir = newPath;
        this.cacheCleanupMode = cleanupMode;
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        return this._saveSettings(s => {
            s.cacheDir = newPath;
            s.cacheCleanupMode = cleanupMode;
        });
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
            process.resourcesPath ? path.resolve(process.resourcesPath, '..', 'bin', 'ffmpeg.exe') : '',
            process.resourcesPath ? path.resolve(process.resourcesPath, '..', 'backend', 'bin', 'ffmpeg.exe') : '',
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
            process.resourcesPath ? path.resolve(process.resourcesPath, '..', 'bin', 'ffprobe.exe') : '',
            process.resourcesPath ? path.resolve(process.resourcesPath, '..', 'backend', 'bin', 'ffprobe.exe') : '',
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
            process.resourcesPath ? path.resolve(process.resourcesPath, '..', 'bin') : '',
            process.resourcesPath ? path.resolve(process.resourcesPath, '..', 'backend', 'bin') : '',
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
            process.resourcesPath ? path.resolve(process.resourcesPath, '..', 'bin', 'yt-dlp.exe') : '',
            process.resourcesPath ? path.resolve(process.resourcesPath, '..', 'backend', 'bin', 'yt-dlp.exe') : '',
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

    getNodeJsPath() {
        const candidateNodes = [
            'C:\\Program Files\\nodejs\\node.exe',
            'C:\\Program Files (x86)\\nodejs\\node.exe',
            path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'node', 'node.exe')
        ];
        for (const n of candidateNodes) {
            if (fs.existsSync(n)) return n;
        }
        if (process.execPath && !process.execPath.toLowerCase().includes('electron') && fs.existsSync(process.execPath)) {
            return process.execPath;
        }
        return 'node';
    }

    getYtDlpStandardArgs(extra = []) {
        const nodePath = this.getNodeJsPath();
        const ffmpegDir = this.getFFmpegDir();
        return [
            '--no-check-certificates',
            '--force-ipv4',
            '--js-runtimes', 'node:' + nodePath,
            '--extractor-args', 'youtube:player_client=ios,mweb,web',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/144.0.0.0',
            '--ffmpeg-location', ffmpegDir,
            ...extra
        ];
    }
}

module.exports = new AppPaths();
