import React, { useState } from 'react';
import { useM3Panel } from '../../../hooks/useM3Panel';
import { emitRuntimeEvent } from '../../../services/RuntimeClient';

const EFFECT_CATEGORIES = [
    {
        name: 'Camera Shake',
        icon: '📷',
        effects: [
            { id: 'cam-natural', name: 'Natural', type: 'camera', presetId: 'camera-shake', recommended: true, desc: "Gentle natural breathing.", defaultProps: { baseIntensity: 10, beatMultiplier: 10, attack: 50, release: 300, randomness: 30, frequency: 5, smoothing: 80, maxOffset: 20 } },
            { id: 'cam-soft', name: 'Soft', type: 'camera', presetId: 'camera-shake', recommended: false, desc: "Very subtle movement.", defaultProps: { baseIntensity: 5, beatMultiplier: 0, attack: 100, release: 500, randomness: 20, frequency: 2, smoothing: 90, maxOffset: 10 } },
            { id: 'cam-bass', name: 'Bass', type: 'camera', presetId: 'camera-shake', recommended: false, desc: "Shakes heavily on kick drums.", defaultProps: { baseIntensity: 0, beatMultiplier: 100, attack: 20, release: 250, randomness: 50, frequency: 15, smoothing: 40, maxOffset: 60 } },
            { id: 'cam-edm', name: 'EDM', type: 'camera', presetId: 'camera-shake', recommended: false, desc: "Aggressive fast shaking.", defaultProps: { baseIntensity: 10, beatMultiplier: 150, attack: 10, release: 150, randomness: 80, frequency: 30, smoothing: 20, maxOffset: 80 } },
            { id: 'cam-cinematic', name: 'Cinematic', type: 'camera', presetId: 'camera-shake', recommended: false, desc: "Slow, heavy camera movements.", defaultProps: { baseIntensity: 5, beatMultiplier: 20, attack: 100, release: 500, randomness: 20, frequency: 2, smoothing: 90, maxOffset: 30 } }
        ]
    },
    {
        name: 'Zoom Pulse',
        icon: '🔍',
        effects: [
            { id: 'zoom-natural', name: 'Natural', type: 'camera', presetId: 'zoom-pulse', recommended: true, desc: "Smooth musical pulsing.", defaultProps: { beatMultiplier: 100, maxScale: 102 } },
            { id: 'zoom-soft', name: 'Soft', type: 'camera', presetId: 'zoom-pulse', recommended: false, desc: "Gently zooms with the beat.", defaultProps: { beatMultiplier: 50, maxScale: 101 } },
            { id: 'zoom-bass', name: 'Bass', type: 'camera', presetId: 'zoom-pulse', recommended: false, desc: "Medium pulse on bass hits.", defaultProps: { beatMultiplier: 150, maxScale: 103 } },
            { id: 'zoom-cinematic', name: 'Cinematic', type: 'camera', presetId: 'zoom-pulse', recommended: false, desc: "Slight pulse for slow songs.", defaultProps: { beatMultiplier: 30, maxScale: 100.5 } },
            { id: 'zoom-edm', name: 'EDM', type: 'camera', presetId: 'zoom-pulse', recommended: false, desc: "Hard zooms for dance music.", defaultProps: { beatMultiplier: 200, maxScale: 104 } },
            { id: 'zoom-hyper', name: 'Hyper', type: 'camera', presetId: 'zoom-pulse', recommended: false, desc: "Extreme zoom variations.", defaultProps: { beatMultiplier: 300, maxScale: 106 } }
        ]
    }
];

