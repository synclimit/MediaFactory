import { useState, useMemo } from 'react';
import { useFXPresetStore } from '../../../fx/preset/FXPresetState';
import { PresetLibrary } from '../../../fx/preset/library/PresetLibrary';
import { PresetLoader } from '../../../fx/preset/definition/PresetLoader';
import { FXPresetExtractor } from '../../../fx/preset/FXPresetExtractor';
import { UserPresetRepository } from '../../../fx/preset/library/UserPresetRepository';
import { Edit2, Check, Search, SearchX, Image as ImageIcon, Heart, Copy, Save, X } from 'lucide-react';

const SCOPE_ORDER = ['Background', 'Visualizer', 'Particle', 'Effects', 'Subtitle', 'Text Objects', 'Lyric', 'Branding', 'Overlay'];

export default function M3FXPresetPanel({ fxPresetController, editorState }) {
    const { 
        activePresetMetadata, status, applyScope, setApplyScope,
        favoriteIds, setLastApplied, addRecent, toggleFavorite
    } = useFXPresetStore();

    const [libraryVersion, setLibraryVersion] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterGenre, setFilterGenre] = useState('All');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    // Modals
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveForm, setSaveForm] = useState({ name: '', genre: 'Custom', description: '' });

    const allPresets = useMemo(() => {
        return PresetLibrary.getAllPresets();
    }, [libraryVersion]);

    const allGenres = useMemo(() => PresetLibrary.getGenres(), [libraryVersion]);

    const filteredAndSortedPresets = useMemo(() => {
        let result = allPresets;
        
        if (showFavoritesOnly) {
            result = result.filter(p => favoriteIds.includes(p.id));
        }

        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(p => 
                p.name.toLowerCase().includes(lowerQuery) ||
                (p.genre && p.genre.toLowerCase().includes(lowerQuery)) ||
                (p.author && p.author.toLowerCase().includes(lowerQuery))
            );
        }
        if (filterGenre !== 'All') result = result.filter(p => p.genre === filterGenre);

        result = [...result].sort((a, b) => a.name.localeCompare(b.name));

        return result;
    }, [allPresets, searchQuery, filterGenre, showFavoritesOnly, favoriteIds]);

    const orderedScopes = useMemo(() => {
        const registered = Object.keys(applyScope);
        return registered.sort((a, b) => {
            let indexA = SCOPE_ORDER.indexOf(a);
            let indexB = SCOPE_ORDER.indexOf(b);
            if (indexA === -1) indexA = 999;
            if (indexB === -1) indexB = 999;
            return indexA - indexB;
        });
    }, [applyScope]);

    const handleApplyPreset = (presetId) => {
        if (!fxPresetController) return;
        try {
            const rawPreset = PresetLibrary.getPresetById(presetId);
            if (!rawPreset) throw new Error('Preset not found');
            const presetDefinition = PresetLoader.loadFromObject(rawPreset);
            fxPresetController.applyPreset(presetDefinition);
            addRecent(presetId);
            setLastApplied(presetId);
        } catch (error) {
            console.error('[M3FXPresetPanel] Failed to apply preset:', error);
            alert(`Failed to apply preset: ${error.message}`);
        }
    };

    const handleDuplicate = (presetId) => {
        try {
            const source = PresetLibrary.getPresetById(presetId);
            if (!source) return;
            
            const newId = `user_preset_${Date.now()}`;
            const newName = source.builtIn ? `${source.name} (Custom)` : `${source.name} - Copy`;
            
            const duplicateRaw = JSON.parse(JSON.stringify(source));
            duplicateRaw.id = newId;
            duplicateRaw.name = newName;
            duplicateRaw.builtIn = false;
            duplicateRaw.createdBy = 'Media Factory User';
            
            const presetDef = PresetLoader.loadFromObject(duplicateRaw);
            UserPresetRepository.create(presetDef);
            setLibraryVersion(v => v + 1);
        } catch (error) {
            alert(`Duplicate failed: ${error.message}`);
        }
    };

    const handleSaveAs = () => {
        try {
            if (!saveForm.name.trim()) return alert("Nama preset wajib diisi");
            
            const extracted = FXPresetExtractor.extract(editorState);
            const newId = `user_preset_${Date.now()}`;
            
            const rawPreset = {
                id: newId,
                name: saveForm.name,
                genre: saveForm.genre,
                author: 'Media Factory User',
                createdBy: 'Media Factory User',
                builtIn: false,
                difficulty: 'Custom',
                description: saveForm.description,
                schemaVersion: '1.0.0',
                presetVersion: '1.0.0',
                applyScope: extracted.applyScope,
                parameters: extracted.parameters
            };

            const presetDef = PresetLoader.loadFromObject(rawPreset);
            UserPresetRepository.create(presetDef);
            
            setShowSaveModal(false);
            setSaveForm({ name: '', genre: 'Custom', description: '' });
            setLibraryVersion(v => v + 1);
            
            // Auto apply the new preset so it becomes active
            handleApplyPreset(newId);
        } catch (error) {
            alert(`Save failed: ${error.message}`);
        }
    };

    const isPreset = status === 'Preset';

    return (
        <div className="flex flex-col h-full bg-[#0a0a0c]">
            {/* TOP FIXED SECTION */}
            <div className="shrink-0 p-4 pb-0 flex flex-col gap-3">
                
                {/* ACTIVE PRESET HEADER */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
                        <h3 className="text-[11px] font-black text-gray-200 tracking-[0.2em] uppercase">Active Preset</h3>
                    </div>
                    {activePresetMetadata && (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isPreset ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {isPreset ? <Check size={10} /> : <Edit2 size={10} />} {isPreset ? 'Matched' : 'Modified'}
                        </div>
                    )}
                </div>

                {/* CURRENT PRESET INFO & APPLY SCOPE */}
                <div className="flex gap-2">
                    <div className="flex-1 bg-[#12131a] border border-[#2d3247] rounded-lg p-2.5 flex flex-col justify-center relative overflow-hidden group">
                        {activePresetMetadata ? (
                            <>
                                <h4 className="text-sm font-bold text-white truncate pr-2">{activePresetMetadata.name}</h4>
                                <div className="text-[9px] font-mono text-gray-500 uppercase mt-0.5 flex items-center gap-2">
                                    <span className={activePresetMetadata.builtIn ? 'text-blue-400' : 'text-purple-400'}>
                                        {activePresetMetadata.builtIn ? 'BUILT-IN' : 'USER'}
                                    </span>
                                </div>
                                {!isPreset && (
                                    <button onClick={() => setShowSaveModal(true)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-600 hover:bg-orange-500 text-white text-[9px] font-bold uppercase px-2 py-1 rounded transition-colors shadow-lg flex items-center gap-1">
                                        <Save size={10} /> Save
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="text-[11px] text-gray-500 italic">No preset applied</div>
                        )}
                    </div>
                    
                    {/* COMPACT APPLY SCOPE DROPDOWN */}
                    <div className="w-[120px] shrink-0 bg-[#12131a] border border-[#2d3247] rounded-lg p-2 flex flex-col justify-center">
                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Apply Scopes</div>
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                            {orderedScopes.map(cat => (
                                <button key={cat} onClick={() => setApplyScope(cat, !applyScope[cat])} title={cat} className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${applyScope[cat] ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-[#1a1c23] text-gray-600 border border-[#2d3247] hover:text-gray-400'}`}>
                                    {cat.charAt(0)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SEARCH & FILTERS */}
                <div className="flex items-center gap-2 mt-1">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"><Search size={12} className="text-gray-500" /></div>
                        <input type="text" placeholder="Search presets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#12131a] border border-[#2d3247] rounded pl-7 pr-2 py-1.5 text-[10px] text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50" />
                    </div>
                    <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className="w-24 bg-[#12131a] border border-[#2d3247] rounded px-2 py-1.5 text-[9px] text-gray-300 focus:outline-none focus:border-orange-500/50">
                        <option value="All">All Genres</option>
                        {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`w-7 h-7 flex flex-col items-center justify-center rounded border transition-colors ${showFavoritesOnly ? 'bg-orange-500/20 border-orange-500/50 text-orange-500' : 'bg-[#12131a] border-[#2d3247] text-gray-500 hover:text-gray-300'}`}>
                        <Heart size={12} className={showFavoritesOnly ? 'fill-orange-500' : ''} />
                    </button>
                </div>
            </div>

            {/* BOTTOM SCROLLABLE LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0">
                {filteredAndSortedPresets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center bg-black/20 border border-white/5 rounded-xl">
                        <SearchX size={24} className="mb-2 text-gray-600" />
                        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">No preset found</h3>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {filteredAndSortedPresets.map(preset => {
                            const isFav = favoriteIds.includes(preset.id);
                            const isActive = activePresetMetadata?.id === preset.id;
                            const isBuiltIn = preset.builtIn !== false;
                            
                            return (
                                <div key={preset.id} className={`flex items-stretch rounded-lg border transition-all duration-300 group ${isActive ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.1)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}`}>
                                    <button onClick={() => handleApplyPreset(preset.id)} className="flex items-stretch flex-grow p-2 text-left">
                                        <div className={`w-10 h-10 shrink-0 rounded flex items-center justify-center mr-2 transition-colors ${isActive ? 'bg-orange-500/20 text-orange-400' : 'bg-black/50 text-gray-600 group-hover:text-gray-400'}`}>
                                            <ImageIcon size={16} />
                                        </div>
                                        <div className="flex flex-col justify-center flex-grow py-0.5 overflow-hidden">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                {!isBuiltIn && <span className="text-[8px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1 rounded uppercase tracking-wider font-bold">USER</span>}
                                                <span className={`text-[11px] font-bold truncate transition-colors ${isActive ? 'text-orange-400' : 'text-gray-200 group-hover:text-white'}`}>{preset.name}</span>
                                            </div>
                                            <div className="text-[8px] text-gray-500 uppercase tracking-widest font-semibold truncate">
                                                {preset.genre} {preset.difficulty ? `• ${preset.difficulty}` : ''}
                                            </div>
                                        </div>
                                    </button>
                                    
                                    <div className="flex flex-col items-center justify-between p-1.5 border-l border-white/5 shrink-0 w-8">
                                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(preset.id); }} className={`p-1 rounded transition-colors ${isFav ? 'text-orange-500' : 'text-gray-600 hover:bg-white/10 hover:text-white'}`}>
                                            <Heart size={12} className={isFav ? 'fill-orange-500' : ''} />
                                        </button>
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => handleDuplicate(preset.id)} title="Duplicate Preset" className="p-1 rounded text-gray-600 hover:text-white hover:bg-white/10 transition-colors">
                                                <Copy size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* SAVE MODAL */}
            {showSaveModal && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111216] border border-[#333] rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between bg-black/40">
                            <h2 className="text-xs font-bold text-white uppercase tracking-widest">Save As Preset</h2>
                            <button onClick={() => setShowSaveModal(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Preset Name</span>
                                <input type="text" value={saveForm.name} onChange={e => setSaveForm({...saveForm, name: e.target.value})} placeholder="e.g. My Epic Visuals" className="bg-black/50 border border-[#333] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Genre</span>
                                <input type="text" value={saveForm.genre} onChange={e => setSaveForm({...saveForm, genre: e.target.value})} placeholder="e.g. Custom, Lofi, EDM..." className="bg-black/50 border border-[#333] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Description (Optional)</span>
                                <textarea value={saveForm.description} onChange={e => setSaveForm({...saveForm, description: e.target.value})} placeholder="What makes this preset special?" className="bg-black/50 border border-[#333] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 h-16 resize-none" />
                            </label>
                        </div>
                        <div className="p-3 border-t border-[#333] bg-black/20 flex justify-end gap-2">
                            <button onClick={() => setShowSaveModal(false)} className="px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                            <button onClick={handleSaveAs} className="px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest bg-orange-600 text-white hover:bg-orange-500 transition-colors shadow-[0_0_10px_rgba(249,115,22,0.3)]">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
