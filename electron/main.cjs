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
}

app.whenReady().then(() => {
    createWindow();

    setTimeout(() => {
        checkUpdatesUnified();
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

// Native autoUpdater setup for GitHub releases
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

try {
    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'synclimit',
        repo: 'MediaFactory'
    });
} catch (e) {
    console.error('[AutoUpdater] setFeedURL error:', e);
}

let nativeUpdateAvailable = false;

autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater Native] Checking for updates...');
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'checking' });
});

autoUpdater.on('update-available', (info) => {
    nativeUpdateAvailable = true;
    console.log('[AutoUpdater Native] Update available:', info.version);
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'available', version: info.version });
});

autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater Native] Native check found no update, running fallback check...');
    performUpdateCheckFallback();
});

autoUpdater.on('download-progress', (progressObj) => {
    const pct = Math.round(progressObj.percent || 0);
    console.log(`[AutoUpdater Native] Download progress: ${pct}%`);
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloading', progress: pct });
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater Native] Update downloaded successfully! Ready to install.');
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'ready', version: info.version });
});

autoUpdater.on('error', (err) => {
    console.warn('[AutoUpdater Native Error]', err ? err.message : 'Unknown error');
    performUpdateCheckFallback();
});

function extractSemver(v) {
    if (!v) return [0, 0, 0];
    const match = v.toString().match(/(\d+)\.(\d+)\.(\d+)/);
    if (!match) return [0, 0, 0];
    return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function isVersionGreater(v1, v2) {
    const p1 = extractSemver(v1);
    const p2 = extractSemver(v2);
    for (let i = 0; i < 3; i++) {
        if (p1[i] > p2[i]) return true;
        if (p1[i] < p2[i]) return false;
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

function downloadReleaseAsset(targetUrl, destPath, onProgress) {
    return new Promise((resolve, reject) => {
        const token = getUpdateToken();
        const https = require('https');
        const fs = require('fs');

        const doDownload = (url, headers, redirectDepth = 0) => {
            if (redirectDepth > 10) return reject(new Error('Too many redirects'));
            
            const req = https.request(url, { method: 'GET', headers }, (res) => {
                if (res.statusCode === 302 || res.statusCode === 301) {
                    const redirectUrl = res.headers.location;
                    return doDownload(redirectUrl, { 'User-Agent': 'MediaFactoryApp' }, redirectDepth + 1);
                }
                if (res.statusCode !== 200) {
                    if ((res.statusCode === 401 || res.statusCode === 403) && headers['Authorization']) {
                        console.warn('[AutoUpdater] Asset download with token returned ' + res.statusCode + ', retrying unauthenticated...');
                        return doDownload(url, { 'User-Agent': 'MediaFactoryApp' }, redirectDepth + 1);
                    }
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

        const headers = { 'User-Agent': 'MediaFactoryApp' };
        if (targetUrl.includes('api.github.com') && token) {
            headers['Authorization'] = `Bearer ${token}`;
            headers['Accept'] = 'application/octet-stream';
        }

        doDownload(targetUrl, headers);
    });
}

async function performUpdateCheckFallback() {
    console.log('[AutoUpdater Fallback] Checking for updates via GitHub REST API...');
    try {
        const releases = await checkGitHubReleasesREST();
        const currentVer = app.getVersion() || '1.0.16';
        console.log(`[AutoUpdater Fallback] Current version: ${currentVer}, Total releases found: ${releases.length}`);
        
        const validRelease = releases.find(rel => {
            if (rel.draft) return false;
            const tag = rel.tag_name || rel.name || '';
            const hasExe = (rel.assets || []).some(a => a.name.endsWith('.exe'));
            const isGreater = isVersionGreater(tag, currentVer);
            return isGreater && hasExe;
        });

        if (validRelease) {
            const tag = validRelease.tag_name || validRelease.name;
            const exeAsset = validRelease.assets.find(a => a.name.endsWith('.exe'));
            const downloadUrl = exeAsset.browser_download_url || exeAsset.url;
            latestReleaseAssetInfo = { tag: tag, assetUrl: downloadUrl, name: exeAsset.name };
            console.log(`[AutoUpdater Fallback] Update available! Tag: ${tag}, Asset: ${exeAsset.name}`);
            if (mainWindow) {
                mainWindow.webContents.send('update-status', { status: 'available', version: tag });
            }
            return;
        }
        
        console.log('[AutoUpdater Fallback] No newer release found.');
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'not-available' });
    } catch (e) {
        console.error('[AutoUpdater Fallback Error]', e);
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'not-available' });
    }
}

async function performUpdateDownloadFallback() {
    if (!latestReleaseAssetInfo) return;
    const os = require('os');
    const destPath = path.join(os.tmpdir(), `MediaFactory-Setup-${latestReleaseAssetInfo.tag}.exe`);
    console.log(`[AutoUpdater Fallback] Starting download of ${latestReleaseAssetInfo.name} to ${destPath}`);
    
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloading', progress: 0, version: latestReleaseAssetInfo.tag });
    
    try {
        await downloadReleaseAsset(latestReleaseAssetInfo.assetUrl, destPath, (pct) => {
            if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloading', progress: pct, version: latestReleaseAssetInfo.tag });
        });
        pendingUpdateExePath = destPath;
        console.log('[AutoUpdater Fallback] Download complete! Ready to install.');
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'ready', version: latestReleaseAssetInfo.tag });
    } catch (e) {
        console.error('[AutoUpdater Fallback Download Error]', e);
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'error' });
    }
}

function checkUpdatesUnified() {
    if (app.isPackaged) {
        try {
            autoUpdater.checkForUpdates().catch(() => performUpdateCheckFallback());
        } catch (e) {
            performUpdateCheckFallback();
        }
    } else {
        performUpdateCheckFallback();
    }
}

function downloadUpdateUnified() {
    if (app.isPackaged && nativeUpdateAvailable) {
        try {
            autoUpdater.downloadUpdate().catch(() => performUpdateDownloadFallback());
        } catch (e) {
            performUpdateDownloadFallback();
        }
    } else {
        performUpdateDownloadFallback();
    }
}

function installUpdateUnified() {
    console.log('[AutoUpdater] Performing safe shutdown and 1-Click update installation...');
    cleanupFFmpegOnExit();
    if (backendServer) {
        try { backendServer.close(); } catch(e) {}
    }

    if (app.isPackaged && nativeUpdateAvailable) {
        // Native silent 1-click update: closes app safely, applies update quietly, restarts app
        try {
            autoUpdater.quitAndInstall(false, true);
            return;
        } catch (e) {
            console.error('[AutoUpdater] quitAndInstall failed, using fallback:', e);
        }
    }

    if (pendingUpdateExePath && require('fs').existsSync(pendingUpdateExePath)) {
        // Run silent NSIS installer with /S flag to prevent file-locking and wizard issues
        const { spawn } = require('child_process');
        try {
            spawn(pendingUpdateExePath, ['/S'], { detached: true, stdio: 'ignore' }).unref();
            setTimeout(() => app.quit(), 500);
        } catch (e) {
            const { shell } = require('electron');
            shell.openPath(pendingUpdateExePath);
            setTimeout(() => app.quit(), 500);
        }
    } else {
        downloadUpdateUnified();
    }
}

ipcMain.on('check-for-updates', checkUpdatesUnified);
ipcMain.on('download-update', downloadUpdateUnified);
ipcMain.on('install-update', installUpdateUnified);
