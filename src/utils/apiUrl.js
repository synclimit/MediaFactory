export function getApiUrl(endpoint) {
  if (typeof window === 'undefined') return endpoint;
  const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

  let activePort = window.SERVER_PORT || window.__MEDIAFACTORY_PORT__;

  if (!activePort && typeof window !== 'undefined' && window.require) {
    try {
      const { ipcRenderer } = window.require('electron');
      const syncPort = ipcRenderer.sendSync('get-server-port-sync');
      if (syncPort && !isNaN(syncPort) && syncPort > 0) {
        activePort = syncPort;
        window.SERVER_PORT = syncPort;
        window.__MEDIAFACTORY_PORT__ = syncPort;
      }
    } catch (e) {}
  }
  
  if (!activePort && typeof window.location !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('serverPort')) {
        activePort = parseInt(urlParams.get('serverPort'), 10);
      } else if (urlParams.has('port')) {
        activePort = parseInt(urlParams.get('port'), 10);
      } else if (window.location.port && window.location.port !== '5173' && window.location.port !== '5174') {
        const parsedLocPort = parseInt(window.location.port, 10);
        if (!isNaN(parsedLocPort) && parsedLocPort > 0) {
          activePort = parsedLocPort;
        }
      }
    } catch (e) {}

    if (activePort) {
      window.SERVER_PORT = activePort;
      window.__MEDIAFACTORY_PORT__ = activePort;
    }
  }

  // When running directly via http/https in browser/Vite dev mode
  if (window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
    // Vite dev server uses relative URL through Vite proxy
    return path;
  }

  // Fallback for Electron file:// protocol or standalone client
  const port = activePort || 18888;
  return `http://127.0.0.1:${port}${path}`;
}

