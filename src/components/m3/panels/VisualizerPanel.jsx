import React from 'react';
import { useM3Panel } from '../../../hooks/useM3Panel';
import { GridThumbnail } from '../../ui/Thumbnails';

export default function VisualizerPanel({ addObject }) {
    const { initialized, loading, error, settings, markDirty, saveSettings } = useM3Panel('Visualizer');
    const [openCategory, setOpenCategory] = React.useState('modern');

    if (!initialized || loading) return <div className="p-4 text-gray-400 text-xs text-center flex-1">Loading Visualizer Settings...</div>;

    const handleSelect = (name, props) => {
        // Example integration: sync last chosen preset to backend
        const newSettings = { ...settings, preset: name };
        markDirty(newSettings);
        saveSettings(newSettings);
        addObject(props);
    };

    const legacyPresets = [
        { id: "classic-bars", name: "Classic Bars", geometry: { shape: "bar", mirror: false, rounded: false, center: false, thickness: 4, spacing: 2 }, appearance: { color: "#ffffff", glow: 50 }, audio: { fftGain: 100 } },
        { id: "rounded-bars", name: "Rounded Bars", geometry: { shape: "bar", mirror: false, rounded: true, center: false, thickness: 8, spacing: 4 }, appearance: { color: "#4facfe", glow: 40 }, audio: { fftGain: 110 } },
        { id: "thin-spectrum", name: "Thin Spectrum", geometry: { shape: "bar", mirror: false, rounded: false, center: false, thickness: 1, spacing: 1 }, appearance: { color: "#00f2fe", glow: 20 }, audio: { fftGain: 120 } },
        { id: "wide-spectrum", name: "Wide Spectrum", geometry: { shape: "bar", mirror: false, rounded: false, center: false, thickness: 20, spacing: 0 }, appearance: { color: "#f093fb", glow: 10 }, audio: { fftGain: 90 } },
        { id: "mirror-spectrum", name: "Mirror Spectrum", geometry: { shape: "bar", mirror: true, rounded: false, center: false, thickness: 4, spacing: 2 }, appearance: { color: "#ff0844", glow: 60 }, audio: { fftGain: 100 } },
        { id: "center-spectrum", name: "Center Spectrum", geometry: { shape: "bar", mirror: true, rounded: true, center: true, thickness: 6, spacing: 2 }, appearance: { color: "#43e97b", glow: 80 }, audio: { fftGain: 110 } },
        { id: "circular-spectrum", name: "Circular Spectrum", geometry: { shape: "circle", mirror: false, rounded: true, center: false, radius: 100, thickness: 4, spacing: 2 }, appearance: { color: "#fa709a", glow: 70 }, audio: { fftGain: 100 } },
        { id: "double-ring-spectrum", name: "Double Ring Spectrum", geometry: { shape: "double-ring", mirror: true, rounded: true, center: false, radius: 120, thickness: 3, spacing: 2 }, appearance: { color: "#a18cd1", glow: 90 }, audio: { fftGain: 120 } },
        { id: "wave-spectrum", name: "Wave Spectrum", geometry: { shape: "line", mirror: false, rounded: true, center: false, thickness: 3, spacing: 0 }, appearance: { color: "#84fab0", glow: 50 }, audio: { fftGain: 100 } },
        { id: "neon-spectrum", name: "Neon Spectrum", geometry: { shape: "bar", mirror: true, rounded: true, center: false, thickness: 5, spacing: 3 }, appearance: { color: "#ff00ff", glow: 100 }, audio: { fftGain: 130 } }
    ];

    const modernPresets = [
        { id: "glass-bars", name: "Glass Bars", geometry: { shape: "bar", mirror: false, rounded: true, center: false, thickness: 12, spacing: 6 }, appearance: { color: "rgba(255,255,255,0.4)", glassmorphism: true, glow: 10 }, audio: { fftGain: 110, smoothing: 90 } },
        { id: "liquid-spectrum", name: "Liquid Spectrum", geometry: { shape: "spline", mirror: false, rounded: true, center: false, thickness: 0, spacing: 0 }, appearance: { color: "#00d2ff", gradient: "Linear", fill: true, glow: 30 }, audio: { fftGain: 100, smoothing: 95 } },
        { id: "aurora-spectrum", name: "Aurora Spectrum", geometry: { shape: "spline", mirror: true, rounded: true, center: true, thickness: 4, spacing: 0 }, appearance: { color: "#c471ed", gradient: "Aurora", glow: 120 }, audio: { fftGain: 120, smoothing: 92 } },
        { id: "ribbon-flow", name: "Ribbon Flow", geometry: { shape: "ribbon", mirror: false, rounded: true, center: false, thickness: 8, spacing: 0 }, appearance: { color: "#f6d365", gradient: "Linear", glow: 40 }, audio: { fftGain: 100, smoothing: 96 } },
        { id: "vision-spectrum", name: "Vision Spectrum", geometry: { shape: "bar", mirror: false, rounded: true, center: false, thickness: 2, spacing: 4 }, appearance: { color: "rgba(255,255,255,0.8)", glassmorphism: true, glow: 5 }, audio: { fftGain: 110, smoothing: 80 } },
        { id: "neon-pulse", name: "Neon Pulse", geometry: { shape: "bar", mirror: true, rounded: true, center: true, thickness: 6, spacing: 4 }, appearance: { color: "#00ffcc", glow: 150 }, audio: { fftGain: 140, smoothing: 70 } },
        { id: "monstercat-style", name: "Monstercat Style", geometry: { shape: "circle", mirror: false, rounded: true, center: false, radius: 150, thickness: 4, spacing: 2, particles: true }, appearance: { color: "#ffffff", glow: 60, innerCover: true }, audio: { fftGain: 120, smoothing: 85 } },
        { id: "trap-nation", name: "Trap Nation Style", geometry: { shape: "circle", mirror: true, rounded: true, center: false, radius: 140, thickness: 3, spacing: 2, particles: true, pulse: true }, appearance: { color: "#ff3366", glow: 100, innerCover: true }, audio: { fftGain: 130, smoothing: 75 } },
        { id: "hologram-spectrum", name: "Hologram Spectrum", geometry: { shape: "grid", mirror: false, rounded: false, center: false, thickness: 1, spacing: 8 }, appearance: { color: "#00f2fe", glow: 80 }, audio: { fftGain: 110, smoothing: 85 } },
        { id: "minimal-wave", name: "Minimal Wave", geometry: { shape: "spline", mirror: false, rounded: true, center: false, thickness: 2, spacing: 0 }, appearance: { color: "rgba(255,255,255,0.6)", glow: 10 }, audio: { fftGain: 90, smoothing: 98 } }
    ];


    const renderPresetGroup = (presets) => (
        <div className="grid grid-cols-2 gap-3 mt-3">
            {presets.map(p => (
                <GridThumbnail 
                    key={p.id}
                    title={p.name} 
                    color="purple"
                    onClick={() => handleSelect(p.name, { 
                        type: 'visualizer', 
                        name: p.name, 
                        x: 200, y: 200, 
                        width: p.geometry.shape === 'circle' || p.geometry.shape === 'double-ring' ? 400 : 600, 
                        height: p.geometry.shape === 'circle' || p.geometry.shape === 'double-ring' ? 400 : 200,
                        presetId: p.id,
                        geometry: p.geometry,
                        appearance: p.appearance,
                        audio: p.audio,
                        transform: { scale: 100, rotation: 0 }
                    })}
                    preview={
                        <div className="flex items-center justify-center w-full h-12">
                            <div className="text-[10px] text-purple-400 font-medium bg-purple-500/10 px-2 py-1 rounded text-center">
                                {p.name}
                            </div>
                        </div>
                    } 
                />
            ))}
        </div>
    );

    return (
        <div className="space-y-4">
            {error && <div className="bg-red-900/40 border border-red-500 text-red-400 p-2 rounded text-[10px]">{error.message}</div>}
            
            <div className="flex flex-col gap-2">
                <div className="border border-[#2d3247] rounded bg-[#1e2230] overflow-hidden opacity-50 cursor-not-allowed">
                    <button disabled className="w-full p-2 text-xs font-bold flex justify-between items-center text-gray-400">
                        <span>⭐ Recommended</span>
                        <span>▶</span>
                    </button>
                </div>

                <div className="border border-purple-500/20 rounded bg-purple-900/10 overflow-hidden">
                    <button onClick={() => setOpenCategory(openCategory === 'modern' ? null : 'modern')} className="w-full p-2 text-xs font-bold flex justify-between items-center text-purple-300 hover:bg-purple-500/10 transition-colors">
                        <span>✨ Modern Collection</span>
                        <span>{openCategory === 'modern' ? '▼' : '▶'}</span>
                    </button>
                    {openCategory === 'modern' && <div className="p-2 pt-0">{renderPresetGroup(modernPresets)}</div>}
                </div>
                
                <div className="border border-[#2d3247] rounded bg-[#1e2230] overflow-hidden">
                    <button onClick={() => setOpenCategory(openCategory === 'legacy' ? null : 'legacy')} className="w-full p-2 text-xs font-bold flex justify-between items-center text-gray-400 hover:bg-[#2a2f42] transition-colors">
                        <span>🎵 Legacy Collection</span>
                        <span>{openCategory === 'legacy' ? '▼' : '▶'}</span>
                    </button>
                    {openCategory === 'legacy' && <div className="p-2 pt-0">{renderPresetGroup(legacyPresets)}</div>}
                </div>

                <div className="border border-[#2d3247] rounded bg-[#1e2230] overflow-hidden opacity-50 cursor-not-allowed">
                    <button disabled className="w-full p-2 text-xs font-bold flex justify-between items-center text-gray-400">
                        <span>👤 My Presets</span>
                        <span>▶</span>
                    </button>
                </div>

                <div className="border border-[#2d3247] rounded bg-[#1e2230] overflow-hidden opacity-50 cursor-not-allowed">
                    <button disabled className="w-full p-2 text-xs font-bold flex justify-between items-center text-gray-400">
                        <span>📥 Downloaded</span>
                        <span>▶</span>
                    </button>
                </div>

                <div className="border border-[#2d3247] rounded bg-[#1e2230] overflow-hidden opacity-50 cursor-not-allowed">
                    <button disabled className="w-full p-2 text-xs font-bold flex justify-between items-center text-gray-400">
                        <span>❤️ Favorites</span>
                        <span>▶</span>
                    </button>
                </div>

                <div className="border border-[#2d3247] rounded bg-[#1e2230] overflow-hidden opacity-50 cursor-not-allowed">
                    <button disabled className="w-full p-2 text-xs font-bold flex justify-between items-center text-gray-400">
                        <span>📦 Plugin Packs</span>
                        <span>▶</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
