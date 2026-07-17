import React, { useEffect, useRef } from 'react';
import { renderFrameStore } from '../../../services/pipeline/runtime/RenderFrameStore';

/**
 * PreviewRoot
 * 
 * Single Source of Truth for Global Transforms (Zoom, Camera Shake, Translate, Rotate).
 * Wraps both Background Media and MediaFactoryRenderer to ensure they remain synchronized
 * during visual effects. Subscribes minimally to renderFrameStore to prevent 
 * full React tree re-renders and video remounting.
 */
export default function PreviewRoot({ children }) {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Subscribing directly to renderFrameStore for minimal repaint
        const unsubscribe = renderFrameStore.subscribe((frame) => {
            const visual = frame?.composition || frame?.states?.visual;
            if (!visual || !visual.transform) return;

            const t = visual.transform;
            
            const scale = t.scale ?? 1.0;
            const tx = t.x ?? 0;
            const ty = t.y ?? 0;
            const rotation = t.rotation ?? 0;
            const originX = t.originX ?? 0.5;
            const originY = t.originY ?? 0.5;

            // Apply unified global transform
            container.style.transform = `translate(${tx}px, ${ty}px) rotate(${rotation}deg) scale(${scale})`;
            container.style.transformOrigin = `${originX * 100}% ${originY * 100}%`;
            
            // TODO: Hit Testing compensation
            // When scaling/translating globally, mouse coordinates for interactions
            // (like dragging text) will be skewed. This should be compensated in the 
            // editor logic or pointer event handlers in the future.
        });

        return () => {
            if (unsubscribe) unsubscribe();
            if (container) {
                container.style.transform = '';
                container.style.transformOrigin = '';
            }
        };
    }, []);

    return (
        <div 
            ref={containerRef} 
            className="preview-root-transform-layer absolute inset-0 w-full h-full"
            style={{
                willChange: 'transform'
            }}
        >
            {children}
        </div>
    );
}
