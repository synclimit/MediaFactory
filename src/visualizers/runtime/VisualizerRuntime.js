import { visualizerRegistry } from '../registry/VisualizerRegistry';
import { rendererRegistry } from '../registry/RendererRegistry';
import { EffectPipeline } from '../effects/EffectPipeline';
import { PerformanceManager } from '../performance/PerformanceManager';
import { beatEngine } from '../../services/audio/BeatEngine';
import { fastWorkspaceManager } from '../../services/pipeline/fastrender/workspace/FastWorkspaceManager.js';

/**
 * VisualizerRuntime.js
 * The core engine that manages the visualizer lifecycle, renderer injection, and effect pipelines.
 */
export class VisualizerRuntime {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.config = config;
        this.renderer = null;
        this.effectPipeline = new EffectPipeline();
        this.performanceManager = new PerformanceManager();
        this.lastError = null;
        
        this.animationId = null;
        this.isRunning = false;
        this.rhythmPhase = 0;
        this.rhythmSpeed = 1.0;
        
        // Context injected into every plugin
        this.context = {
            canvas: this.canvas,
            ctx: null, // Will be set by renderer
            audio: {
                getSpectrum: () => {
                    if (fastWorkspaceManager.isFastWorkspaceActive() || this.config?.fftCacheActive || this.config?._fastModeAdapted) {
                        return this.processSpectrum(this.generateProceduralFFT());
                    }
                    try { 
                        const spec = beatEngine.getSpectrum();
                        if (!spec || spec.length === 0) return this.processSpectrum(this.generateFakeData());
                        
                        let isSilent = true;
                        for(let i=0; i<Math.min(spec.length, 10); i++) {
                            if (spec[i] > 0) { isSilent = false; break; }
                        }
                        const rawSpec = isSilent ? this.generateFakeData() : spec;
                        return this.processSpectrum(rawSpec);
                    } 
                    catch(e) { return this.processSpectrum(this.generateFakeData()); }
                },
                getWaveform: () => {
                    if (fastWorkspaceManager.isFastWorkspaceActive() || this.config?.fftCacheActive || this.config?._fastModeAdapted) {
                        return this.generateProceduralWaveform();
                    }
                    try { 
                        const wave = beatEngine.getTimeDomain();
                        if (!wave || wave.length === 0) return this.generateFakeData();
                        let isSilent = true;
                        for(let i=0; i<Math.min(wave.length, 20); i++) {
                            const val = wave[i];
                            if (val !== 0 && val !== 128 && Math.abs(val - 128) > 2) { isSilent = false; break; }
                        }
                        return isSilent ? this.generateFakeData() : wave;
                    } 
                    catch(e) { return this.generateFakeData(); }
                },
                getBass: () => {
                    if (fastWorkspaceManager.isFastWorkspaceActive() || this.config?.fftCacheActive || this.config?._fastModeAdapted) {
                        const spec = this.generateProceduralFFT();
                        return spec[2];
                    }
                    try { const spec = beatEngine.getSpectrum(); return spec ? spec[2] : 0; }
                    catch(e) { return 0; }
                }
            },
            beat: {
                isOnset: false // Update via beatEngine if applicable
            },
            deltaTime: 0,
            elapsedTime: 0,
            fps: 60,
            config: this.config,
            renderer: null,
            effects: this.effectPipeline,
            camera: null,
            viewport: { width: canvas.width, height: canvas.height }
        };

