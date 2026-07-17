import { BackgroundRenderer } from './BackgroundRenderer';
import { VisualizerRenderer } from './VisualizerRenderer';
import { PlaylistRenderer } from './PlaylistRenderer';
import { TypographyRenderer } from './TypographyRenderer';
import { SubtitleRenderer } from './SubtitleRenderer';
import { OverlayRenderer } from './OverlayRenderer';
import { DebugRenderer } from './DebugRenderer';
import { CompositionRenderer } from './CompositionRenderer';

/**
 * Renderer
 * The master presentation layer that delegates drawing to sub-renderers
 * in a strictly deterministic order.
 */
export class Renderer {
    constructor() {
        // Instantiate the sub-renderers
        this.backgroundRenderer = new BackgroundRenderer();
        this.visualizerRenderer = new VisualizerRenderer();
        this.playlistRenderer = new PlaylistRenderer();
        this.typographyRenderer = new TypographyRenderer();
        this.subtitleRenderer = new SubtitleRenderer();
        this.overlayRenderer = new OverlayRenderer();
        this.debugRenderer = new DebugRenderer();
        this.compositionRenderer = new CompositionRenderer();
    }

    initialize() {
        this.backgroundRenderer.initialize();
        this.visualizerRenderer.initialize();
        this.playlistRenderer.initialize();
        this.typographyRenderer.initialize();
        this.subtitleRenderer.initialize();
        this.overlayRenderer.initialize();
        this.debugRenderer.initialize();
        this.compositionRenderer.initialize();
    }

    /**
     * The single entry point for rendering.
     * Executes drawing strictly in the mandated deterministic order.
     * 
     * @param {RenderFrame} frame The immutable frame constructed by RenderPipeline
     */
    draw(frame) {
        if (!frame) return;

        // Mandated Render Order:
        // 1. Background
        this.backgroundRenderer.draw(frame);
        
        // 2. Visualizer
        this.visualizerRenderer.draw(frame);
        
        // 3. Playlist
        this.playlistRenderer.draw(frame);
        
        // 4. Typography
        this.typographyRenderer.draw(frame);
        
        // 5. Subtitle
        this.subtitleRenderer.draw(frame);
        
        // 6. Overlay
        this.overlayRenderer.draw(frame);
        
        // 7. Debug
        this.debugRenderer.draw(frame);

        // 8. Composition (updates RenderSurface for final presentation)
        this.compositionRenderer.draw(frame);
    }

    shutdown() {
        this.backgroundRenderer.shutdown();
        this.visualizerRenderer.shutdown();
        this.playlistRenderer.shutdown();
        this.typographyRenderer.shutdown();
        this.subtitleRenderer.shutdown();
        this.overlayRenderer.shutdown();
        this.debugRenderer.shutdown();
        this.compositionRenderer.shutdown();
    }
}
