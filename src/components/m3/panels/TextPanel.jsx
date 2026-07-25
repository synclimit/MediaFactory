import React from 'react';
import { useM3Panel } from '../../../hooks/useM3Panel';
import { ThumbnailCard } from '../../ui/Thumbnails';

export default function TextPanel({ addObject }) {
    const { initialized, loading, error, settings, markDirty, saveSettings } = useM3Panel('Text');

    if (!initialized || loading) return <div className="p-4 text-gray-400 text-xs text-center flex-1">Loading Text Settings...</div>;

    const handleSelect = (name, props) => {
        const newSettings = { ...settings, activeTextObjects: [...(settings.activeTextObjects || []), name] };
        markDirty(newSettings);
        saveSettings(newSettings);
        addObject(props);
    };

    return (
        <div className="space-y-4">
            {error && <div className="bg-red-900/40 border border-red-500 text-red-400 p-2 rounded text-[10px]">{error.message}</div>}

            <div className="space-y-3">
                <ThumbnailCard color="green" title="Track List Layout" icon="📋" onClick={() => handleSelect('Playlist Layout', { type: 'playlist', name: 'Playlist Generator', dataSource: 'linked', columns: 1, x: '50%', y: '50%', width: '80%', height: '80%', fontFamily: 'Inter', fontSize: 18, color: '#ffffff', numberFormat: '{number}. {title}' })} />
                <ThumbnailCard color="yellow" title="Current Playing" icon="🎵" onClick={() => handleSelect('Current Playing', { type: 'text', name: '{current_track}', x: '50%', y: '85%', width: '80%', height: '15%', fontSize: 32 })} />
                <ThumbnailCard color="yellow" title="Custom Text" icon="✍️" onClick={() => handleSelect('Custom', { type: 'text', name: 'Custom Text', x: '50%', y: '50%', width: '50%', height: '20%', fontSize: 48 })} />
            </div>
        </div>
    );
}
