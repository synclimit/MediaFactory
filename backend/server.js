const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '500mb' }));

// Bootstrap backend services
try {
    require('./bootstrap.js')();
} catch (e) {
    console.error('[MediaFactory Backend] Bootstrap error:', e);
}

// Import & mount API routers safely
const safeMount = (fn) => {
    try { fn(); } catch (e) { console.error('[MediaFactory Backend] Router mount warning:', e); }
};

safeMount(() => app.use(require('./api/router.js')));
safeMount(() => app.use(require('./api/m1.js').router));
safeMount(() => app.use(require('./api/m2.js').router));
safeMount(() => app.use(require('./api/m2-splitter.js').router));
safeMount(() => app.use(require('./api/m2-mode3-assets.js')));
safeMount(() => app.use(require('./api/m3.js')));
safeMount(() => app.use(require('./api/m4.js').router));
safeMount(() => app.use(require('./api/m5.js').router));
safeMount(() => app.use(require('./api/whisper.js')));
safeMount(() => app.use(require('./api/qa.js')));
safeMount(() => app.use(require('./api/diagnostics.js')));
safeMount(() => app.use(require('./routes/sounds.js')));
safeMount(() => app.use('/api/overlays', require('./routes/overlays.js')));
safeMount(() => app.use(require('./api/m7.js')));
safeMount(() => app.use(require('./api/ai.js')));

// Serve isolated M7 Astrofox app
const m7AppPath = require('path').join(__dirname, '..', 'm7-astrofox', 'app');
app.use('/m7-app', express.static(m7AppPath, {
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));


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

function startServer(initialPort = 18888) {
    return new Promise((resolve) => {
        const candidatePorts = [initialPort, 18888, 3001, 3002, 3003, 8080, 8888, 0];
        const uniquePorts = Array.from(new Set(candidatePorts));
        let index = 0;

        const tryNext = () => {
            if (index >= uniquePorts.length) {
                console.error('[MediaFactory Backend] All candidate ports failed!');
                return resolve(null);
            }
            const targetPort = uniquePorts[index++];
            const server = app.listen(targetPort);

            server.once('listening', () => {
                const boundPort = server.address() ? server.address().port : targetPort;
                console.log(`[MediaFactory Backend] Running successfully on port ${boundPort}`);
                resolve(server);
            });

            server.once('error', (err) => {
                console.warn(`[Backend] Port ${targetPort} unavailable (${err.code}): ${err.message}`);
                try { server.close(); } catch(e) {}
                tryNext();
            });
        };

        tryNext();
    });
}

// Jika dijalankan langsung dengan `node server.js`
if (require.main === module) {
    startServer(18888);
}

module.exports = { app, startServer };
