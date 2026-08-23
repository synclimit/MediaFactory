import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/apiUrl';

export default function Avatar({ name, size = 64, src = null, className = "" }) {
    const initial = name ? name.substring(0, 2).toUpperCase() : 'WS';
    const [imgError, setImgError] = useState(false);

    // Reset error state whenever src prop changes
    useEffect(() => {
        setImgError(false);
    }, [src]);

    // Format display source safely
    let displaySrc = src;
    if (displaySrc && typeof displaySrc === 'string') {
        const isDataOrUrl = displaySrc.startsWith('data:') || 
                            displaySrc.startsWith('blob:') || 
                            displaySrc.startsWith('http://') || 
                            displaySrc.startsWith('https://') || 
                            displaySrc.startsWith('/api/');
        
        if (!isDataOrUrl) {
            // Local file path from Windows or disk (e.g. C:\Users\... or D:/...)
            displaySrc = getApiUrl(`/api/v1/system/file-view?path=${encodeURIComponent(displaySrc)}`);
        }
    }

    const hasImage = Boolean(displaySrc && !imgError);

    return (
        <div 
            className={`flex items-center justify-center rounded-[14px] font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] relative overflow-hidden shrink-0 border border-orange-500/50 ${className}`}
            style={{ 
                width: size, 
                height: size, 
                background: hasImage ? '#0f1017' : 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                fontSize: size * 0.38 
            }}
        >
            {hasImage ? (
                <img 
                    src={displaySrc} 
                    alt={name || 'Avatar'}
                    onError={() => {
                        console.warn('[Avatar] Failed to load image:', displaySrc);
                        setImgError(true);
                    }}
                    className="w-full h-full object-cover relative z-10"
                />
            ) : (
                <>
                    <div className="absolute inset-0 rounded-[14px] shadow-[inset_0_0_10px_rgba(255,255,255,0.4)] pointer-events-none"></div>
                    <span className="relative z-10 font-black tracking-tight drop-shadow-md">{initial}</span>
                </>
            )}
        </div>
    );
}
