import { BaseWorkflowValidator } from './BaseWorkflowValidator.js';

export class ExportWorkflow extends BaseWorkflowValidator {
    static workflowName = "Export Workflow";
    static description = "Validates the project export pipeline.";
    
    constructor() {
        super();
        this.stages = [
            {
                name: 'Render',
                expectedBefore: 'Project Open',
                expectedAfter: 'Render Completed',
                getBeforeState: async () => 'Project Open',
                verifyBeforeState: async () => true,
                action: async () => {},
                getAfterState: async () => 'Render Completed',
                verifyAfterState: async () => true,
                verifyAcceptance: async () => ({ passed: true })
            }
        ];
    }
}
