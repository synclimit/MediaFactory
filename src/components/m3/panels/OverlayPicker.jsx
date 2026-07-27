import React, { useState, useEffect } from 'react';
import { useOverlays } from '../../../hooks/useOverlays';

const GENRE_PRESETS = {
    "asmr": ["water_drip_closeup", "feather_sway_soft"],
    "lofi": ["coffee_smoke_swirl", "rain_window_light"],
    "ambient": ["warm_candle_single", "rain_window_heavy"],
    "sleep": ["warm_candle_single", "feather_sway_soft"]
};

// Simple Safari check for WebM Alpha fallback
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export default function OverlayPicker({ addObject }) {
    const [selectedGenre, setSelectedGenre] = useState('');
    const { overlays, loading, error } = useOverlays(selectedGenre || null);
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    
    // Controls for the selected variant
    const [opacity, setOpacity] = useState(100);
    const [speed, setSpeed] = useState(1.0);

    // When clicking a category, show its variants
    const handleCategorySelect = (overlay) => {
        if (activeCategory?.id === overlay.id) {
            setActiveCategory(null);
            setSelectedVariant(null);
        } else {
            setActiveCategory(overlay);
            // Auto-select first variant
            const firstVariant = overlay.variants[0];
            selectVariant(firstVariant);
        }
    };

    const selectVariant = (variant) => {
        setSelectedVariant(variant);
        setOpacity(Math.round((variant.defaultOpacity || 0.5) * 100));
        setSpeed(variant.defaultSpeed || 1.0);
    };

    const handleApply = () => {
        if (!selectedVariant || !addObject) return;

        // Safari Fallback check: if Safari and format is webm_alpha, we might want to warn or swap.
        // For MVP, we will still inject it, but the user is aware.
        if (isSafari && selectedVariant.format === 'webm_alpha') {
            console.warn("Safari detected: WebM alpha might not render correctly. Consider APNG fallback if implemented.");
        }

        const isProcedural = selectedVariant.format === 'procedural' || (selectedVariant.fileUrl || '').startsWith('procedural://');
        const isBrightCategory = ['smoke_steam', 'fire_light', 'rain_water', 'light_leak', 'particle'].includes(selectedVariant.category || '');
        const isMp4 = (selectedVariant.fileUrl || '').toLowerCase().endsWith('.mp4') || (selectedVariant.fileUrl || '').toLowerCase().endsWith('.mov');
        const autoBlendMode = isProcedural ? 'Normal' : (selectedVariant.defaultBlend || ((isBrightCategory || isMp4) ? 'Screen' : 'Normal'));
        const enableBlackKey = !isProcedural && (isBrightCategory || isMp4);

        let speakerModel = 'studio';
        if ((selectedVariant.fileUrl || '').includes('model=')) {
            speakerModel = selectedVariant.fileUrl.split('model=')[1].split('&')[0];
        }

        addObject({
            type: isProcedural ? 'procedural-speaker' : 'video',
            mediaType: isProcedural ? 'procedural' : 'video',
            name: selectedVariant.label,
            source: selectedVariant.fileUrl, 
            x: 960, y: 540, // Center coordinates
            width: isProcedural ? 700 : 1920, height: isProcedural ? 700 : 1080,
            scale: 1,
            rotation: 0,
            opacity: isProcedural ? 100 : opacity,
            blend: autoBlendMode,
            color: '#00ffcc',
            rings: 0,
            model: speakerModel,
            audioReactive: true,
            chromaKeyEnable: enableBlackKey,
            chromaKeyColor: '#000000',
            chromaKeyTolerance: 35,
            chromaKey: enableBlackKey,
            keyColor: '#000000',
            similarity: 0.35,
            visible: true,
            locked: false,
            layer: Date.now(),
            loop: true,
            muted: true,
            playbackRate: speed
        });
    };

    // Helper to check if a variant is highly recommended for the current genre
    const isRecommended = (variantId) => {
        if (!selectedGenre) return false;
        const presets = GENRE_PRESETS[selectedGenre.toLowerCase()];
        return presets && presets.includes(variantId);
    };

    return (
        <div className="flex flex-col space-y-4">
            {/* Genre Filter */}
            <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Genre Filter (Auto-Suggest)</label>
                <select 
                    className="bg-[#181922] border border-[#2d3247] text-gray-300 text-xs rounded p-2 focus:outline-none focus:border-emerald-500"
                    value={selectedGenre}
                    onChange={(e) => {
                        setSelectedGenre(e.target.value);
                        setActiveCategory(null);
                    }}
                >
                    <option value="">-- All Genres --</option>
                    <option value="asmr">ASMR</option>
                    <option value="lofi">Lo-Fi</option>
                    <option value="ambient">Ambient</option>
                    <option value="sleep">Sleep / Relaxation</option>
                </select>
            </div>

            {error && <div className="text-red-400 text-xs bg-red-900/40 p-2 rounded">{error}</div>}

            {/* Categories Grid */}
            <div className="border-t border-[#21232d] pt-4">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Overlay Catalog</h3>
                
                {loading ? (
                    <div className="text-gray-500 text-xs text-center py-4">Loading Overlays...</div>
                ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {overlays.map(overlay => (
                            <button 
                                key={overlay.id} 
                                onClick={() => handleCategorySelect(overlay)}
                                className={`w-full flex flex-col items-center justify-center gap-2 p-3 rounded border transition-colors text-gray-300
                                    ${activeCategory?.id === overlay.id 
                                        ? 'bg-[#1e2230] border-emerald-500/50' 
                                        : 'bg-[#181922] border-[#2d3247] hover:border-gray-500/50'
                                    }`}
                            >
                                <span className="text-lg">
                                    {overlay.category === 'smoke_steam' ? '💨' :
                                     overlay.category === 'rain_water' ? '🌧️' :
                                     overlay.category === 'fire_light' ? '🔥' :
                                     overlay.category === 'asmr_specific' ? '✨' : '🌌'}
                                </span>
                                <span className="text-[10px] font-bold text-center leading-tight">{overlay.name}</span>
                                {selectedGenre && overlay.isAsmrSignature && selectedGenre === 'asmr' && (
                                    <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded">ASMR Pick</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Variants Sub-panel */}
            {activeCategory && (
                <div className="border-t border-[#21232d] pt-4 bg-[#14151a] -mx-4 px-4 pb-4 rounded-b-lg">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Variants for {activeCategory.name}
                    </h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {activeCategory.variants.map(variant => {
                            const recommended = isRecommended(variant.id);
                            const isActive = selectedVariant?.id === variant.id;
                            
                            return (
                                <button
                                    key={variant.id}
                                    onClick={() => selectVariant(variant)}
                                    className={`relative flex-shrink-0 w-24 h-24 rounded border overflow-hidden group
                                        ${isActive ? 'border-emerald-500' : 'border-[#2d3247] hover:border-gray-500'}
                                    `}
                                >
                                    <img 
                                        src={variant.thumbnailUrl} 
                                        alt={variant.label}
                                        loading="lazy"
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                                        <div className="text-[9px] text-white truncate text-center">{variant.label}</div>
                                    </div>
                                    {recommended && (
                                        <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[8px] font-bold px-1 rounded-bl">
                                            BEST
                                        </div>
                                    )}
                                    {isActive && (
                                        <div className="absolute inset-0 border-2 border-emerald-500 rounded pointer-events-none"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Controls & Apply */}
                    {selectedVariant && (
                        <div className="mt-4 bg-[#181922] p-3 rounded border border-[#2d3247]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs text-gray-300 font-bold">{selectedVariant.label}</span>
                                <span className="text-[10px] bg-[#2d3247] px-1.5 py-0.5 rounded text-gray-400">
                                    {selectedVariant.format}
                                </span>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-[10px] text-gray-400">Opacity</label>
                                        <span className="text-[10px] text-emerald-400">{opacity}%</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="100" 
                                        value={opacity} 
                                        onChange={(e) => setOpacity(parseInt(e.target.value))}
                                        className="w-full accent-emerald-500"
                                    />
                                </div>
                                
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-[10px] text-gray-400">Speed</label>
                                        <span className="text-[10px] text-emerald-400">{speed.toFixed(1)}x</span>
                                    </div>
                                    <input 
                                        type="range" min="0.1" max="3.0" step="0.1"
                                        value={speed} 
                                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                        className="w-full accent-emerald-500"
                                    />
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleApply}
                                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded transition-colors"
                            >
                                ADD LAYER TO CANVAS
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
