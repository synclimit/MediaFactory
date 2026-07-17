import React from 'react';
import { useM3Panel } from '../../../hooks/useM3Panel';
import { ThumbnailCard } from '../../ui/Thumbnails';

export default function BrandingPanel({ addObject }) {
    const { initialized, loading, error, settings, markDirty, saveSettings } = useM3Panel('Branding');

    if (!initialized || loading) return <div className="p-4 text-gray-400 text-xs text-center flex-1">Loading Branding Settings...</div>;

    const handleSelect = (name, props) => {
        const newSettings = { ...settings, activeBranding: [...(settings.activeBranding || []), name] };
        markDirty(newSettings);
        saveSettings(newSettings);
        if (props) addObject(props);
    };

    return (
        <div className="space-y-4">
            {error && <div className="bg-red-900/40 border border-red-500 text-red-400 p-2 rounded text-[10px]">{error.message}</div>}

            <div className="space-y-3">
                <ThumbnailCard color="pink" title="Logo" icon="🛡️" onClick={() => handleSelect('Logo', { type: 'logo', name: 'Brand Logo', x: 50, y: 50, width: 150, height: 150, opacity: 100 })} />
                <ThumbnailCard color="pink" title="Watermark" icon="💧" onClick={() => handleSelect('Watermark', { type: 'logo', name: 'Watermark', x: 1700, y: 1000, width: 100, height: 100, opacity: 50 })} />
                <ThumbnailCard color="pink" title="Intro Sequence" icon="🎬" onClick={() => handleSelect('Intro', { type: 'video', name: 'Intro Sequence', x: 0, y: 0, width: 1920, height: 1080 })} />
                <ThumbnailCard color="pink" title="Outro Sequence" icon="🔚" onClick={() => handleSelect('Outro', { type: 'video', name: 'Outro Sequence', x: 0, y: 0, width: 1920, height: 1080 })} />
                <ThumbnailCard color="pink" title="Subscribe Animation" icon="🔔" onClick={() => handleSelect('Subscribe Animation', { type: 'widget', widgetType: 'subscribe', name: 'Subscribe Animation', x: 800, y: 900, width: 300, height: 100 })} />
            </div>
        </div>
    );
}
