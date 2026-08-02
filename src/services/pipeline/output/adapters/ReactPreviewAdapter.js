import { OutputAdapter } from './OutputAdapter';
import { renderFrameStore } from '../../runtime/RenderFrameStore';

/**
 * ReactPreviewAdapter
 * Dispatches the RenderFrame to the React presentation layer (DOM)
 * via the renderFrameStore.
 */
export class ReactPreviewAdapter extends OutputAdapter {
    initialize() {
        // Any setup required for React presentation
    }

    render(frame) {
        if (!frame) return;
        // Pushes the frame to the store which triggers React reactivity
        renderFrameStore.setFrame(frame);
    }

    dispose() {
        renderFrameStore.clear();
    }
}
