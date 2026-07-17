# Workspace Structure & Electron Investigation

This document is the result of a recursive, exhaustive search across the entire `d:\MediaFactory` workspace to determine the true state of Electron integration and explain the contradictory behavior of the application.

## 1. Package.json Files Found (Excluding node_modules)

- `d:\MediaFactory\package.json` (Frontend / Root)
- `d:\MediaFactory\backend\package.json` (Backend Dependencies)

*No other `package.json` files exist in the project root or subdirectories.*

## 2. Electron Dependencies Found

**None.**
Neither `d:\MediaFactory\package.json` nor `d:\MediaFactory\backend\package.json` contains `electron`, `electron-builder`, `electron-packager`, `electron-forge`, or any related Electron libraries in their `dependencies` or `devDependencies`.

## 3. Electron-Related Files Found

**None.**
A recursive search for `BrowserWindow`, `ipcMain`, `ipcRenderer`, `contextBridge`, `preload`, `app.whenReady()`, and `main.js`/`main.cjs` (as an Electron entry point) yielded **zero** results in the project source code. The only mentions of "Electron" are in markdown documentation and unused configurations.

## 4. Builder Configurations Found

- `d:\MediaFactory\electron-builder.json`
  - *Note: This file exists, but points to a non-existent `electron/` directory and cannot be executed since `electron-builder` is not installed.*
- `d:\MediaFactory\vite.config.js`
- `d:\MediaFactory\eslint.config.js`

## 5. Startup Files & Scripts Found

- `d:\MediaFactory\startMediaFactory.bat`
  - Contents: `npm run dev -- --port 5178`
- `d:\MediaFactory\package.json` (Scripts)
  - `"dev": "vite"`
  - `"build": "vite build"`
  - `"preview": "vite preview"`

---

## 6. The Contradiction: Why does it run like a desktop app?

**The Mystery:** 
How is the application successfully running, opening native system dialogs, and interacting with the local filesystem if Electron does not exist?

**The Evidence (Vite Plugin + PowerShell Integration):**
The application is **NOT** a standalone desktop application. It is running as a React web application inside a standard web browser, powered by a heavily customized Vite development server.

Evidence from `d:\MediaFactory\vite-plugin-render-engine.js`:
```javascript
export default function renderEnginePlugin() {
  let backendApp = null;
  try {
    const bootstrapBackend = require('./backend/bootstrap.js');
    bootstrapBackend();
    const router = require('./backend/api/router.js');
    backendApp = express();
    // ...
    backendApp.use(router);
```
**Explanation of Architecture:**
1. **The Backend Hijack**: When you run `startMediaFactory.bat`, it executes `npm run dev`. The `vite.config.js` loads `vite-plugin-render-engine.js`. This plugin hijacks the Vite development server and embeds an entire Express.js backend (from `backend/`) directly into the Vite process.
2. **Native System Dialogs**: Instead of using Electron's `dialog.showOpenDialog()`, the backend runs raw Windows PowerShell scripts using the `-sta` (Single-Threaded Apartment) flag to spawn native Windows file pickers.
   *(Evidence from `vite-plugin-render-engine.js` line 1423)*:
   `exec('powershell -sta -command "${psCommand}"', ...)`
3. **The "Desktop" Illusion**: Because the Vite Dev Server has full Node.js file system access and can run FFmpeg/PowerShell via `child_process.spawn()`, the browser frontend feels exactly like a native desktop app when talking to `localhost`.

**Why Phase 3 to 9 Failed in the Previous Audit:**
When you run `npm run build`, Vite compiles the React frontend into static HTML/JS/CSS (placed in `dist/`). However, the build process completely strips away `vite-plugin-render-engine.js` and the Express backend. Because there is no Electron wrapper to package the Node backend alongside the built React frontend, the resulting `dist/` folder is just a static website that has lost all ability to communicate with PowerShell, FFmpeg, or the file system. 

Electron is truly missing. The application currently relies entirely on the Vite development server to simulate a desktop environment.
