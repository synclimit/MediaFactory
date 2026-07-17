export class BeatTimeline {
    constructor(data = {}) {
        this.duration = data.duration || 0;
        this.globalBpm = data.globalBpm || 0;
        this.lookupResolution = data.lookupResolution || 0.1;

        this.totalBars = data.totalBars || 0;
        this.totalBeats = data.totalBeats || 0;
        this.averageConfidence = data.averageConfidence || 0;
        this.averageEnergy = data.averageEnergy || 0;
        this.timelineDuration = data.timelineDuration || this.duration;
        
        // Ensure events array and its contents are frozen
        this.events = Object.freeze([...(data.events || [])]);
        
        // Deep freeze the spatial index
        const indexCopy = (data.spatialIndex || []).map(bucket => Object.freeze([...bucket]));
        this.spatialIndex = Object.freeze(indexCopy);

        Object.freeze(this);
    }

    _getBucketIndices(time) {
        if (time < 0 || time > this.duration || this.spatialIndex.length === 0) return [];
        const bucketIdx = Math.floor(time / this.lookupResolution);
        return this.spatialIndex[bucketIdx] || [];
    }

    getBeat(time) {
        const indices = this._getBucketIndices(time);
        for (const idx of indices) {
            const ev = this.events[idx];
            if (Math.abs(ev.timestamp - time) < 0.001) {
                return ev;
            }
        }
        return null;
    }

    getNearestBeat(time) {
        const indices = this._getBucketIndices(time);
        let nearest = null;
        let minDist = Infinity;
        
        // Search in the target bucket
        for (const idx of indices) {
            const ev = this.events[idx];
            const dist = Math.abs(ev.timestamp - time);
            if (dist < minDist) {
                minDist = dist;
                nearest = ev;
            }
        }

        // If not found in the target bucket, fallback to checking adjacent buckets 
        // to ensure we really get the nearest.
        if (!nearest) {
            const bucketIdx = Math.floor(time / this.lookupResolution);
            
            // Look behind
            for (let i = bucketIdx - 1; i >= 0; i--) {
                if (this.spatialIndex[i] && this.spatialIndex[i].length > 0) {
                    const idx = this.spatialIndex[i][this.spatialIndex[i].length - 1];
                    const ev = this.events[idx];
                    const dist = Math.abs(ev.timestamp - time);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = ev;
                    }
                    break;
                }
            }

            // Look ahead
            for (let i = bucketIdx + 1; i < this.spatialIndex.length; i++) {
                if (this.spatialIndex[i] && this.spatialIndex[i].length > 0) {
                    const idx = this.spatialIndex[i][0];
                    const ev = this.events[idx];
                    const dist = Math.abs(ev.timestamp - time);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = ev;
                    }
                    break;
                }
            }
        }

        return nearest;
    }

    getPreviousBeat(time) {
        const indices = this._getBucketIndices(time);
        let prev = null;
        for (const idx of indices) {
            const ev = this.events[idx];
            if (ev.timestamp < time) {
                if (!prev || ev.timestamp > prev.timestamp) {
                    prev = ev;
                }
            }
        }
        
        if (!prev) {
            const bucketIdx = Math.floor(time / this.lookupResolution);
            for (let i = bucketIdx - 1; i >= 0; i--) {
                if (this.spatialIndex[i] && this.spatialIndex[i].length > 0) {
                    const idx = this.spatialIndex[i][this.spatialIndex[i].length - 1];
                    const ev = this.events[idx];
                    if (ev.timestamp < time) return ev;
                }
            }
        }
        return prev;
    }

    getNextBeat(time) {
        const indices = this._getBucketIndices(time);
        let next = null;
        for (const idx of indices) {
            const ev = this.events[idx];
            if (ev.timestamp > time) {
                if (!next || ev.timestamp < next.timestamp) {
                    next = ev;
                }
            }
        }
        
        if (!next) {
            const bucketIdx = Math.floor(time / this.lookupResolution);
            for (let i = bucketIdx + 1; i < this.spatialIndex.length; i++) {
                if (this.spatialIndex[i] && this.spatialIndex[i].length > 0) {
                    const idx = this.spatialIndex[i][0];
                    const ev = this.events[idx];
                    if (ev.timestamp > time) return ev;
                }
            }
        }
        return next;
    }

    getEvents(start, end) {
        if (this.spatialIndex.length === 0) return [];

        const startBucket = Math.max(0, Math.floor(start / this.lookupResolution));
        const endBucket = Math.min(this.spatialIndex.length - 1, Math.floor(end / this.lookupResolution));
        
        const resultSet = new Set();
        for (let i = startBucket; i <= endBucket; i++) {
            if (this.spatialIndex[i]) {
                for (const idx of this.spatialIndex[i]) {
                    const ev = this.events[idx];
                    if (ev.timestamp >= start && ev.timestamp <= end) {
                        resultSet.add(ev);
                    }
                }
            }
        }
        
        return Array.from(resultSet).sort((a, b) => a.timestamp - b.timestamp);
    }

    getBar(barIndex) {
        // Linear scan over events (events are sorted by time/barIndex)
        let startIdx = -1;
        let endIdx = -1;

        for (let i = 0; i < this.events.length; i++) {
            if (this.events[i].barIndex === barIndex) {
                if (startIdx === -1) startIdx = i;
                endIdx = i;
            } else if (startIdx !== -1) {
                break;
            }
        }

        if (startIdx === -1) return [];
        return this.events.slice(startIdx, endIdx + 1);
    }
}
