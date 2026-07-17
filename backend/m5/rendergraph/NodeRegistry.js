const crypto = require('crypto');

class NodeRegistry {
    static nodeTypes = new Set([
        'InputNode',
        'TrimNode',
        'CropNode',
        'ScaleNode',
        'VisualNode',
        'CameraNode',
        'OverlayNode',
        'TransitionNode',
        'AudioNode',
        'ConcatNode',
        'EncoderNode',
        'OutputNode',
        'MotionNode',
        'CompositeNode',
        'AudioTrimNode',
        'AudioMixNode',
        'BackgroundFilterNode',
        'SplitNode',
        'UniqueizationNode',
        'TextOverlayNode'
    ]);

    /**
     * Registers a new node type (e.g. from a plugin)
     * @param {string} typeName 
     */
    static registerType(typeName) {
        this.nodeTypes.add(typeName);
    }

    /**
     * Instantiates an abstract RenderGraph node.
     * @param {string} type 
     * @param {Object} metadata 
     * @param {Array} inputs 
     * @param {Array} outputs 
     * @param {number} executionOrder 
     */
    static create(type, metadata = {}, inputs = [], outputs = [], executionOrder = 0) {
        if (!this.nodeTypes.has(type)) {
            throw new Error(`Node type ${type} is not registered in NodeRegistry.`);
        }

        return {
            id: crypto.randomUUID(),
            type: type,
            inputs: inputs,
            outputs: outputs,
            dependencies: [...inputs],
            metadata: metadata,
            executionOrder: executionOrder,
            nodeVersion: '1.0'
        };
    }
}

module.exports = NodeRegistry;
