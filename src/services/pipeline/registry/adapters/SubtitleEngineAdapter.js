import { EngineAdapter } from '../EngineAdapter';
import { ExecutionResult } from '../../models/ExecutionResult';
import { ExecutionStatus } from '../../models/ExecutionStatus';
import { subtitleRuntime } from '../../../audio/subtitle/SubtitleRuntime';
import { SubtitleLayoutEngine } from '../../../audio/subtitle/rendering/SubtitleLayoutEngine';
import { SubtitleAnimationEngine } from '../../../audio/subtitle/rendering/SubtitleAnimationEngine';
import { SubtitleStyleEngine } from '../../../audio/subtitle/rendering/SubtitleStyleEngine';
import { DisplayStrategyRegistry } from '../../../audio/subtitle/rendering/strategies/DisplayStrategyRegistry';

// Import strategies to ensure they are registered
import '../../../audio/subtitle/rendering/strategies/StaticStrategy';
import '../../../audio/subtitle/rendering/strategies/FadeStrategy';
import '../../../audio/subtitle/rendering/strategies/ParagraphStrategy';
import '../../../audio/subtitle/rendering/strategies/SlideUpStrategy';
import '../../../audio/subtitle/rendering/strategies/ProgressiveWordsStrategy';
import '../../../audio/subtitle/rendering/strategies/TypewriterStrategy';
import '../../../audio/subtitle/rendering/strategies/WordHighlightStrategy';
import '../../../audio/subtitle/rendering/strategies/KaraokeFillStrategy';
import '../../../audio/subtitle/rendering/strategies/CharacterHighlightStrategy';

export class SubtitleEngineAdapter extends EngineAdapter {
    constructor() {
        super('SubtitleEngine');
    }

    _migrateConfig(config) {
        // Migration Layer: V1 layoutStyle -> V2 displayMode
        let displayMode = config.displayMode;
        if (!displayMode && config.layoutStyle) {
            const legacyMap = {
                'Classic Centered': 'Paragraph',
                'Left Aligned': 'Paragraph',
                'Right Aligned': 'Paragraph',
                'Dynamic Word-by-Word': 'Word Highlight',
                'Karaoke Highlight': 'Word Highlight',
                'Cinematic Stack': 'Slide Up',
                'Rolling Lyrics': 'Slide Up'
            };
            displayMode = legacyMap[config.layoutStyle] || 'Static';
        }
        
        return {
            ...config,
            displayMode: displayMode || 'Static',
            position: config.position || 'Bottom Center' // Decoupled from display mode
        };
    }

    _buildStrictSubtitleModel(activeSegment, layoutLines) {
        if (!activeSegment) return null;
        
        return {
            segmentId: activeSegment.id || 'seg',
            start: activeSegment.start,
            end: activeSegment.end,
            text: activeSegment.text || '',
            lines: layoutLines.map((lineArr, index) => ({
                lineIndex: index,
                text: lineArr.map(w => w.word).join(' '),
                words: lineArr.map((w, wIdx) => ({
                    index: wIdx,
                    text: w.word,
                    start: w.start || activeSegment.start, // Fallback if no word timing
                    end: w.end || activeSegment.end
                }))
            }))
        };
    }

    _applyFallbacks(displayMode, subtitleFrame) {
        const hasWordTiming = subtitleFrame && subtitleFrame.lines.some(l => l.words.some(w => w.start !== subtitleFrame.start));
        
        if (!hasWordTiming) {
            if (displayMode === 'Word Highlight' || displayMode === 'Progressive Words' || displayMode === 'Karaoke Fill') {
                return 'Fade'; // Fallback
            }
        }
        return displayMode;
    }

    execute(context) {
        const frameInput = context.providers.get('frameInput');
        const inputs = frameInput ? frameInput.getInputs() : { subtitleObjects: [] };
        
        const state = {};
        const runtimeState = subtitleRuntime.getState();

        for (const rawConfig of inputs.subtitleObjects) {
            const config = this._migrateConfig(rawConfig);
            
            runtimeState.config = config;

            // 1. Layout Engine: Splits words into lines, caches font metrics (Base Caching)
            const t0 = performance.now();
            SubtitleLayoutEngine.compute(
                runtimeState, 
                config, 
                context.canvasWidth || 1920, 
                context.canvasHeight || 1080
            );
            const t1 = performance.now();
            
            runtimeState.diagnostics = runtimeState.diagnostics || {};
            runtimeState.diagnostics.layoutTimeMicroseconds = (t1 - t0) * 1000;

            // 2. Build Strict Data Model
            const subtitleFrame = this._buildStrictSubtitleModel(runtimeState.activeSegment, runtimeState.layoutState.lines);
            
            // 3. Fallback Logic
            const finalDisplayMode = this._applyFallbacks(config.displayMode, subtitleFrame);

            // 4. Construct RenderContext
            const timestamp = subtitleRuntime.getDiagnostics().lastTimestamp;
            const renderContext = {
                currentTime: timestamp,
                canvasWidth: context.canvasWidth || 1920,
                canvasHeight: context.canvasHeight || 1080,
                subtitle: subtitleFrame,
                style: config,
                animation: config,
                settings: config
            };

            // 5. Display Strategy (Stateless behavior logic)
            const t2 = performance.now();
            const strategy = DisplayStrategyRegistry.get(finalDisplayMode);
            runtimeState.renderInstruction = strategy.render(renderContext);
            const t3 = performance.now();
            runtimeState.diagnostics.strategyTimeMicroseconds = (t3 - t2) * 1000;

            // 6. Style Engine (Visual Appearance ONLY)
            SubtitleStyleEngine.compute(runtimeState);

            // 7. Animation Engine (Transitions ONLY)
            SubtitleAnimationEngine.compute(runtimeState, timestamp);

            // Package reference to the shared runtime state
            state[config.id] = runtimeState;
        }
        
        return new ExecutionResult({
            status: ExecutionStatus.SUCCESS,
            state: state,
            metrics: {}
        });
    }

    defaultState() { return {}; }
    reset() { subtitleRuntime.resetState(); }
    getCapabilities() { return { provides: ['subtitle'] }; }
}
