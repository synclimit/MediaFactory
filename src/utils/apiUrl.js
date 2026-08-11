export function getApiUrl(endpoint) {
  if (typeof window === 'undefined') return endpoint;
  const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

  let activePort = window.SERVER_PORT;
  if (!activePort && typeof window.location !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('serverPort')) {
        activePort = parseInt(urlParams.get('serverPort'), 10);
        window.SERVER_PORT = activePort;
      }
    } catch(e) {}
  }

  // When running directly via http/https (e.g. Vite dev server or Express served app)
  if (window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
    // If running in dev mode (e.g., Vite on port 5173/5174), relative URL goes through Vite proxy
    return path;
  }

  // Fallback for Electron file:// protocol or detached client
  const port = activePort || 18888;
  return `http://127.0.0.1:${port}${path}`;
}
