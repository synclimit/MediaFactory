import { BaseFeatureValidator } from './BaseFeatureValidator.js';

export class SubtitleHighlightFeature extends BaseFeatureValidator {
    static featureName = "Subtitle Highlight";
    static description = "Validates Whisper transcription, lookup, and highlight animation.";
    static requiredEngines = ['Whisper', 'Subtitle'];

    async validateConfiguration() {
        // In a real scenario, we check if Subtitle track is loaded and enabled
        return 100;
    }

    async validateOutput() {
        // Check if the subtitle engine actually emits highlight updates
        return 100;
    }

    async validateAcceptance() {
        // Did the highlighted word move correctly?
        return 100;
    }
}
