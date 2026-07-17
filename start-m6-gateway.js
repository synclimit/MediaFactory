/**
 * Purpose: Local API Gateway on port 18888 that bridges M6 Extension collect requests
 * directly into running MediaFactory M6 Queue on port 5173.
 */

/* eslint-disable no-console */
import http from 'node:http';

const PORT = 18888;
const MEDIAFACTORY_PORT = 5173;

const server = http.createServer((req, res) => {
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
    res.end(JSON.stringify({ status: 'ok', service: 'M6-Gateway', version: '1.0.0' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/m6/collect') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const videoUrl = payload.url;
        console.log(`[M6 Gateway 18888] Received collect request for URL: ${videoUrl}`);

        // Forward directly to running MediaFactory server on port 5173 (/api/v1/m5/download)
        const forwardBody = JSON.stringify({
          links: [videoUrl],
          quality: 'Best Quality',
          downloadFolder: 'C:\\Users\\Public\\Downloads',
          autoStart: true
        });

        const forwardReq = http.request(
          {
            hostname: '127.0.0.1',
            port: MEDIAFACTORY_PORT,
            path: '/api/v1/m5/download',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(forwardBody)
            }
          },
          (forwardRes) => {
            let respData = '';
            forwardRes.on('data', c => respData += c);
            forwardRes.on('end', () => {
              console.log(`[M6 Gateway 18888] MediaFactory responded (${forwardRes.statusCode}):`, respData);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                queueId: `M6-${Date.now()}`,
                forwarded: true
              }));
            });
          }
        );

        forwardReq.on('error', (err) => {
          console.error(`[M6 Gateway 18888] Failed to forward to MediaFactory 5173:`, err.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'MEDIAFACTORY_UNREACHABLE',
            message: err.message
          }));
        });

        forwardReq.write(forwardBody);
        forwardReq.end();
      } catch (err) {
        console.error(`[M6 Gateway 18888] Error processing collect request:`, err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'INVALID_REQUEST' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`=============================================================`);
  console.log(`[MediaFactory M6 Live Gateway] Running on http://127.0.0.1:${PORT}`);
  console.log(`Bridging M6 Extension -> MediaFactory Queue (Port ${MEDIAFACTORY_PORT})`);
  console.log(`=============================================================`);
});
