class VisualDraft {
    constructor(data = {}) {
        this.selectedImage = data.selectedImage || null;
        this.score = data.score || 0;
        this.reason = data.reason || '';
        this.portraitDetected = data.portraitDetected || false;
        this.faceCount = data.faceCount || 0;
        this.fitMode = data.fitMode || 'cover';
        this.fallbackMode = data.fallbackMode || 'none';
        this.safeArea = data.safeArea || null;
        this.recommendedTemplate = data.recommendedTemplate || 'Standard';
        this.viewport = data.viewport || { width: 390, height: 844 };
        this.processingTime = data.processingTime || 0;
        this.semanticMatch = data.semanticMatch || false;
        this.imageSource = data.imageSource || 'unknown';
    }
}
module.exports = VisualDraft;