        this.loop = this.loop.bind(this);
    }

    generateFakeData() {
        const data = new Uint8Array(256);
        const time = Date.now() / 1000;
        for (let i = 0; i < 256; i++) {
            // Smooth wavy fake data
            data[i] = 20 + Math.abs(Math.sin(time * 2 + i * 0.1)) * 40 + Math.random() * 10;
        }
        return data;
    }

    generateProceduralFFT() {
        const data = new Uint8Array(256);
        const time = this.context?.realElapsedTime || (performance.now() / 1000);
        const masterLoopDuration = 10.0;
        const loopTime = time % masterLoopDuration;
        const normTime = loopTime / masterLoopDuration;
        const tAngle = normTime * Math.PI * 2;

        for (let i = 0; i < 256; i++) {
            const freqNorm = i / 256;
            
            // Per-bar unique seed phase for non-uniform organic movement
            const barPhase = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
            const barSeed = barPhase - Math.floor(barPhase);
            
            // Multi-octave incommensurable harmonic frequencies for high entropy (unpredictable random look)
            const oct1 = Math.sin(tAngle * 3 + barSeed * 6.28);
            const oct2 = Math.cos(tAngle * 7 + freqNorm * 18.84 + barSeed * 3.14);
            const oct3 = Math.sin(tAngle * 13 + freqNorm * 31.42 + barSeed * 1.57);
            const oct4 = Math.cos(tAngle * 23 + freqNorm * 47.12);
            
            // Sharp chaotic peak spikes
            const spike = Math.pow(Math.max(0, Math.sin(tAngle * 19 + i * 3.14)), 8);
            const fastJitter = Math.sin(tAngle * 41 + i * 7.89) * 25;
            
            // Exponential frequency band envelope (bass heavier, treble lighter)
            const envelope = Math.exp(-freqNorm * 2.2);
            
            // Combine multi-octave chaotic noise
            const rawVal = (0.35 * oct1 + 0.3 * oct2 + 0.2 * oct3 + 0.15 * oct4 + 0.4 * spike) * envelope;
            
            // Map to byte range [15, 255]
            const baseHeight = 35 + Math.abs(rawVal) * 190 + fastJitter;
            data[i] = Math.min(255, Math.max(15, Math.floor(baseHeight)));
        }
        return data;
    }

    generateProceduralWaveform() {
        const data = new Uint8Array(256);
        const time = this.context?.realElapsedTime || (performance.now() / 1000);
        const masterLoopDuration = 10.0;
        const loopTime = time % masterLoopDuration;
        const phase = (loopTime / masterLoopDuration) * Math.PI * 2;

        for (let i = 0; i < 256; i++) {
            const tNorm = i / 256;
            const wave = Math.sin(phase * 4 + tNorm * Math.PI * 8) * 0.4 + Math.cos(phase * 2 + tNorm * Math.PI * 4) * 0.3;
            data[i] = Math.min(255, Math.max(0, Math.floor(128 + wave * 100)));
        }
        return data;
    }

    processSpectrum(spec) {
        const count = this.config.barCount || 64;
        const result = new Uint8Array(count);
        const len = Math.min(spec.length, count * 2);
        
        // Base weighting with bass/mid/treble focus
        const bassFocus = (this.config.bass !== undefined ? this.config.bass : 100) / 100;
        const midFocus = (this.config.mid !== undefined ? this.config.mid : 50) / 50;
        const trebleFocus = (this.config.treble !== undefined ? this.config.treble : 30) / 30;

        const temp = new Uint8Array(count);
        for (let i = 0; i < count; i++) {
            const idx = Math.floor((i / count) * Math.min(len, 256));
            let val = spec[idx] || 0;
            if (i < count * 0.25) val *= bassFocus;
            else if (i < count * 0.65) val *= midFocus;
            else val *= trebleFocus;
            temp[i] = Math.min(255, Math.max(0, val));
        }

        const order = this.config.frequencyOrder || 'Bass -> Treble';
        if (order === 'Treble -> Bass') {
            for (let i = 0; i < count; i++) result[i] = temp[count - 1 - i];
        } else if (order === 'Center Bass') {
            const mid = Math.floor(count / 2);
            for (let i = 0; i < count; i++) {
                if (i % 2 === 0) result[mid + Math.floor(i / 2)] = temp[i];
                else result[mid - Math.ceil(i / 2)] = temp[i];
            }
        } else if (order === 'Split Mirror') {
            const half = Math.floor(count / 2);
            for (let i = 0; i < half; i++) {
                result[i] = temp[half - 1 - i];
                result[half + i] = temp[i];
            }
        } else {
            for (let i = 0; i < count; i++) result[i] = temp[i];
        }

        return result;
    }

    debugDrawError(msg) {
        this.lastError = msg;
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.fillText(msg, 20, 40);
        }
    }

    /**
     * Loads a visualizer plugin by ID.
     */
    async load(pluginId) {
        if (!visualizerRegistry.has(pluginId)) {
            this.debugDrawError(`Visualizer [${pluginId}] not found in registry.`);
            return false;
        }

        const plugin = visualizerRegistry.get(pluginId);
        
        // Clean up previous plugin
        if (this.activePlugin && this.activePlugin.dispose) {
            this.activePlugin.dispose(this.context);
        }
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }

        // Setup Renderer based on manifest
        const rendererId = plugin.manifest?.requiredRenderer || 'Canvas2DRenderer';
        const RendererClass = rendererRegistry.get(rendererId);
        
        if (!RendererClass) {
            this.debugDrawError(`Renderer [${rendererId}] not found.`);
            return false;
        }

        this.renderer = new RendererClass(this.canvas);
        this.renderer.initialize();
        
        // Update context
        this.context.renderer = this.renderer;
        this.context.ctx = this.renderer.getContext(); // Specific to Canvas2D/WebGL
        this.context.config = { ...plugin.defaultConfig, ...this.config };
        this.context.state = {}; // Persistent state for the active plugin

        this.activePlugin = plugin;

        if (this.activePlugin.initialize) {
            this.activePlugin.initialize(this.context);
        }

        return true;
    }

    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        const defaultConfig = this.activePlugin ? (this.activePlugin.defaultConfig || {}) : {};
        const mode = this.config.colorMode || '2 Gradient';
        const colorLeft = this.config.colorLeft || this.config.color || '#AB55F7';
        const colorRight = this.config.colorRight || '#F59E0B';
        const colorMid = this.config.colorMid || '#06B6D4';
        const neonColor = this.config.neonColor || '#00f3ff';
        this.context.config = { 
            ...defaultConfig, 
            ...this.config,
            colorMode: mode,
            colorLeft,
            colorRight,
            colorMid,
            neonColor
        };
    }

    resize(width, height) {
        if (this.renderer) {
            this.renderer.resize(width, height);
            this.context.viewport.width = width;
            this.context.viewport.height = height;
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animationId = requestAnimationFrame(this.loop);
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = this.performanceManager.beginFrame(timestamp);
        
        if (!this.performanceManager.shouldSkipFrame(timestamp)) {
            const dtSec = deltaTime / 1000;
            this.context.deltaTime = dtSec;
            this.context.realElapsedTime = timestamp / 1000;
            this.context.fps = this.performanceManager.fps;

            // Calculate dynamic rhythm speed (fast when beat is intense, slow when quiet)
            let targetSpeed = 1.0;
            try {
                const spec = beatEngine ? beatEngine.getSpectrum() : null;
                if (spec && spec.length > 0) {
                    let bassSum = 0;
                    let totalSum = 0;
                    const len = Math.min(spec.length, 128);
                    for (let i = 0; i < len; i++) {
                        if (i < 12) bassSum += spec[i];
                        totalSum += spec[i];
                    }
                    const bass = (bassSum / Math.min(12, len)) / 255;
                    const avg = (totalSum / len) / 255;
                    targetSpeed = 0.35 + Math.pow(bass, 1.4) * 4.2 + Math.pow(avg, 1.2) * 2.0;
                }
            } catch (e) {}

            this.rhythmSpeed += (targetSpeed - this.rhythmSpeed) * Math.min(dtSec * 15, 1.0);
            this.rhythmPhase += dtSec * this.rhythmSpeed;
            this.context.rhythmSpeed = this.rhythmSpeed;
            this.context.rhythmPhase = this.rhythmPhase;
            this.context.elapsedTime = this.rhythmPhase;
            this.context.beat = (beatEngine && beatEngine.getState) ? beatEngine.getState() : { isOnset: false };

            // Normalize config values for all plugins (handle UI sliders vs plugin schema)
            const rawSmoothing = this.config.smoothing !== undefined ? this.config.smoothing : 70;
            const normSmoothing = rawSmoothing > 1 ? rawSmoothing / 100 : rawSmoothing;
            
            const rawGain = this.config.fftGain !== undefined ? (this.config.fftGain / 100) : (this.config.gain !== undefined ? this.config.gain : 1.0);
            const rawSens = this.config.sensitivity !== undefined ? (this.config.sensitivity / 80) : 1.0;
            const effectiveGain = rawGain * rawSens;
            
            const effectiveThickness = this.config.thickness !== undefined ? this.config.thickness : (this.config.barWidth !== undefined ? this.config.barWidth : 4);
            const effectiveCount = this.config.barCount !== undefined ? this.config.barCount : 64;

            const mode = this.config.colorMode || '2 Gradient';
            const colorLeft = this.config.colorLeft || this.config.color || '#AB55F7';
            const colorRight = this.config.colorRight || '#F59E0B';
            const colorMid = this.config.colorMid || '#06B6D4';
            const neonColor = this.config.neonColor || '#00f3ff';
            let effectiveColorStr = this.config.color || '#00ffcc';
            if (mode === 'Solid' || mode === 'Solid Color') {
                effectiveColorStr = colorLeft;
            } else if (mode === 'Neon') {
                effectiveColorStr = neonColor;
            } else if (mode === '2 Gradient' || mode === 'Gradient' || mode === '3 Gradient') {
                effectiveColorStr = colorLeft;
            } else if (mode === 'Rainbow') {
                const phase = Math.floor((Date.now() / 25) % 360);
                effectiveColorStr = `hsl(${phase}, 100%, 55%)`;
            }

            this.context.config = {
                ...this.context.config,
                ...this.config,
                smoothing: normSmoothing,
                gain: effectiveGain,
                barWidth: effectiveThickness,
                thickness: effectiveThickness,
                barCount: effectiveCount,
                color: effectiveColorStr,
                colorMode: mode,
                colorLeft,
                colorRight,
                colorMid,
                neonColor
            };

            if (!this.context.state) this.context.state = {};
            if (!this.context.state.smoothedData || this.context.state.smoothedData.length !== effectiveCount) {
                this.context.state.smoothedData = new Float32Array(effectiveCount);
            }
            if (!this.context.state.smoothedWave || this.context.state.smoothedWave.length !== 256) {
                this.context.state.smoothedWave = new Float32Array(256);
            }

            if (this.activePlugin && this.renderer) {
                try {
                    // 1. Update logic
                    if (this.activePlugin.update) {
                        this.activePlugin.update(this.context);
                    }

                    // 2. Begin render frame
                    this.renderer.currentConfig = this.context.config;
                    this.renderer.currentContext = this.context;
                    this.renderer.beginFrame(this.context);

                    // 3. Render via pipeline
                    if (this.activePlugin.render) {
                        this.effectPipeline.execute(this.activePlugin.render, this.context);
                    }

                    // 4. End render frame
                    this.renderer.endFrame(this.context);
                } catch (e) {
                    this.debugDrawError(`Render Error: ${e.message}`);
                    this.stop(); // Stop loop on error
                    return;
                }
            } else if (this.lastError) {
                // Keep drawing error
                this.debugDrawError(this.lastError);
            }
        }

        this.animationId = requestAnimationFrame(this.loop);
    }

    dispose() {
        this.stop();
        if (this.activePlugin && this.activePlugin.dispose) {
            this.activePlugin.dispose(this.context);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}
