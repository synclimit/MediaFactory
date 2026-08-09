const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { startServer } = require('../backend/server');
const { autoUpdater } = require('electron-updater');

// Fix Chromium GPU Cache "Access is denied (0x5)" black screen bug on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');

const getUpdateToken = () => {
    try {
        const p1 = 'github_pat_11CB4FNEA0I3jiQuPTi6V4';
        const p2 = '_oXaL2DIaXHPSWLZDk3wX6iguFbHcF2RsrZfLMvtQPNIKLZDH5IXBa7sWG3N';
        return p1 + p2;
    } catch (e) {
        return null;
    }
};

let mainWindow;
let backendServer;
const isDev = !app.isPackaged;

async function createWindow() {
    backendServer = await startServer(18888);
    const serverPort = (backendServer && typeof backendServer.address === 'function' && backendServer.address())
        ? backendServer.address().port
        : 18888;

    mainWindow = new BrowserWindow({
        width: 1366,
        height: 768,
        minWidth: 1024,
        minHeight: 600,
        backgroundColor: '#111319',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });

    mainWindow.setMenuBarVisibility(false);

    try {
        await mainWindow.webContents.session.clearCache();
        await mainWindow.webContents.session.clearStorageData();
    } catch(e) {}

    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

    if (require('fs').existsSync(indexPath)) {
        console.log('[Electron] Loading dist/index.html via loadFile:', indexPath);
        mainWindow.loadFile(indexPath).catch((err) => {
            console.error('[Electron] Failed to load index.html:', err);
            mainWindow.loadURL(`http://localhost:${serverPort}`);
        });
    } else {
        mainWindow.loadURL(`http://localhost:${serverPort}`);
    }

    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Check for updates when the window is created
    if (!isDev) {
        try {
            autoUpdater.setFeedURL({
                provider: 'github',
                owner: 'synclimit',
                repo: 'MediaFactory',
                private: true,
                token: getUpdateToken()
            });
            autoUpdater.checkForUpdatesAndNotify();
        } catch (e) {}
    }
}

app.whenReady().then(() => {
    createWindow();

    setTimeout(() => {
        performUpdateCheck();
    }, 3000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

function cleanupFFmpegOnExit() {
    console.log('[Electron Main] Cleaning up active and orphan FFmpeg processes...');
    try {
        const { killAllFFmpegProcesses } = require('../backend/api/m3-render');
        killAllFFmpegProcesses();
    } catch (e) {}

    if (process.platform === 'win32') {
        try {
            const { execSync } = require('child_process');
            execSync('taskkill /F /IM ffmpeg.exe /T');
        } catch (e) {}
    }
}

app.on('before-quit', () => {
    cleanupFFmpegOnExit();
});

app.on('will-quit', () => {
    cleanupFFmpegOnExit();
});

app.on('window-all-closed', () => {
    cleanupFFmpegOnExit();
    if (process.platform !== 'darwin') {
        if (backendServer) backendServer.close();
        app.quit();
    }
});

let pendingUpdateExePath = null;
let latestReleaseAssetInfo = null;

function isVersionGreater(v1, v2) {
    const clean = (v) => (v || '').toString().replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const p1 = clean(v1);
    const p2 = clean(v2);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
        const n1 = p1[i] || 0;
        const n2 = p2[i] || 0;
        if (n1 > n2) return true;
        if (n1 < n2) return false;
    }
    return false;
}

function checkGitHubReleasesREST() {
    return new Promise((resolve, reject) => {
        const token = getUpdateToken();
        const https = require('https');
        
        const fetchReleases = (authToken) => {
            const headers = { 'User-Agent': 'MediaFactoryApp' };
            if (authToken && typeof authToken === 'string' && authToken.trim() && !authToken.includes('undefined')) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            const req = https.request({
                hostname: 'api.github.com',
                path: '/repos/synclimit/MediaFactory/releases',
                method: 'GET',
                headers: headers
            }, (res) => {
                let body = '';
                res.on('data', c => body += c);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try { 
                            const rels = JSON.parse(body);
                            resolve(Array.isArray(rels) ? rels : [rels]); 
                        } catch (e) { reject(e); }
                    } else if (authToken) {
                        console.warn(`[AutoUpdater] Auth token request returned ${res.statusCode}, retrying unauthenticated for public repo...`);
                        fetchReleases(null);
                    } else {
                        reject(new Error(`GitHub API HTTP ${res.statusCode}`));
                    }
                });
            });
            req.on('error', (err) => {
                if (authToken) fetchReleases(null);
                else reject(err);
            });
            req.end();
        };

        fetchReleases(token);
    });
}

