import React, { useEffect } from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';

export default function Splash({ onComplete }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            if (typeof onComplete === 'function') onComplete();
        }, 800); 
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <Surface 
            variant={BackgroundVariants.Splash} 
            className="fixed inset-0 z-[100] cursor-pointer pointer-events-auto" 
            contentClassName="flex flex-col items-center justify-center"
            onClick={() => { if (typeof onComplete === 'function') onComplete(); }}
        >
            <div className="flex flex-col items-center relative z-10 select-none">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(249,115,22,0.5)]">
                    <span className="text-4xl font-black text-white tracking-widest">MF</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">MEDIA FACTORY</h1>
                <p className="text-orange-400/80 mt-2 text-xs tracking-widest font-mono uppercase">Click anywhere or waiting to start...</p>
            </div>
        </Surface>
    );
}
