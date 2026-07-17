const TranslatorRegistry = require('../registry/TranslatorRegistry');
const FilterUtils = require('../utils/FilterUtils');
const GraphUtils = require('../utils/GraphUtils');

class VideoChainBuilder {
    /**
     * Translates a video chain from RenderGraph to FFmpeg FilterGraph Nodes.
     * @param {Object} videoChainNode 
     * @param {Object} outputDimensions
     */
    static build(videoChainNode, outputDimensions) {
        // Build the filter chain for this specific video segment
        const filters = [];

        // Note: Real implementation would handle multiple inputs (videoA, videoB) via LayoutEngine nodes here,
        // using [in1][in2]vstack etc. We assume for this prototype translation that basic filters are mapped.

        // 1. Camera (Zoom/Pan/Crop/Rotate)
        const cameraFilter = TranslatorRegistry.camera.translate(
            videoChainNode.camera, 
            { w: outputDimensions.width, h: outputDimensions.height }, // input dims simplified
            outputDimensions, 
            outputDimensions.fps
        );
        if (cameraFilter) filters.push(cameraFilter);

        // 2. Visual (Brightness/Contrast/Hue/etc)
        const visualFilter = TranslatorRegistry.visual.translate(videoChainNode.visual);
        if (visualFilter) filters.push(visualFilter);

        // 3. Motion (Speed/Blend)
        const motionFilter = TranslatorRegistry.motion.translateVideo(videoChainNode.motion);
        if (motionFilter) filters.push(motionFilter);

        const filterStr = FilterUtils.chain(filters);
        
        return {
            chainId: videoChainNode.chainId,
            filterStr: filterStr,
            inLink: null, // to be assigned by FilterGraphBuilder based on input index
            outLink: GraphUtils.generateLinkId('v')
        };
    }
}

module.exports = VideoChainBuilder;
