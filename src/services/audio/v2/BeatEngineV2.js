import { DSPPipeline } from './dsp/DSPPipeline.js';
import { BeatTimelineBuilder } from './builders/BeatTimelineBuilder.js';
import { BeatCacheManager } from './cache/BeatCacheManager.js';
import { BeatDebugger } from './debug/BeatDebugger.js';

const ENGINE_STATES = {
    IDLE: 'Idle',
    ANALYZING: 'Analyzing',
    READY: 'Ready',
    DISPOSED: 'Disposed'
};

export class BeatEngineV2 {
    constructor() {
        this.pipeline = new DSPPipeline();
        this.timelineBuilder = new BeatTimelineBuilder();
        this.cacheManager = new BeatCacheManager();
        this.debugger = new BeatDebugger();

        this.state = ENGINE_STATES.IDLE;
        this.timeline = null;
        this.lastMeta = null;
        
        // Statistics
        this.analyzerVersion = "2.0.0";
        this.analysisTime = 0;
        this.cacheHit = false;
        this.totalFramesProcessed = 0;
    }

    initialize(config = {}) {
        if (this.state === ENGINE_STATES.DISPOSED) throw new Error("Cannot initialize disposed engine.");
        if (this.state === ENGINE_STATES.ANALYZING) throw new Error("Cannot initialize while analyzing.");
        
        this.pipeline.initialize(config);
        this.timelineBuilder.initialize(config);
        this.state = ENGINE_STATES.IDLE;
    }

    analyze(audioBuffer, metadata) {
        if (this.state === ENGINE_STATES.DISPOSED) throw new Error("Engine is disposed.");
        if (this.state === ENGINE_STATES.ANALYZING) throw new Error("Analysis already in progress.");
        
        // Use standard Date if performance.now is not universally mapped in all testing envs
        const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.state = ENGINE_STATES.ANALYZING;
        
        const meta = {
            audioHash: metadata.audioHash,
            analyzerVersion: this.analyzerVersion,
            analysisParameters: metadata.analysisParameters || {}
        };
        this.lastMeta = meta;

        // 1. Evaluate Cache Layer
        if (this.cacheManager.exists(meta)) {
            const cachedTimeline = this.cacheManager.load(meta);
            if (cachedTimeline) {
                this.timeline = cachedTimeline;
                this.cacheHit = true;
                this.totalFramesProcessed = 0; // O(1) load
                this.analysisTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
                this.state = ENGINE_STATES.READY;
                return this.timeline;
            }
        }

        this.cacheHit = false;

        // 2. Cache Miss -> Execute DSP Pipeline
        const processorOutputs = this.pipeline.process(audioBuffer);
        this.totalFramesProcessed = processorOutputs.energyFrames ? processorOutputs.energyFrames.length : 0;

        // 3. Assemble Offline Topology
        this.timeline = this.timelineBuilder.build(processorOutputs);

        // 4. Persist to Cache V2
        this.cacheManager.save(this.timeline, meta);

        // 5. Compile Debugger Internals transparently
        this.debugger.compileSession({ ...meta, cacheStatus: 'MISS' }, this.timeline, processorOutputs, {});

        this.analysisTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
        this.state = ENGINE_STATES.READY;
        return this.timeline;
    }

    loadCache(cacheJson) {
        if (this.state === ENGINE_STATES.DISPOSED) throw new Error("Engine is disposed.");
        const loaded = this.cacheManager.loader.deserialize(cacheJson);
        if (loaded && loaded.timeline) {
            this.timeline = loaded.timeline;
            this.state = ENGINE_STATES.READY;
        }
    }

    saveCache() {
        if (this.state !== ENGINE_STATES.READY || !this.timeline || !this.lastMeta) {
            throw new Error("Cannot save cache without active timeline and metadata.");
        }
        this.cacheManager.save(this.timeline, this.lastMeta);
    }

    hasCache(audioHash) {
        // Simple heuristic lookup check
        return this.cacheManager.exists({ audioHash, analyzerVersion: this.analyzerVersion, analysisParameters: {} }); 
    }

    invalidateCache(audioHash) {
        this.cacheManager.invalidate(audioHash);
    }

    // High-performance Read APIs directly traversing Timeline Spatial Index
    getTimeline() {
        if (this.state !== ENGINE_STATES.READY) throw new Error("Timeline not ready.");
        return this.timeline;
    }

    getBeat(time) { return this.getTimeline().getBeat(time); }
    getNearestBeat(time) { return this.getTimeline().getNearestBeat(time); }
    getPreviousBeat(time) { return this.getTimeline().getPreviousBeat(time); }
    getNextBeat(time) { return this.getTimeline().getNextBeat(time); }
    getEvents(start, end) { return this.getTimeline().getEvents(start, end); }
    getBar(index) { return this.getTimeline().getBar(index); }

    seek(time) {
        if (this.state !== ENGINE_STATES.READY) throw new Error("Cannot seek, engine not ready.");
        return this.getNearestBeat(time);
    }

    getStatistics() {
        return {
            state: this.state,
            cacheHit: this.cacheHit,
            analysisTime: this.analysisTime,
            totalFrames: this.totalFramesProcessed,
            totalEvents: this.timeline ? this.timeline.totalBeats : 0,
            totalBars: this.timeline ? this.timeline.totalBars : 0,
            globalBpm: this.timeline ? this.timeline.globalBpm : 0,
            analyzerVersion: this.analyzerVersion
        };
    }

    reset() {
        if (this.state === ENGINE_STATES.DISPOSED) throw new Error("Engine is disposed.");
        this.pipeline.reset();
        this.timeline = null;
        this.lastMeta = null;
        this.cacheHit = false;
        this.analysisTime = 0;
        this.totalFramesProcessed = 0;
        this.state = ENGINE_STATES.IDLE;
    }

    dispose() {
        if (this.state !== ENGINE_STATES.DISPOSED) {
            this.reset();
            this.state = ENGINE_STATES.DISPOSED;
        }
    }
}
