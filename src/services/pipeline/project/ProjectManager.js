/**
 * ProjectManager
 * 
 * Handles serialization and deserialization of the Composer timeline
 * into a JSON project file, saving to localStorage (mock backend)
 * and enabling Autosave, Recovery, New, Open, and Save.
 */

export class ProjectManager {
    constructor() {
        this.currentProject = null;
        this.autoSaveInterval = null;
        this.isAutoSaveEnabled = true;
    }

    createProject(name = "Untitled Project") {
        this.currentProject = {
            id: 'proj_' + Date.now().toString(36),
            name,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            data: {
                m3Objects: [],
                m3AudioTracks: [],
                m3BgPool: []
            }
        };
        return this.currentProject;
    }

    saveProject(state) {
        if (!this.currentProject) {
            this.createProject();
        }
        this.currentProject.updatedAt = Date.now();
        this.currentProject.data = state;

        const projects = this.getAllProjects();
        const existingIdx = projects.findIndex(p => p.id === this.currentProject.id);
        if (existingIdx >= 0) {
            projects[existingIdx] = this.currentProject;
        } else {
            projects.push(this.currentProject);
        }

        localStorage.setItem('mf_projects', JSON.stringify(projects));
        this.saveRecovery(state);
    }

    saveAs(name, state) {
        this.createProject(name);
        this.saveProject(state);
        return this.currentProject;
    }

    openProject(id) {
        const projects = this.getAllProjects();
        const proj = projects.find(p => p.id === id);
        if (proj) {
            this.currentProject = proj;
            return proj.data;
        }
        return null;
    }

    getAllProjects() {
        try {
            return JSON.parse(localStorage.getItem('mf_projects')) || [];
        } catch (e) {
            return [];
        }
    }

    // Auto Recovery System
    saveRecovery(state) {
        localStorage.setItem('mf_recovery', JSON.stringify({
            timestamp: Date.now(),
            state
        }));
    }

    checkRecovery() {
        try {
            return JSON.parse(localStorage.getItem('mf_recovery'));
        } catch (e) {
            return null;
        }
    }

    clearRecovery() {
        localStorage.removeItem('mf_recovery');
    }

    startAutoSave(getStateCallback, onSaveIndicator) {
        if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
        this.autoSaveInterval = setInterval(() => {
            if (this.isAutoSaveEnabled) {
                const state = getStateCallback();
                this.saveProject(state);
                if (onSaveIndicator) onSaveIndicator();
            }
        }, 30000); // 30 seconds
    }

    stopAutoSave() {
        if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    }
}

export const projectManager = new ProjectManager();
