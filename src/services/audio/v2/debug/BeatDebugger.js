import { BeatDebuggerSession } from './BeatDebuggerSession.js';

export class BeatDebugger {
    constructor() {
        this.session = null;
    }

    compileSession(meta, timeline, processorOutputs, validationResults) {
        const debugFrames = [];
        
        // Base our iteration on the energy frames as they represent the fundamental continuous timeline
        const { energyFrames = [] } = processorOutputs;
        
        // Fast map lookup for sparse metrical arrays (Beats, Downbeats, Percussion)
        // Eliminates O(N^2) search overhead.
        const mapEvent = (arr) => {
            const map = new Map();
            (arr || []).forEach(f => {
                const ts = f.timestamp || f.stableTimestamp;
                if (ts !== undefined) map.set(ts.toFixed(3), f);
            });
            return map;
        };

        const stableMap = mapEvent(processorOutputs.stableBeatFrames);
        const downbeatMap = mapEvent(processorOutputs.downbeatFrames);
        const percMap = mapEvent(processorOutputs.percussionFrames);

        for (let i = 0; i < energyFrames.length; i++) {
            const e = energyFrames[i];
            const tsKey = e.timestamp.toFixed(3);

            // Parallel continuous arrays
            const analysis = (processorOutputs.analysisFrames || [])[i] || {};
            const flux = (processorOutputs.spectralFluxFrames || [])[i] || {};
            const peak = (processorOutputs.peakFrames || [])[i] || {};
            const onset = (processorOutputs.onsetFrames || [])[i] || {};
            
            // Sparse timeline lookup
            const stable = stableMap.get(tsKey) || {};
            const downbeat = downbeatMap.get(tsKey) || {};
            const perc = percMap.get(tsKey) || {};
            
            debugFrames.push(Object.freeze({
                timestamp: e.timestamp,
                rms: analysis.rms || 0,
                peak: analysis.peak || 0,
                spectralFlux: flux.spectralFlux || 0,
                adaptiveThreshold: flux.adaptiveThreshold || 0,
                isPeak: peak.isPeak || false,
                isOnset: onset.isOnset || false,
                isBeat: !!stable.stableTimestamp,
                isDownbeat: downbeat.isDownbeat || false,
                bpm: stable.correctedBpm || 0,
                barIndex: downbeat.barIndex || 0,
                kickProb: perc.kick?.probability || 0,
                snareProb: perc.snare?.probability || 0,
                hihatProb: perc.hihat?.probability || 0,
                beatConfidence: downbeat.barConfidence || 0,
                stability: stable.stability || 0,
                cacheStatus: meta.cacheStatus || 'UNCACHED'
            }));
        }

        const timelineSummary = {
            duration: timeline.duration || 0,
            globalBpm: timeline.globalBpm || 0,
            totalBeats: timeline.totalBeats || 0,
            totalBars: timeline.totalBars || 0,
            cacheStatus: meta.cacheStatus || 'UNCACHED'
        };

        this.session = new BeatDebuggerSession({
            audioHash: meta.audioHash,
            analyzerVersion: meta.analyzerVersion,
            analysisParameters: meta.analysisParameters,
            timelineSummary,
            validationResults,
            debugFrames
        });

        return this.session;
    }
}
