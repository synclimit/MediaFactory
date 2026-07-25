import React, { useState } from 'react';
import { Image as ImageIcon, Video, Shuffle, Plus, ChevronUp, ChevronDown, X } from 'lucide-react';

export default function BackgroundPanel({ 
    m3BgPool = [], 
    setM3BgPool, 
    m3SelectedObjectId, 
    setM3SelectedObjectId 
}) {
    const [activeTab, setActiveTab] = useState('BG Image');

    const handleUploadClick = (type) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = type === 'video' ? 'video/*' : 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
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
                        const url = `/api/m2/stream?uri=${encodeURIComponent(json.data.path)}`;
                        const newId = `bg_${Date.now()}`;
                        const newBg = {
                            id: newId,
                            type: type,
                            url: url,
                            preview: url,
                            filename: file.name,
                            settings: {
                                overlayDarkness: 30,
                                blurAmount: 0,
                                scaleMode: 'Cover (Fill)',
                                backgroundZoom: 0,
                                horizontalPosition: 0,
                                verticalPosition: 0,
                                danceMode: 'Ringan (Pixel) — cepat di CPU',
                                danceStyle: 'Subtle Sway',
                                danceIntensity: 100,
                                danceReactLevel: 45,
                                danceReactsTo: 'Whole song',
                                danceSmoothing: 0.70
                            }
                        };
                        
                        if (setM3BgPool) {
                            setM3BgPool(prev => [...prev, newBg]);
                        }
                        if (setM3SelectedObjectId) {
                            setM3SelectedObjectId(newId);
                        }
                    }
                } catch (err) {
                    console.error("Failed to upload background:", err);
                }
            }
            document.body.removeChild(fileInput);
        };
        
        fileInput.oncancel = () => {
            document.body.removeChild(fileInput);
        };

        fileInput.click();
    };

    const removeBg = (id, e) => {
        e.stopPropagation();
        if (setM3BgPool) {
            setM3BgPool(prev => prev.filter(bg => bg.id !== id));
        }
        if (m3SelectedObjectId === id && setM3SelectedObjectId) {
            setM3SelectedObjectId(null);
        }
    };

    const moveBg = (index, direction, e) => {
        e.stopPropagation();
        if (!setM3BgPool) return;
        
        setM3BgPool(prev => {
            const newPool = [...prev];
            if (direction === 'up' && index > 0) {
                const temp = newPool[index - 1];
                newPool[index - 1] = newPool[index];
                newPool[index] = temp;
            } else if (direction === 'down' && index < newPool.length - 1) {
                const temp = newPool[index + 1];
                newPool[index + 1] = newPool[index];
                newPool[index] = temp;
            }
            return newPool;
        });
    };

    const tabs = [
        { id: 'BG Image', icon: '🖼️' },
        { id: 'Gradient', icon: '🌈' },
        { id: 'Solid', icon: '🎨' },
        { id: 'Video', icon: '🎞️' }
    ];

    return (
        <div className="flex flex-col h-full relative z-10">
            {/* Custom Header Tabs - Sleeker Design */}
            <div className="flex items-center border-b border-[#2a2c33] bg-black/20">
                <button 
                    onClick={() => setActiveTab('BG Image')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'BG Image' ? 'text-[#f97316]' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    <span className="text-[14px]">🖼️</span> Image
                    {activeTab === 'BG Image' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f97316] to-transparent shadow-[0_-2px_8px_rgba(249,115,22,0.5)]" />}
                </button>
                <button 
                    onClick={() => setActiveTab('Video')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'Video' ? 'text-[#f97316]' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    <span className="text-[14px]">🎞️</span> Video
                    {activeTab === 'Video' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f97316] to-transparent shadow-[0_-2px_8px_rgba(249,115,22,0.5)]" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleUploadClick(activeTab === 'Video' ? 'video' : 'image')}
                        className="flex-1 bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-[11px] uppercase tracking-wider shadow-[0_4px_15px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.5)] transform hover:-translate-y-0.5 border border-orange-400/50"
                    >
                        <span className="text-lg">+</span> Add {activeTab === 'Video' ? 'Video' : 'Image'}
                    </button>
                    <button 
                        className="bg-[#161822]/90 hover:bg-[#1a1c25] border border-orange-500/20 hover:border-orange-500/40 text-gray-200 font-bold px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider shadow-inner"
                    >
                        <Shuffle size={14} className="text-[#f97316]" /> Shuffle
                    </button>
                </div>

                <div className="relative bg-[#161822] border-[3px] border-orange-500/50 px-4 py-3 rounded-lg flex items-center justify-between mt-8 mb-4 shadow-[0_4px_20px_rgba(249,115,22,0.15)]">
                    {/* Inner orange glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/15 to-transparent rounded-lg pointer-events-none"></div>
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3/4 bg-orange-500 rounded-r-md shadow-[0_0_12px_#f97316]"></div>
                    
                    <span className="text-[12px] font-black text-white uppercase tracking-[0.15em] drop-shadow-md relative z-10 pl-2">
                        Active Backgrounds
                    </span>
                    <span className="bg-orange-500 text-white font-black px-2.5 py-0.5 rounded-md shadow-[0_2px_8px_rgba(249,115,22,0.5)] relative z-10 text-[11px]">{m3BgPool.length}</span>
                </div>

                <div className="space-y-3">
                    {m3BgPool.map((bg, index) => {
                        const isSelected = m3SelectedObjectId === bg.id;

                        return (
                            <div 
                                key={bg.id} 
                                onClick={() => setM3SelectedObjectId && setM3SelectedObjectId(bg.id)}
                                className={`relative rounded-xl border flex flex-col shrink-0 overflow-hidden group transition-all duration-300 cursor-pointer z-10 bg-gradient-to-br from-[#2a2c33] to-[#111216] border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] mb-2 ${isSelected ? 'ring-1 ring-orange-500/30' : 'opacity-80 hover:opacity-100'}`}
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
                                {/* Header */}
                                <div className={`flex items-center justify-between p-2.5 relative z-10 ${isSelected ? '' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => removeBg(bg.id, e)}
                                            className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-900/10 hover:bg-red-500 border border-transparent hover:border-red-400 text-red-500 hover:text-white transition-all"
                                            title="Remove Background"
                                        >
                                            <X size={12} />
                                        </button>
                                        <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-[#f97316]' : 'text-gray-500'}`}>
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <span className={`text-[11px] truncate ${isSelected ? 'text-gray-200 font-semibold' : 'text-gray-400'}`}>
                                            {bg.filename || 'Unknown Media'}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button 
                                            onClick={(e) => moveBg(index, 'up', e)}
                                            disabled={index === 0}
                                            className={`p-1 rounded bg-[#2a2d3e] hover:bg-[#f97316] hover:text-white transition-colors ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'text-gray-300'}`}
                                        >
                                            <ChevronUp size={12} />
                                        </button>
                                        <button 
                                            onClick={(e) => moveBg(index, 'down', e)}
                                            disabled={index === m3BgPool.length - 1}
                                            className={`p-1 rounded bg-[#2a2d3e] hover:bg-[#f97316] hover:text-white transition-colors ${index === m3BgPool.length - 1 ? 'opacity-50 cursor-not-allowed' : 'text-gray-300'}`}
                                        >
                                            <ChevronDown size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {m3BgPool.length === 0 && (
                        <div className="text-center py-10 opacity-50 bg-[#161822]/90 rounded-lg border border-orange-500/20 shadow-inner">
                            <div className="text-3xl mb-2">📸</div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">No backgrounds added</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
