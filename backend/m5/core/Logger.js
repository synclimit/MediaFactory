const fsSync = require('fs');
let diagnosticsManager = null;
const logFile = 'd:/MediaFactory/m5_debug.log';

function writeToFile(text) {
    try {
        fsSync.appendFileSync(logFile, text + '\n');
    } catch (e) {}
}

function getDiagnostics() {
    if (!diagnosticsManager) {
        try {
            diagnosticsManager = require('../../system/DiagnosticsManager');
        } catch (e) { }
    }
    return diagnosticsManager;
}

class Logger {
    static _pushToDiagnostics(level, engineName, message, executionTimeMs = 0) {
        const diag = getDiagnostics();
        if (diag) {
            diag.pushLog({
                timestamp: new Date().toISOString(),
                level,
                engine: engineName,
                message,
                executionTimeMs
            });
        }
    }

    static start(engineName, message = 'Started') {
        const startMem = process.memoryUsage().heapUsed;
        const startTime = process.hrtime.bigint();
        const msg = `[${new Date().toISOString()}] [INFO] [${engineName}] ${message}`;
        console.log(msg);
        writeToFile(msg);
        this._pushToDiagnostics('INFO', engineName, message);
        return { startTime, startMem };
    }

    static finish(engineName, startData, message = 'Finished') {
        const endMem = process.memoryUsage().heapUsed;
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startData.startTime) / 1e6;
        const memDeltaKb = (endMem - startData.startMem) / 1024;
        
        const fullMsg = `${message} (Took ${Math.round(durationMs)}ms, MemDelta: ${memDeltaKb > 0 ? '+' : ''}${Math.round(memDeltaKb)}KB)`;
        const msg = `[${new Date().toISOString()}] [SUCCESS] [${engineName}] ${fullMsg}`;
        console.log(msg);
        writeToFile(msg);
        this._pushToDiagnostics('SUCCESS', engineName, fullMsg, durationMs);
        
        return {
            executionTimeMs: durationMs,
            memoryDeltaKb: memDeltaKb
        };
    }

    static error(engineName, message, error) {
        const msg = `[${new Date().toISOString()}] [ERROR] [${engineName}] ${message} ${error?.message || error}`;
        console.error(msg);
        if (error?.stack) {
            console.error(error.stack);
            writeToFile(msg + '\n' + error.stack);
        } else {
            writeToFile(msg);
        }
        this._pushToDiagnostics('ERROR', engineName, `${message} ${error?.message || error || ''}\n${error?.stack || ''}`);
    }

    static info(engineName, message) {
        const msg = `[${new Date().toISOString()}] [INFO] [${engineName}] ${message}`;
        console.info(msg);
        writeToFile(msg);
        this._pushToDiagnostics('INFO', engineName, message);
    }

    static warn(engineName, message) {
        const msg = `[${new Date().toISOString()}] [WARN] [${engineName}] ${message}`;
        console.warn(msg);
        writeToFile(msg);
        this._pushToDiagnostics('WARNING', engineName, message);
    }

    static debug(engineName, message) {
        console.debug(`[${new Date().toISOString()}] [DEBUG] [${engineName}] ${message}`);
        this._pushToDiagnostics('DEBUG', engineName, message);
    }

    static trace(engineName, message) {
        console.trace(`[${new Date().toISOString()}] [TRACE] [${engineName}] ${message}`);
        this._pushToDiagnostics('TRACE', engineName, message);
    }
}

module.exports = Logger;
