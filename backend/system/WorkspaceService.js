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

    setCurrentWorkspace(name, customPath = null) {
        this.currentWorkspace = name;
        if (customPath) {
            try {
                if (require('fs').existsSync(customPath)) {
                    AppPaths.registerWorkspacePath(name, customPath);
                }
            } catch(e) {}
        }
        try {
            AppPaths.setActiveWorkspace(name);
        } catch(e) {}
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

        // 1. Check knownWorkspaces registry (supports any custom partition/folder: E:\, D:\Anywhere, etc.)
        try {
            const known = AppPaths.getKnownWorkspaces();
            if (known && known[name] && require('fs').existsSync(known[name])) {
                return known[name];
            }
            if (known && known[safeName] && require('fs').existsSync(known[safeName])) {
                return known[safeName];
            }
        } catch(e) {}

        // 2. Primary path inside current this.basePath
        const primaryPath = path.join(this.basePath, safeName || 'default');
        const fsSync = require('fs');
        if (fsSync.existsSync(primaryPath)) return primaryPath;

        const os = require('os');
        const candidateBases = [
            this.basePath,
            path.resolve(process.cwd(), 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactory', 'MediaFactoryData', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'mediafactory', 'MediaFactoryData', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactory', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'mediafactory', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactoryData', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'MediaFactoryData', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Local', 'MediaFactory', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'MediaFactory', 'Workspaces'),
            path.join(os.homedir(), 'Documents', 'MediaFactory', 'Workspaces'),
            path.join(os.homedir(), 'Documents', 'MediaFactoryData', 'Workspaces'),
            path.join(os.homedir(), 'Documents', 'MediaFactory'),
            path.join(os.homedir(), 'MediaFactory', 'Workspaces'),
            path.join(os.homedir(), 'MediaFactory'),
            'c:/MediaFactory/Workspaces',
            'c:/MediaFactoryData/Workspaces',
            'c:/.mediafactory_data/Workspaces',
            'd:/MediaFactory/Workspaces',
            'd:/MediaFactory/.mediafactory/Workspaces',
            'd:/MediaFactory/.mediafactory_data/Workspaces',
            'e:/MediaFactory/Workspaces',
            'f:/MediaFactory/Workspaces'
        ];

        // Also check any known workspaces parent directories
        try {
            const known = AppPaths.getKnownWorkspaces();
            for (const kwPath of Object.values(known)) {
                const parent = path.dirname(kwPath);
                if (!candidateBases.includes(parent)) candidateBases.unshift(parent);
            }
        } catch(e) {}

        for (const cb of candidateBases) {
            try {
                const p = path.join(cb, safeName);
                if (fsSync.existsSync(p)) return p;
            } catch(e) {}
        }

        return primaryPath;
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

    async createWorkspace(name, customBasePath = null) {
        const storage = this._getStorage();
        const config = this._getConfig();
        const safeName = String(name).replace(/[/\\?%*:|"<>]/g, '_').trim();
        const workspacePath = customBasePath 
            ? path.join(customBasePath, safeName) 
            : this._getWorkspacePath(name);
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
            try { AppPaths.registerWorkspacePath(name, workspacePath); } catch(e) {}
            this.setCurrentWorkspace(name);
            logMsg('Workspace.Create.AlreadyExists', { ...logData, workspaceId: existingId });
            return { success: true, workspaceId: existingId, workspaceName: name, activeWorkspace: name, existing: true, workspacePath };
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
            try { AppPaths.registerWorkspacePath(name, workspacePath); } catch(e) {}
            this.setCurrentWorkspace(name);

            logMsg('Workspace.Create.Success', logData);
            return { success: true, workspaceId, workspaceName: name, activeWorkspace: name, workspacePath };
            
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
        try { AppPaths.unregisterWorkspacePath(name); } catch(e) {}
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

        const resolvedPath = path.resolve(folderPath);
        let targetWorkspacePath = resolvedPath;
        let workspaceName = path.basename(resolvedPath);

        // Check if the selected folder is directly a workspace or a parent containing workspaces
        const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
        const manifestPath = path.join(resolvedPath, 'workspace.manifest.json');
        const hasManifest = fsSync.existsSync(manifestPath);
        const hasDirectWorkspaceMarkers = hasManifest || entries.some(e => 
            e.isDirectory() && ['Config', 'Projects', 'Assets', 'Output'].includes(e.name)
        );

        if (!hasDirectWorkspaceMarkers) {
            // Check if subdirectories are workspaces (e.g. user chose an entire Workspaces partition root)
            const subdirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
            if (subdirs.length > 0) {
                for (const sub of subdirs) {
                    const subPath = path.join(resolvedPath, sub.name);
                    try {
                        await this._initializeFolderTree(subPath);
                        await this._initializeDatabases(subPath);
                        AppPaths.registerWorkspacePath(sub.name, subPath);
                    } catch(e) {}
                }
                targetWorkspacePath = path.join(resolvedPath, subdirs[0].name);
                workspaceName = subdirs[0].name;
            }
        }

        // Initialize structure and manifest in-place (ZERO-COPY IN-PLACE MOUNTING)
        await this._initializeFolderTree(targetWorkspacePath);
        await this._initializeDatabases(targetWorkspacePath);

        const targetManifest = path.join(targetWorkspacePath, 'workspace.manifest.json');
        if (!fsSync.existsSync(targetManifest)) {
            const config = this._getConfig();
            const manifest = {
                workspaceId: require('crypto').randomUUID(),
                name: workspaceName,
                schemaVersion: 1,
                databaseVersion: 1,
                pluginVersion: 1,
                migrationVersion: 1,
                activePlugins: [],
                compatibleMediaFactoryVersion: "v4.2.0",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await config.save(targetManifest, { data: manifest });
        } else {
            try {
                const config = this._getConfig();
                const mData = await config.load(targetManifest);
                if (mData?.data?.name) workspaceName = mData.data.name;
            } catch(e) {}
        }

        // Save into persistent registry and set as active workspace
        AppPaths.registerWorkspacePath(workspaceName, targetWorkspacePath);
        this.setCurrentWorkspace(workspaceName);
        return { success: true, workspaceName, workspacePath: targetWorkspacePath };
    }

    async _inspectWorkspaceFolder(wsFolder, defaultName, seenNames, workspaces) {
        const fs = require('fs').promises;
        const fsSync = require('fs');
        const path = require('path');

        if (!wsFolder || !fsSync.existsSync(wsFolder)) return;

        const normFolder = path.normalize(wsFolder);
        const folderBasename = path.basename(normFolder);
        const wsName = defaultName || folderBasename;

        const lowerKey = wsName.toLowerCase();
        const lowerBase = folderBasename.toLowerCase();
        const lowerNorm = normFolder.toLowerCase();

        if (seenNames.has(lowerKey) || seenNames.has(lowerBase) || seenNames.has(lowerNorm)) {
            return;
        }

        let manifestData = null;
        const manifestPath = path.join(normFolder, 'workspace.manifest.json');
        try {
            if (fsSync.existsSync(manifestPath)) {
                manifestData = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
            }
        } catch (e) {}

        const configPath = path.join(normFolder, 'Config', 'workspace.json');
        let configData = null;
        let customOutput = null;
        try {
            if (fsSync.existsSync(configPath)) {
                configData = JSON.parse(await fs.readFile(configPath, 'utf8'));
                if (configData?.data?.output?.main && configData.data.output.main !== path.join(normFolder, 'Output')) {
                    customOutput = configData.data.output.main;
                }
            }
        } catch (e) {}

        // Project count
        let totalProjects = 0;
        const projectsPath = path.join(normFolder, 'Projects');
        try {
            if (fsSync.existsSync(projectsPath)) {
                const pEntries = await fs.readdir(projectsPath);
                totalProjects += pEntries.filter(f => !f.startsWith('.')).length;
            }
        } catch (e) {}

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

        // Render count
        let renderCount = 0;
        try {
            renderCount += await this._countMediaFiles(path.join(normFolder, 'Output'));
            renderCount += await this._countMediaFiles(path.join(normFolder, 'Renders'));
            if (customOutput && fsSync.existsSync(customOutput)) {
                renderCount += await this._countMediaFiles(customOutput);
            }
        } catch(e) {}

        // Storage size
        let formattedStorage = '0.00 GB';
        try {
            const dirStats = await this._calculateDirStats(normFolder);
            let totalSizeBytes = dirStats.totalSize;
            if (customOutput && fsSync.existsSync(customOutput)) {
                const customStats = await this._calculateDirStats(customOutput);
                totalSizeBytes += customStats.totalSize;
            }
            if (totalSizeBytes >= 1024 * 1024 * 1024) {
                formattedStorage = `${(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
            } else if (totalSizeBytes >= 1024 * 1024) {
                formattedStorage = `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
            } else if (totalSizeBytes > 0) {
                formattedStorage = `${(totalSizeBytes / 1024).toFixed(0)} KB`;
            }
        } catch(e) {}

        // Last opened
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
                const folderStat = await fs.stat(normFolder);
                lastOpened = folderStat.mtimeMs;
            } catch(e) {
                lastOpened = Date.now();
            }
        }

        const displayName = manifestData?.data?.name || manifestData?.name || wsName;
        const isCurrentActive = Boolean(this.currentWorkspace && (
            this.currentWorkspace.toLowerCase() === lowerKey || 
            this.currentWorkspace.toLowerCase() === displayName.toLowerCase() ||
            this.currentWorkspace.toLowerCase() === lowerBase
        ));

        seenNames.add(lowerKey);
        seenNames.add(displayName.toLowerCase());
        seenNames.add(lowerBase);
        seenNames.add(lowerNorm);

        workspaces.push({
            name: displayName,
            folderName: folderBasename,
            path: normFolder,
            thumbnail: manifestData?.data?.thumbnail || configData?.data?.general?.channelThumbnail || configData?.data?.branding?.logo || null,
            lastOpened: lastOpened,
            totalProjects: totalProjects,
            lastRender: null,
            renderCount: renderCount,
            storageSizeGB: formattedStorage,
            isActive: isCurrentActive
        });
    }

    async listWorkspaces() {
        const fs = require('fs').promises;
        const fsSync = require('fs');
        const os = require('os');
        const path = require('path');

        const workspaces = [];
        const seenNames = new Set();

        // 1. PRIORITY 1: Direct inspection of all knownWorkspaces from persistent registry
        try {
            const known = AppPaths.getKnownWorkspaces();
            if (known && typeof known === 'object') {
                for (const [kName, kPath] of Object.entries(known)) {
                    if (kPath && fsSync.existsSync(kPath)) {
                        await this._inspectWorkspaceFolder(kPath, kName, seenNames, workspaces);
                    }
                }
            }
        } catch(e) {
            console.error('[WorkspaceService] Error loading known workspaces:', e);
        }

        // 2. PRIORITY 2: Scan candidate base directories
        const candidateBases = [
            this.basePath,
            path.resolve(process.cwd(), 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactory', 'MediaFactoryData', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'mediafactory', 'MediaFactoryData', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactory', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'mediafactory', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactoryData', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'MediaFactoryData', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Local', 'MediaFactory', 'Workspaces'),
            path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'MediaFactory', 'Workspaces'),
            path.join(os.homedir(), 'Documents', 'MediaFactory', 'Workspaces'),
            path.join(os.homedir(), 'Documents', 'MediaFactoryData', 'Workspaces'),
            path.join(os.homedir(), 'Documents', 'MediaFactory'),
            path.join(os.homedir(), 'MediaFactory', 'Workspaces'),
            path.join(os.homedir(), 'MediaFactory'),
            'c:/MediaFactory/Workspaces',
            'c:/MediaFactoryData/Workspaces',
            'c:/.mediafactory_data/Workspaces',
            'd:/MediaFactory/Workspaces',
            'd:/MediaFactory/.mediafactory/Workspaces',
            'd:/MediaFactory/.mediafactory_data/Workspaces',
            'e:/MediaFactory/Workspaces',
            'f:/MediaFactory/Workspaces'
        ];

        // Also scan common drive partitions (C through Z) for Workspaces folders
        const driveLetters = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        for (const dl of driveLetters) {
            const paths = [
                `${dl}:/Workspaces`,
                `${dl}:/MediaFactory/Workspaces`,
                `${dl}:/MediaFactoryData/Workspaces`,
                `${dl}:/MediaFactory`
            ];
            for (const p of paths) {
                if (!candidateBases.includes(p)) candidateBases.push(p);
            }
        }

        for (const basePath of candidateBases) {
            try {
                if (!fsSync.existsSync(basePath)) continue;
                const stat = fsSync.statSync(basePath);
                if (!stat.isDirectory()) continue;

                const entries = await fs.readdir(basePath, { withFileTypes: true });

                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        const wsName = entry.name;
                        if (wsName.startsWith('.') || wsName.startsWith('$')) continue;
                        if (seenNames.has(wsName.toLowerCase())) continue;

                        const wsFolder = path.join(basePath, wsName);
                        // Check if it has workspace markers before spending time inspecting
                        const manifestPath = path.join(wsFolder, 'workspace.manifest.json');
                        const configPath = path.join(wsFolder, 'Config', 'workspace.json');
                        const hasProjects = fsSync.existsSync(path.join(wsFolder, 'Projects'));
                        const hasOutput = fsSync.existsSync(path.join(wsFolder, 'Output'));

                        if (fsSync.existsSync(manifestPath) || fsSync.existsSync(configPath) || hasProjects || hasOutput) {
                            await this._inspectWorkspaceFolder(wsFolder, wsName, seenNames, workspaces);
                            try { AppPaths.registerWorkspacePath(wsName, wsFolder); } catch(e) {}
                        }
                    }
                }
            } catch (e) {
                // Ignore inaccessible drives or directories
            }
        }

        // 3. Guarantee any known workspaces that weren't caught yet are included
        try {
            const known = AppPaths.getKnownWorkspaces();
            if (known && typeof known === 'object') {
                for (const [kName, kPath] of Object.entries(known)) {
                    if (kPath && fsSync.existsSync(kPath) && !seenNames.has(kName.toLowerCase()) && !seenNames.has(path.basename(kPath).toLowerCase())) {
                        await this._inspectWorkspaceFolder(kPath, kName, seenNames, workspaces);
                    }
                }
            }
        } catch (e) {}

        if (workspaces.length === 0) {
            try {
                const defaultFolder = path.join(this.basePath, 'Test 1');
                const subDirs = ['Projects', 'Config', 'Assets', 'Output', 'Logs', 'Runtime', 'Cache'];
                subDirs.forEach(sub => {
                    const p = path.join(defaultFolder, sub);
                    if (!fsSync.existsSync(p)) fsSync.mkdirSync(p, { recursive: true });
                });
                const manifestPath = path.join(defaultFolder, 'workspace.manifest.json');
                if (!fsSync.existsSync(manifestPath)) {
                    fsSync.writeFileSync(manifestPath, JSON.stringify({
                        data: {
                            workspaceId: require('crypto').randomUUID(),
                            name: 'Test 1',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        }
                    }, null, 2));
                }
                workspaces.push({
                    name: 'Test 1',
                    folderName: 'Test 1',
                    path: defaultFolder,
                    thumbnail: null,
                    lastOpened: Date.now(),
                    totalProjects: 0,
                    lastRender: null,
                    renderCount: 0,
                    storageSizeGB: '0.00 GB',
                    isActive: true
                });
                try { AppPaths.registerWorkspacePath('Test 1', defaultFolder); } catch(e) {}
            } catch (e) {
                console.error('[WorkspaceService] Failed to auto-create default workspace:', e);
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
