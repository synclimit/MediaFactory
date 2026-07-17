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
                <ThumbnailCard color="yellow" title="Playlist Title" icon="T" onClick={() => handleSelect('Playlist Title', { type: 'text', name: 'My Playlist Title', x: 560, y: 200, width: 800, height: 100, fontSize: 64, fontWeight: 'bold' })} />
                <ThumbnailCard color="green" title="Track List Layout" icon="📋" onClick={() => handleSelect('Playlist Layout', { type: 'playlist', name: 'Playlist Generator', dataSource: 'linked', columns: 1, columnTransforms: [{ x: 0, y: 0 }], fontFamily: 'Inter', fontSize: 18, color: '#ffffff', numberFormat: '{number}. {title}' })} />
                <ThumbnailCard color="yellow" title="Current Playing" icon="🎵" onClick={() => handleSelect('Current Playing', { type: 'text', name: 'Now Playing', x: 660, y: 300, width: 600, height: 50, fontSize: 32 })} />
                <ThumbnailCard color="yellow" title="Artist / Album" icon="👤" onClick={() => handleSelect('Artist Album', { type: 'text', name: 'Artist Name', x: 660, y: 380, width: 600, height: 40, fontSize: 24 })} />
                <ThumbnailCard color="yellow" title="Lyrics" icon="🎤" onClick={() => handleSelect('Lyrics', { type: 'text', name: 'Lyrics appear here...', x: 500, y: 800, width: 920, height: 60, fontSize: 28, color: '#aaaaaa' })} />
                <ThumbnailCard color="yellow" title="Custom Text" icon="✍️" onClick={() => handleSelect('Custom', { type: 'text', name: 'Custom Text', x: 760, y: 490, width: 400, height: 100, fontSize: 48 })} />
            </div>
        </div>
    );
}