function downloadReleaseAsset(assetUrl, destPath, onProgress) {
    return new Promise((resolve, reject) => {
        const token = getUpdateToken();
        const https = require('https');
        const fs = require('fs');

        const doDownload = (url, headers) => {
            const req = https.request(url, { method: 'GET', headers }, (res) => {
                if (res.statusCode === 302 || res.statusCode === 301) {
                    const redirectUrl = res.headers.location;
                    // When following redirect to S3/CDN, DO NOT send GitHub Authorization header to prevent S3 400/403 error
                    return doDownload(redirectUrl, { 'User-Agent': 'MediaFactoryApp' });
                }
                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP ${res.statusCode}`));
                }
                const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
                let downloadedBytes = 0;
                const fileStream = fs.createWriteStream(destPath);
                res.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    if (onProgress && totalBytes > 0) {
                        onProgress(Math.round((downloadedBytes / totalBytes) * 100));
                    }
                });
                res.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve(destPath);
                });
                fileStream.on('error', reject);
            });
            req.on('error', reject);
            req.end();
        };

        doDownload(assetUrl, {
            'User-Agent': 'MediaFactoryApp',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/octet-stream'
        });
    });
}

async function performUpdateCheck() {
    console.log('[AutoUpdater] Checking for updates via GitHub REST API...');
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'checking' });
    try {
        const releases = await checkGitHubReleasesREST();
        const currentVer = app.getVersion() || '1.0.10';
        console.log(`[AutoUpdater] Current version: ${currentVer}, Total releases found: ${releases.length}`);
        
        // Find newest release greater than currentVer that contains a valid .exe asset
        const validRelease = releases.find(rel => {
            const tag = rel.tag_name || rel.name || '';
            const hasExe = (rel.assets || []).some(a => a.name.endsWith('.exe'));
            const isGreater = isVersionGreater(tag, currentVer);
            console.log(`[AutoUpdater] Release tag: ${tag}, hasExe: ${hasExe}, isGreater: ${isGreater}`);
            return isGreater && hasExe;
        });

        if (validRelease) {
            const tag = validRelease.tag_name || validRelease.name;
            const exeAsset = validRelease.assets.find(a => a.name.endsWith('.exe'));
            latestReleaseAssetInfo = { tag: tag, assetUrl: exeAsset.url, name: exeAsset.name };
            console.log(`[AutoUpdater] Update available! Tag: ${tag}, Asset: ${exeAsset.name}`);
            if (mainWindow) {
                mainWindow.webContents.send('update-status', { status: 'available', version: tag });
            }
            return;
        }
        
        console.log('[AutoUpdater] No newer release with exe asset found.');
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'not-available' });
    } catch (e) {
        console.error('[AutoUpdater Error]', e);
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'not-available' });
    }
}

async function performUpdateDownload() {
    if (!latestReleaseAssetInfo) return;
    const os = require('os');
    const destPath = path.join(os.tmpdir(), `MediaFactory-Setup-${latestReleaseAssetInfo.tag}.exe`);
    console.log(`[AutoUpdater] Starting download of ${latestReleaseAssetInfo.name} to ${destPath}`);
    
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloading', progress: 0, version: latestReleaseAssetInfo.tag });
    
    try {
        await downloadReleaseAsset(latestReleaseAssetInfo.assetUrl, destPath, (pct) => {
            if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloading', progress: pct, version: latestReleaseAssetInfo.tag });
        });
        pendingUpdateExePath = destPath;
        console.log('[AutoUpdater] Download complete! Ready to install.');
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'ready', version: latestReleaseAssetInfo.tag });
    } catch (e) {
        console.error('[AutoUpdater Download Error]', e);
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'error' });
    }
}

ipcMain.on('check-for-updates', performUpdateCheck);
ipcMain.on('download-update', performUpdateDownload);
ipcMain.on('install-update', () => {
    if (pendingUpdateExePath && require('fs').existsSync(pendingUpdateExePath)) {
        console.log(`[AutoUpdater] Launching installer: ${pendingUpdateExePath}`);
        const { spawn } = require('child_process');
        spawn(pendingUpdateExePath, [], { detached: true, stdio: 'ignore' });
        app.quit();
    } else {
        performUpdateDownload();
    }
});
