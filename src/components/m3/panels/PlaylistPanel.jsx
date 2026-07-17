import React, { useState, useEffect } from 'react';
import { useM3Panel } from '../../../hooks/useM3Panel';

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

    // Initial sync from backend to frontend
    useEffect(() => {
        if (initialized && settings.tracks && m3AudioTracks.length === 0) {
            setM3AudioTracks(settings.tracks);
        }
    }, [initialized, settings.tracks]);

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
        const validFiles = Array.from(files).filter(f => f.type.startsWith('audio/') || f.name.endsWith('.mp3'));
        const newTracks = [];
        
        for (let i = 0; i < validFiles.length; i++) {
            const f = validFiles[i];
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
                    const asset = json.data;
                    const previewPath = `/api/m2/stream?uri=${encodeURIComponent(asset.path)}`;
                    
                    // Since it's an uploaded asset, we might not easily have duration on the client without loading it.
                    // For Sprint 1, we can just use an Audio element to quickly peek the duration before throwing it away.
                    let durationSec = 0;
                    let durationStr = "00:00";
                    try {
                        const url = URL.createObjectURL(f);
                        durationSec = await new Promise((resolve) => {
                            const audio = new Audio(url);
                            audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
                            audio.addEventListener('error', () => resolve(0));
                        });
                        URL.revokeObjectURL(url);
                        const hrs = Math.floor(durationSec / 3600);
                        const mins = Math.floor((durationSec % 3600) / 60);
                        const secs = Math.floor(durationSec % 60);
                        durationStr = hrs > 0 ? `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    } catch (e) {}
                    
                    newTracks.push({
                        id: 'trk-' + asset.id,
                        title: asset.originalFilename.replace(/\.[^/.]+$/, ""),
                        artist: 'Unknown',
                        duration: durationStr,
                        durationSec: durationSec,
                        size: f.size,
                        thumbnail: '',
                        sourceType: 'file',
                        sourcePath: asset.path,
                        blobUrl: previewPath // Use the stream endpoint
                    });
                }
            } catch(e) {
                console.error("Audio import failed:", e);
            }
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
        
        // This normally clears playlist then adds new tracks
        const validFiles = Array.from(finalFiles).filter(f => f.type.startsWith('audio/') || f.name.endsWith('.mp3'));
        // Sync via dummy promise loop to keep duration parsing
        const tracksPromises = validFiles.map(async (f, i) => {
            return {
                id: 'trk-' + Date.now() + '-' + i, title: f.name.replace(/\.[^/.]+$/, ""), artist: 'Unknown', duration: '03:00', durationSec: 180, size: f.size, thumbnail: '', sourceType: 'file', sourcePath: f.name, blobUrl: ''
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
        const newTracks = [...m3AudioTracks];
        const item = newTracks.splice(draggedIdx, 1)[0];
        newTracks.splice(idx, 0, item);
        setDraggedIdx(idx);
        syncToBackend(newTracks); // Auto save on reorder
    };
    const onDragEnd = () => setDraggedIdx(null);
    const onShufflePlaylist = () => syncToBackend([...m3AudioTracks].sort(() => Math.random() - 0.5));
    const onClearPlaylist = () => syncToBackend([]);

    return (
        <div className="flex flex-col h-full gap-4">
            {error && (
                <div className="bg-red-900/40 border border-red-500 text-red-400 p-2 rounded text-[10px]">
                    {error.message}
                </div>
            )}

            <div className="flex gap-2 shrink-0">
                <button onClick={() => setAudioTab('File')} className={`flex-1 border rounded py-1.5 text-[10px] ${audioTab === 'File' ? 'bg-green-600 border-green-500 text-white font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-[#181922] border-[#2d3247] hover:bg-[#1e2230] text-gray-400'}`}>File</button>
                <button onClick={() => setAudioTab('Folder')} className={`flex-1 border rounded py-1.5 text-[10px] ${audioTab === 'Folder' ? 'bg-green-600 border-green-500 text-white font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-[#181922] border-[#2d3247] hover:bg-[#1e2230] text-gray-400'}`}>Folder</button>
                <button onClick={() => setAudioTab('YouTube')} className={`flex-1 border rounded py-1.5 text-[10px] ${audioTab === 'YouTube' ? 'bg-green-600 border-green-500 text-white font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-[#181922] border-[#2d3247] hover:bg-[#1e2230] text-gray-400'}`}>YouTube</button>
            </div>
            
            {audioTab === 'File' && capabilities?.import !== false && (
                <label className="w-full bg-[#181922] hover:bg-[#1e2230] border border-dashed border-[#2d3247] hover:border-green-500 transition-colors text-gray-300 rounded py-6 text-[11px] font-bold flex flex-col items-center justify-center cursor-pointer shrink-0">
                    <span className="text-green-400 mb-2 text-2xl">🎵</span>
                    Browse or Drop Audio Files
                    <input type="file" multiple accept="audio/*" className="hidden" onChange={onImportFile} disabled={saving} />
                </label>
            )}

            {audioTab === 'Folder' && capabilities?.import !== false && (
                <div className="bg-[#181922] border border-[#2d3247] p-3 rounded shrink-0 space-y-3">
                    <label className="w-full bg-green-600 hover:bg-green-500 text-white rounded py-2 text-[11px] font-bold flex justify-center cursor-pointer transition-colors">
                        Select Audio Folder
                        <input type="file" webkitdirectory="" directory="" multiple className="hidden" onChange={onSelectFolder} disabled={saving} />
                    </label>
                    <div className="flex justify-between items-center text-[10px] text-gray-300">
                        <span>Limit Size</span>
                        <input id="playlistSizeInput" type="number" defaultValue={15} className="w-14 bg-[#0c0d12] border border-[#2d3247] rounded px-2 py-1 text-center font-mono focus:border-green-500 outline-none" />
                    </div>
                    <button onClick={onGeneratePlaylistFromFolder} disabled={folderFiles.length === 0 || saving} className="w-full bg-[#1e2230] hover:bg-[#2d3247] disabled:opacity-50 text-green-400 border border-green-500/30 rounded py-1.5 text-[10px] font-bold transition-colors">
                        Generate from Folder
                    </button>
                </div>
            )}

            {audioTab === 'YouTube' && capabilities?.import !== false && (
                <div className="bg-[#181922] border border-[#2d3247] p-3 rounded shrink-0 space-y-2">
                    <input type="text" placeholder="Paste YouTube Playlist URL..." value={ytUrl} onChange={e => setYtUrl(e.target.value)} disabled={saving} className="w-full bg-[#0c0d12] border border-[#2d3247] rounded p-1.5 text-[10px] text-gray-300 outline-none focus:border-green-500" />
                    <button onClick={onFetchYoutube} disabled={saving} className="w-full bg-green-600 hover:bg-green-500 text-white rounded py-1.5 text-[11px] font-bold disabled:opacity-50">Fetch Playlist</button>
                    {ytResult && (
                        <div className="bg-[#0c0d12] p-2 rounded text-[10px] text-gray-300 space-y-1 font-mono mt-2 border border-[#2d3247]">
                            <div className="truncate font-bold text-white">{ytResult.title}</div>
                            <button onClick={() => onAddTrackToPlaylist(ytResult)} disabled={saving} className="w-full mt-2 bg-[#1e2230] hover:bg-[#2d3247] text-green-400 border border-green-500/30 rounded py-1 text-[10px] font-bold disabled:opacity-50">Add to Playlist</button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 flex flex-col min-h-0 bg-[#0c0d12] border border-[#21232d] rounded overflow-hidden">
                <div className="text-[10px] font-bold text-gray-400 bg-[#12131a] px-3 py-2 border-b border-[#21232d] flex justify-between items-center shrink-0">
                    <span>Playlist ({m3AudioTracks.length})</span>
                    <div className="flex gap-3">
                        <button onClick={onShufflePlaylist} disabled={saving} className="text-green-400 hover:text-green-300 disabled:opacity-50">Shuffle</button>
                        <button onClick={onClearPlaylist} disabled={saving} className="text-red-400 hover:text-red-300 disabled:opacity-50">Clear</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1 relative">
                    {saving && <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center text-xs text-green-400">Saving...</div>}
                    {m3AudioTracks.length === 0 ? (
                        <div className="text-center text-gray-600 italic py-4 text-[10px]">Playlist is empty</div>
                    ) : (
                        m3AudioTracks.map((track, idx) => (
                            <div key={idx} draggable onDragStart={(e) => onDragStart(e, idx)} onDragOver={(e) => onDragOver(e, idx)} onDragEnd={onDragEnd} className={`flex justify-between items-center p-2 rounded border text-[10px] font-mono group cursor-move transition-colors ${idx === m3CurrentTrackIndex ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-[#181922] border-[#2d3247] hover:bg-[#1e2230] hover:border-green-500/30'}`}>
                                <div className="flex gap-2 items-center overflow-hidden">
                                    <span className={`w-4 font-bold ${idx === m3CurrentTrackIndex ? 'text-emerald-400' : 'text-gray-600'}`}>{idx === m3CurrentTrackIndex ? '▶' : idx + 1 + '.'}</span>
                                    <span className={`truncate w-32 ${idx === m3CurrentTrackIndex ? 'text-emerald-300 font-bold' : 'text-gray-300'}`}>{track.title}</span>
                                </div>
                                <div className="flex gap-2 items-center shrink-0">
                                    <span className="text-gray-500">{track.duration}</span>
                                    <button onClick={() => onRemoveTrack(idx)} className="text-red-500 opacity-0 group-hover:opacity-100 p-0.5">✖</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
