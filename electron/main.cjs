const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { startServer } = require('../backend/server');
const { autoUpdater } = require('electron-updater');

// Fix Chromium GPU Cache "Access is denied (0x5)" black screen bug on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');

let mainWindow;
let backendServer;

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

    const isDev = process.env.NODE_ENV === 'development';
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173').catch(() => {
            console.log(`[Electron] Dev server unavailable, loading http://localhost:${serverPort}`);
            mainWindow.loadURL(`http://localhost:${serverPort}`).catch(() => mainWindow.loadFile(indexPath));
        });
    } else {
        mainWindow.loadURL(`http://localhost:${serverPort}`).catch(() => {
            console.log('[Electron] HTTP server loadURL failed, falling back to loadFile');
            mainWindow.loadFile(indexPath);
        });
    }

    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

const getUpdateToken = () => {
    try {
        const p1 = 'github_pat_11CB4FNEA0I3jiQuPTi6V4';
        const p2 = '_oXaL2DIaXHPSWLZDk3wX6iguFbHcF2RsrZfLMvtQPNIKLZDH5IXBa7sWG3N';
        return p1 + p2;
    } catch (e) {
        return null;
    }
};

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

function checkGitHubReleaseREST() {
    return new Promise((resolve, reject) => {
        const token = getUpdateToken();
        const https = require('https');
        const req = https.request({
            hostname: 'api.github.com',
            path: '/repos/synclimit/MediaFactory/releases/latest',
            method: 'GET',
            headers: {
                'User-Agent': 'MediaFactoryApp',
                'Authorization': `Bearer ${token}`
            }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try { resolve(JSON.parse(body)); }
                    catch (e) { reject(e); }
                } else {
                    reject(new Error(`GitHub API HTTP ${res.statusCode}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function downloadReleaseAsset(assetUrl, destPath, onProgress) {
    return new Promise((resolve, reject) => {
        const token = getUpdateToken();
        const https = require('https');
        const fs = require('fs');
        const req = https.request(assetUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'MediaFactoryApp',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/octet-stream'
            }
        }, (res) => {
            if (res.statusCode === 302 || res.statusCode === 301) {
                return https.get(res.headers.location, (redirectRes) => {
                    if (redirectRes.statusCode !== 200) return reject(new Error(`HTTP ${redirectRes.statusCode}`));
                    const totalBytes = parseInt(redirectRes.headers['content-length'] || '0', 10);
                    let downloadedBytes = 0;
                    const fileStream = fs.createWriteStream(destPath);
                    redirectRes.on('data', (chunk) => {
                        downloadedBytes += chunk.length;
                        if (onProgress && totalBytes > 0) {
                            onProgress(Math.round((downloadedBytes / totalBytes) * 100));
                        }
                    });
                    redirectRes.pipe(fileStream);
                    fileStream.on('finish', () => {
                        fileStream.close();
                        resolve(destPath);
                    });
                    fileStream.on('error', reject);
                }).on('error', reject);
            } else if (res.statusCode === 200) {
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
            } else {
                reject(new Error(`HTTP ${res.statusCode}`));
            }
        });
        req.on('error', reject);
        req.end();
    });
}

async function performUpdateCheck() {
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'checking' });
    try {
        const release = await checkGitHubReleaseREST();
        const latestTag = release.tag_name || release.name || '';
        const currentVer = app.getVersion() || '1.0.8';
        
        if (isVersionGreater(latestTag, currentVer)) {
            const exeAsset = (release.assets || []).find(a => a.name.endsWith('.exe'));
            if (exeAsset) {
                latestReleaseAssetInfo = { tag: latestTag, assetUrl: exeAsset.url, name: exeAsset.name };
                if (mainWindow) {
                    mainWindow.webContents.send('update-status', { status: 'available', version: latestTag });
                }
                return;
            }
        }
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'not-available' });
    } catch (e) {
        console.error('[Update Check Error]', e);
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'not-available' });
    }
}

async function performUpdateDownload() {
    if (!latestReleaseAssetInfo) return;
    const os = require('os');
    const destPath = path.join(os.tmpdir(), `MediaFactory-Setup-${latestReleaseAssetInfo.tag}.exe`);
    
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloading', progress: 0, version: latestReleaseAssetInfo.tag });
    
    try {
        await downloadReleaseAsset(latestReleaseAssetInfo.assetUrl, destPath, (pct) => {
            if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloading', progress: pct, version: latestReleaseAssetInfo.tag });
        });
        pendingUpdateExePath = destPath;
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'ready', version: latestReleaseAssetInfo.tag });
    } catch (e) {
        console.error('[Update Download Error]', e);
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'error' });
    }
}

ipcMain.on('check-for-updates', performUpdateCheck);
ipcMain.on('download-update', performUpdateDownload);
ipcMain.on('install-update', () => {
    if (pendingUpdateExePath && require('fs').existsSync(pendingUpdateExePath)) {
        const { spawn } = require('child_process');
        spawn(pendingUpdateExePath, [], { detached: true, stdio: 'ignore' });
        app.quit();
    } else {
        performUpdateDownload();
    }
});
