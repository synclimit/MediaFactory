const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Global Exception Handler to write crash logs and show error dialog
function writeCrashLog(err) {
    try {
        const crashDir = path.join(app.getPath('userData'), 'logs');
        if (!fs.existsSync(crashDir)) fs.mkdirSync(crashDir, { recursive: true });
        const crashFile = path.join(crashDir, 'startup_crash.log');
        const content = `[${new Date().toISOString()}] ${err ? (err.stack || err.message) : 'Unknown Error'}\n\n`;
        fs.appendFileSync(crashFile, content);
    } catch(e) {}
}

process.on('uncaughtException', (err) => {
    console.error('[Electron Uncaught Exception]', err);
    writeCrashLog(err);
    try {
        dialog.showErrorBox('MediaFactory Startup Error', err ? (err.stack || err.message) : 'Unknown Startup Error');
    } catch(e) {}
});

process.on('unhandledRejection', (reason) => {
    console.error('[Electron Unhandled Rejection]', reason);
    writeCrashLog(reason);
});

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    console.log('[Electron] Another instance is already running. Quitting new instance...');
    app.quit();
    process.exit(0);
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
            try { mainWindow.webContents.reloadIgnoringCache(); } catch(e) {}
        }
    });
}

const { autoUpdater } = require('electron-updater');

// Fix Chromium GPU Cache "Access is denied (0x5)" black screen bug on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');

let mainWindow;
let backendServer;
let currentServerPort = 18888;
const isDev = !app.isPackaged;

async function createWindow() {
    let serverPort = 18888;
    try {
        const { startServer } = require('../backend/server');
        backendServer = await startServer(18888);
        if (backendServer && typeof backendServer.address === 'function' && backendServer.address()) {
            serverPort = backendServer.address().port;
        }
        currentServerPort = serverPort;
    } catch (err) {
        console.error('[Electron] Backend startServer error:', err);
        writeCrashLog(err);
    }

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

    ipcMain.on('get-server-port-sync', (event) => {
        event.returnValue = currentServerPort || 18888;
    });

    mainWindow.setMenuBarVisibility(false);

    // Inject bound server port into window object when webContents starts and finishes loading
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`window.SERVER_PORT = ${serverPort}; window.__MEDIAFACTORY_PORT__ = ${serverPort};`).catch(() => {});
    });

    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        if (level >= 2) {
            console.error(`[Renderer Console Error] ${message} (${sourceId}:${line})`);
        }
    });

    let targetUrl = `http://127.0.0.1:${serverPort}?serverPort=${serverPort}`;
    if (isDev) {
        try {
            const http = require('http');
            const isViteRunning = await new Promise((resolve) => {
                const req = http.get('http://127.0.0.1:5173', { timeout: 600 }, (res) => resolve(res.statusCode < 500));
                req.on('error', () => resolve(false));
                req.on('timeout', () => { req.destroy(); resolve(false); });
            });
            if (isViteRunning) {
                targetUrl = `http://127.0.0.1:5173?serverPort=${serverPort}`;
                console.log('[Electron] Connected to Vite Dev Server:', targetUrl);
            }
        } catch(e) {}
    }

    if (!mainWindow || mainWindow.isDestroyed()) return;

    if (isDev && targetUrl.includes(':5173')) {
        console.log('[Electron] Loading UI via Vite Dev Server:', targetUrl);
        mainWindow.loadURL(targetUrl).catch((err) => {
            console.error('[Electron] loadURL error:', err);
        });
    } else {
        const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
        if (fs.existsSync(indexPath)) {
            console.log('[Electron] Loading UI via local build file:', indexPath);
            mainWindow.loadFile(indexPath, { query: { serverPort: String(serverPort) } }).catch((err) => {
                console.error('[Electron] loadFile error:', err);
            });
        } else {
            console.log('[Electron] Loading UI via URL:', targetUrl);
            mainWindow.loadURL(targetUrl).catch((err) => {
                console.error('[Electron] loadURL error:', err);
            });
        }
    }

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

