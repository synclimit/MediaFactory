class CameraTranslator {
    /**
     * Translates a RenderGraph Camera Node into Abstract Filter Nodes.
     * @param {Object} cameraNode 
     * @param {Object} inputDimensions 
     * @param {Object} outputDimensions 
     * @param {number} fps 
     */
    static translate(cameraNode, inputDimensions, outputDimensions, fps) {
        if (!cameraNode) return [];
        
        const nodes = [];

        // 1. ZOOM / PAN (Rule #4: NO ZOOMPAN FOR VIDEO, replace with crop + scale)
        if ((cameraNode.zoom && cameraNode.zoom !== 1.0) || cameraNode.pan) {
            const zoomVal = cameraNode.zoom ? cameraNode.zoom.toFixed(3) : '1.0';
            let xExpr = '(iw-ow)/2';
            let yExpr = '(ih-oh)/2';

            if (cameraNode.pan === 'tiny_left') xExpr = '(iw-ow)*0.2';
            else if (cameraNode.pan === 'tiny_right') xExpr = '(iw-ow)*0.8';
            else if (cameraNode.pan === 'tiny_up') yExpr = '(ih-oh)*0.2';
            else if (cameraNode.pan === 'tiny_down') yExpr = '(ih-oh)*0.8';

            nodes.push({ 
                filter: 'crop', 
                params: { w: `iw/${zoomVal}`, h: `ih/${zoomVal}`, x: xExpr, y: yExpr }
            });
            nodes.push({
                filter: 'scale',
                params: { w: outputDimensions.w, h: outputDimensions.h, force_original_aspect_ratio: 'increase' }
            });
        } else if (inputDimensions.w !== outputDimensions.w || inputDimensions.h !== outputDimensions.h) {
            // SCALE
            nodes.push({
                filter: 'scale',
                params: { w: outputDimensions.w, h: outputDimensions.h, force_original_aspect_ratio: 'increase' }
            });
        }

        // 2. CROP
        if (cameraNode.crop && cameraNode.crop !== 1.0) {
            nodes.push({
                filter: 'crop',
                params: { w: `iw/${cameraNode.crop}`, h: `ih/${cameraNode.crop}` }
            });
        }

        // 3. ROTATE
        if (cameraNode.rotate) {
            const radians = (cameraNode.rotate * Math.PI) / 180;
            nodes.push({
                filter: 'rotate',
                params: { a: radians, c: 'black' }
            });
        }

        // 4. MIRROR
        if (cameraNode.mirror === 'horizontal') nodes.push({ filter: 'hflip', params: {} });
        if (cameraNode.mirror === 'vertical') nodes.push({ filter: 'vflip', params: {} });

        return nodes;
    }
}

module.exports = CameraTranslator;
