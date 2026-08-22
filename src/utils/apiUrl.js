/**
 * MediaFactory Dynamic API URL Resolver
 * Guarantees 100% dynamic frontend-backend communication across all end-user environments:
 * - Electron production (reads bound server port dynamically via IPC / window.SERVER_PORT / query params)
 * - Express production bundle (uses window.location.origin)
 * - Vite dev server (uses relative proxy paths)
 */

export function getApiPort() {
  if (typeof window === 'undefined') return null;

  // 1. Check global window variables set by Electron main process
  let port = window.SERVER_PORT || window.__MEDIAFACTORY_PORT__;
  if (port && !isNaN(port) && port > 0) return parseInt(port, 10);

  // 2. Synchronously query Electron IPC if available
  if (window.require) {
    try {
      const { ipcRenderer } = window.require('electron');
      const syncPort = ipcRenderer.sendSync('get-server-port-sync');
      if (syncPort && !isNaN(syncPort) && syncPort > 0) {
        window.SERVER_PORT = syncPort;
        window.__MEDIAFACTORY_PORT__ = syncPort;
        return parseInt(syncPort, 10);
      }
    } catch (e) {}
  }

  // 3. Check URL query params (?serverPort=... or ?port=...)
  if (typeof window.location !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('serverPort')) {
        port = parseInt(urlParams.get('serverPort'), 10);
      } else if (urlParams.has('port')) {
        port = parseInt(urlParams.get('port'), 10);
      } else if (window.location.port && window.location.port !== '5173' && window.location.port !== '5174') {
        const parsedLocPort = parseInt(window.location.port, 10);
        if (!isNaN(parsedLocPort) && parsedLocPort > 0) {
          port = parsedLocPort;
        }
      }
    } catch (e) {}

    if (port && !isNaN(port) && port > 0) {
      window.SERVER_PORT = port;
      window.__MEDIAFACTORY_PORT__ = port;
      return parseInt(port, 10);
    }
  }

  return null;
}

export function getApiUrl(endpoint) {
  if (typeof window === 'undefined') return endpoint;
  const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

  // When running inside Vite dev server (port 5173 / 5174), use relative paths for Vite proxying
  if (typeof window.location !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174')) {
    return path;
  }

  // Check dynamically allocated server port
  const activePort = getApiPort();
  if (activePort) {
    return `http://127.0.0.1:${activePort}${path}`;
  }

  // If served directly via HTTP/HTTPS (e.g. Express production static server)
  if (typeof window.location !== 'undefined' && window.location.origin && window.location.origin.startsWith('http')) {
    return `${window.location.origin}${path}`;
  }

  // Fallback to default port if all dynamic detection mechanisms are unavailable
  return `http://127.0.0.1:18888${path}`;
}
