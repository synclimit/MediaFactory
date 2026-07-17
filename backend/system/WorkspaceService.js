const path = require('path');
const crypto = require('crypto');
const ServiceRegistry = require('./ServiceRegistry');
const AppPaths = require('./AppPaths');

class WorkspaceService {
    constructor() {
        this.basePath = AppPaths.getWorkspaceBase();
        this.currentWorkspace = null;
        this.storage = null;
        this.config = null;
    }

    _getStorage() {
        if (!this.storage) this.storage = ServiceRegistry.resolve('StorageService');
        return this.storage;
    }

    _getConfig() {
        if (!this.config) this.config = ServiceRegistry.resolve('ConfigurationService');
        return this.config;
    }

    getCurrentWorkspace() {
        return this.currentWorkspace;
    }

    setCurrentWorkspace(name) {
        this.currentWorkspace = name;
        try {
            const runtime = ServiceRegistry.resolve('RuntimeService');
            if (runtime) {
                runtime.emit('System.WorkspaceChanged', { workspaceName: name });
            }
        } catch (e) {
            // Ignored during initialization before RuntimeService exists
        }
    }

    _getWorkspacePath(name) {
        return path.join(this.basePath, name);
    }

    async _initializeFolderTree(workspacePath) {
        const storage = this._getStorage();
        
        const directories = [
            'Assets/Background', 'Assets/Audio', 'Assets/Fonts', 'Assets/Overlay',
            'Assets/Visualizer', 'Assets/Effects', 'Assets/Branding', 'Assets/Intro',
            'Assets/Outro', 'Assets/Lyrics',
            'Presets/Render', 'Presets/Visualizer', 'Presets/Effects', 'Presets/Overlay',
            'Presets/Branding', 'Presets/Reactive', 'Presets/Text',
            'Plugins',
            'Projects',
            'Database',
            'Config',
            'Logs',
            'Runtime',
            'Cache/thumbnails', 'Cache/previews', 'Cache/metadata',
            'Backup/auto',
            'Trash',
            'Output',
            'Temp'
        ];

        for (const dir of directories) {
            await storage.mkdir(path.join(workspacePath, dir));
        }
    }

    async _initializeDatabases(workspacePath) {
        const config = this._getConfig();
        const databases = ['assets.json', 'projects.json', 'presets.json', 'jobs.json', 'runtime.json', 'plugins.json'];
        
        for (const db of databases) {
            const dbPath = path.join(workspacePath, 'Database', db);
            const storage = this._getStorage();
            if (!await storage.exists(dbPath)) {
                await config.save(dbPath, { data: {} });
            }
        }
    }

    async createWorkspace(name) {
        const storage = this._getStorage();
        const config = this._getConfig();
        const workspacePath = this._getWorkspacePath(name);
        const runtime = ServiceRegistry.resolve('RuntimeService');

        const logMsg = (msg, data = {}) => {
            if (runtime) {
                // If the folder doesn't exist yet, it'll fail writing to disk, but emit works
                try { runtime.workspace(msg, data); } catch (e) {}
                runtime.emit('workspace', { action: msg, ...data });
            }
        };

        const workspaceId = crypto.randomUUID();
        const timestamp = new Date().toISOString();
        const logData = { workspaceId, workspaceName: name, timestamp };

        logMsg('Workspace.Create.Start', logData);
        logMsg('Workspace.Validate', logData);

        if (await storage.exists(workspacePath)) {
            const err = new Error(`Workspace ${name} already exists.`);
            logMsg('Workspace.Create.Error', { ...logData, error: err.message });
            throw err;
        }

        try {
            logMsg('Workspace.Create.Folders', logData);
            await this._initializeFolderTree(workspacePath);
            
            // To allow logs to actually write to disk for subsequent steps
            const previousWorkspace = this.currentWorkspace;
            this.currentWorkspace = name; 

            logMsg('Workspace.Create.Databases', logData);
            await this._initializeDatabases(workspacePath);

            logMsg('Workspace.Create.Manifest', logData);
            const manifestPath = path.join(workspacePath, 'workspace.manifest.json');
            const manifest = {
                workspaceId: workspaceId,
                name: name,
                schemaVersion: 1,
                databaseVersion: 1,
                pluginVersion: 1,
                migrationVersion: 1,
                activePlugins: [],
                compatibleMediaFactoryVersion: "v4.2.0",
                createdAt: timestamp,
                updatedAt: timestamp
            };
            await config.save(manifestPath, { data: manifest });

            logMsg('Workspace.Active.Set', logData);
            this.setCurrentWorkspace(name);

            logMsg('Workspace.Create.Success', logData);
            return { success: true, workspaceId, workspaceName: name, activeWorkspace: name };
            
        } catch (error) {
            logMsg('Workspace.Create.Error', { ...logData, error: error.message });
            
            // Rollback
            if (await storage.exists(workspacePath)) {
                await storage.delete(workspacePath);
            }
            if (this.currentWorkspace === name) {
                this.currentWorkspace = null;
            }
            throw error;
        }
    }

    async initializeWorkspace(name) {
        const storage = this._getStorage();
        const workspacePath = this._getWorkspacePath(name);
        
        if (!await storage.exists(workspacePath)) {
            await this.createWorkspace(name);
        } else {
            await this._initializeFolderTree(workspacePath);
            await this._initializeDatabases(workspacePath);
        }
        
        this.setCurrentWorkspace(name);
    }

    async deleteWorkspace(name) {
        const storage = this._getStorage();
        const workspacePath = this._getWorkspacePath(name);
        if (await storage.exists(workspacePath)) {
            await storage.delete(workspacePath);
            if (this.currentWorkspace === name) {
                this.currentWorkspace = null;
            }
        }
    }

