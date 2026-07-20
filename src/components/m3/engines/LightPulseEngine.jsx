import React, { useEffect, useState } from 'react';
import { reactiveObjectProcessor } from '../../../services/audio/ReactiveObjectProcessor';

/**
 * LightPulseEngine: Listens to the audio reactive engine and pulses the screen background.
 */
export default function LightPulseEngine({ config }) {
    const [pulseValue, setPulseValue] = useState(0);

    useEffect(() => {
        if (!config || !config.enabled) return;
        
        let animationId;
        const renderLoop = () => {
            animationId = requestAnimationFrame(renderLoop);
            // Get raw bass energy or specific reactive channel if needed
            // Defaulting to channel 1 for low-end punch
            const val = reactiveObjectProcessor.getValue('beat-pulse') || 
                        reactiveObjectProcessor.getValue('light-pulse') || 0;
            
            // Smoothing the falloff a bit
            setPulseValue(prev => {
                if (val > prev) return val; // Instant attack
                return prev * 0.85; // Smooth release
            });
        };
        renderLoop();
        
        return () => cancelAnimationFrame(animationId);
    }, [config]);

    if (!config || !config.enabled) return null;

    const { 
        color = '#ffffff', 
        intensity = 50,
        style = 'Flash'
    } = config;

    const baseOpacity = (intensity / 100);
    const currentOpacity = pulseValue * baseOpacity;

    let overlayStyle = {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 4,
        mixBlendMode: 'screen',
        opacity: currentOpacity
    };

    if (style === 'Flash') {
        overlayStyle.backgroundColor = color;
    } else if (style === 'Glow') {
        overlayStyle.background = `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 80%)`;
    }

    return (
        <div 
            className="mf-light-pulse-engine"
            style={overlayStyle}
        />
    );
}
