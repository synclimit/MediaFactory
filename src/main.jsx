// Patch window.fetch to ensure relative /api endpoints dynamically reach Express server on bound port
if (typeof window !== 'undefined' && window.fetch) {
  const _origFetch = window.fetch;
  window.fetch = function(input, init) {
    let targetUrl = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    const isHttp = typeof window.location !== 'undefined' && window.location.protocol.startsWith('http');
    const activePort = window.SERVER_PORT || (window.location.port ? parseInt(window.location.port, 10) : 18888);

    if (targetUrl.startsWith('/api')) {
      if (isHttp) {
        // Under HTTP protocol, keep relative path so browser automatically hits active origin/port
        targetUrl = targetUrl;
      } else {
        // Under file: protocol fallback, target bound local server port
        targetUrl = `http://127.0.0.1:${activePort}${targetUrl}`;
      }
      if (typeof input === 'string') input = targetUrl;
    }

    return _origFetch.call(this, input, init).catch(err => {
      // Node.js HTTP fallback if Chromium web fetch fails in Electron
      if (typeof window !== 'undefined' && window.require && (targetUrl.startsWith('/api') || targetUrl.includes('127.0.0.1') || targetUrl.includes('localhost'))) {
        try {
          const http = window.require('http');
          const fullUrl = targetUrl.startsWith('/') ? `http://127.0.0.1:${activePort}${targetUrl}` : targetUrl;
          const parsed = new URL(fullUrl);
          const bodyStr = init && init.body ? (typeof init.body === 'string' ? init.body : String(init.body)) : '';
          
          return new Promise((resolve, reject) => {
            const req = http.request({
              hostname: parsed.hostname || '127.0.0.1',
              port: parsed.port || activePort,
              path: parsed.pathname + parsed.search,
              method: (init && init.method) || 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                ...((init && init.headers) || {})
              }
            }, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                resolve({
                  ok: res.statusCode >= 200 && res.statusCode < 300,
                  status: res.statusCode,
                  json: async () => JSON.parse(data),
                  text: async () => data
                });
              });
            });
            req.on('error', (e) => reject(e));
            if (bodyStr) req.write(bodyStr);
            req.end();
          });
        } catch(e) {}
      }
      throw err;
    });
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
