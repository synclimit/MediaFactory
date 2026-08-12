// Patch window.fetch to ensure relative /api endpoints dynamically reach Express server with stream support & multi-port failover
if (typeof window !== 'undefined' && window.fetch) {
  const _origFetch = window.fetch;
  let discoveredPort = null;

  async function resolveActiveBackendPort() {
    if (window.SERVER_PORT) return window.SERVER_PORT;
    if (discoveredPort) return discoveredPort;
    
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        const syncPort = ipcRenderer.sendSync('get-server-port-sync');
        if (syncPort && !isNaN(syncPort) && syncPort > 0) {
          window.SERVER_PORT = syncPort;
          discoveredPort = syncPort;
          return syncPort;
        }
      } catch(e) {}
    }

    if (typeof window.location !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('serverPort')) {
          const p = parseInt(urlParams.get('serverPort'), 10);
          if (p) {
            window.SERVER_PORT = p;
            discoveredPort = p;
            return p;
          }
        }
      } catch(e) {}
    }

    const candidatePorts = [18888, 3001, 3002, 3003, 8080, 8888];
    for (const p of candidatePorts) {
      const isAlive = await new Promise((resolve) => {
        if (window.require) {
          try {
            const http = window.require('http');
            const req = http.get(`http://127.0.0.1:${p}/api/v1/diagnostics/health`, { timeout: 300 }, (res) => resolve(res.statusCode < 500));
            req.on('error', () => resolve(false));
            req.on('timeout', () => { req.destroy(); resolve(false); });
          } catch(e) { resolve(false); }
        } else {
          resolve(false);
        }
      });
      if (isAlive) {
        window.SERVER_PORT = p;
        discoveredPort = p;
        return p;
      }
    }
    return 18888;
  }

  window.fetch = async function(input, init) {
    let targetUrl = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    const isHttp = typeof window.location !== 'undefined' && window.location.protocol.startsWith('http');
    const activePort = await resolveActiveBackendPort();

    if (targetUrl.startsWith('/api')) {
      if (!isHttp) {
        targetUrl = `http://127.0.0.1:${activePort}${targetUrl}`;
      }
      if (typeof input === 'string') input = targetUrl;
    }

    try {
      return await _origFetch.call(this, input, init);
    } catch (err) {
      // Node.js HTTP fallback with streaming support if Chromium web fetch fails in Electron
      if (typeof window !== 'undefined' && window.require && (targetUrl.startsWith('/api') || targetUrl.includes('127.0.0.1') || targetUrl.includes('localhost'))) {
        const candidatePorts = [activePort, activePort === 18888 ? 3001 : 18888];
        for (const targetPort of candidatePorts) {
          try {
            const http = window.require('http');
            const fullUrl = targetUrl.startsWith('/') ? `http://127.0.0.1:${targetPort}${targetUrl}` : targetUrl.replace(/:\d+\//, `:${targetPort}/`);
            const parsed = new URL(fullUrl);
            const bodyStr = init && init.body ? (typeof init.body === 'string' ? init.body : String(init.body)) : '';
            
            const nodeResponse = await new Promise((resolve, reject) => {
              const req = http.request({
                hostname: parsed.hostname || '127.0.0.1',
                port: parsed.port || targetPort,
                path: parsed.pathname + parsed.search,
                method: (init && init.method) || 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(bodyStr),
                  ...((init && init.headers) || {})
                }
              }, (res) => {
                const stream = new ReadableStream({
                  start(controller) {
                    res.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk)));
                    res.on('end', () => controller.close());
                    res.on('error', (e) => controller.error(e));
                  }
                });
                
                resolve(new Response(stream, {
                  status: res.statusCode,
                  statusText: res.statusMessage,
                  headers: res.headers
                }));
              });
              req.on('error', (e) => reject(e));
              if (bodyStr) req.write(bodyStr);
              req.end();
            });
            
            window.SERVER_PORT = targetPort;
            discoveredPort = targetPort;
            return nodeResponse;
          } catch (nodeErr) {
            // Continue trying next candidate port if ECONNREFUSED
          }
        }
      }
      throw err;
    }
  };
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
