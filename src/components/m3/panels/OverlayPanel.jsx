import React from 'react';
import { useM3Panel } from '../../../hooks/useM3Panel';
import OverlayPicker from './OverlayPicker';

export default function OverlayPanel({ addObject }) {
    const { 
        initialized, loading, saving, error, 
        settings, capabilities, markDirty, saveSettings 
    } = useM3Panel('Overlay');

    const [widgets, setWidgets] = React.useState([]);

    React.useEffect(() => {
        import('../../../services/m3WidgetStore').then(({ m3WidgetStore }) => {
            m3WidgetStore.initialize().then(() => {
                setWidgets(m3WidgetStore.getAllWidgets());
            });
        });
    }, []);

    if (!initialized || loading) {
        return <div className="p-4 text-gray-400 text-xs text-center flex-1">Loading Overlay Settings...</div>;
    }

    const injectSocialWidget = (widgetId) => {
        if (!addObject) return;
        import('../../../services/m3WidgetStore').then(({ m3WidgetStore }) => {
            const w = m3WidgetStore.getWidget(widgetId);
            if (!w) return;
            
            addObject({
                type: 'social-widget',
                widgetId: w.id,
                name: w.name,
                source: w.videoUrl, // Use the resolved URL
                x: 100, y: 100,
                width: 400, height: 400,
                scale: w.defaultScale || 1.0,
                opacity: w.defaultOpacity !== undefined ? w.defaultOpacity * 100 : 100,
                rotation: 0,
                loop: w.loop || false,
                playbackRate: 1.0,
                visible: true,
                locked: false,
                layer: Date.now(),
                // Chroma Key advanced defaults
                alphaMode: w.alphaMode || 'chroma',
                chromaKey: w.alphaMode === 'chroma',
                keyColor: w.keyColor || '#00FF00',
                similarity: w.similarity ?? 0.22,
                smoothness: w.smoothness ?? 0.08,
                spill: w.spill ?? 0.15
            });
        });
    };

    const injectImage = (mediaType, name) => {
        if (!addObject) return;

        const input = document.createElement('input');
        input.type = 'file';
        
        if (mediaType === 'image') {
            input.accept = 'image/png, image/jpeg, image/jpg, image/webp, image/svg+xml';
        } else if (mediaType === 'video') {
            input.accept = 'video/mp4, video/webm, video/quicktime';
        } else if (mediaType === 'gif') {
            input.accept = 'image/gif';
        }

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Generate an object URL for the local file so we can render it immediately
            const objectUrl = URL.createObjectURL(file);

            // Give it default dimensions based on type (would normally load metadata first)
            addObject({
                type: 'image', // Keep it 'image' type for M3ObjectInspector Overlay category logic
                mediaType, // 'image', 'video', 'gif'
                name: file.name,
                source: objectUrl,
                x: 100, y: 100,
                width: 400, height: mediaType === 'video' ? 225 : 400,
                scale: 1,
                rotation: 0,
                opacity: 100,
                blend: 'Normal',
                visible: true,
                locked: false,
                layer: Date.now(), // Will be sorted
                // Default media props
                loop: true,
                muted: false,
                playbackRate: 1
            });
        };

        input.click();
    };

    const injectWidget = (type, name, icon) => {
        if (!addObject) return;
        addObject({
            type: type,
            name: name,
            icon: icon,
            x: 50, y: 50,
            width: 150, height: 150,
            scale: 1,
            opacity: 100,
            rotation: 0,
            visible: true,
            locked: false,
            layer: Date.now()
        });
    };

    const injectPlaylist = () => {
        if (!addObject) return;
        addObject({
            type: 'playlist',
            name: 'Track List',
            tracks: [
                { id: `t-1`, title: 'Track 01' },
                { id: `t-2`, title: 'Track 02' },
                { id: `t-3`, title: 'Track 03' },
                { id: `t-4`, title: 'Track 04' }
            ],
            layout: 'single',
            leftTransform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 100 },
            rightTransform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 100 },
            numbering: 'normal',
            columns: 1,
            font: 'Inter',
            fontSize: 24,
            color: '#ffffff',
            lineHeight: 1.5,
            gap: 20,
            opacity: 100,
            rotation: 0,
            x: 400,
            y: 300,
            width: 800,
            height: 600,
            visible: true,
            locked: false,
            layer: Date.now()
        });
    };

    const injectSubtitle = () => {
        if (!addObject) return;
        addObject({
            type: 'subtitle',
            name: 'Subtitle Track',
            subtitles: [
                { id: 's-1', text: 'This is the first subtitle line' },
                { id: 's-2', text: 'And this is the second line' }
            ],
            transform: { x: 400, y: 400, scale: 1, rotation: 0, opacity: 100 },
            width: 700,
            bottomMargin: 50,
            typographyTheme: 'classic',
            font: 'Arial, sans-serif',
            fontSize: 32,
            fontWeight: 'bold',
            color: '#ffffff',
            align: 'center',
            layer: Date.now(),
            visible: true,
            locked: false,
            canvasMode: 'composer'
        });
    };

    return (
        <div className="space-y-4">
            {error && <div className="bg-red-900/40 border border-red-500 text-red-400 p-2 rounded text-[10px]">{error.message}</div>}

            <OverlayPicker addObject={addObject} />

            <div className="border-t border-[#21232d] pt-4">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Basic Tools</h3>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => injectWidget('logo', 'Corner Logo', 'Ⓜ️')} className="w-full flex flex-col items-center justify-center gap-1 p-2 rounded bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] hover:border-emerald-500/50 transition-colors text-gray-300">
                        <span className="text-lg">Ⓜ️</span>
                        <span className="text-[9px] font-bold">Logo</span>
                    </button>
                    <button onClick={injectPlaylist} className="w-full flex flex-col items-center justify-center gap-1 p-2 rounded bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] hover:border-emerald-500/50 transition-colors text-gray-300">
                        <span className="text-lg">🎵</span>
                        <span className="text-[9px] font-bold">Playlist</span>
                    </button>
                    <button onClick={injectSubtitle} className="w-full flex flex-col items-center justify-center gap-1 p-2 rounded bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] hover:border-emerald-500/50 transition-colors text-gray-300">
                        <span className="text-lg">💬</span>
                        <span className="text-[9px] font-bold">Subtitle</span>
                    </button>
                </div>
            </div>

            <div className="border-t border-[#21232d] pt-4">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Social Widgets</h3>
                {widgets.length === 0 ? (
                    <div className="text-gray-500 text-xs text-center py-4">Loading widgets...</div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {widgets.map(w => (
                            <button key={w.id} onClick={() => injectSocialWidget(w.id)} className="bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] py-2 rounded flex items-center justify-center gap-2">
                                <span className="text-blue-500">❖</span> {w.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
