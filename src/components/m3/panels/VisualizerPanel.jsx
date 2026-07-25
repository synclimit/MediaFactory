import React, { useState } from 'react';
import { useM3Panel } from '../../../hooks/useM3Panel';
import { categoryRegistry, visualizerRegistry } from '../../../visualizers/registry';
import { register3DCategory } from '../../../visualizers/categories/3d';
import { registerAbstractCategory } from '../../../visualizers/categories/abstract';
import { registerBarsCategory } from '../../../visualizers/categories/bars';
import { registerCinematicCategory } from '../../../visualizers/categories/cinematic';
import { registerCircleCategory } from '../../../visualizers/categories/circle';
import { registerDNACategory } from '../../../visualizers/categories/dna';
import { registerExperimentalCategory } from '../../../visualizers/categories/experimental';
import { registerFluidCategory } from '../../../visualizers/categories/fluid';
import { registerGalaxyCategory } from '../../../visualizers/categories/galaxy';
import { registerGeometryCategory } from '../../../visualizers/categories/geometry';
import { registerMandalaCategory } from '../../../visualizers/categories/mandala';
import { registerMatrixCategory } from '../../../visualizers/categories/matrix';
import { registerMinimalCategory } from '../../../visualizers/categories/minimal';
import { registerNatureCategory } from '../../../visualizers/categories/nature';
import { registerNeonCategory } from '../../../visualizers/categories/neon';
import { registerParticleCategory } from '../../../visualizers/categories/particle';
import { registerRetroCategory } from '../../../visualizers/categories/retro';
import { registerRibbonCategory } from '../../../visualizers/categories/ribbon';
import { registerRingCategory } from '../../../visualizers/categories/ring';
import { registerSpeakerCategory } from '../../../visualizers/categories/speaker';
import { registerSpiralCategory } from '../../../visualizers/categories/spiral';
import { registerTerrainCategory } from '../../../visualizers/categories/terrain';
import { registerTextCategory } from '../../../visualizers/categories/text';
import { registerTunnelCategory } from '../../../visualizers/categories/tunnel';
import { registerWavesCategory } from '../../../visualizers/categories/waves';

// Ensure plugins are registered for the UI
try {
    register3DCategory();
    registerAbstractCategory();
    registerBarsCategory();
    registerCinematicCategory();
    registerCircleCategory();
    registerDNACategory();
    registerExperimentalCategory();
    registerFluidCategory();
    registerGalaxyCategory();
    registerGeometryCategory();
    registerMandalaCategory();
    registerMatrixCategory();
    registerMinimalCategory();
    registerNatureCategory();
    registerNeonCategory();
    registerParticleCategory();
    registerRetroCategory();
    registerRibbonCategory();
    registerRingCategory();
    registerSpeakerCategory();
    registerSpiralCategory();
    registerTerrainCategory();
    registerTextCategory();
    registerTunnelCategory();
    registerWavesCategory();
} catch (e) {
    console.warn("Some visualizer categories might not exist yet", e);
}

