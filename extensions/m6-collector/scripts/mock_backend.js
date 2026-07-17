/**
 * Purpose: Lightweight Mock API Gateway server on port 18888 for local testing of M6 Collector extension.
 * Run with: node scripts/mock_backend.js
 */

/* eslint-disable no-console */
import http from 'node:http';

const PORT = 18888;

const server = http.createServer((req, res) => {
  // CORS headers so extension / local requests work cleanly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-MediaFactory, X-Extension-Version');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', version: '1.0.0' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/m6/collect') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      console.log(`[M6 Mock Gateway] Received collect request:`, body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          queueId: `M6-JOB-${Date.now()}`
        })
      );
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`[MediaFactory M6 Mock API Gateway] Running on port ${PORT}`);
  console.log(`Ready to receive short video URLs at http://127.0.0.1:${PORT}/api/m6/collect`);
  console.log(`Press Ctrl+C to stop.`);
  console.log(`======================================================\n`);
});
