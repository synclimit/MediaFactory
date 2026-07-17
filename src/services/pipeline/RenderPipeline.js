import { FrameComposer } from './FrameComposer';
import { subtitleRuntime } from '../audio/subtitle/SubtitleRuntime';
import { visualRuntime } from '../visual/VisualRuntime';
import { audioDrivenRuntime } from '../audio/v2/AudioDrivenRuntime';
import { RenderMode } from './models/RenderMode';
import { FrameInputProvider } from './providers/FrameInputProvider';
import { beatEngine } from '../audio/BeatEngine';
import { motionEngine } from '../audio/MotionEngine';

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

        const currentTime = this.timeline.getCurrentTime();
        const deltaTime = this.timeline.getDeltaTime();

        // 1. Inputs (Project state)
        const objects = this.frameInput.getObjects();
        const settings = this.frameInput.getSettings();

        // 2. Execute Runtimes (Deterministic Order)
        subtitleRuntime.update(currentTime, 1.0);
        const subtitleState = subtitleRuntime.getState();

        beatEngine.update(this.timeline.clock.isPlaying);
        if (beatEngine.state && beatEngine.state.beat) {
            motionEngine.applyImpulse('zoom', beatEngine.state.beatStrength || 1.0);
            motionEngine.applyImpulse('pulse', beatEngine.state.beatStrength || 1.0);
            if (beatEngine.state.lastBeatEvent) {
                audioDrivenRuntime.processEvent(beatEngine.state.lastBeatEvent);
            } else {
                audioDrivenRuntime.processEvent({ type: 'beat', strength: beatEngine.state.beatStrength || 1.0, kickScore: 1.0, energy: beatEngine.state.energy });
            }
        }
        motionEngine.update(this.timeline.clock.isPlaying ? 1.0 : 0.0, deltaTime);

        const audioDrivenState = audioDrivenRuntime.update(deltaTime, beatEngine.state);
        const visualComposition = visualRuntime.update(deltaTime, audioDrivenState, objects);
        
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
            BeatEngine: beatEngine,
            MotionEngine: motionEngine.getState()
        };

        const tComposeStart = performance.now();
        const frame = FrameComposer.compose(metadata, states, objects);
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
