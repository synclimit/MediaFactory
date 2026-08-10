import React, { useState, useEffect, useRef } from 'react';
import { useM3Panel } from '../../../hooks/useM3Panel';
import { Trash2, Music, Folder, PlaySquare as Youtube, Shuffle, XCircle, GripVertical } from 'lucide-react';

export default function PlaylistPanel({ m3AudioTracks, setM3AudioTracks, m3CurrentTrackIndex }) {
    const { 
        initialized, loading, saving, error, 
        settings, capabilities, markDirty, saveSettings 
    } = useM3Panel('Playlist');

    const [audioTab, setAudioTab] = useState('File');
    const [ytUrl, setYtUrl] = useState('');
    const [ytResult, setYtResult] = useState(null);
    const [folderFiles, setFolderFiles] = useState([]);
    const [playlistHistory, setPlaylistHistory] = useState(new Set());
    const [draggedIdx, setDraggedIdx] = useState(null);

    // Initial sync between backend and frontend
    useEffect(() => {
        if (initialized) {
            if (settings.tracks && settings.tracks.length > 0 && m3AudioTracks.length === 0) {
                setM3AudioTracks(settings.tracks);
            } else if (m3AudioTracks.length > 0 && (!settings.tracks || settings.tracks.length === 0)) {
                syncToBackend(m3AudioTracks);
            }
        }
    }, [initialized]);

    const localTracksRef = useRef(m3AudioTracks);
    useEffect(() => { localTracksRef.current = m3AudioTracks; }, [m3AudioTracks]);

    if (!initialized || loading) {
        return <div className="p-4 text-gray-400 text-xs text-center flex-1">Loading Playlist Settings...</div>;
    }

    const syncToBackend = (newTracks) => {
        setM3AudioTracks(newTracks);
        const newSettings = { ...settings, tracks: newTracks };
        markDirty(newSettings);
        saveSettings(newSettings);
    };

    const handleFiles = async (files) => {
        const validFiles = Array.from(files).filter(f => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(f.name));
        const newTracks = [];
        
        for (let i = 0; i < validFiles.length; i++) {
            const f = validFiles[i];
            let previewPath = '';
            let assetPath = f.name;
            let durationSec = 180;
            let durationStr = "03:00";

            try {
                previewPath = URL.createObjectURL(f);
                durationSec = await new Promise((resolve) => {
                    const audio = new Audio(previewPath);
                    audio.addEventListener('loadedmetadata', () => resolve(audio.duration || 180));
                    audio.addEventListener('error', () => resolve(180));
                });
                const hrs = Math.floor(durationSec / 3600);
                const mins = Math.floor((durationSec % 3600) / 60);
                const secs = Math.floor(durationSec % 60);
                durationStr = hrs > 0 ? `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            } catch (e) {
                console.warn("Local audio metadata parse notice:", e);
            }

            try {
                const response = await fetch('/api/v1/assets/upload', {
                    method: 'POST',
                    headers: {
                        'x-file-name': encodeURIComponent(f.name),
                        'x-category': 'audio',
                        'Content-Type': f.type || 'audio/mpeg'
                    },
                    body: f
                });
                
                const json = await response.json();
                if (json.success && json.data) {
                    assetPath = json.data.path;
                    previewPath = `/api/m2/stream?uri=${encodeURIComponent(json.data.path)}`;
                }
            } catch(e) {
                console.warn("Backend upload skipped, using local audio object URL:", e);
            }

            newTracks.push({
                id: 'trk-' + Date.now() + '-' + i,
                title: f.name.replace(/\.[^/.]+$/, ""),
                artist: 'Audio File',
                duration: durationStr,
                durationSec: durationSec,
                size: f.size,
                thumbnail: '',
                sourceType: 'file',
                sourcePath: assetPath,
                blobUrl: previewPath
            });
        }
        
        if (newTracks.length > 0) {
            syncToBackend([...m3AudioTracks, ...newTracks]);
        }
    };

    const onImportFile = (e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = null; };
    const onSelectFolder = (e) => {
        if (e.target.files) setFolderFiles(Array.from(e.target.files).filter(f => f.type.startsWith('audio/') || f.name.endsWith('.mp3')));
        e.target.value = null;
    };

    const onGeneratePlaylistFromFolder = () => {
        if (folderFiles.length === 0) return;
        const sizeInput = parseInt(document.getElementById('playlistSizeInput')?.value || 15, 10);
        let attempts = 0; let finalFiles = []; let hash = '';
        do {
            let tempFiles = [...folderFiles].sort(() => Math.random() - 0.5);
            finalFiles = tempFiles.slice(0, sizeInput);
            hash = finalFiles.map(f => f.name).join('|');
            attempts++;
        } while (playlistHistory.has(hash) && attempts < 10);
        setPlaylistHistory(prev => new Set(prev).add(hash));
        
        const validFiles = Array.from(finalFiles).filter(f => f.type.startsWith('audio/') || f.name.endsWith('.mp3'));
        
        // Upload selected files to backend to persist across reloads
        const tracksPromises = validFiles.map(async (f, i) => {
            let durationSec = 180;
            let durationStr = '03:00';
            let previewPath = '';
            let assetPath = f.name;
            
            try {
                // First get duration using temporary blob URL
                const tempUrl = URL.createObjectURL(f);
                durationSec = await new Promise((resolve) => {
                    const audio = new Audio(tempUrl);
                    audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
                    audio.addEventListener('error', () => resolve(180));
                });
                URL.revokeObjectURL(tempUrl);
                
                const hrs = Math.floor(durationSec / 3600);
                const mins = Math.floor((durationSec % 3600) / 60);
                const secs = Math.floor(durationSec % 60);
                durationStr = hrs > 0 ? `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                
                // Upload file
                const response = await fetch('/api/v1/assets/upload', {
                    method: 'POST',
                    headers: {
                        'x-file-name': encodeURIComponent(f.name),
                        'x-category': 'audio',
                        'Content-Type': f.type || 'audio/mpeg'
                    },
                    body: f
                });
                
                const json = await response.json();
                if (json.success && json.data) {
                    assetPath = json.data.path;
                    previewPath = `/api/m2/stream?uri=${encodeURIComponent(json.data.path)}`;
                } else {
                    // Fallback to local blob if upload fails (will still break on refresh)
                    previewPath = URL.createObjectURL(f);
                }
            } catch(e) {
                console.error("Audio import failed:", e);
                previewPath = URL.createObjectURL(f);
            }
            
            return {
                id: 'trk-' + Date.now() + '-' + i, 
                title: f.name.replace(/\.[^/.]+$/, ""), 
                artist: 'Unknown', 
                duration: durationStr, 
                durationSec: durationSec, 
                size: f.size, 
                thumbnail: '', 
                sourceType: 'file', 
                sourcePath: assetPath, 
                blobUrl: previewPath
            };
        });
        Promise.all(tracksPromises).then(newTracks => syncToBackend(newTracks));
    };

    const onFetchYoutube = () => {
        if (!ytUrl) return;
        setYtResult({ title: 'YouTube Fetched ' + Math.floor(Math.random() * 1000), duration: '01:12:30', thumbnail: 'Dummy', status: 'Ready' });
    };

    const onAddTrackToPlaylist = (track) => {
        const newTrack = { id: 'yt-' + Date.now(), title: track.title, artist: 'YouTube', duration: track.duration, thumbnail: track.thumbnail, sourceType: 'youtube', sourceUrl: ytUrl, sourcePath: ytUrl };
        syncToBackend([...m3AudioTracks, newTrack]);
        setYtResult(null);
    };

    const onRemoveTrack = (idxToRemove) => syncToBackend(m3AudioTracks.filter((_, i) => i !== idxToRemove));
    
    const onDragStart = (e, idx) => setDraggedIdx(idx);
    const onDragOver = (e, idx) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === idx) return;
        const newTracks = [...localTracksRef.current];
        const item = newTracks.splice(draggedIdx, 1)[0];
        newTracks.splice(idx, 0, item);
        setDraggedIdx(idx);
        setM3AudioTracks(newTracks); // visual update only
    };
    const onDragEnd = () => {
        setDraggedIdx(null);
        syncToBackend(localTracksRef.current); // Sync once on drop
    };
    const onShufflePlaylist = () => syncToBackend([...m3AudioTracks].sort(() => Math.random() - 0.5));
    const onClearPlaylist = () => syncToBackend([]);

    const calculateTotalDuration = () => {
        let totalSeconds = 0;
        m3AudioTracks.forEach(track => {
            if (typeof track.durationSec === 'number') {
                totalSeconds += track.durationSec;
            } else if (typeof track.duration === 'string') {
                const parts = track.duration.split(':').map(Number);
                if (parts.length === 3) {
                    totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else if (parts.length === 2) {
                    totalSeconds += parts[0] * 60 + parts[1];
                }
            }
        });
        
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = Math.floor(totalSeconds % 60);
        
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const totalDurationStr = calculateTotalDuration();

    return (
        <div className="flex flex-col h-full -mt-2 -mx-4">
            {error && error.message && !String(error.message).toLowerCase().includes('failed to fetch') && (
                <div className="bg-red-900/40 border border-red-500 text-red-400 p-2 rounded text-[10px] mx-4 mt-2">
                    {error.message}
                </div>
            )}

            {/* Custom Header Tabs - Sleeker Design */}
            <div className="px-4 pt-4 pb-2">
                <div className="flex items-center bg-[#0c0d12] border border-[#21232d] p-1 rounded-xl shadow-inner">
                    <button 
                        onClick={() => setAudioTab('File')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg ${audioTab === 'File' ? 'bg-gradient-to-br from-[#2a2c33] to-[#111216] border border-[#3a3d47] shadow-[0_4px_15px_rgba(0,0,0,0.5)] text-orange-500 ring-1 ring-orange-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-[#161822]'}`}
                    >
                        <Music size={14} /> File
                    </button>
                    <button 
                        onClick={() => setAudioTab('Folder')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg ${audioTab === 'Folder' ? 'bg-gradient-to-br from-[#2a2c33] to-[#111216] border border-[#3a3d47] shadow-[0_4px_15px_rgba(0,0,0,0.5)] text-orange-500 ring-1 ring-orange-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-[#161822]'}`}
                    >
                        <Folder size={14} /> Folder
                    </button>
                    <button 
                        onClick={() => setAudioTab('YouTube')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg ${audioTab === 'YouTube' ? 'bg-gradient-to-br from-[#2a2c33] to-[#111216] border border-[#3a3d47] shadow-[0_4px_15px_rgba(0,0,0,0.5)] text-orange-500 ring-1 ring-orange-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-[#161822]'}`}
                    >
                        <Youtube size={14} /> YouTube
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] p-4 flex flex-col shrink-0 overflow-hidden group z-10">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
                    
                    <div className="relative z-10">
                        {audioTab === 'File' && (
                            <label className="w-full bg-[#161822]/90 hover:bg-[#1a1c25] border border-dashed border-orange-500/20 hover:border-orange-500/50 transition-all text-gray-300 rounded-lg py-3 px-4 text-[10px] font-bold flex flex-row items-center justify-center gap-3 cursor-pointer shrink-0 group shadow-inner">
                                <Music size={16} className="text-orange-500/60 group-hover:text-orange-400 transition-colors" />
                                <span className="uppercase tracking-wider">Browse or Drop Audio Files</span>
                                <input type="file" multiple accept="audio/*" className="hidden" onChange={onImportFile} />
                            </label>
                        )}

                        {audioTab === 'Folder' && capabilities?.import !== false && (
                            <div className="bg-[#161822]/90 border border-orange-500/20 p-2 rounded-lg shrink-0 flex items-center gap-2 shadow-inner">
                                <label className="flex-1 bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white rounded py-2 text-[10px] font-bold flex justify-center items-center cursor-pointer transition-all shadow-[0_2px_8px_rgba(249,115,22,0.3)]">
                                    <Folder size={12} className="mr-1.5" /> Select Folder
                                    <input type="file" webkitdirectory="" directory="" multiple className="hidden" onChange={onSelectFolder} disabled={saving} />
                                </label>
                                <div className="flex items-center gap-1.5 bg-[#0a0b10] border border-[#2a2c33] rounded px-2 py-1.5 shadow-inner">
                                    <span className="text-[9px] text-gray-400 font-bold uppercase">Limit</span>
                                    <input id="playlistSizeInput" type="number" defaultValue={15} className="w-8 bg-transparent text-[10px] text-center font-mono outline-none text-gray-200" />
                                </div>
                                <button onClick={onGeneratePlaylistFromFolder} disabled={folderFiles.length === 0 || saving} className="bg-[#1a1c25] hover:bg-[#2d3247] disabled:opacity-50 text-orange-400 border border-orange-500/30 rounded px-3 py-1.5 text-[10px] font-bold uppercase transition-all shadow-inner">
                                    Generate
                                </button>
                            </div>
                        )}

                        {audioTab === 'YouTube' && capabilities?.import !== false && (
                            <div className="flex flex-col gap-2 shrink-0">
                                <div className="bg-[#161822]/90 border border-orange-500/20 p-2 rounded-lg flex gap-2 shadow-inner">
                                    <input type="text" placeholder="Paste YouTube Playlist URL..." value={ytUrl} onChange={e => setYtUrl(e.target.value)} disabled={saving} className="flex-1 bg-[#0a0b10] border border-[#2a2c33] rounded px-2 py-1.5 text-[10px] text-gray-300 outline-none focus:border-orange-500 transition-colors shadow-inner" />
                                    <button onClick={onFetchYoutube} disabled={saving} className="bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white rounded px-4 py-1.5 text-[10px] font-bold shadow-[0_2px_8px_rgba(249,115,22,0.3)] disabled:opacity-50 transition-all uppercase">Fetch</button>
                                </div>
                                {ytResult && (
                                    <div className="bg-[#161822]/90 p-2 rounded-lg text-[10px] text-gray-300 flex items-center justify-between font-mono border border-orange-500/20 shadow-inner mt-2">
                                        <div className="truncate font-bold text-white text-[11px] mr-2">{ytResult.title}</div>
                                        <button onClick={() => onAddTrackToPlaylist(ytResult)} disabled={saving} className="bg-[#1a1c25] hover:bg-orange-900/30 text-orange-400 border border-orange-500/30 hover:border-orange-500/50 rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 transition-all shrink-0">Add</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative bg-[#161822] border-[3px] border-orange-500/50 px-4 py-3 rounded-lg flex items-center justify-between mt-8 mb-4 shadow-[0_4px_20px_rgba(249,115,22,0.15)]">
                    {/* Inner orange glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/15 to-transparent rounded-lg pointer-events-none"></div>
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3/4 bg-orange-500 rounded-r-md shadow-[0_0_12px_#f97316]"></div>
                    
                    <div className="flex flex-col items-start leading-tight relative z-10 pl-2">
                        <span className="text-[12px] font-black text-white uppercase tracking-[0.15em] drop-shadow-md">
                            Playlist Tracks
                        </span>
                        {m3AudioTracks.length > 0 && (
                            <span className="text-[10px] text-orange-400 font-mono font-bold tracking-normal normal-case mt-1 drop-shadow-md">
                                Total Duration: {totalDurationStr}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2 items-center relative z-10">
                        <button onClick={onShufflePlaylist} disabled={saving} className="bg-[#0c0d12] border border-[#2d3247] hover:border-orange-500/50 text-orange-500/80 hover:text-orange-400 transition-colors p-1.5 rounded shadow-inner" title="Shuffle"><Shuffle size={12} /></button>
                        <button onClick={onClearPlaylist} disabled={saving} className="bg-[#0c0d12] border border-[#2d3247] hover:border-red-500/50 text-red-500/80 hover:text-red-400 transition-colors p-1.5 rounded shadow-inner" title="Clear"><XCircle size={12} /></button>
                        <span className="bg-orange-500 text-white font-black px-2.5 py-0.5 rounded-md shadow-[0_2px_8px_rgba(249,115,22,0.5)] ml-1 text-[11px]">{m3AudioTracks.length}</span>
                    </div>
                </div>

                <div className="space-y-3 relative">
                    {saving && <div className="absolute inset-0 bg-black/50 z-10 rounded-xl flex items-center justify-center text-xs text-orange-400 font-bold uppercase tracking-widest backdrop-blur-sm">Saving...</div>}
                    {m3AudioTracks.length === 0 ? (
                        <div className="text-center text-[10px] text-gray-500 italic py-8 border border-dashed border-[#2d3247] rounded-xl bg-black/20">
                            Playlist is empty
                        </div>
                    ) : (
                        m3AudioTracks.map((track, idx) => {
                            const isSelected = idx === m3CurrentTrackIndex;
                            return (
                                <div 
                                    key={idx} 
                                    draggable 
                                    onDragStart={(e) => onDragStart(e, idx)} 
                                    onDragOver={(e) => onDragOver(e, idx)} 
                                    onDragEnd={onDragEnd}
                                    className={`relative rounded-xl border flex flex-col shrink-0 overflow-hidden group transition-all duration-300 cursor-move z-10 bg-gradient-to-br from-[#2a2c33] to-[#111216] border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] mb-2 ${isSelected ? 'ring-1 ring-orange-500/30' : 'opacity-80 hover:opacity-100'}`}
                                >
                                    {isSelected && (
                                        <>
                                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
                                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
                                        </>
                                    )}
                                    {!isSelected && (
                                        <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
                                    )}
                                    <div className={`flex items-center justify-between p-2.5 relative z-10 ${isSelected ? '' : ''}`}>
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <GripVertical size={14} className="text-gray-600 shrink-0" />
                                            <span className={`w-4 font-bold shrink-0 text-center ${isSelected ? 'text-orange-400' : 'text-gray-600'}`}>{isSelected ? '▶' : idx + 1}</span>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className={`truncate text-[11px] font-bold tracking-wider uppercase ${isSelected ? 'text-orange-400 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]' : 'text-gray-300'}`}>
                                                    {track.title}
                                                </span>
                                                <span className="text-[9px] text-gray-500 font-mono">{track.duration}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pl-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onRemoveTrack(idx); }}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-900/10 hover:bg-red-500 border border-transparent hover:border-red-400 text-red-500 hover:text-white transition-all shrink-0"
                                                title="Remove Track"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

