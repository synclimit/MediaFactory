import React, { useState } from 'react';
import { useM3Panel } from '../../../hooks/useM3Panel';
import { emitRuntimeEvent } from '../../../services/RuntimeClient';

// ============================================================
// BSPLabs-Style FX Panel — 18 Effects with Inline Inspector
// ============================================================

export const ALL_EFFECTS = [
    {
        id: 'guncang-kamera', name: 'Guncang kamera', presetId: 'camera-shake', tier: 'pro',
        defaultProps: { strength: 23, source: 'kick', mode: 'Ringan — cepat (disarankan)', shape: 'Semua arah', size: 27 }
    },
    {
        id: 'zoom-hentak', name: 'Zoom hentak', presetId: 'zoom-hentak', tier: 'pro',
        defaultProps: { depth: 50, source: 'kick', mode: 'Ringan — cepat (disarankan)', shape: 'Masuk', speed: 1.0 }
    },
    {
        id: 'kilat-strobe', name: 'Kilat / strobe', presetId: 'strobe-flash', tier: 'pro',
        defaultProps: { brightness: 50, source: 'kick', colorMode: 'Warna kustom', color: '#ffffff', speed: 1.0 }
    },
    {
        id: 'lampu-disko', name: 'Lampu disko', presetId: 'disco-light', tier: 'pro',
        defaultProps: { brightness: 50, source: 'kick', colorMode: 'Warna kustom', color: '#ffffff', shape: 'Kerucut sorot', size: 50, count: 4 }
    },
    {
        id: 'neon-kedalaman', name: 'Neon kedalaman', presetId: 'neon-depth', tier: 'pro',
        defaultProps: { brightness: 50, source: 'kick', colorMode: 'Warna kustom', color: '#00ffff', shape: 'Garis lurus', size: 50, speed: 1.0 }
    },
    {
        id: 'lampu-kedalaman', name: 'Lampu kedalaman', presetId: 'deep-light', tier: 'pro',
        defaultProps: { brightness: 50, source: 'kick', colorMode: 'Warna kustom', color: '#ffffff', shape: 'Bulatan', size: 50, count: 3, depthLevel: 80 }
    },
    {
        id: 'sinar-kedalaman', name: 'Sinar kedalaman', presetId: 'god-rays', tier: 'pro',
        defaultProps: { strength: 50, source: 'kick', colorMode: 'Warna kustom', color: '#ffaa55', direction: 'Atas', length: 50, speed: 1.0 }
    },
    {
        id: 'bokeh-kedalaman', name: 'Bokeh kedalaman', presetId: 'depth-bokeh', tier: 'pro',
        defaultProps: { brightness: 50, source: 'energy', colorMode: 'Warna kustom', color: '#ffffff', size: 50, count: 25, depthLevel: 80 }
    },
    {
        id: 'pindai-kedalaman', name: 'Pindai kedalaman', presetId: 'depth-scan', tier: 'pro',
        defaultProps: { brightness: 50, source: 'kick', colorMode: 'Warna kustom', color: '#00ff88', shape: 'Horizontal', speed: 1.0, size: 50 }
    },
    {
        id: 'kabut-kedalaman', name: 'Kabut kedalaman', presetId: 'depth-fog', tier: 'pro',
        defaultProps: { density: 50, source: 'energy', colorMode: 'Warna kustom', color: '#ffffff', speed: 1.0, depthLevel: 80 }
    },
    {
        id: 'glitch', name: 'Glitch', presetId: 'glitch-digital', tier: 'pro',
        defaultProps: { intensity: 50, source: 'kick', shape: 'RGB Split', frequency: 50, speed: 1.0 }
    },
    {
        id: 'debu-film-tua', name: 'Debu film tua', presetId: 'old-film-dust', tier: 'free',
        defaultProps: { density: 50, source: 'energy', shape: 'Ringan', color: '#ffffff', speed: 1.0 }
    },
    {
        id: 'garis-kecepatan', name: 'Garis kecepatan', presetId: 'speed-lines', tier: 'pro',
        defaultProps: { intensity: 50, source: 'kick', shape: 'Radial', color: '#ffffff', count: 60, speed: 1.0 }
    },
    {
        id: 'grain-film', name: 'Grain film', presetId: 'film-grain', tier: 'free',
        defaultProps: { intensity: 50, source: 'none', shape: 'Halus', size: 50 }
    },
    {
        id: 'vignette', name: 'Vignette', presetId: 'vignette', tier: 'free',
        defaultProps: { darkness: 50, source: 'none', shape: 'Bulat', color: '#000000', size: 50 }
    },
    {
        id: 'letterbox', name: 'Letterbox', presetId: 'letterbox', tier: 'free',
        defaultProps: { height: 50, source: 'none', color: '#000000', size: 50 }
    },
    {
        id: 'scanline', name: 'Scanline', presetId: 'scanline', tier: 'pro',
        defaultProps: { density: 50, source: 'kick', shape: 'Turun', color: '#000000', size: 50 }
    },
    {
        id: 'light-leak', name: 'Light leak', presetId: 'light-leak', tier: 'pro',
        defaultProps: { strength: 50, source: 'kick', colorMode: 'Warna kustom', color: '#ff8800', shape: 'Kanan-atas', size: 50, speed: 1.0 }
    },
];

