const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { startServer } = require('../backend/server');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let backendServer;

async function createWindow() {
    // Start backend server on fixed port so Chrome Extension can connect
    backendServer = await startServer(18888);
    const port = (backendServer && typeof backendServer.address === 'function' && backendServer.address()) ? backendServer.address().port : 18888;

    mainWindow = new BrowserWindow({
        width: 1366,
        height: 768,
        minWidth: 1024,
        minHeight: 600,
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false // Bypasses local file CORS for easier video previewing
        }
    });

    mainWindow.setMenuBarVisibility(false);

    // If running in dev mode, connect to Vite dev server
    // If packaged, load the built HTML file via the random backend port
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
        const targetUrl = port ? `http://localhost:${port}` : `file://${indexPath}`;
        mainWindow.loadURL(targetUrl).catch(() => {
            mainWindow.loadFile(indexPath);
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Check for updates when the window is created
    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
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

// IPC Listeners for UI-triggered updates
ipcMain.on('check-for-updates', async () => {
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'checking' });
    try {
        if (!app.isPackaged) {
            setTimeout(() => {
                if (mainWindow) mainWindow.webContents.send('update-status', { status: 'not-available' });
            }, 800);
            return;
        }
        await autoUpdater.checkForUpdates();
    } catch (err) {
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'not-available' });
    }
});

ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
});

// Auto Updater Events - Forwarded to UI
autoUpdater.on('checking-for-update', () => {
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'checking' });
});

autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'available', version: info.version });
});

autoUpdater.on('update-not-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'not-available' });
});

autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloading', progress: progressObj.percent });
});

autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'ready', version: info.version });
});

autoUpdater.on('error', (err) => {
    if (mainWindow) {
        mainWindow.webContents.send('update-status', { status: 'not-available' });
    }
});
