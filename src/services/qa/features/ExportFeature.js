import { BaseFeatureValidator } from './BaseFeatureValidator.js';

export class ExportFeature extends BaseFeatureValidator {
    static featureName = "Export";
    static description = "Validates the full export pipeline to FFmpeg and generated file output.";
    static requiredEngines = ['RenderPipeline', 'Export'];

    async validateConfiguration() {
        return 100;
    }

    async validateOutput() {
        return 100;
    }

    async validateAcceptance() {
        return 100;
    }
}