export const GENRE_PRESETS = [
    { name: 'Phonk', effects: ['guncang-kamera', 'zoom-hentak', 'glitch', 'vignette'] },
    { name: 'EDM drop', effects: ['zoom-hentak', 'kilat-strobe', 'neon-kedalaman', 'garis-kecepatan'] },
    { name: 'House', effects: ['lampu-disko', 'neon-kedalaman', 'kabut-kedalaman'] },
    { name: 'Techno', effects: ['kilat-strobe', 'scanline', 'glitch'] },
    { name: 'Trance', effects: ['zoom-hentak', 'neon-kedalaman', 'bokeh-kedalaman', 'kabut-kedalaman'] },
    { name: 'Dubstep', effects: ['guncang-kamera', 'glitch', 'kilat-strobe', 'garis-kecepatan'] },
    { name: 'Hip-hop', effects: ['zoom-hentak', 'vignette', 'light-leak'] },
    { name: 'Trap', effects: ['zoom-hentak', 'kilat-strobe', 'garis-kecepatan'] },
    { name: 'Disco', effects: ['lampu-disko', 'light-leak', 'bokeh-kedalaman'] },
    { name: 'Funk', effects: ['lampu-disko', 'neon-kedalaman', 'light-leak'] },
    { name: 'R&B', effects: ['bokeh-kedalaman', 'light-leak', 'vignette'] },
    { name: 'Pop', effects: ['zoom-hentak', 'light-leak', 'bokeh-kedalaman'] },
    { name: 'Rock', effects: ['guncang-kamera', 'kilat-strobe', 'vignette'] },
    { name: 'Metal', effects: ['guncang-kamera', 'kilat-strobe', 'glitch', 'garis-kecepatan'] },
    { name: 'Reggae', effects: ['light-leak', 'kabut-kedalaman', 'bokeh-kedalaman'] },
    { name: 'Synthwave', effects: ['neon-kedalaman', 'scanline', 'garis-kecepatan', 'vignette'] },
    { name: 'Vaporwave', effects: ['scanline', 'glitch', 'grain-film', 'vignette'] },
    { name: 'Lo-fi tape', effects: ['grain-film', 'debu-film-tua', 'vignette', 'letterbox'] },
    { name: 'Chill / study', effects: ['bokeh-kedalaman', 'vignette', 'light-leak'] },
    { name: 'Ambient', effects: ['kabut-kedalaman', 'bokeh-kedalaman', 'sinar-kedalaman'] },
    { name: 'ASMR / rain', effects: ['grain-film', 'vignette', 'kabut-kedalaman'] },
    { name: 'Classical', effects: ['sinar-kedalaman', 'vignette', 'bokeh-kedalaman'] },
    { name: 'Jazz', effects: ['grain-film', 'vignette', 'light-leak'] },
    { name: 'Acoustic', effects: ['light-leak', 'vignette', 'bokeh-kedalaman'] },
    { name: 'Worship', effects: ['sinar-kedalaman', 'bokeh-kedalaman', 'kabut-kedalaman'] },
    { name: 'Nasheed', effects: ['sinar-kedalaman', 'vignette', 'kabut-kedalaman'] },
    { name: 'Dangdut / koplo', effects: ['lampu-disko', 'kilat-strobe', 'kabut-kedalaman'] },
    { name: 'Workout', effects: ['zoom-hentak', 'garis-kecepatan', 'kilat-strobe'] },
    { name: 'Kids', effects: ['bokeh-kedalaman', 'light-leak'] },
    { name: 'Retro VHS', effects: ['scanline', 'glitch', 'grain-film', 'debu-film-tua'] },
    { name: 'Bersih', effects: [] },
];

