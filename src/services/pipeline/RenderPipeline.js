import { FrameComposer } from './FrameComposer';
import { subtitleRuntime } from '../audio/subtitle/SubtitleRuntime';
import { visualRuntime } from '../visual/VisualRuntime';
import { audioDrivenRuntime } from '../audio/v2/AudioDrivenRuntime';
import { RenderMode } from './models/RenderMode';
import { FrameInputProvider } from './providers/FrameInputProvider';
import { beatEngine } from '../audio/BeatEngine';
import { motionEngine } from '../audio/MotionEngine';
import PlaylistLayoutEngine from '../playlist/PlaylistLayoutEngine';
import PlaylistTransformEngine from '../playlist/PlaylistTransformEngine';
import TypographyEngine from '../typography/TypographyEngine';

/**
 * RenderPipeline
 * 
 * ONE unified pipeline for Preview and Export.
 * Executes runtimes -> calls FrameComposer -> passes RenderFrame to OutputManager.
 */
export class RenderPipeline {
    constructor(outputManager, timeline, frameInputProvider) {
        this.outputManager = outputManager;
        this.timeline = timeline;
        this.frameInput = frameInputProvider || new FrameInputProvider();
        
        this.frameNumber = 0;
        this.renderMode = RenderMode.REALTIME_PREVIEW;
        
        this.metrics = {
            renderTimeMicroseconds: 0,
            composeTimeMicroseconds: 0,
            pipelineTimeMicroseconds: 0,
            droppedFrames: 0
        };
    }

    initialize({ renderMode = RenderMode.REALTIME_PREVIEW }) {
        this.renderMode = renderMode;
        this.frameNumber = 0;
    }

    setMode(mode) {
        this.renderMode = mode;
    }

