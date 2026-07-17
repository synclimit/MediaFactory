const FilterUtils = require('../utils/FilterUtils');

class CommandBuilder {
    /**
     * Converts the Abstract FilterGraph and Inputs into FFmpeg CLI syntax.
     * @param {Object} renderGraph 
     * @param {Object} filterGraph 
     * @param {string} encoderFlags
     */
    static build(renderGraph, filterGraph, encoderFlags) {
        const args = [];
        const inputIdToStream = {};
        let inputIndex = 0;
        const inputsList = [];
        
        // 1. Build -i inputs - paths stored exactly as-is
        renderGraph.nodes.forEach(node => {
            if (node.type === 'InputNode' && node.metadata.path) {
                if (node.metadata.isAudio || node.metadata.loop) {
                    // Rule #7: If music shorter loop music (Also applies to looped backgrounds)
                    args.push('-stream_loop', '-1');
                }
                args.push('-i', node.metadata.path);
                inputsList.push(node.metadata.path);

                if (node.metadata.isAudio) {
                    inputIdToStream[node.id] = `${inputIndex}:a`;
                } else {
                    inputIdToStream[node.id] = `${inputIndex}:v`;
                }
                inputIndex++;
            }
        });

        // 2. Build filter_complex
        const complexFilters = [];
        filterGraph.nodes.forEach(fNode => {
            const nodeChains = [];
            fNode.filters.forEach(f => {
                nodeChains.push(FilterUtils.build(f.filter, f.params));
            });
            if (nodeChains.length > 0) {
                const filterStr = FilterUtils.chain(nodeChains);
                const isAudioNode = fNode.type.toUpperCase().includes('AUDIO') || fNode.filters.some(f => ['atrim', 'amix', 'afade', 'volume', 'amerge', 'anull', 'loudnorm', 'bass'].includes(f.filter));
                const inStr = fNode.inputs && fNode.inputs.length > 0
                    ? fNode.inputs.map(i => {
                        let streamName = inputIdToStream[i] || i;
                        if (isAudioNode && typeof streamName === 'string' && streamName.endsWith(':v')) {
                            streamName = streamName.replace(':v', ':a');
                        }
                        return `[${streamName}]`;
                    }).join('')
                    : '';
                const outStr = fNode.outputs && fNode.outputs.length > 0
                    ? fNode.outputs.map(o => `[${o}]`).join('')
                    : '';
                complexFilters.push(`${inStr}${filterStr}${outStr}`);
            }
        });

        const filterComplexStr = complexFilters.join(';');
        if (complexFilters.length > 0) {
            args.push('-filter_complex', filterComplexStr);
        }

        // 3. Stream mapping
        const mapList = [];
        const outNode = renderGraph.nodes.find(n => n.type === 'OutputNode');
        if (outNode && outNode.inputs) {
            outNode.inputs.forEach(i => {
                args.push('-map', `[${i}]`);
                mapList.push(`[${i}]`);
            });
        }

        // If audio wasn't filtered and mapped via inputs, fallback to direct mapping
        if (outNode && !outNode.metadata.hasAudioFilter && typeof outNode.metadata.audioInputIndex === 'number' && outNode.metadata.audioInputIndex >= 0) {
            args.push('-map', `${outNode.metadata.audioInputIndex}:a`);
            mapList.push(`${outNode.metadata.audioInputIndex}:a`);
        }

        args.push('-c:a', 'aac', '-b:a', '192k');

        // 4. Video encoding
        args.push('-c:v', encoderFlags, '-pix_fmt', 'yuv420p', '-movflags', '+faststart');

        const cmdStr = 'ffmpeg ' + args.map(a => (a.includes(' ') || a.includes(';') || a.includes('[') || a.includes(']')) ? `"${a}"` : a).join(' ');
        
        return {
            command: cmdStr,
            args: args,
            inputsList,
            filterComplexStr,
            mapList
        };
    }
}

module.exports = CommandBuilder;
