import { beatEngine } from '../audio/BeatEngine';
import { audioDrivenAdapter } from '../audio/AudioDrivenAdapter';
import { visualRuntime } from '../visual/VisualRuntime';
import { subtitleRuntime } from '../audio/subtitle/SubtitleRuntime';
import { analysisCacheManager } from '../audio/AnalysisCacheManager';

class BeatDebuggerCore {
    constructor() {
        this.isRecording = false;
        this.logData = [];
        this.subscribers = new Set();
        
        this.systemStats = {
            frameTime: 0,
            latency: 0,
            updateRate: 0,
            cpuLoad: 0,
            memoryUsedMB: 0,
            lastFrameStamp: performance.now()
        };

        this._unsubscribe = null;
        this._updateLoop = this._updateLoop.bind(this);
    }

    start() {
        if (!this._unsubscribe) {
            this._unsubscribe = beatEngine.subscribe(this._updateLoop);
            this.systemStats.lastFrameStamp = performance.now();
        }
    }

    stop() {
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = null;
        }
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    _updateLoop(beatState) {
        const now = performance.now();
        const frameTime = now - this.systemStats.lastFrameStamp;
        
        this.systemStats.frameTime = frameTime;
        // Simple moving average for FPS
        this.systemStats.updateRate = this.systemStats.updateRate * 0.9 + (frameTime > 0 ? 1000 / frameTime : 0) * 0.1;
        
        // Estimated Thread Load % (how much of the 16.6ms budget is spent)
        this.systemStats.cpuLoad = (frameTime / 16.666) * 100;
        
        // Capture memory if available in Chrome/Edge
        if (performance.memory) {
            this.systemStats.memoryUsedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
        } else {
            this.systemStats.memoryUsedMB = 0;
        }
        
        const diag = beatEngine.getDiagnostics ? beatEngine.getDiagnostics() : {};
        this.systemStats.latency = diag.processingTime || 0;
        
        this.systemStats.lastFrameStamp = now;

        const adapterState = audioDrivenAdapter.getState();
        const visualComposition = visualRuntime.getComposition();
        
        // Read aggregated composition directly
        // The Debugger sees the final state precisely as the Renderer sees it.
        const comp = visualComposition;
        
        // Fetch detailed effect states for internal logic
        const zoomEffectState = visualRuntime.zoomEffect ? visualRuntime.zoomEffect._output : {};
        const glowEffectState = visualRuntime.glowEffect ? visualRuntime.glowEffect._output : {};
        const cameraEffectState = visualRuntime.cameraEffect ? visualRuntime.cameraEffect._output : {};
        const particleEffectState = visualRuntime.particleEffect ? visualRuntime.particleEffect._output : {};
        const blurEffectState = visualRuntime.blurEffect ? visualRuntime.blurEffect._output : {};
        const spectrumEffectState = visualRuntime.spectrumEffect ? visualRuntime.spectrumEffect._output : {};
        
        // Fetch musical feel
        const feel = adapterState.musicalFeel || {};

        // Fetch subtitle state
        const subtitleState = subtitleRuntime.getState();
        const subtitleDiag = subtitleRuntime.getDiagnostics();
        const whisperCacheState = analysisCacheManager.getCacheState('whisper_cache');

        const snapshot = {
            timestamp: now,
            beatState: {
                time: beatState.timestamp || 0,
                bpm: beatState.bpm || 0,
                beat: !!beatState.beat,
                downbeat: beatState.beatPhase < 0.1 && !!beatState.beat, // Approximate downbeat mapping
                kick: beatState.kick || 0,
                bass: beatState.bass || 0,
                mid: beatState.mid || 0,
                high: beatState.treble || 0, // Mapped to treble
                energy: beatState.energy || 0,
                confidence: beatState.confidence || 0
            },
            adapterState: {
                impulse: adapterState.impulse || 0,
                accent: adapterState.accent || 0,
                transient: adapterState.transient || 0
            },
            system: {
                frameTime: this.systemStats.frameTime,
                latency: this.systemStats.latency,
                updateRate: this.systemStats.updateRate,
                cpuLoad: this.systemStats.cpuLoad,
                memoryUsedMB: this.systemStats.memoryUsedMB
            },
            visual: {
                // Final Composed Values
                transform: { ...comp.transform },
                camera: { ...comp.camera },
                postProcess: { ...comp.postProcess },
                overlay: { ...comp.overlay },
                activeEffects: [...comp.debug.activeEffects],
                
                // Effect Envelopes (for debugging logic)
                zoomVelocity: zoomEffectState.velocity || 0,
                zoomState: zoomEffectState.state || 'IDLE',
                adaptiveAttack: zoomEffectState.adaptiveAttack || 0,
                adaptiveDecay: zoomEffectState.adaptiveDecay || 0,
                adaptiveRelease: zoomEffectState.adaptiveRelease || 0,
                glowState: glowEffectState.state || 'IDLE',
                cameraState: cameraEffectState.state || 'IDLE'
            },
            musicalFeel: {
                punch: feel.punch || 0,
                sustain: feel.sustain || 0,
                agility: feel.agility || 0,
                groove: feel.groove || 0,
                stability: feel.stability || 0
            },
            subtitle: {
                cacheStatus: whisperCacheState || 'NONE',
                cacheHit: !!subtitleRuntime.document,
                language: subtitleState.language,
                currentSegment: subtitleState.activeSegment ? subtitleState.activeSegment.text : "",
                segmentIndex: subtitleState.segmentIndex,
                currentWord: subtitleState.currentWord ? subtitleState.currentWord.word : "",
                previousWord: subtitleState.previousWord ? subtitleState.previousWord.word : "",
                nextWord: subtitleState.nextWord ? subtitleState.nextWord.word : "",
                wordIndex: subtitleState.wordIndex,
                confidence: subtitleState.confidence,
                lookupTimeMicroseconds: subtitleDiag.lookupTimeMicroseconds || 0,
                layoutTimeMicroseconds: subtitleDiag.layoutTimeMicroseconds || 0,
                animationTimeMicroseconds: subtitleDiag.animationTimeMicroseconds || 0,
                layoutCacheHit: subtitleDiag.layoutCacheHit || false,
                playbackSpeed: subtitleDiag.playbackSpeed,
                currentStyle: subtitleState.style,
                opacity: subtitleState.opacity,
                offsetX: subtitleState.offsetX,
                offsetY: subtitleState.offsetY,
                highlightIndex: subtitleState.highlightIndex,
                characterIndex: subtitleState.characterIndex
            }
        };

        if (this.isRecording) {
            this.logData.push(snapshot);
            // Cap log array size to ~5 mins at 60fps to prevent memory blowouts
            if (this.logData.length > 18000) { 
                this.logData.shift(); 
            }
        }

        for (const sub of this.subscribers) {
            sub(snapshot);
        }
    }

