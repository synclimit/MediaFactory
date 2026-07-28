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
app.use(express.static(distPath));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'MediaFactory Backend is running' });
});

function startServer(port = 3001) {
    return new Promise((resolve) => {
        const server = app.listen(port, () => {
            console.log(`MediaFactory Backend running on port ${port}`);
            resolve(server);
        });
    });
}

// Jika dijalankan langsung dengan `node server.js`
if (require.main === module) {
    startServer(3001);
}

module.exports = { app, startServer };
