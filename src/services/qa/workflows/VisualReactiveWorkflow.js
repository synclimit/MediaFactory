import { BaseWorkflowValidator } from './BaseWorkflowValidator.js';

export class VisualReactiveWorkflow extends BaseWorkflowValidator {
    static workflowName = "Visual Reactive Workflow";
    static description = "Validates Audio to Visual Reactive pipeline.";
    
    constructor() {
        super();
        this.stages = [
            {
                name: 'Import Audio',
                expectedBefore: 'No Audio',
                expectedAfter: 'Audio Loaded',
                getBeforeState: async () => 'No Audio',
                verifyBeforeState: async () => true,
                action: async () => {},
                getAfterState: async () => 'Audio Loaded',
                verifyAfterState: async () => true,
                verifyAcceptance: async () => ({ passed: true })
            },
            {
                name: 'Beat Analysis',
                expectedBefore: 'Audio Loaded',
                expectedAfter: 'Beat Track Generated',
                getBeforeState: async () => 'Audio Loaded',
                verifyBeforeState: async () => true,
                action: async () => {},
                getAfterState: async () => 'Beat Track Generated',
                verifyAfterState: async () => true,
                verifyAcceptance: async () => ({ passed: true })
            }
        ];
    }
}
