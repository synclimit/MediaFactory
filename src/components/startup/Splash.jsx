import React, { useEffect } from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';

export default function Splash({ onComplete }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 1500); 
        return () => clearTimeout(timer);
    }, []); // Removed onComplete dependency to prevent resetting timer on parent re-renders

    return (
        <Surface variant={BackgroundVariants.Splash} className="fixed inset-0 z-[100] pointer-events-none" contentClassName="flex flex-col items-center justify-center">
            <div className="animate-pulse flex flex-col items-center relative z-10">
                <div className="w-24 h-24 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(59,130,246,0.5)]">
                    <span className="text-4xl font-bold text-white">MF</span>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-wider">MEDIA FACTORY</h1>
                <p className="text-gray-400 mt-2 text-sm tracking-widest">ENTERPRISE EDITION</p>
            </div>
        </Surface>
    );
}
