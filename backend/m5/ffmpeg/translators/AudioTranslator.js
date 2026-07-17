class AudioTranslator {
    /**
     * Translates a RenderGraph Audio Node into Abstract Filter Nodes.
     * @param {Object} audioNode 
     */
    static translate(audioNode) {
        if (!audioNode) return [];
        
        const nodes = [];

        // Rule #7: Audio must follow timeline (atrim, asetpts, afade)
        if (audioNode.targetDuration && audioNode.targetDuration > 0) {
            nodes.push({ filter: 'atrim', params: { start: 0, end: audioNode.targetDuration } });
            nodes.push({ filter: 'asetpts', params: { expr: 'PTS-STARTPTS' } });
        }

        // 1. VOLUME
        if (audioNode.volume !== undefined && audioNode.volume !== 1.0) {
            nodes.push({ filter: 'volume', params: { volume: audioNode.volume.toFixed(4) } });
        }

        // 2. EQUALIZER
        if (audioNode.eqPreset && audioNode.eqPreset !== 'none') {
            if (audioNode.eqPreset === 'bass_boost') {
                nodes.push({ filter: 'bass', params: { g: 5, f: 100 } });
            }
        }

        // 3. FADE IN / OUT
        if (audioNode.fadeIn) {
            const dur = audioNode.fadeInDuration || 1;
            nodes.push({ filter: 'afade', params: { t: 'in', st: 0, d: dur } });
        }
        
        const targetDur = audioNode.targetDuration || audioNode.duration;
        if (audioNode.fadeOut && targetDur > 0) {
            const dur = audioNode.fadeOutDuration || 2;
            const start = Math.max(0, targetDur - dur);
            nodes.push({ filter: 'afade', params: { t: 'out', st: start, d: dur } });
        }

        // 4. NORMALIZE
        if (audioNode.normalize) {
            nodes.push({ filter: 'loudnorm', params: { I: -16, TP: -1.5, LRA: 11 } });
        }

        return nodes;
    }
}

module.exports = AudioTranslator;