export default function EffectsPanel({ m3Objects, setM3Objects, m3SelectedObjectId, setM3SelectedObjectId }) {
    const { initialized, loading, error } = useM3Panel('Effects');
    const [openCategory, setOpenCategory] = useState('Camera');
    const [showAll, setShowAll] = useState(false);
    const [hoveredEffect, setHoveredEffect] = useState(null);

    if (!initialized || loading) return <div className="p-4 text-gray-400 text-xs text-center flex-1">Loading Effects...</div>;

    const activeEffects = m3Objects.filter(obj => obj.type === 'effect' || obj.type === 'reactive');

    const handleAddEffect = (effect) => {
        let newEffect = {
            id: 'eff_' + Date.now(),
            type: 'reactive',
            presetId: effect.presetId || effect.id,
            name: effect.name,
            category: 'reactive',
            enabled: true,
            sensitivityMode: 'Normal',
            amplitude: 100, threshold: 35, attack: 15, release: 180, smoothness: 60,
            operation: 'multiply', curve: 'easeOut',
            props: { ...effect.defaultProps }
        };

        if (effect.presetId === 'camera-shake') {
            newEffect.effect = 'Camera Shake';
            newEffect.source = 'bass';
        } else if (effect.presetId === 'zoom-pulse') {
            newEffect.effect = 'Zoom Pulse';
            newEffect.source = 'kick';
            newEffect.operation = 'multiply';
            newEffect.amplitude = effect.defaultProps && effect.defaultProps.maxScale ? effect.defaultProps.maxScale - 100 : 10;
        } else {
            newEffect.effect = effect.presetId;
            newEffect.source = 'energy';
        }

        setM3Objects(prev => [...prev, newEffect]);
        setM3SelectedObjectId(newEffect.id);
        emitRuntimeEvent('Effect.Created', { id: newEffect.id, name: newEffect.name });
    };

    const handleToggleEffect = (id, enabled) => {
        setM3Objects(prev => prev.map(obj => obj.id === id ? { ...obj, enabled } : obj));
        emitRuntimeEvent(enabled ? 'Effect.Enabled' : 'Effect.Disabled', { id });
    };

    const handleDeleteEffect = (id) => {
        setM3Objects(prev => prev.filter(obj => obj.id !== id));
        if (m3SelectedObjectId === id) {
            setM3SelectedObjectId(null);
        }
        emitRuntimeEvent('Effect.Removed', { id });
    };

    const getCategoryIcon = (category) => {
        const cat = EFFECT_CATEGORIES.find(c => c.effects.some(e => e.type === category));
        return cat ? cat.icon : '✨';
    };

    const handleHover = (effectId) => {
        setHoveredEffect(effectId);
        // Simulation of temporary hover preview
    };

    return (
        <div className="flex flex-col gap-6 bg-[#0A0D14] -m-4 p-4">
            {error && <div className="bg-red-900/40 border border-red-500 text-red-400 p-2 text-[10px] z-50 mb-4">{error.message}</div>}
            
            {/* Top: Current Stack (Always visible first) */}
            <div className="flex flex-col bg-[#141824] rounded-2xl border border-[#2d3247] overflow-hidden shadow-[0_5px_20px_rgba(0,0,0,0.2)]">
                <div className="p-3 border-b border-[#2d3247] bg-[#1a1e2d] flex justify-between items-center">
                    <div>
                        <h3 className="text-xs font-bold text-white tracking-tight">Current Stack</h3>
                        <p className="text-[9px] text-gray-500 mt-0.5">Active effects applied to scene</p>
                    </div>
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-bold">{activeEffects.length}</span>
                </div>
                
                <div className="p-2.5 flex flex-col gap-2">
                    {activeEffects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center gap-2 opacity-50">
                            <span className="text-2xl">🪄</span>
                            <div>
                                <p className="text-xs font-bold text-gray-300">No active effects</p>
                                <p className="text-[10px] text-gray-500 mt-1">Choose a creative preset from the library below.</p>
                            </div>
                        </div>
                    ) : (
                        activeEffects.map((eff, index) => (
                            <div 
                                key={eff.id} 
                                className={`flex flex-col bg-[#1a1e2d] border rounded-xl p-3 gap-2 transition-colors ${!eff.enabled ? 'opacity-50 grayscale' : ''} ${m3SelectedObjectId === eff.id ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'border-[#2d3247] hover:border-[#4d5573]'} cursor-pointer`}
                                onClick={() => setM3SelectedObjectId(eff.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleToggleEffect(eff.id, !eff.enabled); }}
                                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${eff.enabled ? 'bg-purple-500 border-purple-500' : 'bg-transparent border-gray-600'}`}
                                        >
                                            {eff.enabled && <span className="text-[10px] text-white font-bold">✓</span>}
                                        </button>
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-white">{eff.name}</span>
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                🎵 Reactive
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[9px] font-bold bg-green-900/20 text-green-400 px-1.5 py-0.5 rounded">🟢 Active</span>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteEffect(eff.id); }} className="text-red-500 hover:text-red-400 text-xs opacity-50 hover:opacity-100 mt-1" title="Remove Effect">Remove</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Bottom: Library */}
            <div className="flex flex-col gap-4 w-full">
                {EFFECT_CATEGORIES.map(cat => (
                    <div key={cat.name} className="flex flex-col gap-3 mb-4">
                        {/* Richer Category Header */}
                        <div 
                            className="flex justify-between items-end border-b border-[#2d3247] pb-2 cursor-pointer group"
                            onClick={() => {
                                if (openCategory !== cat.name) {
                                    setOpenCategory(cat.name);
                                    setShowAll(false);
                                } else {
                                    setOpenCategory(null);
                                }
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{cat.icon}</span>
                                <div className="flex flex-col">
                                    <h2 className="text-[15px] font-bold text-white tracking-tight leading-tight">{cat.name} Effects</h2>
                                    <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                                        {cat.effects.filter(e => e.recommended).length} Recommended
                                    </span>
                                </div>
                            </div>
                            <span className="text-gray-600 group-hover:text-white transition-colors text-xs">{openCategory === cat.name ? '▼' : '▶'}</span>
                        </div>

                        {/* Effects Grid - Strictly 2 columns for narrow 320px container */}
                        {openCategory === cat.name && (
                            <div className="grid grid-cols-2 gap-2.5">
                                {cat.effects.filter(eff => showAll || eff.recommended).map(eff => (
                                    <div 
                                        key={eff.id} 
                                        onClick={() => handleAddEffect(eff)}
                                        onMouseEnter={() => handleHover(eff.id)}
                                        onMouseLeave={() => setHoveredEffect(null)}
                                        className={`flex flex-col bg-[#141824] rounded-xl border transition-all cursor-pointer overflow-hidden ${hoveredEffect === eff.id ? 'border-purple-500 shadow-[0_4px_15px_rgba(168,85,247,0.15)] scale-[1.02]' : 'border-[#2d3247] hover:border-[#4d5573]'}`}
                                    >
                                        {/* Visual Preview */}
                                        <div 
                                            className="h-24 w-full bg-[#11131a] bg-cover bg-center border-b border-[#2d3247] flex items-center justify-center relative overflow-hidden transition-transform duration-500"
                                            style={{ 
                                                backgroundImage: `url(/assets/effects/${eff.id}.png), url(/assets/effects/${cat.name.includes('Color') ? 'color' : cat.name.includes('Distortion') ? 'retro' : cat.name.toLowerCase()}.png)` 
                                            }}
                                        >
                                            <div className={`absolute inset-0 transition-colors duration-300 ${hoveredEffect === eff.id ? 'bg-black/10' : 'bg-[#0a0d14]/70'}`}></div>
                                            <span className={`text-2xl z-10 drop-shadow-lg transition-opacity duration-300 ${hoveredEffect === eff.id ? 'opacity-0' : 'opacity-60'}`}>{cat.icon}</span>
                                        </div>
                                        
                                        {/* Details */}
                                        <div className="p-2.5 flex flex-col gap-1">
                                            <span className="text-xs font-bold text-white tracking-tight truncate">
                                                {eff.recommended && <span className="text-yellow-400 mr-1" title="Recommended">⭐</span>}
                                                {eff.name}
                                            </span>
                                            <span className="text-[9px] text-gray-400 truncate opacity-80">{eff.desc}</span>
                                            
                                            {/* Badges */}
                                            <div className="flex gap-1 mt-1.5 flex-wrap">
                                                <span className="text-[8.5px] font-bold bg-[#1e2230] text-gray-300 px-1 py-0.5 rounded flex items-center gap-1 shrink-0">
                                                    🎵 {cat.name === 'Camera' || cat.name === 'Particles' ? 'Reactive' : 'Visual'}
                                                </span>
                                                <span className="text-[8.5px] font-bold bg-green-900/20 text-green-400 px-1 py-0.5 rounded flex items-center gap-1 shrink-0">
                                                    🟢 Light
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {openCategory === cat.name && !showAll && cat.effects.some(e => !e.recommended) && (
                            <button 
                                onClick={() => setShowAll(true)}
                                className="w-full py-2 bg-[#141824] hover:bg-[#1e2230] border border-[#2d3247] rounded-xl text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors mt-1"
                            >
                                Show All {cat.effects.length} Presets...
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