    async renameWorkspace(oldName, newName) {
        const storage = this._getStorage();
        const oldPath = this._getWorkspacePath(oldName);
        const newPath = this._getWorkspacePath(newName);
        
        if (!await storage.exists(oldPath)) {
            throw new Error(`Workspace ${oldName} not found.`);
        }
        if (await storage.exists(newPath)) {
            throw new Error(`Workspace ${newName} already exists.`);
        }

        await storage.rename(oldPath, newName);
        
        const config = this._getConfig();
        const manifestPath = path.join(newPath, 'workspace.manifest.json');
        const manifestData = await config.load(manifestPath);
        if (manifestData) {
            manifestData.data.name = newName;
            await config.save(manifestPath, manifestData);
        }

        if (this.currentWorkspace === oldName) {
            this.setCurrentWorkspace(newName);
        }
    }

    async duplicateWorkspace(sourceName, targetName) {
        const storage = this._getStorage();
        const srcPath = this._getWorkspacePath(sourceName);
        const targetPath = this._getWorkspacePath(targetName);

        if (!await storage.exists(srcPath)) {
            throw new Error(`Workspace ${sourceName} not found.`);
        }
        if (await storage.exists(targetPath)) {
            throw new Error(`Workspace ${targetName} already exists.`);
        }

        await storage.copy(srcPath, targetPath);
        
        // Update manifest of the copy
        const config = this._getConfig();
        const manifestPath = path.join(targetPath, 'workspace.manifest.json');
        const manifestData = await config.load(manifestPath);
        if (manifestData) {
            manifestData.data.name = targetName;
            manifestData.data.workspaceId = crypto.randomUUID(); // Fresh ID
            await config.save(manifestPath, manifestData);
        }
    }

    async backupWorkspace(name) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `${name}-backup-${timestamp}`;
        await this.duplicateWorkspace(name, backupName);
        return backupName;
    }

    async listWorkspaces() {
        const storage = this._getStorage();
        const config = this._getConfig();
        
        if (!await storage.exists(this.basePath)) {
            return [];
        }

        const entries = await storage.readDir(this.basePath);
        const workspaces = [];

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const manifestPath = path.join(this.basePath, entry.name, 'workspace.manifest.json');
                if (await storage.exists(manifestPath)) {
                    const manifestData = await config.load(manifestPath);
                    // Generate basic stats (Last Opened, Projects, etc)
                    // Stubbed logic for now
                    const projectsPath = path.join(this.basePath, entry.name, 'Projects');
                    const projectEntries = await storage.readDir(projectsPath);
                    const totalProjects = projectEntries.filter(p => p.isFile()).length;

                    workspaces.push({
                        name: entry.name,
                        thumbnail: manifestData?.data?.thumbnail || null,
                        lastOpened: manifestData?.data?.updatedAt || manifestData?.data?.createdAt,
                        totalProjects: totalProjects,
                        lastRender: null,
                        renderCount: 0
                    });
                }
            }
        }
        return workspaces;
    }

    async getSettings(name) {
        const config = this._getConfig();
        const settingsPath = path.join(this._getWorkspacePath(name), 'Config', 'workspace.json');
        let settings = await config.load(settingsPath);
        
        if (!settings) {
            // Default settings structure if it doesn't exist
            settings = {
                data: {
                    general: { channelName: name, channelThumbnail: null },
                    branding: { logo: null, watermark: null, subscribeAnim: null, intro: null, outro: null, defaultFont: null },
                    output: { main: 'Output' },
                    hardware: { profile: 'Balanced', autoDetect: true, preferredEncoder: 'Auto' },
                    videoOutput: { resolution: '1080p', fps: 30, codec: 'H264', pixelFormat: 'YUV420P', bitrate: '10M' }
                }
            };
            await config.save(settingsPath, settings);
        } else {
            // Migration for older workspaces
            if (!settings.data.output) settings.data.output = {};
            if (settings.data.output.m1 && !settings.data.output.main) {
                settings.data.output.main = settings.data.output.m1.replace('/M1', '').replace('\\M1', '');
                delete settings.data.output.m1;
                delete settings.data.output.m2;
                delete settings.data.output.m3;
                delete settings.data.output.m4;
                delete settings.data.output.m5;
                await config.save(settingsPath, settings);
            }
        }
        return settings;
    }

    async saveSettings(name, payload) {
        const config = this._getConfig();
        const settingsPath = path.join(this._getWorkspacePath(name), 'Config', 'workspace.json');
        
        const existing = await this.getSettings(name);
        existing.data = { ...existing.data, ...payload };
        
        return await config.save(settingsPath, existing);
    }

    // --- Path Resolvers ---
    _getActivePath() {
        if (!this.currentWorkspace) throw new Error("No active workspace set.");
        return this._getWorkspacePath(this.currentWorkspace);
    }

    getConfigPath(panel) {
        return path.join(this._getActivePath(), 'Config', `${panel}.json`);
    }

    getAssetsPath(category) {
        return path.join(this._getActivePath(), 'Assets', category);
    }

    getOutputPath() {
        return path.join(this._getActivePath(), 'Output');
    }

    getLogsPath() {
        return path.join(this._getActivePath(), 'Logs');
    }

    getRuntimePath() {
        return path.join(this._getActivePath(), 'Runtime');
    }

    getCachePath() {
        return path.join(this._getActivePath(), 'Cache');
    }
}

module.exports = WorkspaceService;
