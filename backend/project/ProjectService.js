const path = require('path');
const crypto = require('crypto');
const ServiceRegistry = require('../system/ServiceRegistry');

class ProjectService {
    constructor() {
        this.currentProject = null;
        this.workspace = null;
        this.config = null;
    }

    _getWorkspace() {
        if (!this.workspace) this.workspace = ServiceRegistry.resolve('WorkspaceService');
        return this.workspace;
    }

    _getConfig() {
        if (!this.config) this.config = ServiceRegistry.resolve('ConfigurationService');
        return this.config;
    }
    
    _getRuntime() {
        return ServiceRegistry.resolve('RuntimeService');
    }

    async _updateIndex(projectId, projectData, action = 'upsert') {
        const workspaceService = this._getWorkspace();
        const configService = this._getConfig();
        const indexPath = path.join(workspaceService._getActivePath(), 'Database', 'projects.json');
        
        let index = await configService.load(indexPath);
        if (!index) {
            index = { data: { projects: {} } };
        }
        
        if (action === 'delete') {
            delete index.data.projects[projectId];
        } else {
            index.data.projects[projectId] = {
                id: projectId,
                name: projectData.projectInfo.name,
                createdAt: projectData.projectInfo.createdAt,
                updatedAt: new Date().toISOString()
            };
        }
        
        await configService.save(indexPath, index);
    }

    async create(name) {
        const workspaceService = this._getWorkspace();
        const configService = this._getConfig();
        
        const projectId = crypto.randomUUID();
        const projectPath = path.join(workspaceService._getActivePath(), 'Projects', `${projectId}.json`);
        
        const now = new Date().toISOString();
        const projectData = {
            projectInfo: {
                name: name,
                createdAt: now
            },
            assetReferences: {},
            renderQueue: [],
            timelineState: { zoom: 1.0, positionSec: 0 },
            uiState: { selectedObjectId: null },
            panelConfigs: {}
        };

        const savedData = await configService.save(projectPath, { data: projectData });
        await this._updateIndex(projectId, savedData.data, 'upsert');
        
        this._getRuntime().emit('Project.Created', { projectId, name });
        return projectId;
    }

    async load(projectId) {
        const workspaceService = this._getWorkspace();
        const configService = this._getConfig();
        const projectPath = path.join(workspaceService._getActivePath(), 'Projects', `${projectId}.json`);
        
        const data = await configService.load(projectPath);
        if (!data) throw new Error(`Project ${projectId} not found`);
        
        this.currentProject = projectId;
        this._getRuntime().emit('System.ProjectLoaded', { projectId });
        return data.data;
    }

    async save(projectId, projectDataPayload) {
        const workspaceService = this._getWorkspace();
        const configService = this._getConfig();
        const projectPath = path.join(workspaceService._getActivePath(), 'Projects', `${projectId}.json`);
        
        const existingData = await configService.load(projectPath);
        if (!existingData) throw new Error(`Project ${projectId} not found`);

        existingData.data = { ...existingData.data, ...projectDataPayload };
        const savedData = await configService.save(projectPath, existingData);
        
        await this._updateIndex(projectId, savedData.data, 'upsert');
        this._getRuntime().emit('System.ProjectSaved', { projectId });
        
        return savedData.data;
    }

    async delete(projectId) {
        const workspaceService = this._getWorkspace();
        const storageService = ServiceRegistry.resolve('StorageService');
        const configService = this._getConfig();
        
        const projectPath = path.join(workspaceService._getActivePath(), 'Projects', `${projectId}.json`);
        
        if (await storageService.exists(projectPath)) {
            // Move to Trash per Workspace Architecture Rules
            const trashPath = path.join(workspaceService._getActivePath(), 'Trash', `${projectId}.json`);
            await storageService.move(projectPath, trashPath);
            configService.invalidateCache(projectPath);
        }

        await this._updateIndex(projectId, null, 'delete');
        if (this.currentProject === projectId) {
            this.currentProject = null;
        }
        this._getRuntime().emit('Project.Deleted', { projectId });
    }

    async duplicate(sourceId, targetName) {
        const sourceData = await this.load(sourceId);
        const newProjectId = await this.create(targetName);
        
        const duplicatedData = {
            ...sourceData,
            projectInfo: {
                name: targetName,
                createdAt: new Date().toISOString()
            }
        };
        
        await this.save(newProjectId, duplicatedData);
        return newProjectId;
    }
}

module.exports = ProjectService;
