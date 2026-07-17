export class WorkflowRegistry {
    static _workflows = [];

    static register(workflowClass) {
        if (!this._workflows.includes(workflowClass)) {
            this._workflows.push(workflowClass);
        }
    }

    static getWorkflows() {
        return this._workflows;
    }

    static coverage() {
        const totalKnownWorkflows = 5; // Configured for MF-1000B.10
        const implemented = this._workflows.length;
        
        return {
            total: totalKnownWorkflows,
            implemented,
            percentage: Math.round((implemented / totalKnownWorkflows) * 100) || 0
        };
    }
}