    startRecording() {
        this.logData = [];
        this.isRecording = true;
    }

    stopRecording() {
        this.isRecording = false;
    }

    exportJSON() {
        return JSON.stringify(this.logData, null, 2);
    }

    exportCSV() {
        if (this.logData.length === 0) return '';
        
        const header = [
            'Timestamp', 
            'Beat_Time', 'BPM', 'Beat', 'Downbeat', 'Kick', 'Bass', 'Mid', 'High', 'Energy', 'Confidence',
            'Feel_Punch', 'Feel_Sustain', 'Feel_Agility', 'Feel_Groove', 'Feel_Stability',
            'Sub_CacheStatus', 'Sub_CacheHit', 'Sub_Lang', 'Sub_SegmentIdx', 'Sub_WordIdx', 'Sub_Confidence', 'Sub_LookupTimeUs', 'Sub_LayoutTimeUs', 'Sub_AnimTimeUs', 'Sub_LayoutCache', 'Sub_Speed', 'Sub_Style', 'Sub_Opacity', 'Sub_OffsetX', 'Sub_OffsetY', 'Sub_HighIdx', 'Sub_CharIdx',
            'Adapter_Impulse', 'Adapter_Accent', 'Adapter_Transient',
            'Visual_TransformScale', 'Visual_ZoomVelocity', 'Visual_ZoomState',
            'Visual_GlowIntensity', 'Visual_GlowRadius', 'Visual_GlowOpacity', 'Visual_GlowState',
            'Visual_BlurRadius', 'Visual_BlurDirection', 'Visual_BlurStrength',
            'Visual_CameraPosX', 'Visual_CameraPosY', 'Visual_CameraRoll', 'Visual_CameraVelocity', 'Visual_CameraMomentum', 'Visual_CameraState',
            'Visual_ParticleSpawnRate', 'Visual_ParticleBurstCount',
            'Visual_SpectrumBands', 'Visual_SpectrumPeak', 'Visual_SpectrumColorWeight',
            'Sys_FrameTime', 'Sys_Latency', 'Sys_UpdateRate', 'Sys_CpuLoad', 'Sys_MemoryUsedMB'
        ].join(',');

        const rows = this.logData.map(log => {
            return [
                log.timestamp.toFixed(2),
                log.beatState.time.toFixed(3), 
                log.beatState.bpm.toFixed(1), 
                log.beatState.beat ? 1 : 0, 
                log.beatState.downbeat ? 1 : 0, 
                log.beatState.kick.toFixed(4), 
                log.beatState.bass.toFixed(4), 
                log.beatState.mid.toFixed(4), 
                log.beatState.high.toFixed(4), 
                log.beatState.energy.toFixed(4), 
                log.beatState.confidence.toFixed(4),
                log.musicalFeel.punch.toFixed(4),
                log.musicalFeel.sustain.toFixed(4),
                log.musicalFeel.agility.toFixed(4),
                log.musicalFeel.groove.toFixed(4),
                log.musicalFeel.stability.toFixed(4),
                log.subtitle.cacheStatus,
                log.subtitle.cacheHit ? 1 : 0,
                log.subtitle.language,
                log.subtitle.segmentIndex.toString(),
                log.subtitle.wordIndex.toString(),
                log.subtitle.confidence.toFixed(4),
                log.subtitle.lookupTimeMicroseconds.toFixed(2),
                log.subtitle.layoutTimeMicroseconds.toFixed(2),
                log.subtitle.animationTimeMicroseconds.toFixed(2),
                log.subtitle.layoutCacheHit ? 1 : 0,
                log.subtitle.playbackSpeed.toFixed(2),
                log.subtitle.currentStyle,
                log.subtitle.opacity.toFixed(2),
                log.subtitle.offsetX.toFixed(2),
                log.subtitle.offsetY.toFixed(2),
                log.subtitle.highlightIndex.toString(),
                log.subtitle.characterIndex.toString(),
                log.adapterState.impulse.toFixed(4), 
                log.adapterState.accent.toFixed(4), 
                log.adapterState.transient.toFixed(4),
                log.visual.transform.scale.toFixed(4),
                log.visual.zoomVelocity.toFixed(4),
                log.visual.zoomState,
                log.visual.postProcess.glowIntensity.toFixed(4),
                log.visual.postProcess.glowRadius.toFixed(4),
                log.visual.postProcess.glowOpacity.toFixed(4),
                log.visual.glowState,
                log.visual.postProcess.blur.toFixed(4),
                log.visual.postProcess.blurDirection.toFixed(4),
                log.visual.postProcess.blurStrength.toFixed(4),
                log.visual.camera.posX.toFixed(4),
                log.visual.camera.posY.toFixed(4),
                log.visual.camera.roll.toFixed(4),
                log.visual.camera.velocity.toFixed(4),
                log.visual.camera.momentum.toFixed(4),
                log.visual.cameraState,
                log.visual.overlay.particleSpawnRate.toFixed(4),
                log.visual.overlay.particleBurstCount.toString(),
                log.visual.geometry.spectrumBands.toString(),
                log.visual.geometry.spectrumPeak.toFixed(4),
                log.visual.geometry.spectrumColorWeight.toFixed(4),
                log.system.frameTime.toFixed(2), 
                log.system.latency.toFixed(2), 
                log.system.updateRate.toFixed(1),
                log.system.cpuLoad.toFixed(1),
                log.system.memoryUsedMB.toFixed(1)
            ].join(',');
        });

        return [header, ...rows].join('\n');
    }

