import React, { useEffect, useState } from 'react';

/**
 * AtmosphereEngine: Creates haze, fog, or warm ambient gradients.
 * Uses animated CSS gradients to simulate volume.
 */
export default function AtmosphereEngine({ config }) {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        let animationId;
        let p = 0;
        const animate = () => {
            p += 0.002;
            setPhase(p);
            animationId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationId);
    }, []);

    if (!config || !config.enabled) return null;

    const { 
        style = 'None', 
        intensity = 50,
        color = '#ffffff'
    } = config;

    const opacity = (intensity / 100) * 0.4; // Max 40% opacity so it doesn't wash out completely

    let overlayStyle = {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
        opacity: opacity,
        mixBlendMode: 'screen',
        transition: 'background 0.5s ease'
    };

    if (style === 'Fog') {
        const offset = Math.sin(phase) * 10;
        overlayStyle.background = `linear-gradient(${180 + offset}deg, transparent 0%, ${color} 100%)`;
    } else if (style === 'Haze') {
        const offset = Math.cos(phase) * 20;
        overlayStyle.background = `radial-gradient(circle at 50% ${100 + offset}%, ${color} 0%, transparent 70%)`;
    } else if (style === 'Glow') {
        overlayStyle.background = `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 60%)`;
        overlayStyle.opacity = opacity * 1.5; // Glow can be brighter
    } else {
        return null;
    }

    return (
        <div 
            className="mf-atmosphere-engine"
            style={overlayStyle}
        />
    );
}
