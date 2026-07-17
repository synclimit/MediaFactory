import React, { useState } from 'react';
import { useM3Panel } from '../../../hooks/useM3Panel';

export default function BackgroundPanel({ setM3BgPool }) {
    const { 
        initialized, loading, saving, error, 
        settings, capabilities, markDirty, saveSettings 
    } = useM3Panel('Background');

    const [recentAssets, setRecentAssets] = useState([]);

    if (!initialized || loading) {
        return <div className="p-4 text-gray-400 text-xs text-center flex-1">Loading Background Settings...</div>;
    }

    const hasImport = capabilities?.import !== false;

    const handleBgChange = (type, filename) => {
        const newSettings = { ...settings, type, filename };
        markDirty(newSettings);
        saveSettings(newSettings);
        
        // Sync with global canvas state to avoid regressions
        if (setM3BgPool) {
            if (type === 'none') {
                setM3BgPool([]);
            } else {
                setM3BgPool([{ id: 'bg-' + Date.now(), type, filename, preview: '', sourcePath: filename }]);
            }
        }
    };

    const handleFileSelect = async (e, type) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Upload to enterprise asset service instead of local blob management
                const response = await fetch('/api/v1/assets/upload', {
                    method: 'POST',
                    headers: {
                        'x-file-name': encodeURIComponent(file.name),
                        'x-category': 'background',
                        'Content-Type': file.type || 'application/octet-stream'
                    },
                    body: file
                });
                
                const json = await response.json();
                if (json.success && json.data) {
                    const asset = json.data;
                    const previewPath = `/api/m2/stream?uri=${encodeURIComponent(asset.path)}`;
                    
                    const newSettings = { ...settings, type, filename: asset.originalFilename, assetId: asset.id };
                    markDirty(newSettings);
                    saveSettings(newSettings);
                    
                    setRecentAssets(prev => [{ ...asset, type, previewPath }, ...prev]);
                    
                    if (setM3BgPool) {
                        setM3BgPool([{ 
                            id: 'bg-' + asset.id, 
                            type, 
                            filename: asset.originalFilename, 
                            preview: previewPath, 
                            sourcePath: asset.path 
                        }]);
                    }
                } else {
                    console.error("Upload failed", json);
                }
            } catch (err) {
                console.error("Upload error", err);
            }
        }
        e.target.value = null;
    };

    const onClearBackground = () => {
        handleBgChange('none', null);
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-900/40 border border-red-500 text-red-400 p-2 rounded text-[10px]">
                    {error.message}
                </div>
            )}
            
            {hasImport && (
                <div className="grid grid-cols-2 gap-2">
                    <label className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all cursor-pointer ${settings.type === 'image' ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] text-blue-400' : 'bg-[#181922] hover:bg-[#1e2230] border-[#2d3247] hover:border-gray-500 text-gray-400'}`}>
                        <span className="text-2xl">🖼️</span>
                        <span className="text-[10px] font-bold uppercase">Image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
                    </label>
                    <label className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all cursor-pointer ${settings.type === 'video' ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] text-blue-400' : 'bg-[#181922] hover:bg-[#1e2230] border-[#2d3247] hover:border-gray-500 text-gray-400'}`}>
                        <span className="text-2xl">🎬</span>
                        <span className="text-[10px] font-bold uppercase">Video</span>
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileSelect(e, 'video')} />
                    </label>
                </div>
            )}

            <div className="border-t border-[#21232d] pt-4">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Current Background</h3>
                {settings.filename ? (
                    <div className="flex justify-between items-center p-2 rounded bg-[#12131a] border border-[#2d3247] text-[11px] font-mono group">
                        <span className="text-blue-400 truncate w-48" title={settings.filename}>{settings.filename}</span>
                        <button onClick={onClearBackground} disabled={saving} className="text-red-500 hover:text-red-400 font-bold px-2 disabled:opacity-50">✖</button>
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-600 italic p-4 text-center border border-dashed border-[#2d3247] rounded">
                        {saving ? 'Saving...' : 'No background selected'}
                    </div>
                )}
            </div>

            {capabilities?.assets !== false && (
                <div className="border-t border-[#21232d] pt-4">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Recent Assets</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {recentAssets.map((asset, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => {
                                    const newSettings = { ...settings, type: asset.type, filename: asset.originalFilename, assetId: asset.id };
                                    markDirty(newSettings);
                                    saveSettings(newSettings);
                                    if (setM3BgPool) {
                                        setM3BgPool([{ 
                                            id: 'bg-' + asset.id, 
                                            type: asset.type, 
                                            filename: asset.originalFilename, 
                                            preview: asset.previewPath, 
                                            sourcePath: asset.path 
                                        }]);
                                    }
                                }}
                                className="aspect-video bg-[#1e2230] rounded border border-[#2d3247] hover:border-emerald-500 cursor-pointer overflow-hidden flex items-center justify-center relative group"
                            >
                                {asset.type === 'video' ? (
                                    <video src={asset.previewPath} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                                ) : (
                                    <img src={asset.previewPath} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                                )}
                            </div>
                        ))}
                        {recentAssets.length === 0 && (
                            <div className="col-span-3 text-center text-gray-600 text-[10px] italic">No recent assets</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
