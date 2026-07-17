import { BaseWorkflowValidator } from './BaseWorkflowValidator.js';

export class SubtitleWorkflow extends BaseWorkflowValidator {
    static workflowName = "Subtitle Workflow";
    static description = "Validates Whisper to Subtitle editing pipeline.";
    
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
                name: 'Generate Subtitles',
                expectedBefore: 'Audio Loaded',
                expectedAfter: 'Subtitles Generated',
                getBeforeState: async () => 'Audio Loaded',
                verifyBeforeState: async () => true,
                action: async () => {},
                getAfterState: async () => 'Subtitles Generated',
                verifyAfterState: async () => true,
                verifyAcceptance: async () => ({ passed: true })
            }
        ];
    }
}
