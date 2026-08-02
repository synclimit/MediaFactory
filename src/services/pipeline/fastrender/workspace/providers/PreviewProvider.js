/**
 * PreviewProvider.js
 * Rendering provider for Preview Canvas context in MediaFactory M3.
 * Coordinates frame preview evaluation in NORMAL and FAST workspaces without changing procedural effects.
 */

export class PreviewProvider {
    /**
     * @param {string} mode - 'NORMAL' | 'FAST'
     */
    constructor(mode = 'NORMAL') {
        this.mode = mode;
        this.isFastMode = mode === 'FAST';
    }

    /**
     * Get preview pipeline mode
     */
    getMode() {
        return this.mode;
    }

    /**
     * Evaluate preview frame metadata & process visual objects via RenderingContext
     * @param {number} timeSec - Current timecode in seconds
     * @param {Object} projectState - Project state reference
     * @param {import('../RenderingContext.js').RenderingContext} [renderingContext]
     */
    evaluatePreviewFrame(timeSec = 0, projectState = {}, renderingContext = null) {
        const objects = projectState.m3Objects || [];
        const processedObjects = renderingContext && typeof renderingContext.getPreviewObjects === 'function'
            ? renderingContext.getPreviewObjects(objects, timeSec)
            : (this.isFastMode ? objects.filter(o => !o.fastModeSuspended) : objects);

        return {
            mode: this.mode,
            timeSec,
            isFastPreview: this.isFastMode,
            previewEngine: this.isFastMode ? 'FastWorkspacePreviewEngine' : 'NormalWorkspacePreviewEngine',
            activeObjectsCount: processedObjects.length,
            processedObjects
        };
    }

    /**
     * Get preview canvas display settings
     */
    getPreviewSettings() {
        return {
            mode: this.mode,
            badge: this.isFastMode ? '⚡ FAST WORKSPACE PREVIEW' : '🎬 NORMAL PREVIEW',
            overlayColor: this.isFastMode ? 'rgba(249, 115, 22, 0.15)' : 'transparent'
        };
    }
}