    exportTXT() {
        if (this.logData.length === 0) return '';
        
        return this.logData.map(log => {
            const beatFlag = log.beatState.beat ? (log.beatState.downbeat ? '[DOWNBEAT]' : '[ BEAT ]') : '        ';
            return `T=${log.timestamp.toFixed(1).padStart(8, ' ')} | ${beatFlag} | BPM: ${log.beatState.bpm.toFixed(1).padStart(5, ' ')} | Punch: ${log.musicalFeel.punch.toFixed(2)} | Sub_Word: ${(log.subtitle.currentWord || '').padEnd(10, ' ')} | Sub_Seg: ${log.subtitle.segmentIndex.toString().padStart(3, ' ')} | Sub_Us: ${log.subtitle.lookupTimeMicroseconds.toFixed(1).padStart(5, ' ')} | Z_Scale: ${log.visual.transform.scale.toFixed(3)} | G_Int: ${log.visual.postProcess.glowIntensity.toFixed(3)} | Latency: ${log.system.latency.toFixed(2)}ms | CPU: ${log.system.cpuLoad.toFixed(1)}% | Mem: ${log.system.memoryUsedMB.toFixed(1)}MB`;
        }).join('\n');
    }

    triggerDownload(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

export const beatDebuggerCore = new BeatDebuggerCore();
export default BeatDebuggerCore;
