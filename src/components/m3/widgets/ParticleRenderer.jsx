import React, { useRef, useEffect } from 'react';
import { renderFrameStore } from '../../../services/pipeline/runtime/RenderFrameStore';
import { ParticleCore } from '../../../engine/particles/ParticleCore';

export default function ParticleRenderer({ config, id }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        const startTime = performance.now();

        const render = () => {
            animId = requestAnimationFrame(render);
            
            // Adjust canvas size to match container safely
            const parent = canvas.parentElement;
            if (parent) {
                const targetW = Math.max(100, parent.clientWidth || parent.offsetWidth || 1920);
                const targetH = Math.max(100, parent.clientHeight || parent.offsetHeight || 1080);
                if (canvas.width !== targetW || canvas.height !== targetH) {
                    canvas.width = targetW;
                    canvas.height = targetH;
                }
            }

            const frame = renderFrameStore.getFrame();
            const currentTime = frame?.metadata?.currentTime ?? ((performance.now() - startTime) / 1000);
            const audioState = frame?.states?.audioState || frame?.debug?.beat || {};

            // Delegate to unified ParticleCore renderer
            ParticleCore.renderFrame(ctx, canvas.width, canvas.height, currentTime, config, audioState);
        };

        render();

        return () => cancelAnimationFrame(animId);
    }, [config]);

    return (
        <div className="w-full h-full relative pointer-events-none flex items-center justify-center overflow-hidden">
            <canvas 
                ref={canvasRef} 
                className="w-full h-full pointer-events-none block"
            />
        </div>
    );
}
