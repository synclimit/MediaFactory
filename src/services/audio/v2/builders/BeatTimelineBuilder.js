import { BeatEvent } from '../models/BeatEvent.js';
import { BeatTimeline } from '../models/BeatTimeline.js';

export class BeatTimelineBuilder {
    constructor() {
        this.config = {
            lookupResolution: 0.1 // 100ms buckets
        };
    }

    initialize(config = {}) {
        this.config = { ...this.config, ...config };
    }

    build(inputData) {
        const percussionFrames = inputData.percussionFrames || [];
        const downbeatFrames = inputData.downbeatFrames || [];
        const onsetFrames = inputData.onsetFrames || [];
        const energyFrames = inputData.energyFrames || [];
        
        if (percussionFrames.length === 0 || downbeatFrames.length === 0) {
            return new BeatTimeline();
        }

        const events = [];
        let totalConfidence = 0;
        let totalEnergy = 0;
        let sumBpm = 0;

        let energyIdx = 0;
        let onsetIdx = 0;

        // Assumes parallel arrays for percussion and downbeat since they share 1:1 mapping
        for (let i = 0; i < percussionFrames.length; i++) {
            const perc = percussionFrames[i];
            const db = downbeatFrames[i]; 

            const ts = db.timestamp;

            // Align closest EnergyFrame
            while (energyIdx < energyFrames.length - 1 && Math.abs(energyFrames[energyIdx + 1].timestamp - ts) < Math.abs(energyFrames[energyIdx].timestamp - ts)) {
                energyIdx++;
            }
            const energyFrame = energyFrames[energyIdx] || { totalEnergy: 0 };

            // Align closest OnsetFrame
            while (onsetIdx < onsetFrames.length - 1 && Math.abs(onsetFrames[onsetIdx + 1].timestamp - ts) < Math.abs(onsetFrames[onsetIdx].timestamp - ts)) {
                onsetIdx++;
            }
            const onsetFrame = onsetFrames[onsetIdx] || { isOnset: false };

            // Build decimated spectrum for offline storage
            let decimatedSpectrum = null;
            if (energyFrame.fftBins && energyFrame.fftBins.length > 0) {
                const targetBands = 64;
                decimatedSpectrum = new Array(targetBands);
                const step = Math.floor(energyFrame.fftBins.length / targetBands);
                if (step > 0) {
                    for (let b = 0; b < targetBands; b++) {
                        let sum = 0;
                        for (let j = 0; j < step; j++) {
                            sum += energyFrame.fftBins[b * step + j] || 0;
                        }
                        decimatedSpectrum[b] = (sum / step) / 255.0; // Normalize 0..1
                    }
                } else {
                    for (let b = 0; b < targetBands; b++) {
                        decimatedSpectrum[b] = (energyFrame.fftBins[b] || 0) / 255.0;
                    }
                }
            }

            const beatEvent = new BeatEvent({
                timestamp: ts,
                bpm: db.correctedBpm,
                beatIndex: i + 1, // Global 1-based index
                barIndex: db.barIndex,
                confidence: db.barConfidence,
                onset: onsetFrame.isOnset || false,
                downbeat: db.isDownbeat,
                kick: perc.kick,
                snare: perc.snare,
                hihat: perc.hihat,
                energy: energyFrame.totalEnergy,
                spectrum: decimatedSpectrum
            });

            events.push(beatEvent);

            totalConfidence += beatEvent.confidence;
            totalEnergy += beatEvent.energy;
            sumBpm += beatEvent.bpm;
        }

        // Guarantee strict monotonic ordering 
        events.sort((a, b) => a.timestamp - b.timestamp);

        // Generate O(1) Spatial Index Bucket Map
        const timelineDuration = events[events.length - 1].timestamp;
        const bucketCount = Math.floor(timelineDuration / this.config.lookupResolution) + 1;
        const spatialIndex = new Array(bucketCount);
        
        for (let i = 0; i < bucketCount; i++) {
            spatialIndex[i] = [];
        }

        for (let i = 0; i < events.length; i++) {
            const ev = events[i];
            const bucketIdx = Math.floor(ev.timestamp / this.config.lookupResolution);
            if (bucketIdx >= 0 && bucketIdx < spatialIndex.length) {
                spatialIndex[bucketIdx].push(i); // Push index, not object
            }
        }

        const globalSummary = {
            duration: timelineDuration,
            globalBpm: sumBpm / events.length,
            lookupResolution: this.config.lookupResolution,
            events,
            spatialIndex,
            
            // Global Summaries
            totalBars: events[events.length - 1].barIndex,
            totalBeats: events.length,
            averageConfidence: totalConfidence / events.length,
            averageEnergy: totalEnergy / events.length,
            timelineDuration
        };

        return new BeatTimeline(globalSummary);
    }
}
