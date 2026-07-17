const EventEmitter = require('events');
const ServiceRegistry = require('./ServiceRegistry');
const path = require('path');

class RuntimeService extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100);
        this.logChannels = ['timeline', 'performance', 'api', 'ffmpeg', 'validation', 'workspace', 'project', 'crash'];
    }

    _getWorkspace() {
        return ServiceRegistry.resolve('WorkspaceService');
    }

    _getStorage() {
        return ServiceRegistry.resolve('StorageService');
    }

    emit(eventNamespace, payload) {
        // Broadcast exact match e.g. "System.WorkspaceChanged"
        super.emit(eventNamespace, payload);
        
        // Broadcast wildcard match e.g. "System.*"
        const [domain, action] = eventNamespace.split('.');
        if (domain && action) {
            super.emit(`${domain}.*`, { event: action, payload });
        }
        
        return true;
    }

    async _writeLog(channel, message, data = {}) {
        if (!this.logChannels.includes(channel)) {
            channel = 'crash'; // Fallback
        }
        
        try {
            const workspaceService = this._getWorkspace();
            const storage = this._getStorage();
            
            if (!workspaceService.getCurrentWorkspace()) return;

            const runtimePath = workspaceService.getRuntimePath();
            const logFile = path.join(runtimePath, `${channel}.log`);
            
            const logEntry = `[${new Date().toISOString()}] ${message} ${JSON.stringify(data)}\n`;
            
            let currentContent = '';
            if (await storage.exists(logFile)) {
                currentContent = await storage.read(logFile);
            }
            await storage.write(logFile, currentContent + logEntry);
        } catch (error) {
            console.error("RuntimeService Log Write Failed", error);
        }
    }

    // Direct explicit logger methods
    timeline(msg, data) { this._writeLog('timeline', msg, data); }
    performance(msg, data) { this._writeLog('performance', msg, data); }
    api(msg, data) { this._writeLog('api', msg, data); }
    ffmpeg(msg, data) { this._writeLog('ffmpeg', msg, data); }
    validation(msg, data) { this._writeLog('validation', msg, data); }
    workspace(msg, data) { this._writeLog('workspace', msg, data); }
    project(msg, data) { this._writeLog('project', msg, data); }
    crash(msg, data) { this._writeLog('crash', msg, data); }
}

module.exports = RuntimeService;
