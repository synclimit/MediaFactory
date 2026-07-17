import React from 'react';

export default function Avatar({ name, size = 64 }) {
    const initial = name ? name.substring(0, 2).toUpperCase() : 'WS';
    
    return (
        <div 
            className="flex items-center justify-center rounded-full font-bold text-white shadow-[0_0_35px_rgba(50,216,255,0.25)] relative"
            style={{ 
                width: size, 
                height: size, 
                background: 'linear-gradient(135deg, #32D8FF 0%, #4EEAD8 100%)',
                fontSize: size * 0.4 
            }}
        >
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_rgba(255,255,255,0.4)] pointer-events-none"></div>
            <span className="relative z-10">{initial}</span>
        </div>
    );
}
