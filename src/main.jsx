// Patch window.fetch to ensure relative /api endpoints always reach Express server on port 18888 in Electron
if (typeof window !== 'undefined' && window.fetch) {
  const _origFetch = window.fetch;
  window.fetch = function(input, init) {
    const isElectronFile = typeof window.location !== 'undefined' && window.location.protocol === 'file:';
    if (isElectronFile || (typeof window.location !== 'undefined' && window.location.port !== '18888')) {
      if (typeof input === 'string' && input.startsWith('/api')) {
        input = 'http://127.0.0.1:18888' + input;
      } else if (input && typeof input === 'object' && typeof input.url === 'string' && input.url.startsWith('/api')) {
        try {
          input = new Request('http://127.0.0.1:18888' + input.url, input);
        } catch (e) {}
      }
    }
    return _origFetch.call(this, input, init);
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
