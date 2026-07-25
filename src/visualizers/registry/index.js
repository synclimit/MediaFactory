import { visualizerRegistry } from './VisualizerRegistry';
import { categoryRegistry } from './CategoryRegistry';
import { rendererRegistry } from './RendererRegistry';

// Core renderers
import { Canvas2DRenderer } from '../renderers/Canvas2DRenderer';
import { BarsRenderer } from '../renderers/engines/BarsRenderer';

// Auto-register core renderers
rendererRegistry.register('Canvas2DRenderer', Canvas2DRenderer);
rendererRegistry.register('BarsRenderer', BarsRenderer);

export {
    visualizerRegistry,
    categoryRegistry,
    rendererRegistry
};
