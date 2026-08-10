import React, { useState, useEffect } from 'react';
import { Sparkles, Edit2, ClipboardList, Save, X, Circle, Settings, Wind, Move, Triangle, Square, Hexagon, Star, Heart, Activity, Check, Trash2 } from 'lucide-react';

const SHAPES = [
    { id: 'shape_circle', name: 'Circle', icon: <Circle size={10} /> },
    { id: 'shape_square', name: 'Square', icon: <Square size={10} /> },
    { id: 'shape_triangle', name: 'Triangle', icon: <Triangle size={10} /> },
    { id: 'shape_diamond', name: 'Diamond', icon: <Square size={10} className="rotate-45" /> },
    { id: 'shape_hexagon', name: 'Hexagon', icon: <Hexagon size={10} /> },
    { id: 'shape_star', name: 'Star', icon: <Star size={10} /> },
    { id: 'shape_heart', name: 'Heart', icon: <Heart size={10} /> },
    { id: 'shape_music_note', name: 'Music Note', icon: <Activity size={10} /> },
    { id: 'shape_lightning', name: 'Lightning', icon: <Activity size={10} /> },
    { id: 'shape_flame', name: 'Flame', icon: <Activity size={10} /> },
    { id: 'shape_snowflake', name: 'Snowflake', icon: <Sparkles size={10} /> },
    { id: 'shape_leaf', name: 'Leaf', icon: <Sparkles size={10} /> },
    { id: 'shape_feather', name: 'Feather', icon: <Sparkles size={10} /> },
    { id: 'shape_bubble', name: 'Bubble', icon: <Circle size={10} className="text-blue-400" /> },
    { id: 'shape_droplet', name: 'Droplet', icon: <Circle size={10} className="text-cyan-400" /> },
    { id: 'shape_crystal', name: 'Crystal', icon: <Diamond size={10} /> },
    { id: 'shape_pixel', name: 'Pixel', icon: <Square size={10} className="fill-white" /> },
    { id: 'shape_ring', name: 'Ring', icon: <Circle size={10} className="stroke-2" /> },
];

const FLOWS = [
    { id: 'flow_static', name: 'Static' },
    { id: 'flow_drift', name: 'Drift' },
    { id: 'flow_float', name: 'Float' },
    { id: 'flow_rain', name: 'Rain' },
    { id: 'flow_snow', name: 'Snow' },
    { id: 'flow_wind_left', name: 'Wind Left' },
    { id: 'flow_wind_right', name: 'Wind Right' },
    { id: 'flow_swirl', name: 'Swirl' },
    { id: 'flow_spiral', name: 'Spiral' },
    { id: 'flow_orbit', name: 'Orbit' },
    { id: 'flow_explosion', name: 'Explosion' },
    { id: 'flow_implosion', name: 'Implosion' },
    { id: 'flow_starfield', name: 'Starfield Warp (Outward)' },
    { id: 'flow_pulse', name: 'Pulse' },
    { id: 'flow_wave', name: 'Wave' },
    { id: 'flow_fountain', name: 'Fountain' },
];

const TRAILS = [
    { id: 'trail_none', name: 'None' },
    { id: 'trail_fade', name: 'Fade' },
    { id: 'trail_glow', name: 'Glow' },
    { id: 'trail_light', name: 'Light Streak' },
    { id: 'trail_smoke', name: 'Smoke' },
    { id: 'trail_fire', name: 'Fire' },
    { id: 'trail_energy', name: 'Energy' },
    { id: 'trail_rainbow', name: 'Rainbow' },
    { id: 'trail_dotted', name: 'Dotted' },
    { id: 'trail_pixel', name: 'Pixel' },
];

function Diamond({ size, className }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/>
        </svg>
    );
}

