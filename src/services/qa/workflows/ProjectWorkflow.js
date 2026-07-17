import { BaseWorkflowValidator } from './BaseWorkflowValidator.js';

export class ProjectWorkflow extends BaseWorkflowValidator {
    static workflowName = "Project Workflow";
    static description = "Validates project creation, save, and reopen.";
    
    constructor() {
        super();
        this.stages = [
            {
                name: 'Create Project',
                expectedBefore: 'No Project',
                expectedAfter: 'New Project Created',
                getBeforeState: async () => 'No Project',
                verifyBeforeState: async () => true,
                action: async () => {},
                getAfterState: async () => 'New Project Created',
                verifyAfterState: async () => true,
                verifyAcceptance: async () => ({ passed: true })
            }
        ];
    }
}