function getUpdateToken() {
    return process.env.GITHUB_TOKEN || '';
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
    console.log('[AutoUpdater] checkUpdatesUnified triggered');
    let hasResponded = false;

    const safetyTimer = setTimeout(() => {
        if (!hasResponded) {
            console.warn('[AutoUpdater] Native check timed out after 3s, executing REST fallback...');
            hasResponded = true;
            performUpdateCheckFallback();
        }
    }, 3000);

    if (mainWindow) {
        mainWindow.webContents.send('update-status', { status: 'checking' });
    }

    if (app.isPackaged) {
        try {
            autoUpdater.checkForUpdates()
                .then((res) => {
                    console.log('[AutoUpdater Native] Check result:', res ? res.updateInfo?.version : 'done');
                })
                .catch((err) => {
                    console.warn('[AutoUpdater Native] checkForUpdates error, falling back:', err);
                    if (!hasResponded) {
                        hasResponded = true;
                        clearTimeout(safetyTimer);
                        performUpdateCheckFallback();
                    }
                });
        } catch (e) {
            if (!hasResponded) {
                hasResponded = true;
                clearTimeout(safetyTimer);
                performUpdateCheckFallback();
            }
        }
    } else {
        if (!hasResponded) {
            hasResponded = true;
            clearTimeout(safetyTimer);
            performUpdateCheckFallback();
        }
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

function forceKillLingeringProcesses() {
    cleanupFFmpegOnExit();
    if (process.platform === 'win32') {
        const { execSync } = require('child_process');
        try { execSync('taskkill /F /IM ffmpeg.exe /T', { stdio: 'ignore' }); } catch(e) {}
        try { execSync('taskkill /F /IM ffprobe.exe /T', { stdio: 'ignore' }); } catch(e) {}
        try { execSync('taskkill /F /IM yt-dlp.exe /T', { stdio: 'ignore' }); } catch(e) {}
    }
}

function installUpdateUnified() {
    console.log('[AutoUpdater] Performing safe shutdown and 1-Click update installation...');
    forceKillLingeringProcesses();

    if (backendServer) {
        try {
            if (typeof backendServer.closeAllConnections === 'function') {
                backendServer.closeAllConnections();
            }
            backendServer.close();
        } catch(e) {}
    }

    // Destroy all open windows immediately to release all UI file locks
    try {
        const { BrowserWindow } = require('electron');
        BrowserWindow.getAllWindows().forEach(win => {
            try { win.removeAllListeners(); win.destroy(); } catch(e) {}
        });
    } catch(e) {}

    if (app.isPackaged && nativeUpdateAvailable) {
        // Native silent 1-click update: closes app safely, applies update quietly, restarts app
        try {
            autoUpdater.quitAndInstall(true, true);
            // Ensure unconditional hard exit so MediaFactory.exe is not locked in Task Manager
            setTimeout(() => {
                app.exit(0);
            }, 600);
            return;
        } catch (e) {
            console.error('[AutoUpdater] quitAndInstall failed, using fallback:', e);
        }
    }

    if (pendingUpdateExePath && require('fs').existsSync(pendingUpdateExePath)) {
        // Run silent NSIS installer with /S flag to prevent file-locking and wizard issues
        const { spawn } = require('child_process');
        try {
            spawn(pendingUpdateExePath, ['/S', '--force-run'], { detached: true, stdio: 'ignore' }).unref();
            setTimeout(() => app.exit(0), 600);
        } catch (e) {
            const { shell } = require('electron');
            shell.openPath(pendingUpdateExePath);
            setTimeout(() => app.exit(0), 600);
        }
    } else {
        downloadUpdateUnified();
    }
}

ipcMain.handle('show-open-dialog', async (event, options) => {
    const { dialog, BrowserWindow } = require('electron');
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    try {
        const res = await dialog.showOpenDialog(win, options || { properties: ['openFile'] });
        if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
            return res.filePaths;
        }
        return [];
    } catch(e) {
        console.error('[Electron] showOpenDialog error:', e);
        return [];
    }
});

ipcMain.handle('get-server-port', () => currentServerPort);
ipcMain.on('get-server-port-sync', (event) => {
    event.returnValue = currentServerPort;
});

ipcMain.on('check-for-updates', checkUpdatesUnified);
ipcMain.on('download-update', downloadUpdateUnified);
ipcMain.on('install-update', installUpdateUnified);