export default function ParticlesPanel({ addObject, m3Objects = [], setM3Objects, m3SelectedObjectId, setM3SelectedObjectId }) {
    const [activeTab, setActiveTab] = useState('Particles');
    const [savedPresets, setSavedPresets] = useState(() => {
        try {
            const saved = localStorage.getItem('mf_particle_presets');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const particles = m3Objects.filter(o => o.type === 'particle');

    const handleAddParticle = () => {
        addObject({
            type: 'particle',
            name: `Particle System ${particles.length + 1}`,
            shape: 'shape_circle',
            flow: 'flow_float',
            trail: 'trail_none',
            fillColor: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 0,
            opacity: 100,
            scale: 1.0,
            randomScale: true,
            rotation: 0,
            randomRotation: true,
            speedMultiplier: 1.0,
            count: 50,
            blendMode: 'Screen',
            beatReactive: false,
            beatReactLevel: 40,
            x: 960,
            y: 540,
            width: 1920,
            height: 1080,
            visible: true,
            locked: true,
            pointerEvents: 'none'
        });
    };

    const removeParticle = (id) => {
        setM3Objects(prev => prev.filter(o => o.id !== id));
        if (m3SelectedObjectId === id) {
            setM3SelectedObjectId(null);
        }
    };

    const updateParticleProp = (id, key, value) => {
        setM3Objects(prev => prev.map(o => o.id === id ? { ...o, [key]: value } : o));
    };

    const savePreset = (instance) => {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const presetName = `${instance.name || 'Particle Preset'} (${timeStr})`;
        
        const newPreset = {
            id: 'preset_' + Date.now(),
            name: presetName,
            config: { ...instance, id: undefined, type: undefined, name: undefined, locked: undefined }
        };
        
        const updated = [...savedPresets, newPreset];
        setSavedPresets(updated);
        localStorage.setItem('mf_particle_presets', JSON.stringify(updated));
    };

    const loadPreset = (presetConfig) => {
        addObject({
            type: 'particle',
            name: `Particle System ${particles.length + 1}`,
            ...presetConfig,
            visible: true,
            locked: false,
        });
        setActiveTab('Particles');
    };

    useEffect(() => {
        if (particles && particles.length > 0 && (!m3SelectedObjectId || !particles.some(p => p.id === m3SelectedObjectId))) {
            setM3SelectedObjectId(particles[0].id);
        }
    }, [particles, m3SelectedObjectId, setM3SelectedObjectId]);

    const effectiveSelectedId = (m3SelectedObjectId && particles.some(p => p.id === m3SelectedObjectId)) ? m3SelectedObjectId : (particles[0]?.id || null);

    return (
        <div className="flex flex-col h-full -mt-2 -mx-4">
            {/* Custom Header Tabs - Sleeker Design */}
            <div className="flex items-center border-b border-[#21232d] bg-[#08090c]">
                <button 
                    onClick={() => setActiveTab('Particles')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'Particles' ? 'text-[#f97316]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="text-[14px]">✨</span> Particles
                    {activeTab === 'Particles' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f97316] to-transparent" />}
                </button>
                <button 
                    onClick={() => setActiveTab('Presets')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'Presets' ? 'text-[#f97316]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="text-[14px]">📑</span> Presets
                    {activeTab === 'Presets' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f97316] to-transparent" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                {activeTab === 'Particles' && (
                    <>
                        <button 
                            onClick={handleAddParticle}
                            className="w-full bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-[11px] uppercase tracking-wider shadow-[0_4px_15px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.5)] transform hover:-translate-y-0.5"
                        >
                            <span className="text-lg">+</span> Add System
                        </button>

                        <div className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-[#2d3247] pb-2 mt-4 flex items-center justify-between">
                            <span>Active Systems</span>
                            <span className="bg-[#1a1c23] px-2 py-0.5 rounded-full text-[#f97316]">{particles.length}</span>
                        </div>

                        <div className="space-y-3">
                            {particles.map((instance) => {
                                const isSelected = effectiveSelectedId === instance.id;

                                return (
                                    <div 
                                        key={instance.id} 
                                        onClick={() => setM3SelectedObjectId(instance.id)}
                                        className={`rounded-xl overflow-hidden cursor-pointer transition-all border ${isSelected ? 'bg-gradient-to-r from-[#1a1310] to-[#12131a] border-[#f97316] shadow-[0_0_15px_rgba(249,115,22,0.15)] ring-1 ring-[#f97316]/30' : 'bg-[#0c0d12] border-[#21232d] hover:border-[#f97316]/50'}`}
                                    >
                                        {/* Header */}
                                        <div className={`flex items-center justify-between p-2.5 border-b ${isSelected ? 'border-[#f97316]/30' : 'border-[#21232d]'}`}>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); removeParticle(instance.id); }}
                                                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-900/10 hover:bg-red-500 border border-transparent hover:border-red-400 text-red-500 hover:text-white transition-all"
                                                    title="Remove System"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                                <span className={`text-[11px] font-bold tracking-widest uppercase ${isSelected ? 'text-[#f97316] drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]' : 'text-gray-300'}`}>
                                                    {instance.name || 'Particle System'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase tracking-wider cursor-pointer bg-black/40 px-2 py-1 rounded-md border border-[#2d3247] hover:border-[#f97316]/50 transition-colors" onClick={(e) => e.stopPropagation()}>
                                                    <input type="checkbox" checked={instance.visible !== false} onChange={(e) => updateParticleProp(instance.id, 'visible', e.target.checked)} className="accent-[#f97316]" />
                                                    Vis
                                                </label>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className={`p-2 flex gap-2 justify-end ${isSelected ? 'bg-gradient-to-r from-[#1a1310]/50 to-transparent' : 'bg-transparent'}`}>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); savePreset(instance); }}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1c23] hover:bg-[#f97316]/10 border border-[#2d3247] hover:border-[#f97316]/50 rounded-lg text-[9px] text-gray-400 hover:text-[#f97316] font-bold uppercase tracking-widest transition-all"
                                            >
                                                <Save size={12} /> Save Preset
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {particles.length === 0 && (
                                <div className="text-center text-[10px] text-gray-500 italic py-8 border border-dashed border-[#2d3247] rounded bg-black/20">
                                    No particle systems active.
                                </div>
                            )}
                        </div>
                    </>
                )}
                {activeTab === 'Presets' && (
                    <div className="space-y-3">
                        {savedPresets.length === 0 && (
                            <div className="text-center text-[10px] text-gray-500 italic py-10 px-4 border border-dashed border-[#2d3247] rounded-xl bg-black/20 flex flex-col items-center justify-center gap-2">
                                <span className="text-2xl opacity-50 mb-1">🗂️</span>
                                You haven't saved any presets yet.<br/>Go to Particles tab and click "Save Preset".
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            {savedPresets.map(preset => (
                                <div key={preset.id} className="relative group">
                                    <button 
                                        onClick={() => loadPreset(preset.config)}
                                        className="w-full bg-[#11131a] border border-[#2d3247] hover:border-[#f97316]/50 p-4 rounded-xl flex flex-col items-center justify-center gap-3 text-gray-300 hover:text-[#f97316] transition-all shadow-sm group-hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] group-hover:bg-[#1a1310]"
                                    >
                                        <Sparkles size={20} className="opacity-50 group-hover:opacity-100" />
                                        <span className="text-[10px] font-bold text-center w-full truncate px-1 uppercase tracking-wider">{preset.name}</span>
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this preset?')) {
                                                const updated = savedPresets.filter(p => p.id !== preset.id);
                                                setSavedPresets(updated);
                                                localStorage.setItem('mf_particle_presets', JSON.stringify(updated));
                                            }
                                        }}
                                        className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[#1a1c23] border border-[#2d3247] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all shadow-lg"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