    update() {
        const t0 = performance.now();
        this.frameNumber++;

        const settings = this.frameInput.getSettings();
        const currentTime = settings.currentTimeSec !== undefined ? settings.currentTimeSec : this.timeline.getCurrentTime();
        const deltaTime = this.timeline.getDeltaTime();

        // 1. Inputs (Project state)
        const objects = this.frameInput.getObjects();
        
        const m3AudioTracks = settings.m3AudioTracks || [];
        
        let realtimeTrackIndex = 0;
        if (m3AudioTracks.length > 0) {
            let accTime = 0;
            for (let i = 0; i < m3AudioTracks.length; i++) {
                let durSec = m3AudioTracks[i].durationSec;
                if (typeof durSec !== 'number' || isNaN(durSec)) {
                    if (typeof m3AudioTracks[i].duration === 'string') {
                        const parts = m3AudioTracks[i].duration.split(':').map(Number);
                        if (parts.length === 3) durSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
                        else if (parts.length === 2) durSec = parts[0] * 60 + parts[1];
                        else durSec = 0;
                    } else {
                        durSec = 0;
                    }
                }
                accTime += (durSec || 0);
                if (currentTime < accTime) {
                    realtimeTrackIndex = i;
                    break;
                }
            }
            // If currentTime is beyond all tracks, keep it at the last track
            if (currentTime >= accTime && m3AudioTracks.length > 0) {
                realtimeTrackIndex = m3AudioTracks.length - 1;
            }
        }
        
        const currentTrackTitle = m3AudioTracks[realtimeTrackIndex]?.title || 'Now Playing';
        
        const processedObjects = objects.map(obj => {
            if (obj.type === 'text' && (obj.name === '{current_track}' || obj.bindToCurrentTrack)) {
                return { ...obj, name: currentTrackTitle, bindToCurrentTrack: true, textType: 'title' };
            }
            if (obj.type === 'playlist' && obj.bindToAudioTracks !== false) {
                return { ...obj, tracks: m3AudioTracks.map(t => t.title) };
            }
            return obj;
        });

        // 2. Execute Runtimes (Deterministic Order)
        subtitleRuntime.update(currentTime, 1.0);
        const subtitleState = subtitleRuntime.getState();

        const isPlaying = window.m3IsPlaying || this.timeline.clock.isPlaying;
        beatEngine.update(isPlaying);
        if (beatEngine.state && beatEngine.state.beat) {
            motionEngine.applyImpulse('zoom', beatEngine.state.beatStrength || 1.0);
            motionEngine.applyImpulse('pulse', beatEngine.state.beatStrength || 1.0);
            if (beatEngine.state.lastBeatEvent) {
                audioDrivenRuntime.processEvent(beatEngine.state.lastBeatEvent);
            } else {
                audioDrivenRuntime.processEvent({ type: 'beat', strength: beatEngine.state.beatStrength || 1.0, kickScore: 1.0, energy: beatEngine.state.energy });
            }
        }
        motionEngine.update(isPlaying ? 1.0 : 0.0, deltaTime);

        const audioDrivenState = audioDrivenRuntime.update(deltaTime, beatEngine.state);
        const visualComposition = visualRuntime.update(deltaTime, audioDrivenState, processedObjects);
        
        // Playlist Engine
        const playlistState = {};
        const playlistObjects = this.frameInput.getInputs().playlistObjects || [];
        const audioTracks = settings.m3AudioTracks || [];
        const trackTitles = audioTracks.length > 0 ? audioTracks.map(t => t.title) : ['Track 01', 'Track 02', 'Track 03', 'Track 04'];
        
        playlistState.globalPlaylistInfo = {
            activeTrackTitle: trackTitles[realtimeTrackIndex] || trackTitles[0] || 'Unknown Track'
        };
        
        for (const config of playlistObjects) {
            let tracksForThisConfig = trackTitles;
            let startIndex = 1;
            
            if (config.trackSplit === 'first-half') {
                tracksForThisConfig = trackTitles.slice(0, Math.ceil(trackTitles.length / 2));
            } else if (config.trackSplit === 'second-half') {
                startIndex = Math.ceil(trackTitles.length / 2) + 1;
                tracksForThisConfig = trackTitles.slice(Math.ceil(trackTitles.length / 2));
            }
            
            const layoutConfig = { ...config, startIndex };
            const layoutData = PlaylistLayoutEngine.calculate(tracksForThisConfig, layoutConfig, realtimeTrackIndex);
            const transformData = PlaylistTransformEngine.calculate(layoutData, config);
            const typographyData = TypographyEngine.normalize(config);
            playlistState[config.id] = { layoutData, transformData, typographyData };
        }
        
        // 3. Call FrameComposer
        const metadata = {
            frameNumber: this.frameNumber,
            currentTime,
            deltaTime,
            fps: deltaTime > 0 ? 1 / deltaTime : 0,
            renderMode: this.renderMode
        };

        const states = {
            subtitle: subtitleState,
            visual: visualComposition,
            beat: {
                bass: beatEngine.state.bass || 0,
                mid: beatEngine.state.mid || 0,
                treble: beatEngine.state.treble || 0,
                energy: beatEngine.state.energy || 0,
                kick: beatEngine.state.kick || 0,
                peak: beatEngine.state.peak || 0,
                master: beatEngine.state.master || 0,
                beat: beatEngine.state.beat || false,
                beatStrength: beatEngine.state.beatStrength || 0,
                bpm: beatEngine.state.bpm || 120,
            },
            BeatEngine: beatEngine,
            MotionEngine: motionEngine.getState(),
            PlaylistEngine: playlistState
        };

        const tComposeStart = performance.now();
        const frame = FrameComposer.compose(metadata, states, processedObjects);
        const composeTime = performance.now() - tComposeStart;

        this.currentFrame = frame;

        // 4. Pass RenderFrame to OutputManager
        const tRenderStart = performance.now();
        if (this.outputManager) {
            this.outputManager.dispatch(frame);
        }
        const renderTime = performance.now() - tRenderStart;

        const pipelineTime = performance.now() - t0;

        this.metrics.renderTimeMicroseconds = renderTime * 1000;
        this.metrics.composeTimeMicroseconds = composeTime * 1000;
        this.metrics.pipelineTimeMicroseconds = pipelineTime * 1000;
        
        frame.metrics.pipeline = { ...this.metrics };
    }

    seek(time) {
        if (this.timeline) {
            this.timeline.seek(time);
        }
        this.update();
    }

    reset() {
        this.frameNumber = 0;
        this.currentFrame = null;
        this.metrics.droppedFrames = 0;
    }

    getFrame() {
        return this.currentFrame;
    }

    getMetrics() {
        return this.metrics;
    }

    shutdown() {
        this.currentFrame = null;
    }
}
