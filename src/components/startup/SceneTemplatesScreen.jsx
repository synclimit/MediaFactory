import React, { useState } from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import Button from '../ui/Button';
import { Play } from 'lucide-react';

const SCENE_TEMPLATES = [
    { id: 'dj-live', name: '🎧 DJ Live', desc: 'High energy club layout with reactive lights.', genre: 'EDM', color: 'from-pink-500/20 to-purple-600/20' },
    { id: 'lofi-radio', name: '🌧 Lo-fi Radio', desc: 'Rainy aesthetic with subtle breathing camera.', genre: 'Lofi', color: 'from-blue-500/20 to-indigo-600/20' },
    { id: 'night-drive', name: '🌃 Night Drive', desc: 'Retro synthwave aesthetic with motion blur.', genre: 'Synthwave', color: 'from-purple-500/20 to-pink-600/20' },
    { id: 'sunset-chill', name: '🌇 Sunset Chill', desc: 'Warm cinematic glow with soft particles.', genre: 'Chillhop', color: 'from-orange-500/20 to-red-600/20' },
    { id: 'gaming-stream', name: '🎮 Gaming Stream', desc: 'Sharp neon edges with fast beat reactivity.', genre: 'Gaming', color: 'from-green-500/20 to-emerald-600/20' },
    { id: 'podcast', name: '🎙 Podcast Studio', desc: 'Clean, minimal audio spectrum design.', genre: 'Podcast', color: 'from-gray-500/20 to-slate-600/20' }
];

export default function SceneTemplatesScreen({ onProjectCreated }) {
    const [selected, setSelected] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = (template) => {
        setIsCreating(true);
        // Simulate backend project creation
        setTimeout(() => {
            onProjectCreated(`Project: ${template.name}`);
        }, 1500);
    };

    return (
        <Surface variant={BackgroundVariants.WorkspacePicker} className="absolute inset-0 z-50 overflow-y-auto" contentClassName="flex flex-col items-center py-12">
            <div className="max-w-6xl w-full px-8 relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-[32px] font-bold text-white mb-3 tracking-tight">Create New Project</h1>
                    <p className="text-[#B6C2D1] text-[16px]">Choose a Scene Template to instantly configure your visualizer, looks, and background.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SCENE_TEMPLATES.map((tpl) => (
                        <div 
                            key={tpl.id}
                            onClick={() => setSelected(tpl.id)}
                            onDoubleClick={() => handleCreate(tpl)}
                            className={`relative bg-[#11131a] rounded-2xl border ${selected === tpl.id ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]' : 'border-[#2d3247] hover:border-[#4d5573]'} transition-all cursor-pointer overflow-hidden group flex flex-col h-[320px]`}
                        >
                            {/* Visual Placeholder for Template Preview */}
                            <div className={`h-[180px] w-full bg-gradient-to-br ${tpl.color} flex items-center justify-center border-b border-[#2d3247]`}>
                                <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                                    <Play size={24} className="text-white ml-1 opacity-50 group-hover:opacity-100" />
                                </div>
                            </div>
                            
                            {/* Template Info */}
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-[18px] font-bold text-white tracking-tight">{tpl.name}</h3>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#2d3247] text-gray-300">{tpl.genre}</span>
                                </div>
                                <p className="text-[13px] text-[#738091] leading-relaxed flex-1">{tpl.desc}</p>
                                
                                {selected === tpl.id && (
                                    <div className="pt-4 flex justify-end animate-in fade-in zoom-in-95">
                                        <Button 
                                            variant="primary" 
                                            onClick={(e) => { e.stopPropagation(); handleCreate(tpl); }} 
                                            className="w-full justify-center !py-2 font-bold"
                                            disabled={isCreating}
                                        >
                                            {isCreating ? 'Creating Project...' : 'Start with Template'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button className="text-[13px] text-gray-500 hover:text-gray-300 font-medium transition-colors">
                        Start from Scratch (Blank Canvas)
                    </button>
                </div>
            </div>
        </Surface>
    );
}
