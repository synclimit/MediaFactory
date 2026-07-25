import React, { useState } from 'react';
import { fxRegistry } from '../../../fx/registry/FXRegistry';
import Tooltip from '../../ui/Tooltip'; // assuming there is a generic Tooltip, if not we inline

export default function FxPanel({ m3Effects, setM3Effects }) {
    const categories = fxRegistry.getCategories();
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');

    const handleAddEffect = (pluginId) => {
        try {
            const instance = fxRegistry.createInstance(pluginId);
            setM3Effects(prev => [...prev, instance]);
        } catch (e) {
            console.error('Failed to add effect', e);
        }
    };

    const handleRemoveEffect = (instanceId) => {
        setM3Effects(prev => prev.filter(fx => fx.id !== instanceId));
    };

    const handleToggleEffect = (instanceId) => {
        setM3Effects(prev => prev.map(fx => 
            fx.id === instanceId ? { ...fx, enabled: !fx.enabled } : fx
        ));
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        setM3Effects(prev => {
            const next = [...prev];
            [next[index - 1], next[index]] = [next[index], next[index - 1]];
            return next;
        });
    };

    const handleMoveDown = (index) => {
        if (index === m3Effects.length - 1) return;
        setM3Effects(prev => {
            const next = [...prev];
            [next[index + 1], next[index]] = [next[index], next[index + 1]];
            return next;
        });
    };

    return (
        <div className="space-y-4">
            {/* ACTIVE EFFECTS RACK */}
            <div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2 flex justify-between items-center">
                    <span>Active FX Rack</span>
                    <span className="text-[9px] font-mono text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-500/30">
                        {m3Effects.length} Layer(s)
                    </span>
                </h3>
                
                {m3Effects.length === 0 ? (
                    <div className="text-[10px] text-gray-500 italic text-center py-6 bg-[#0c0d12]/50 border border-[#2d3247] border-dashed rounded flex flex-col items-center">
                        <span className="text-xl mb-1 opacity-50">🎛️</span>
                        No effects active. Build your stack below.
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {m3Effects.map((fx, idx) => (
                            <div key={fx.id} className={`flex items-center gap-2 p-1.5 rounded border transition-colors ${fx.enabled ? 'bg-gradient-to-r from-[#1c1f26] to-[#121418] border-purple-500/30' : 'bg-[#0f1115] border-gray-700/50 opacity-60'}`}>
                                <div className="flex flex-col gap-0.5 shrink-0">
                                    <button onClick={() => handleMoveUp(idx)} disabled={idx === 0} className="text-[8px] text-gray-500 hover:text-white disabled:opacity-30">▲</button>
                                    <button onClick={() => handleMoveDown(idx)} disabled={idx === m3Effects.length - 1} className="text-[8px] text-gray-500 hover:text-white disabled:opacity-30">▼</button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-bold text-gray-200 truncate">{fx.metadata.displayName || fx.metadata.name}</div>
                                    <div className="text-[8px] font-mono text-purple-400 uppercase tracking-widest">{fx.metadata.category}</div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button 
                                        onClick={() => handleToggleEffect(fx.id)} 
                                        className={`w-6 h-4 rounded-full flex items-center transition-colors px-0.5 ${fx.enabled ? 'bg-purple-600 justify-end' : 'bg-gray-700 justify-start'}`}
                                    >
                                        <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                    </button>
                                    <button 
                                        onClick={() => handleRemoveEffect(fx.id)}
                                        className="text-[10px] text-red-400 hover:text-red-300 ml-1 p-1"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#2d3247] to-transparent my-4"></div>

            {/* EFFECT CATALOG */}
            <div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                    FX Library
                </h3>
                
                <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-2 mb-2">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded transition-colors border ${selectedCategory === cat ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]' : 'bg-[#1a1c23] border-[#2d3247] text-gray-400 hover:bg-[#252836]'}`}
                        >
                            {cat.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {fxRegistry.getAll(selectedCategory).map(plugin => (
                        <div key={plugin.metadata.id} className="bg-[#121418] border border-[#2d3247] rounded p-2 flex justify-between items-center group hover:border-purple-500/50 transition-colors">
                            <div className="flex-1 min-w-0 pr-2">
                                <div className="text-[10px] font-bold text-gray-200">{plugin.metadata.displayName || plugin.metadata.name}</div>
                                <div className="text-[8px] text-gray-500 truncate">{plugin.metadata.description}</div>
                            </div>
                            <button 
                                onClick={() => handleAddEffect(plugin.metadata.id)}
                                className="shrink-0 bg-[#1c1f26] hover:bg-purple-600 border border-[#2d3247] hover:border-purple-400 text-gray-300 hover:text-white text-[10px] font-bold w-6 h-6 rounded flex items-center justify-center transition-all shadow-sm"
                            >
                                +
                            </button>
                        </div>
                    ))}
                    {fxRegistry.getAll(selectedCategory).length === 0 && (
                        <div className="text-[9px] text-gray-500 italic text-center py-2">No effects in this category.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
