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
        try {
            const fs = require('fs');
            if (!fs.existsSync(this.basePath)) {
                fs.mkdirSync(this.basePath, { recursive: true });
            }
        } catch(e) {}
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
        if (!name) return path.join(this.basePath, 'default');
        const safeName = String(name).replace(/[/\\?%*:|"<>]/g, '_').trim();
        return path.join(this.basePath, safeName || 'default');
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
            const manifestPath = path.join(workspacePath, 'workspace.manifest.json');
            let existingId = workspaceId;
            try {
                const manifestData = await config.load(manifestPath);
                if (manifestData && manifestData.data && manifestData.data.workspaceId) {
                    existingId = manifestData.data.workspaceId;
                }
            } catch(e) {}
            this.setCurrentWorkspace(name);
            logMsg('Workspace.Create.AlreadyExists', { ...logData, workspaceId: existingId });
            return { success: true, workspaceId: existingId, workspaceName: name, activeWorkspace: name, existing: true };
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

        await storage.rename(oldPath, newPath);
        
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

    async _calculateDirStats(dirPath) {
        const fs = require('fs').promises;
        const fsSync = require('fs');
        const path = require('path');
        let totalSize = 0;
        let fileCount = 0;

        if (!fsSync.existsSync(dirPath)) {
            return { totalSize: 0, fileCount: 0 };
        }

        const walk = async (currentPath) => {
            try {
                const entries = await fs.readdir(currentPath, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(currentPath, entry.name);
                    if (entry.isDirectory()) {
                        await walk(fullPath);
                    } else if (entry.isFile()) {
                        try {
                            const stat = await fs.stat(fullPath);
                            totalSize += stat.size;
                            fileCount++;
                        } catch(e) {}
                    }
                }
            } catch (e) {
                // Ignore missing folders/permissions
            }
        };
        await walk(dirPath);
        return { totalSize, fileCount };
    }

    async _countMediaFiles(dirPath) {
        const fs = require('fs').promises;
        const fsSync = require('fs');
        const path = require('path');
        let count = 0;

        if (!fsSync.existsSync(dirPath)) return 0;

        const mediaExts = new Set(['.mp4', '.mkv', '.mov', '.avi', '.webm', '.flv', '.m4v']);

        const walk = async (currentPath) => {
            try {
                const entries = await fs.readdir(currentPath, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(currentPath, entry.name);
                    if (entry.isDirectory()) {
                        await walk(fullPath);
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name).toLowerCase();
                        if (mediaExts.has(ext)) {
                            count++;
                        }
                    }
                }
            } catch (e) {}
        };
        await walk(dirPath);
        return count;
    }

    async importWorkspaceFromFolder(folderPath) {
        const fs = require('fs').promises;
        const fsSync = require('fs');
        const path = require('path');
        
        if (!folderPath || !fsSync.existsSync(folderPath)) {
            throw new Error('Folder path does not exist');
        }

        const folderName = path.basename(folderPath);
        const targetPath = path.join(this.basePath, folderName);

        // If not already in this.basePath, copy it
        if (path.resolve(folderPath).toLowerCase() !== path.resolve(targetPath).toLowerCase()) {
            const storage = this._getStorage();
            if (!fsSync.existsSync(targetPath)) {
                await storage.copy(folderPath, targetPath);
            }
        }

        // Initialize structure and manifest if needed
        await this._initializeFolderTree(targetPath);
        await this._initializeDatabases(targetPath);

        const manifestPath = path.join(targetPath, 'workspace.manifest.json');
        if (!fsSync.existsSync(manifestPath)) {
            const config = this._getConfig();
            const manifest = {
                workspaceId: require('crypto').randomUUID(),
                name: folderName,
                schemaVersion: 1,
                databaseVersion: 1,
                pluginVersion: 1,
                migrationVersion: 1,
                activePlugins: [],
                compatibleMediaFactoryVersion: "v4.2.0",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await config.save(manifestPath, { data: manifest });
        }

        this.setCurrentWorkspace(folderName);
        return { success: true, workspaceName: folderName };
    }

    async listWorkspaces() {
        const fs = require('fs').promises;
        const fsSync = require('fs');
        const os = require('os');
        const path = require('path');

        const candidateBases = [
            this.basePath,
            path.resolve(process.cwd(), 'Workspaces'),
            'd:/MediaFactory/Workspaces',
            'd:/MediaFactory/.mediafactory/Workspaces',
            'd:/MediaFactory/.mediafactory_data/Workspaces',
            'e:/MediaFactory/Workspaces',
            'f:/MediaFactory/Workspaces'
        ];

        const workspaces = [];
        const seenNames = new Set();

        for (const basePath of candidateBases) {
            try {
                if (!fsSync.existsSync(basePath)) continue;
                const entries = await fs.readdir(basePath, { withFileTypes: true });

                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        const wsName = entry.name;
                        if (seenNames.has(wsName) || wsName.startsWith('.')) continue;

                        const wsFolder = path.join(basePath, wsName);

                        // If discovered in another candidate path, ensure it is mirrored to this.basePath
                        if (path.resolve(basePath).toLowerCase() !== path.resolve(this.basePath).toLowerCase()) {
                            const targetFolder = path.join(this.basePath, wsName);
                            if (!fsSync.existsSync(targetFolder)) {
                                try {
                                    const storage = this._getStorage();
                                    await storage.copy(wsFolder, targetFolder);
                                } catch(err) {}
                            }
                        }

                        const manifestPath = path.join(wsFolder, 'workspace.manifest.json');
                        const configPath = path.join(wsFolder, 'Config', 'workspace.json');

                        seenNames.add(wsName);

                        let manifestData = null;
                        try {
                            if (fsSync.existsSync(manifestPath)) {
                                manifestData = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
                            }
                        } catch (e) {}

                        // 1. Calculate Real Project Count (Projects folder + output project directories)
                        let totalProjects = 0;
                        const projectsPath = path.join(wsFolder, 'Projects');
                        try {
                            if (fsSync.existsSync(projectsPath)) {
                                const pEntries = await fs.readdir(projectsPath);
                                totalProjects += pEntries.filter(f => !f.startsWith('.')).length;
                            }
                        } catch (e) {}

                        // Read config data
                        let configData = null;
                        let customOutput = null;
                        try {
                            if (fsSync.existsSync(configPath)) {
                                configData = JSON.parse(await fs.readFile(configPath, 'utf8'));
                                if (configData?.data?.output?.main && configData.data.output.main !== path.join(wsFolder, 'Output')) {
                                    customOutput = configData.data.output.main;
                                }
                            }
                        } catch (e) {}

                        // Scan sub-project folders in custom output (M1, M2, M3 Fast/Normal, M4, M5, M7)
                        if (customOutput && fsSync.existsSync(customOutput)) {
                            const scanSubdirs = async (dir) => {
                                try {
                                    if (!fsSync.existsSync(dir)) return 0;
                                    const entries = await fs.readdir(dir, { withFileTypes: true });
                                    return entries.filter(e => e.isDirectory() && !e.name.startsWith('.')).length;
                                } catch(e) { return 0; }
                            };
                            totalProjects += await scanSubdirs(path.join(customOutput, 'M1'));
                            totalProjects += await scanSubdirs(path.join(customOutput, 'M2'));
                            totalProjects += await scanSubdirs(path.join(customOutput, 'M3', 'Fast Render'));
                            totalProjects += await scanSubdirs(path.join(customOutput, 'M3', 'Normal Render'));
                            totalProjects += await scanSubdirs(path.join(customOutput, 'M4'));
                            totalProjects += await scanSubdirs(path.join(customOutput, 'M5'));
                            totalProjects += await scanSubdirs(path.join(customOutput, 'M6'));
                            totalProjects += await scanSubdirs(path.join(customOutput, 'M7'));
                            totalProjects += await scanSubdirs(path.join(customOutput, 'M7_Astrofox'));
                        }

                        // 2. Calculate Real Render Count from Output / Renders folders
                        let renderCount = 0;
                        const defaultOutputDir = path.join(wsFolder, 'Output');
                        const rendersDir = path.join(wsFolder, 'Renders');
                        renderCount += await this._countMediaFiles(defaultOutputDir);
                        renderCount += await this._countMediaFiles(rendersDir);

                        if (customOutput && fsSync.existsSync(customOutput)) {
                            renderCount += await this._countMediaFiles(customOutput);
                        }

                        // 3. Calculate Real Storage Size in Bytes
                        const dirStats = await this._calculateDirStats(wsFolder);
                        let totalSizeBytes = dirStats.totalSize;
                        if (customOutput && fsSync.existsSync(customOutput)) {
                            const customStats = await this._calculateDirStats(customOutput);
                            totalSizeBytes += customStats.totalSize;
                        }

                        let formattedStorage = '0.00 GB';
                        if (totalSizeBytes >= 1024 * 1024 * 1024) {
                            formattedStorage = `${(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
                        } else if (totalSizeBytes >= 1024 * 1024) {
                            formattedStorage = `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
                        } else if (totalSizeBytes > 0) {
                            formattedStorage = `${(totalSizeBytes / 1024).toFixed(0)} KB`;
                        } else {
                            formattedStorage = '0.00 GB';
                        }

                        // 4. Calculate Real Last Opened Timestamp (Prefer config/settings updatedAt or manifest lastOpened)
                        let lastOpened = null;
                        if (manifestData?.data?.lastOpened) {
                            lastOpened = manifestData.data.lastOpened;
                        } else if (configData?.updatedAt) {
                            lastOpened = configData.updatedAt;
                        } else if (manifestData?.data?.updatedAt && manifestData.data.updatedAt !== manifestData?.data?.createdAt) {
                            lastOpened = manifestData.data.updatedAt;
                        } else if (configData?.createdAt) {
                            lastOpened = configData.createdAt;
                        } else {
                            try {
                                const folderStat = await fs.stat(wsFolder);
                                lastOpened = folderStat.mtimeMs;
                            } catch(e) {
                                lastOpened = Date.now();
                            }
                        }

                        const displayName = manifestData?.data?.name || manifestData?.name || wsName;
                        const isCurrentActive = Boolean(this.currentWorkspace && (this.currentWorkspace.toLowerCase() === wsName.toLowerCase() || this.currentWorkspace.toLowerCase() === displayName.toLowerCase()));

                        workspaces.push({
                            name: displayName,
                            folderName: wsName,
                            thumbnail: manifestData?.data?.thumbnail || configData?.data?.general?.channelThumbnail || configData?.data?.branding?.logo || null,
                            lastOpened: lastOpened,
                            totalProjects: totalProjects,
                            lastRender: null,
                            renderCount: renderCount,
                            storageSizeGB: formattedStorage,
                            isActive: isCurrentActive
                        });
                    }
                }
            } catch (e) {
                console.error('[WorkspaceService] Error scanning path:', basePath, e);
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
        
        // Auto-create output folder structure when output.main is set
        if (payload.output && payload.output.main) {
            const outPath = payload.output.main;
            const fs = require('fs');
            
            const dirsToCreate = [
                outPath,
                path.join(outPath, 'M1'),
                path.join(outPath, 'M2'),
                path.join(outPath, 'M2', 'Audio Compiler'),
                path.join(outPath, 'M2', 'Playlist Splitter'),
                path.join(outPath, 'M2', 'Asset Generator'),
                path.join(outPath, 'M3'),
                path.join(outPath, 'M4'),
                path.join(outPath, 'M5'),
                path.join(outPath, 'M6')
            ];
            
            for (const dir of dirsToCreate) {
                if (!fs.existsSync(dir)) {
                    try {
                        fs.mkdirSync(dir, { recursive: true });
                    } catch (e) {
                        console.error('Failed to create output directory:', dir, e);
                    }
                }
            }
        }
        
        return await config.save(settingsPath, existing);
    }

    // --- Path Resolvers ---
    _getActivePath() {
        if (!this.currentWorkspace) {
            try {
                const fs = require('fs');
                if (fs.existsSync(this.basePath)) {
                    const entries = fs.readdirSync(this.basePath);
                    for (const entry of entries) {
                        if (!entry.startsWith('.')) {
                            this.currentWorkspace = entry;
                            break;
                        }
                    }
                }
            } catch(e) {}
            if (!this.currentWorkspace) this.currentWorkspace = 'default';
        }
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
