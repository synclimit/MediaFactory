import React from 'react';

/**
 * FilmFXEngine: Provides post-processing overlays like Grain, Noise, VHS scanlines.
 * Purely CSS-based using mix-blend-mode and pseudo-elements for high performance.
 */
export default function FilmFXEngine({ config }) {
    if (!config || !config.enabled) return null;

    const { 
        style = 'None', 
        intensity = 50 
    } = config;

    const opacity = intensity / 100;

    let overlayStyle = {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        opacity: opacity
    };

    if (style === 'Grain') {
        // SVG Data URI for noise/grain
        const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;
        overlayStyle = {
            ...overlayStyle,
            backgroundImage: noiseSvg,
            mixBlendMode: 'overlay',
            opacity: opacity * 0.5 // Scale down opacity as it's strong
        };
    } else if (style === 'VHS') {
        overlayStyle = {
            ...overlayStyle,
            background: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)',
            backgroundSize: '100% 4px',
            mixBlendMode: 'multiply',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)' // Vignette
        };
    } else if (style === 'Vignette') {
        overlayStyle = {
            ...overlayStyle,
            background: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.8) 120%)',
            mixBlendMode: 'multiply'
        };
    } else {
        return null;
    }

    return (
        <div 
            className="mf-film-fx-engine"
            style={overlayStyle}
        />
    );
}
