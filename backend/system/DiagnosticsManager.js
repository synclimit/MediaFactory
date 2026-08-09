const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const AdmZip = require('adm-zip');
const { PipelineEmitter, PipelineEvents } = require('../m5/core/Events');
const AppPaths = require('./AppPaths');

class DiagnosticsManager {
    constructor() {
        this.diagnosticsDir = AppPaths.getDiagnosticsBase();
        this.sessionsDir = path.join(this.diagnosticsDir, 'sessions');
        
        this.currentSessionId = this._generateSessionId();
        this.sessionData = this._createEmptySession();
        
        this.maxItems = 2000;
        this.healthScore = 100;
        
        this._initCrashHandlers();
        this._initPipelineListeners();
        this._startPerformanceMonitor();
    }
    
    async init() {
        await fs.mkdir(this.diagnosticsDir, { recursive: true });
        await fs.mkdir(this.sessionsDir, { recursive: true });
        await this._saveSession();
    }

    _generateSessionId() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hex = crypto.randomBytes(2).toString('hex').toUpperCase();
        return `SESSION-${yyyy}-${mm}-${dd}-${hex}`;
    }

    _createEmptySession() {
        return {
            id: this.currentSessionId,
            startTime: Date.now(),
            endTime: null,
            logs: [],
            events: [],
            requests: [],
            sql: [],
            ffmpeg: [],
            snapshots: [],
            performance: [],
            pipelineTree: {},
            system: null
        };
    }

    async _saveSession() {
        try {
            if (!this.sessionData.system) {
                this.sessionData.system = await this.getSystemInfo();
            }
            const dest = path.join(this.sessionsDir, `${this.currentSessionId}.json`);
            // Mask sensitive data before saving to disk
            let jsonString = JSON.stringify(this.sessionData);
            jsonString = this.maskSensitiveData(jsonString);
            await fs.writeFile(dest, jsonString, 'utf8');
        } catch (e) {
            console.error('[DiagnosticsManager] Failed to save session:', e);
        }
    }

    async loadSession(sessionId) {
        try {
            const dest = path.join(this.sessionsDir, `${sessionId}.json`);
            const data = await fs.readFile(dest, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            throw new Error('Session not found or unreadable.');
        }
    }

    async listSessions() {
        try {
            const files = await fs.readdir(this.sessionsDir);
            return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')).reverse();
        } catch (e) {
            return [this.currentSessionId];
        }
    }

    // ---------- Telemetry Collectors ----------

    pushLog(logObj) {
        logObj.sessionId = this.currentSessionId;
        this.sessionData.logs.unshift(logObj);
        if (this.sessionData.logs.length > this.maxItems) this.sessionData.logs.pop();
    }

    logRequest(reqData) {
        reqData.sessionId = this.currentSessionId;
        this.sessionData.requests.unshift(reqData);
        if (this.sessionData.requests.length > this.maxItems) this.sessionData.requests.pop();
    }

    logSQL(queryData) {
        queryData.sessionId = this.currentSessionId;
        this.sessionData.sql.unshift(queryData);
        if (this.sessionData.sql.length > this.maxItems) this.sessionData.sql.pop();
    }

    logFFmpeg(ffmpegData) {
        ffmpegData.sessionId = this.currentSessionId;
        this.sessionData.ffmpeg.unshift(ffmpegData);
        if (this.sessionData.ffmpeg.length > this.maxItems) this.sessionData.ffmpeg.pop();
    }

    addSnapshot(stage, inputObj, outputObj, jobId = 'unknown', engine = 'unknown') {
        this.sessionData.snapshots.unshift({
            timestamp: Date.now(),
            sessionId: this.currentSessionId,
            stage,
            jobId,
            engine,
            input: inputObj,
            output: outputObj
        });
        if (this.sessionData.snapshots.length > 500) this.sessionData.snapshots.pop();
        
        // Build Engine Execution Tree representation
        if (!this.sessionData.pipelineTree[jobId]) {
            this.sessionData.pipelineTree[jobId] = { id: jobId, stages: [] };
        }
        this.sessionData.pipelineTree[jobId].stages.push({
            stage,
            engine,
            timestamp: Date.now(),
            status: 'Success'
        });
    }

    _initPipelineListeners() {
        Object.values(PipelineEvents).forEach(eventName => {
            PipelineEmitter.on(eventName, (payload) => {
                const evt = {
                    timestamp: Date.now(),
                    sessionId: this.currentSessionId,
                    event: eventName,
                    payload
                };
                this.sessionData.events.unshift(evt);
                if (this.sessionData.events.length > this.maxItems) this.sessionData.events.pop();
                
                const jobId = payload?.jobId || 'unknown';
                if (!this.sessionData.pipelineTree[jobId]) {
                    this.sessionData.pipelineTree[jobId] = { id: jobId, stages: [] };
                }
                
                const status = eventName.includes('FAILED') ? 'Failed' : (eventName.includes('COMPLETED') ? 'Completed' : 'Running');
                this.sessionData.pipelineTree[jobId].stages.push({
                    stage: eventName,
                    engine: payload?.engine || 'Core',
                    timestamp: Date.now(),
                    status,
                    executionTime: payload?.executionTime || 0
                });
            });
        });
    }

    _initCrashHandlers() {
        process.on('uncaughtException', async (err) => {
            console.error('[CRITICAL] Uncaught Exception:', err);
            await this.generateCrashPackage('UncaughtException', err);
        });

        process.on('unhandledRejection', async (reason, promise) => {
            console.error('[CRITICAL] Unhandled Rejection:', reason);
            await this.generateCrashPackage('UnhandledRejection', reason);
        });
    }

    _startPerformanceMonitor() {
        setInterval(() => {
            const mem = process.memoryUsage();
            this.sessionData.performance.unshift({
                timestamp: Date.now(),
                rss: Math.round(mem.rss / 1024 / 1024),
                heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
                heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
                external: Math.round(mem.external / 1024 / 1024)
            });
            if (this.sessionData.performance.length > 500) this.sessionData.performance.pop();
        }, 10000); // Every 10s
    }

    // ---------- System Info & Masking ----------

    async getSystemInfo() {
        return {
            os: `${os.type()} ${os.release()} (${os.arch()})`,
            cpu: os.cpus()[0]?.model,
            cores: os.cpus().length,
            ramTotal: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
            ramFree: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
            nodeVersion: process.version,
            electronVersion: process.versions.electron || 'N/A',
            appVersion: 'MediaFactory V5',
            uptime: process.uptime()
        };
    }

    maskSensitiveData(dataStr) {
        if (!dataStr) return '';
        let masked = dataStr.replace(/([a-zA-Z0-9_-]{24,})/g, '***MASKED_TOKEN***');
        masked = masked.replace(/(C:\\Users\\[^\\]+)/gi, 'C:\\Users\\***MASKED***');
        masked = masked.replace(/("password"\s*:\s*)"[^"]+"/gi, '$1"***MASKED***"');
        masked = masked.replace(/("api_key"\s*:\s*)"[^"]+"/gi, '$1"***MASKED***"');
        return masked;
    }

    // ---------- Express Middleware ----------

    requestInterceptor() {
        return (req, res, next) => {
            const start = Date.now();
            // Intercept response finish
            res.on('finish', () => {
                const duration = Date.now() - start;
                this.logRequest({
                    endpoint: req.originalUrl,
                    method: req.method,
                    payload: req.body,
                    statusCode: res.statusCode,
                    duration,
                    timestamp: start
                });
            });
            next();
        };
    }

    // ---------- Health Check ----------

    async runHealthCheck() {
        const results = [];
        let score = 100;
        let deductions = 0;

        const addResult = (module, status, detail) => {
            results.push({ module, status, detail });
            if (status === 'FAIL') deductions += 20;
            if (status === 'WARNING') deductions += 5;
        };

        // SQLite Check
        try {
            const dbPath = path.join(AppPaths.getCacheBase(), 'm5', 'production.db');
            if (await fs.stat(dbPath).catch(() => false)) {
                addResult('SQLite Database', 'PASS', 'Database file exists and accessible.');
            } else {
                throw new Error('Not found');
            }
        } catch(e) {
            addResult('SQLite Database', 'FAIL', 'Cannot access production.db');
        }

        // FFmpeg Check
        try {
            const { execSync } = require('child_process');
            const ffmpegBin = AppPaths.getFFmpegPath();
            execSync(`"${ffmpegBin}" -version`, { stdio: 'ignore' });
            addResult('FFmpeg Execution', 'PASS', `FFmpeg accessible at: ${ffmpegBin}`);
        } catch(e) {
            addResult('FFmpeg Execution', 'FAIL', `FFmpeg failed to execute: ${e.message}`);
        }

        // FFprobe Check
        try {
            const { execSync } = require('child_process');
            const ffprobeBin = AppPaths.getFFprobePath();
            execSync(`"${ffprobeBin}" -version`, { stdio: 'ignore' });
            addResult('FFprobe Execution', 'PASS', `FFprobe accessible at: ${ffprobeBin}`);
        } catch(e) {
            addResult('FFprobe Execution', 'FAIL', `FFprobe failed to execute: ${e.message}`);
        }

        // yt-dlp Executable & VC++ Runtime Check
        const ytDlpBin = AppPaths.getYtDlpPath();
        let ytDlpWorking = false;
        try {
            const { execSync } = require('child_process');
            const versionStr = execSync(`"${ytDlpBin}" --version`, { encoding: 'utf8' }).trim();
            ytDlpWorking = true;
            addResult('yt-dlp Engine', 'PASS', `yt-dlp version ${versionStr} running properly at: ${ytDlpBin}`);
        } catch(e) {
            addResult('yt-dlp Engine', 'FAIL', `yt-dlp failed to run (${ytDlpBin}). Error: ${e.message}. Possible cause: Missing Microsoft Visual C++ Redistributable 2015-2022 or blocked by Antivirus.`);
        }

        // YouTube Live Extraction Test
        if (ytDlpWorking) {
            try {
                const { execSync } = require('child_process');
                const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
                const stdout = execSync(`"${ytDlpBin}" --no-check-certificates --dump-json --no-playlist "${testUrl}"`, { timeout: 12000, encoding: 'utf8' });
                if (stdout && stdout.includes('"id":')) {
                    addResult('YouTube Extraction', 'PASS', 'YouTube live metadata extraction verified.');
                } else {
                    addResult('YouTube Extraction', 'FAIL', 'yt-dlp ran but returned invalid JSON output.');
                }
            } catch(e) {
                const errDetail = e.stderr ? e.stderr.toString().replace(/[\r\n]+/g, ' ').trim() : e.message;
                addResult('YouTube Extraction', 'FAIL', `YouTube fetch failed: ${errDetail || 'Code ' + e.status}. yt-dlp may be outdated or blocked by ISP/Firewall.`);
            }
        } else {
            addResult('YouTube Extraction', 'FAIL', 'Skipped because yt-dlp binary is not executable.');
        }

        // Output Directory Check
        try {
            const outPath = AppPaths.getOutputBase();
            if (await fs.stat(outPath).catch(() => false)) {
                addResult('Output Permissions', 'PASS', `Output directory is writable: ${outPath}`);
            } else {
                throw new Error('Not found');
            }
        } catch(e) {
            addResult('Output Permissions', 'WARNING', 'Output directory does not exist yet or not writable.');
        }

        this.healthScore = Math.max(0, score - deductions);
        
        return {
            score: this.healthScore,
            checks: results
        };
    }

    // ---------- Reports & Packages ----------

    async buildAIReport(errorContext = null) {
        const sysInfo = await this.getSystemInfo();
        let report = `# MediaFactory Developer Diagnostics - AI Report\n\n`;
        report += `## Executive Summary\n`;
        report += `Generated: ${new Date().toISOString()}\n`;
        report += `Session ID: ${this.currentSessionId}\n`;
        report += `Application Version: ${sysInfo.appVersion}\n\n`;

        if (errorContext) {
            report += `## Likely Root Cause\n`;
            report += `Type: ${errorContext.type}\n`;
            report += `Message: ${errorContext.error?.message || errorContext.error}\n\n`;
            report += `## Stack Trace\n\`\`\`\n${errorContext.error?.stack || ''}\n\`\`\`\n\n`;
            
            // Try to find the Responsible Engine
            const lastLog = this.sessionData.logs[0];
            report += `## Responsible Engine (Assumed)\n`;
            report += `Engine: ${lastLog ? lastLog.engine : 'Unknown'}\n`;
            report += `Current Stage: ${lastLog ? lastLog.message : 'Unknown'}\n\n`;
        } else {
            report += `## Status\nRoutine diagnostics export. No crash detected.\n\n`;
        }

        report += `## Chronological Timeline Summary\n`;
        const recentEvents = this.sessionData.events.slice(0, 10).reverse();
        recentEvents.forEach(evt => {
            report += `- [${new Date(evt.timestamp).toISOString()}] ${evt.event}\n`;
        });
        report += `\n`;

        report += `## Relevant Logs (Last 15)\n\`\`\`\n`;
        const recentLogs = this.sessionData.logs.slice(0, 15).map(l => `[${l.timestamp}] [${l.level}] [${l.engine}] ${l.message}`).join('\n');
        report += this.maskSensitiveData(recentLogs) + '\n\`\`\`\n\n';

        report += `## Suggested Investigation\n`;
        report += `- Analyze the Stack Trace above.\n`;
        report += `- Cross-reference with the Timeline Summary.\n`;
        report += `- Check \`Requests.json\` and \`SQL.json\` if it's an API/DB issue.\n`;

        return report;
    }

    async buildZipPackage(errorContext = null) {
        const zip = new AdmZip();
        
        const aiReport = await this.buildAIReport(errorContext);
        zip.addFile("AI_Report.md", Buffer.from(aiReport, "utf8"));
        
        const allLogs = this.sessionData.logs.map(l => `[${l.timestamp}] [${l.level}] [${l.engine}] ${l.message}`).join('\n');
        zip.addFile("Logs.txt", Buffer.from(this.maskSensitiveData(allLogs), "utf8"));
        
        const sysInfo = await this.getSystemInfo();
        zip.addFile("System.json", Buffer.from(JSON.stringify(sysInfo, null, 2), "utf8"));
        
        zip.addFile("Requests.json", Buffer.from(this.maskSensitiveData(JSON.stringify(this.sessionData.requests, null, 2)), "utf8"));
        zip.addFile("SQL.json", Buffer.from(this.maskSensitiveData(JSON.stringify(this.sessionData.sql, null, 2)), "utf8"));
        zip.addFile("PipelineEvents.json", Buffer.from(this.maskSensitiveData(JSON.stringify(this.sessionData.events, null, 2)), "utf8"));
        zip.addFile("Performance.json", Buffer.from(JSON.stringify(this.sessionData.performance, null, 2), "utf8"));
        zip.addFile("Snapshots.json", Buffer.from(this.maskSensitiveData(JSON.stringify(this.sessionData.snapshots, null, 2)), "utf8"));
        zip.addFile("FFmpeg.json", Buffer.from(this.maskSensitiveData(JSON.stringify(this.sessionData.ffmpeg, null, 2)), "utf8"));
        
        return zip;
    }

    async generateCrashPackage(type, error) {
        try {
            await this.init();
            // Force save session before generating zip so the zip has the latest data
            await this._saveSession();
            
            const zip = await this.buildZipPackage({ type, error });
            const filename = `CrashPackage_${this.currentSessionId}_${Date.now()}.zip`;
            const dest = path.join(this.diagnosticsDir, filename);
            zip.writeZip(dest);
            console.log(`[DiagnosticsManager] Crash package saved to ${dest}`);
        } catch (e) {
            console.error('[DiagnosticsManager] Failed to generate crash package!', e);
        }
    }
}

module.exports = new DiagnosticsManager();
