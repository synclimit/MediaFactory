const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '500mb' }));

// Bootstrap backend services
require('./bootstrap.js')();

// Import the main API router
const apiRouter = require('./api/router.js');
app.use(apiRouter);

// Import module routers
app.use(require('./api/m1.js').router);
app.use(require('./api/m2.js').router);
app.use(require('./api/m2-splitter.js').router);
app.use(require('./api/m2-mode3-assets.js'));
app.use(require('./api/m3.js'));
app.use(require('./api/m4.js').router);
app.use(require('./api/m5.js').router);
app.use(require('./api/whisper.js'));
app.use(require('./api/qa.js'));
app.use(require('./api/diagnostics.js'));
app.use(require('./routes/sounds.js'));
app.use('/api/overlays', require('./routes/overlays.js'));

// Serve static frontend in production
const path = require('path');
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath, {
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));

app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const indexPath = path.join(distPath, 'index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send('MediaFactory Backend running.');
    }
});

app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        const indexPath = path.join(distPath, 'index.html');
        if (require('fs').existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    next();
});

function startServer(port = 18888) {
    return new Promise((resolve) => {
        const tryListen = (targetPort) => {
            const server = app.listen(targetPort, '0.0.0.0', () => {
                const boundPort = server.address() ? server.address().port : targetPort;
                console.log(`[MediaFactory Backend] Running successfully on port ${boundPort}`);
                resolve(server);
            }).on('error', (err) => {
                console.warn(`[Backend] Port ${targetPort} listen error:`, err.message);
                if (err.code === 'EADDRINUSE') {
                    if (targetPort === 18888) {
                        console.log(`[Backend] Port 18888 in use, trying fallback port 3001...`);
                        tryListen(3001);
                    } else if (targetPort === 3001) {
                        console.log(`[Backend] Port 3001 in use, allocating dynamic free port (port 0)...`);
                        tryListen(0);
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });
        };
        tryListen(port);
    });
}

// Jika dijalankan langsung dengan `node server.js`
if (require.main === module) {
    startServer(18888);
}

module.exports = { app, startServer };
