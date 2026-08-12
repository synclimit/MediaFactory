import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Status from '../ui/Status';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import { Play, Copy, FolderSync, Plus, Trash2 } from 'lucide-react';
import { getApiUrl } from '../../utils/apiUrl';

export default function WorkspacePicker({ onWorkspaceSelected, onNewWorkspace }) {
    const [workspaces, setWorkspaces] = useState([]);
    const [selected, setSelected] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadWorkspaces = async () => {
        try {
            const res = await fetch(getApiUrl('/api/v1/system/workspace/list'));
            const data = await res.json();
            if (data.success) {
                setWorkspaces(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadWorkspaces();
    }, []);

    const handleSelect = (name) => {
        setSelected(name);
    };

    const handleOpen = async (name) => {
        try {
            await fetch(getApiUrl('/api/v1/system/workspace/active'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceName: name })
            });
            onWorkspaceSelected(name);
        } catch (e) {
            console.error(e);
        }
    };

    if (isLoading) {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center font-sans bg-[#0a0a0c] text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-bold tracking-wider uppercase text-gray-400">Loading Channel Workspaces...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center font-sans overflow-hidden bg-[#0a0a0c]">
            {/* EXACT M1 MECHA BACKGROUND */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-[0.35]" 
                    style={{ backgroundImage: 'url(/mecha_bg.png)' }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/80 via-[#0a0a0c]/60 to-[#0a0a0c]/90"></div>
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-orange-600/20 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
                <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-cyan-700/20 rounded-full blur-[150px] mix-blend-screen opacity-30"></div>
                <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen opacity-40"></div>
                <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
            </div>

            <div className="max-w-6xl w-full p-12 relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-[32px] font-black text-white mb-2 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Select Channel Workspace</h1>
                    <p className="text-gray-400 text-[14px] font-mono tracking-wide">Choose a workspace to load its specific branding, output folders, and render profiles.</p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-6">
                    {workspaces.map((ws, i) => (
                        <div 
                            key={ws.name}
                            onClick={() => handleSelect(ws.name)}
                            onDoubleClick={() => handleOpen(ws.name)}
                            className={`relative w-[340px] rounded-xl border p-5 flex flex-col cursor-pointer transition-all duration-300 group overflow-hidden ${
                                selected === ws.name 
                                    ? 'bg-gradient-to-br from-[#2a1306]/90 via-[#1b1d22] to-[#0d0e12] border-orange-500 shadow-[0_15px_40px_rgba(249,115,22,0.3),inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.5)]' 
                                    : 'bg-gradient-to-br from-[#1b1d22] via-[#14151a] to-[#0d0e12] border-[#2a2c33] hover:border-orange-500/50 shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)]'
                            }`}
                        >
                            {/* Orange Glow Line on top */}
                            <div className={`absolute top-0 left-0 w-full h-[2px] transition-colors ${
                                selected === ws.name 
                                    ? 'bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.8)] z-0 pointer-events-none'
                                    : 'bg-gradient-to-r from-orange-600/30 via-orange-500/50 to-orange-600/30 shadow-[0_0_10px_rgba(249,115,22,0.3)] group-hover:via-orange-500/80 z-0 pointer-events-none'
                            }`}></div>

                            <div className="flex items-start gap-4 mb-4 relative z-10">
                                <Avatar name={ws.name} size={54} />
                                <div className="flex-1">
                                    <h3 className="text-[20px] font-black text-white tracking-widest uppercase mb-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{ws.name}</h3>
                                    <p className="text-[11px] text-gray-400 font-mono mb-2">LAST OPENED: {ws.lastOpened ? new Date(ws.lastOpened).toLocaleDateString() : 'NEVER'}</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                        <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Active</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-gray-400 mt-auto bg-black/40 rounded-xl p-3 border border-[#2a2c33] relative z-10">
                                <div className="flex flex-col items-center">
                                    <span className="text-gray-500 mb-1">PROJECTS</span>
                                    <span className="font-bold text-white text-[14px]">{ws.totalProjects || 0}</span>
                                </div>
                                <div className="flex flex-col items-center border-l border-r border-[#2a2c33]">
                                    <span className="text-gray-500 mb-1">RENDERS</span>
                                    <span className="font-bold text-white text-[14px]">{ws.renderCount || 0}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-gray-500 mb-1">STORAGE</span>
                                    <span className="font-bold text-white text-[14px]">{ws.storageSizeGB || 0} GB</span>
                                </div>
                            </div>
                            
                            {selected === ws.name && (
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent flex justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-250 z-20">
                                    <button 
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Are you sure you want to delete workspace "${ws.name}"?`)) {
                                                try {
                                                    await fetch(getApiUrl(`/api/v1/system/workspace/${ws.name}`), { method: 'DELETE' });
                                                    loadWorkspaces();
                                                } catch(err) { console.error(err); }
                                            }
                                        }}
                                        className="w-10 h-10 flex items-center justify-center bg-[#1a1c23] hover:bg-red-900/30 border border-[#333] hover:border-red-500/50 rounded-lg text-gray-400 hover:text-red-400 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                                        title="Delete Workspace"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button 
                                        className="w-10 h-10 flex items-center justify-center bg-[#1a1c23] hover:bg-[#2a2c33] border border-[#333] hover:border-orange-500/50 rounded-lg text-gray-400 hover:text-white transition-all shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                                        title="Sync Folder"
                                    >
                                        <FolderSync size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleOpen(ws.name); }} 
                                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 border border-orange-400 text-white font-black uppercase tracking-widest text-[12px] rounded-lg transition-all shadow-[0_0_15px_rgba(249,115,22,0.5),inset_0_1px_2px_rgba(255,255,255,0.3)]"
                                    >
                                        <Play size={14} fill="currentColor" /> Open
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    <div 
                        className="relative w-[340px] rounded-xl border border-dashed border-[#2a2c33] hover:border-orange-500/50 bg-black/20 hover:bg-[#1a1c23]/50 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group min-h-[220px]"
                        onClick={() => {
                            if (onNewWorkspace) onNewWorkspace();
                        }}
                    >
                        <div className="w-14 h-14 rounded-full border-2 border-[#2a2c33] group-hover:border-orange-500/50 bg-[#14151a] group-hover:bg-orange-500/10 flex items-center justify-center mb-4 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                            <Plus size={24} className="text-gray-500 group-hover:text-orange-500 transition-colors" />
                        </div>
                        <span className="text-gray-400 group-hover:text-white font-black text-[14px] tracking-widest uppercase transition-colors">New Workspace</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