export default function EffectsPanel({ m3Objects, setM3Objects, m3SelectedObjectId, setM3SelectedObjectId }) {
    const [openCategory, setOpenCategory] = useState('Genre Presets');
    const { initialized, loading } = useM3Panel('Effects');

    if (!initialized || loading) return <div className="p-4 text-gray-400 text-xs text-center flex-1">Loading Effects...</div>;

    // --- Apply genre preset ---
    const applyGenrePreset = (presetName) => {
        const preset = GENRE_PRESETS.find(p => p.name === presetName);
        if (!preset) return;
        
        const nonEffects = m3Objects.filter(obj => obj.type !== 'effect' && obj.type !== 'reactive');
        const newEffects = preset.effects.map(effectId => {
            const effectDef = ALL_EFFECTS.find(e => e.id === effectId);
            if (!effectDef) return null;
            return {
                id: 'fx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                type: 'effect', // Updated to 'effect' so it routes to the correct inspector automatically
                presetId: effectDef.presetId,
                name: effectDef.name,
                category: 'effect',
                enabled: true,
                // Envelope defaults
                sensitivityMode: 'Normal',
                amplitude: 100, threshold: 35, attack: 15, release: 180, smoothness: 60,
                operation: 'multiply', curve: 'easeOut',
                source: effectDef.defaultProps.source || 'energy',
                props: { ...effectDef.defaultProps },
            };
        }).filter(Boolean);
        
        setM3Objects([...nonEffects, ...newEffects]);
    };

    const handleAddEffect = (effectDef) => {
        const newEffect = {
            id: 'fx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: 'effect',
            presetId: effectDef.presetId,
            name: effectDef.name,
            category: 'effect',
            enabled: true,
            sensitivityMode: 'Normal',
            amplitude: 100, threshold: 35, attack: 15, release: 180, smoothness: 60,
            operation: 'multiply', curve: 'easeOut',
            source: effectDef.defaultProps.source || 'energy',
            props: { ...effectDef.defaultProps },
        };
        setM3Objects(prev => [...prev, newEffect]);
        emitRuntimeEvent('Effect.Created', { id: newEffect.id, name: newEffect.name });
    };

    const EFFECT_CATEGORIES = [
        {
            id: 'Motion & Action',
            icon: '🎬',
            effects: ['guncang-kamera', 'zoom-hentak', 'garis-kecepatan']
        },
        {
            id: 'Lighting & Glow',
            icon: '✨',
            effects: ['kilat-strobe', 'lampu-disko', 'neon-kedalaman', 'lampu-kedalaman', 'sinar-kedalaman', 'bokeh-kedalaman', 'light-leak']
        },
        {
            id: 'Cinematic & Retro',
            icon: '🎞️',
            effects: ['debu-film-tua', 'grain-film', 'vignette', 'letterbox']
        },
        {
            id: 'Digital & Environment',
            icon: '⚡',
            effects: ['glitch', 'scanline', 'pindai-kedalaman', 'kabut-kedalaman']
        }
    ];

    return (
        <div className="flex flex-col h-full bg-[#0b0d14] text-gray-300 font-sans px-1 pb-10 overflow-y-auto custom-scrollbar select-none">
            
            <div className="flex flex-col gap-3 mt-4">
                
                {/* GENRE PRESETS ACCORDION */}
                <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] flex flex-col shrink-0 overflow-hidden group transition-all duration-300 z-10 mb-2">
                    {openCategory === 'Genre Presets' && (
                        <>
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
                        </>
                    )}
                    <button 
                        onClick={() => setOpenCategory(openCategory === 'Genre Presets' ? null : 'Genre Presets')}
                        className={`w-full text-left px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide flex justify-between items-center transition-colors relative z-10 ${openCategory === 'Genre Presets' ? 'text-white m5-white-glow' : 'hover:bg-[#1a1c25] text-gray-300'}`}
                    >
                        <span className="flex items-center gap-3">
                            <span className={`text-[16px] transition-all duration-300 ${openCategory === 'Genre Presets' ? 'text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)] scale-110' : 'text-orange-500/80 group-hover:text-orange-400'}`}>🎨</span> 
                            Genre Presets
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-colors ${openCategory === 'Genre Presets' ? 'bg-orange-500/20 border-orange-500/40 text-orange-200' : 'bg-[#111216] border-[#2d3247] text-gray-500'}`}>
                            {GENRE_PRESETS.length} PRESETS
                        </span>
                    </button>
                    {openCategory === 'Genre Presets' && (
                        <div className="p-3 bg-black/20 relative z-10 border-t border-white/5">
                            <select 
                                className="w-full bg-[#151720] border border-[#2d3060] rounded-lg px-4 py-2.5 text-[12px] text-white font-medium focus:outline-none focus:border-orange-500 appearance-none cursor-pointer hover:border-orange-400/50 transition-colors mb-2"
                                onChange={e => applyGenrePreset(e.target.value)}
                                defaultValue=""
                                style={{
                                    backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%23f97316%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E\")",
                                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '.75rem auto'
                                }}
                            >
                                <option value="" disabled className="bg-[#151720] text-gray-500">✨ Pilih Preset Genre...</option>
                                {GENRE_PRESETS.map((p, i) => (
                                    <option key={i} value={p.name} className="bg-[#151720]">{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* EFFECTS CATEGORIES */}
                {EFFECT_CATEGORIES.map(cat => {
                    const isOpen = openCategory === cat.id;
                    const catEffects = cat.effects.map(effectId => ALL_EFFECTS.find(e => e.id === effectId)).filter(Boolean);

                    return (
                        <div key={cat.id} className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] flex flex-col shrink-0 overflow-hidden group transition-all duration-300 z-10 mb-2">
                            {isOpen && (
                                <>
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
                                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
                                </>
                            )}
                            <button 
                                onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                                className={`w-full text-left px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide flex justify-between items-center transition-colors relative z-10 ${isOpen ? 'text-white m5-white-glow' : 'hover:bg-[#1a1c25] text-gray-300'}`}
                            >
                                <span className="flex items-center gap-3">
                                    <span className={`text-[16px] transition-all duration-300 ${isOpen ? 'text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)] scale-110' : 'text-orange-500/80 group-hover:text-orange-400'}`}>{cat.icon}</span> 
                                    {cat.id}
                                </span>
                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-colors ${isOpen ? 'bg-orange-500/20 border-orange-500/40 text-orange-200' : 'bg-[#111216] border-[#2d3247] text-gray-500'}`}>
                                    {catEffects.length} EFFECTS
                                </span>
                            </button>
                            
                            {isOpen && (
                                <div className="p-3 bg-black/20 relative z-10 border-t border-white/5">
                                    <div className="grid grid-cols-2 gap-2">
                                        {catEffects.map(eff => (
                                            <button 
                                                key={eff.id}
                                                onClick={() => handleAddEffect(eff)}
                                                className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-white/5 bg-[#161822]/50 hover:bg-[#1a1c25] hover:border-orange-500/50 transition-all duration-300 group text-left shadow-inner relative"
                                            >
                                                <div className="w-full h-10 bg-black/40 rounded border border-black/50 group-hover:border-orange-500/40 flex items-center justify-center overflow-hidden">
                                                    <span className="text-xl opacity-30 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 group-hover:text-orange-400">{cat.icon}</span>
                                                </div>
                                                {eff.tier === 'pro' && (
                                                    <span className="absolute top-1 right-1 text-[7px] bg-orange-600 text-white px-1 py-0.5 rounded font-black tracking-wider shadow-md z-20">PRO</span>
                                                )}
                                                <span className="text-[9px] font-bold text-gray-400 group-hover:text-white truncate w-full text-center tracking-wide transition-colors">
                                                    {eff.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
