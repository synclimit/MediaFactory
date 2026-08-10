import React from 'react';
import { useM3Panel } from '../../../hooks/useM3Panel';
import { GridThumbnail } from '../../ui/Thumbnails';
import { ReactivePresets } from '../../../services/reactive/ReactivePresets';

export default function ReactivePanel({ addObject }) {
    const handleSelect = (preset) => {
        if (!addObject) return;
        addObject({
            type: 'reactive',
            name: preset.name,
            category: 'reactive',
            enabled: true,
            sensitivityMode: 'Normal',
            ...preset
        });
    };

    const previews = {
        zoom_pulse_default: <div className="text-xl">🔍</div>,
        camera_shake_default: <div className="text-xl">📸</div>,
        beat_flash_default: <div className="w-full h-full bg-white opacity-20"></div>,
        bg_pulse_default: <div className="w-full h-full bg-red-900/30 animate-pulse"></div>,
        logo_pulse_default: <div className="text-xl animate-pulse">⭐</div>,
        brightness_pulse_default: <div className="w-full h-full bg-yellow-400/30 animate-pulse"></div>,
        scale_pulse_default: <div className="text-xl">↗️</div>
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {Object.values(ReactivePresets).map((preset) => (
                    <GridThumbnail 
                        key={preset.id}
                        title={preset.name} 
                        color="red" 
                        onClick={() => handleSelect(preset)} 
                        preview={previews[preset.id] || <div className="text-xl">✨</div>} 
                    />
                ))}
            </div>
        </div>
    );
}