export default function VisualizerPanel({ addObject }) {
    const { initialized, loading, error } = useM3Panel('Visualizer');
    const [openCategory, setOpenCategory] = useState('Bars');

    if (!initialized || loading) return <div className="p-4 text-gray-400 text-xs text-center flex-1">Loading Visualizer Settings...</div>;

    const handleSelectStyle = (plugin) => {
        addObject({
            type: 'visualizer',
            name: `Visualizer (${plugin.metadata.displayName})`,
            visualizerId: plugin.metadata.id,
            x: window.innerWidth / 2 - 300 > 0 ? window.innerWidth / 2 - 300 : 300, 
            y: window.innerHeight / 2 - 100 > 0 ? window.innerHeight / 2 - 100 : 200, 
            width: 600, 
            height: 200,
            transform: { scale: 100, rotation: 0, opacity: 100 },
            colorMode: '2 Gradient',
            colorLeft: '#AB55F7',
            colorRight: '#F59E0B',
            ...plugin.defaultConfig, // Automatically merge default schema config
            visible: true
        });
    };

    const renderThumbnail = (plugin, catId) => {
        if (plugin.metadata.thumbnail) {
            return <img src={plugin.metadata.thumbnail} alt={plugin.metadata.displayName} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />;
        }
        
        const id = plugin.metadata.id ? plugin.metadata.id.toLowerCase() : '';
        const cat = catId ? catId.toLowerCase() : '';
        
        switch (cat) {
            case 'bars':
                if (id.includes('horizontal')) {
                    return (
                        <div className="flex flex-col items-start justify-center gap-[3px] w-full h-full px-2 py-1">
                            <div className="h-1.5 w-[40%] bg-gradient-to-r from-orange-600 to-orange-400 rounded-r-sm shadow-[0_0_8px_rgba(249,115,22,0.4)] group-hover:w-[60%] transition-all duration-300"></div>
                            <div className="h-1.5 w-[70%] bg-gradient-to-r from-orange-500 to-yellow-400 rounded-r-sm shadow-[0_0_8px_rgba(249,115,22,0.4)] group-hover:w-[90%] transition-all duration-300 delay-75"></div>
                            <div className="h-1.5 w-[50%] bg-gradient-to-r from-orange-600 to-orange-400 rounded-r-sm shadow-[0_0_8px_rgba(249,115,22,0.4)] group-hover:w-[70%] transition-all duration-300 delay-150"></div>
                        </div>
                    );
                } else if (id.includes('mirror') || id.includes('dual') || id.includes('split')) {
                    return (
                        <div className="flex items-center justify-center gap-[2px] h-full">
                            <div className="w-1 h-[30%] bg-orange-600 rounded-sm group-hover:h-[50%] transition-all duration-300"></div>
                            <div className="w-1 h-[60%] bg-orange-500 rounded-sm group-hover:h-[80%] transition-all duration-300 delay-75"></div>
                            <div className="w-1 h-[40%] bg-yellow-400 rounded-sm group-hover:h-[60%] transition-all duration-300 delay-150"></div>
                            <div className="w-0.5 h-[80%] bg-orange-300 rounded-sm group-hover:h-[100%] transition-all duration-300 delay-75 mx-[1px]"></div>
                            <div className="w-1 h-[40%] bg-yellow-400 rounded-sm group-hover:h-[60%] transition-all duration-300 delay-150"></div>
                            <div className="w-1 h-[60%] bg-orange-500 rounded-sm group-hover:h-[80%] transition-all duration-300 delay-75"></div>
                            <div className="w-1 h-[30%] bg-orange-600 rounded-sm group-hover:h-[50%] transition-all duration-300"></div>
                        </div>
                    );
                } else if (id.includes('pill') || id.includes('round')) {
                    return (
                        <div className="flex items-end justify-center gap-[4px] h-full pb-2 pt-3">
                            <div className="w-2.5 h-[40%] bg-gradient-to-t from-orange-600 to-orange-400 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)] group-hover:h-[60%] transition-all duration-300"></div>
                            <div className="w-2.5 h-[70%] bg-gradient-to-t from-orange-500 to-yellow-400 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)] group-hover:h-[90%] transition-all duration-300 delay-75"></div>
                            <div className="w-2.5 h-[50%] bg-gradient-to-t from-orange-600 to-orange-400 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)] group-hover:h-[70%] transition-all duration-300 delay-150"></div>
                        </div>
                    );
                } else if (id.includes('matrix') || id.includes('dot')) {
                    return (
                        <div className="flex flex-col items-center justify-center gap-[2px] h-full">
                            <div className="flex gap-[2px]"><div className="w-1 h-1 bg-orange-400 rounded-full"></div><div className="w-1 h-1 bg-orange-500 rounded-full"></div><div className="w-1 h-1 bg-orange-600 rounded-full"></div></div>
                            <div className="flex gap-[2px]"><div className="w-1 h-1 bg-yellow-400 rounded-full group-hover:scale-150 transition-transform"></div><div className="w-1 h-1 bg-orange-400 rounded-full group-hover:scale-150 transition-transform delay-75"></div><div className="w-1 h-1 bg-orange-500 rounded-full"></div></div>
                            <div className="flex gap-[2px]"><div className="w-1 h-1 bg-orange-500 rounded-full group-hover:scale-150 transition-transform delay-150"></div><div className="w-1 h-1 bg-yellow-400 rounded-full group-hover:scale-150 transition-transform"></div><div className="w-1 h-1 bg-orange-400 rounded-full"></div></div>
                        </div>
                    );
                } else {
                    return (
                        <div className="flex items-end justify-center gap-[3px] h-full pb-2.5 pt-4">
                            <div className="w-1.5 h-[40%] bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-sm shadow-[0_0_8px_rgba(249,115,22,0.4)] group-hover:h-[60%] transition-all duration-300"></div>
                            <div className="w-1.5 h-[70%] bg-gradient-to-t from-orange-500 to-yellow-400 rounded-t-sm shadow-[0_0_8px_rgba(249,115,22,0.4)] group-hover:h-[90%] transition-all duration-300 delay-75"></div>
                            <div className="w-1.5 h-[50%] bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-sm shadow-[0_0_8px_rgba(249,115,22,0.4)] group-hover:h-[70%] transition-all duration-300 delay-150"></div>
                        </div>
                    );
                }
            case 'circle':
            case 'ring':
            case 'mandala':
                if (id.includes('double') || id.includes('dual')) {
                    return (
                        <div className="flex items-center justify-center h-full relative">
                            <div className="w-8 h-8 rounded-full border-[2px] border-orange-500/30 border-t-yellow-400 group-hover:rotate-180 transition-all duration-700 absolute"></div>
                            <div className="w-5 h-5 rounded-full border-[1.5px] border-orange-500/50 border-b-yellow-400 group-hover:-rotate-180 transition-all duration-700 absolute"></div>
                        </div>
                    );
                }
                return (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 rounded-full border-[2.5px] border-orange-500/40 border-t-yellow-400 shadow-[0_0_10px_rgba(249,115,22,0.3)] group-hover:rotate-180 transition-all duration-700 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.6)] group-hover:border-orange-500"></div>
                    </div>
                );
            case 'particle':
            case 'galaxy':
                return (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <div className="absolute w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,0.8)] group-hover:-translate-y-2 group-hover:translate-x-1 transition-transform duration-500"></div>
                        <div className="absolute ml-6 mb-4 w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] group-hover:-translate-y-3 group-hover:-translate-x-2 transition-transform duration-500 delay-75"></div>
                        <div className="absolute mr-5 mt-3 w-1 h-1 rounded-full bg-orange-300 shadow-[0_0_4px_rgba(249,115,22,0.8)] group-hover:translate-y-2 group-hover:translate-x-3 transition-transform duration-500 delay-150"></div>
                    </div>
                );
            case 'waves':
            case 'fluid':
            case 'terrain':
                return (
                    <div className="flex items-center justify-center h-full overflow-hidden relative">
                        <div className="w-[120%] h-5 border-t-[2.5px] border-orange-500/70 rounded-[50%] absolute top-1/2 -translate-y-1/2 shadow-[0_-2px_10px_rgba(249,115,22,0.3)] group-hover:scale-y-[1.8] group-hover:border-orange-400 transition-all duration-500 group-hover:shadow-[0_-4px_15px_rgba(249,115,22,0.6)]"></div>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#08090d] to-orange-500/5 group-hover:to-orange-500/20 transition-colors duration-500">
                        <span className="text-xl opacity-30 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 group-hover:text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">✨</span>
                    </div>
                );
        }
    };

    const categories = categoryRegistry.getAll();

    return (
        <div className="space-y-4 pb-10 px-1">
            {error && <div className="bg-red-900/40 border border-red-500/50 text-red-200 p-3 rounded-xl text-[10px] mb-4 backdrop-blur-md shadow-lg">{error.message}</div>}

            <div className="flex flex-col gap-3 mt-2">
                {categories.map(cat => {
                    const plugins = visualizerRegistry.getByCategory(cat.id);
                    const isOpen = openCategory === cat.id;

                    return (
                        <div key={cat.id} className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] flex flex-col shrink-0 overflow-hidden group transition-all duration-300 z-10 mb-2">
                            {isOpen && (
                                <>
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
                                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
                                </>
                            )}
                            {!isOpen && (
                                <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
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
                                    {plugins.length} STYLES
                                </span>
                            </button>
                            
                            {isOpen && (
                                <div className="p-3 bg-black/20 relative z-10 border-t border-white/5">
                                    <div className="grid grid-cols-3 gap-2">
                                        {plugins.map(plugin => (
                                            <button 
                                                key={plugin.metadata.id}
                                                onClick={() => handleSelectStyle(plugin)}
                                                className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-white/5 bg-[#161822]/50 hover:bg-[#1a1c25] hover:border-orange-500/50 transition-all duration-300 group text-left shadow-inner"
                                            >
                                                <div className="w-full h-11 bg-black/40 rounded border border-black/50 group-hover:border-orange-500/40 overflow-hidden relative">
                                                    {renderThumbnail(plugin, cat.id)}
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-400 group-hover:text-white truncate w-full text-center tracking-wide transition-colors">
                                                    {plugin.metadata.displayName}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    {plugins.length === 0 && (
                                        <div className="text-center p-6 text-[10px] text-gray-600 italic font-medium bg-black/20 rounded-lg border border-white/5 mt-1 shadow-inner">
                                            No styles available in this collection.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {categories.length === 0 && (
                <div className="text-center p-6 text-[11px] text-gray-500 border border-dashed border-[#2d3247] rounded-xl bg-[#0a0b0f]">
                    <span className="animate-pulse tracking-wide font-medium">Initializing Visualizer Engine...</span>
                </div>
            )}
        </div>
    );
}
