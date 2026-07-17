/**
 * RenderSurface
 * 
 * An environment-agnostic presentation target. 
 * The Renderer writes to this surface, and the Presentation Layer (e.g., React/DOM)
 * synchronizes with it to produce the final visible output.
 */
export class RenderSurface {
    constructor() {
        this.transform = {
            scale: 1.0,
            x: 0,
            y: 0,
            rotation: 0
        };
        
        this.postProcess = {
            brightness: 1.0,
            contrast: 1.0,
            saturation: 1.0,
            blur: 0
        };
    }

    /**
     * @param {Object} transform 
     */
    applyTransform(transform) {
        if (!transform) return;
        this.transform.scale = transform.scale !== undefined ? transform.scale : this.transform.scale;
        this.transform.x = transform.offsetX !== undefined ? transform.offsetX : this.transform.x;
        this.transform.y = transform.offsetY !== undefined ? transform.offsetY : this.transform.y;
        this.transform.rotation = transform.rotation !== undefined ? transform.rotation : this.transform.rotation;
    }

    applyPostProcess(pp) {
        if (!pp) return;
        this.postProcess.brightness = pp.brightness !== undefined ? pp.brightness : this.postProcess.brightness;
        this.postProcess.contrast = pp.contrast !== undefined ? pp.contrast : this.postProcess.contrast;
        this.postProcess.saturation = pp.saturation !== undefined ? pp.saturation : this.postProcess.saturation;
        this.postProcess.blur = pp.blur !== undefined ? pp.blur : this.postProcess.blur;
    }
}

export const renderSurface = new RenderSurface();
