import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import { Image, ImagePlay, MonitorPlay, AlertTriangle, FolderOutput } from 'lucide-react';
import { getApiUrl } from '../../utils/apiUrl';

export default function WorkspaceWizard({ onWorkspaceCreated, onClose }) {
    const [step, setStep] = useState(1);
    
    // Step 1 Data
    const [name, setName] = useState('');
    const [workspaceRoot, setWorkspaceRoot] = useState('');
    
    // Step 2 Data
    const [logoPath, setLogoPath] = useState('');
    const [watermarkPath, setWatermarkPath] = useState('');
    const [overlayPath, setOverlayPath] = useState('');
    const [subscribePath, setSubscribePath] = useState('');
    const [outputFolder, setOutputFolder] = useState('');

    const [isCreating, setIsCreating] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('Creating Workspace...');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetch(getApiUrl('/api/v1/system/workspace-base'))
            .then(r => r.json())
            .then(d => {
                if (d.data?.workspaceBase) {
                    setWorkspaceRoot(d.data.workspaceBase);
                }
            })
            .catch(() => {});
    }, []);

    const handleChangeWorkspaceLocation = async () => {
        let selectedFolder = null;
        if (window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                const paths = await ipcRenderer.invoke('show-open-dialog', {
                    properties: ['openDirectory', 'createDirectory'],
                    title: 'Select Root Workspace Directory'
                });
                if (paths && paths.length > 0) selectedFolder = paths[0];
            } catch (e) {}
        }
        if (selectedFolder) {
            setWorkspaceRoot(selectedFolder);
            try {
                await fetch(getApiUrl('/api/v1/system/workspace-base'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ workspaceBase: selectedFolder })
                });
            } catch(e) {}
        }
    };

    const handleNext = () => {
        if (name.trim()) {
            setStep(2);
            setErrorMsg('');
        } else {
            setErrorMsg('Channel Name is required.');
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        const cleanName = name.trim();
        setIsCreating(true);
        setErrorMsg('');
        
        // 1. Instantly save workspace to client storage
        localStorage.setItem('mf_active_workspace', cleanName);
        try {
            const existingList = JSON.parse(localStorage.getItem('mf_created_workspaces') || '[]');
            if (!existingList.includes(cleanName)) {
                existingList.push(cleanName);
                localStorage.setItem('mf_created_workspaces', JSON.stringify(existingList));
            }
        } catch(e) {}
        
        if (outputFolder) {
            localStorage.setItem(`mf_workspace_output_${cleanName}`, outputFolder);
        }
        if (logoPath || watermarkPath || overlayPath || subscribePath) {
            localStorage.setItem(`mf_workspace_branding_${cleanName}`, JSON.stringify({
                logo: logoPath,
                watermark: watermarkPath,
                overlay: overlayPath,
                subscribeAnim: subscribePath
            }));
        }

        // 2. Fire and forget backend sync call
        try {
            const payload = {
                name: cleanName,
                assets: {
                    logo: logoPath,
                    watermark: watermarkPath,
                    overlay: overlayPath,
                    subscribe_anim: subscribePath
                },
                outputFolder
            };
            fetch(getApiUrl('/api/v1/system/workspace/create'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {});
        } catch(e) {}

        // 3. Immediately transition to Editor
        setLoadingMsg('Loading Workspace...');
        setTimeout(() => {
            setLoadingMsg('Opening Editor...');
            setTimeout(() => {
                onWorkspaceCreated(cleanName);
            }, 300);
        }, 400);
    };

    const handleBrowseFolder = async () => {
        if (window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                const paths = await ipcRenderer.invoke('show-open-dialog', {
                    properties: ['openDirectory', 'createDirectory']
                });
                if (paths && paths.length > 0) {
                    setOutputFolder(paths[0]);
                }
                return; // STOP HERE! Prevent dialog spam on cancel
            } catch (e) {
                console.warn('[WorkspaceWizard] IPC open-dialog fallback:', e);
            }
        }

        try {
            const res = await fetch(getApiUrl('/api/v1/m5/dialog/folder'), { method: 'POST' });
            const data = await res.json();
            if (data.path) setOutputFolder(data.path);
        } catch (e) {
            console.error("Failed to browse folder", e);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <Surface 
                variant={BackgroundVariants.WorkspaceWizard}
                className="rounded-[24px] shadow-[0_25px_80px_rgba(0,0,0,0.6)] border border-[rgba(255,255,255,0.08)] w-[540px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-250"
            >
                <div className="relative z-10 p-8">
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-[24px] font-bold text-white mb-2 tracking-tight">Welcome to MediaFactory</h2>
                            <p className="text-[#B6C2D1] mb-6 text-[13px] leading-relaxed">To begin, create your first Channel Workspace. A Workspace stores all rendering defaults and branding for a specific YouTube channel.</p>
                            
                            {errorMsg && (
                                <div className="mb-4 p-3 bg-transparent border border-[rgba(255,100,100,0.3)] shadow-[0_0_15px_rgba(255,100,100,0.1)] rounded-[8px] text-[#FF6464] text-[12px] font-medium animate-in fade-in">
                                    ⚠️ {errorMsg}
                                </div>
                            )}

                            <div className="mb-5">
                                <label className="block text-[11px] font-semibold text-[#738091] uppercase tracking-wider mb-2">Channel Name</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => { setName(e.target.value); setErrorMsg(''); }}
                                    placeholder="e.g. Lofi Vibes Channel" 
                                    disabled={isCreating}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleNext();
                                    }}
                                    className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-3 text-white outline-none focus:border-[#32D8FF] transition-colors disabled:opacity-50"
                                />
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-[11px] font-semibold text-[#738091] uppercase tracking-wider">Workspace Location</label>
                                    <button 
                                        type="button" 
                                        onClick={handleChangeWorkspaceLocation} 
                                        className="text-[11px] text-[#32D8FF] hover:underline cursor-pointer flex items-center gap-1 font-mono"
                                    >
                                        Change Folder 📁
                                    </button>
                                </div>
                                <div className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-2.5 text-[12px] text-gray-300 font-mono truncate" title={workspaceRoot}>
                                    {workspaceRoot || 'Loading...'}
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Database and assets will be stored inside this directory.</p>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                                <Button 
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={isCreating}
                                    className="min-w-[100px] border border-white/10 bg-transparent hover:bg-white/5 text-white/70"
                                >
                                    Back
                                </Button>
                                <Button 
                                    onClick={handleNext}
                                    disabled={!name.trim() || isCreating}
                                    className="min-w-[140px]"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-[20px] font-bold text-white mb-1 tracking-tight uppercase">DEFAULT ASSETS</h2>
                            <p className="text-[#B6C2D1] mb-5 text-[12px] leading-relaxed">Configure the default visual assets and output directory for {name || 'this workspace'}.</p>
                            
                            {errorMsg && (
                                <div className="mb-4 p-3 bg-transparent border border-[rgba(255,100,100,0.3)] shadow-[0_0_15px_rgba(255,100,100,0.1)] rounded-[8px] text-[#FF6464] text-[12px] font-medium animate-in fade-in">
                                    ⚠️ {errorMsg}
                                </div>
                            )}

                            <div className="flex flex-col gap-4 mb-8 h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                                {/* OUTPUT FOLDER */}
                                <div className="flex flex-col gap-1.5 mt-2">
                                    <label className="text-[11px] font-bold text-[#738091] uppercase tracking-wider">Output Folder</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative flex items-center">
                                            <div className="absolute left-3 text-blue-400 opacity-80"><FolderOutput size={14} /></div>
                                            <input 
                                                type="text" 
                                                value={outputFolder}
                                                onChange={(e) => setOutputFolder(e.target.value)}
                                                placeholder="PATH\TO\OUTPUT\FOLDER" 
                                                className="w-full bg-[rgba(10,15,24,0.6)] border border-[rgba(255,255,255,0.05)] rounded-[6px] pl-9 pr-3 py-2.5 text-white text-[12px] outline-none focus:border-white/20 transition-colors"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleBrowseFolder}
                                            className="px-4 rounded-[6px] bg-[#141822] hover:bg-[#1a202d] border border-white/5 text-white text-[11px] font-bold tracking-wider uppercase transition-colors shrink-0"
                                        >
                                            Browse
                                        </button>
                                    </div>
                                </div>
                            </div>


                            <div className="flex justify-between items-center">
                                <Button 
                                    variant="secondary"
                                    onClick={() => setStep(1)}
                                    disabled={isCreating}
                                    className="min-w-[100px] border border-white/10 bg-transparent hover:bg-white/5 text-white/70"
                                >
                                    Back
                                </Button>
                                <div className="flex items-center gap-4">
                                    {isCreating && (
                                        <div className="flex items-center gap-2 text-[#32D8FF] text-[12px] font-bold animate-pulse">
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {loadingMsg}
                                        </div>
                                    )}
                                    <Button 
                                        onClick={handleCreate}
                                        disabled={isCreating}
                                        className="min-w-[160px]"
                                    >
                                        {isCreating ? 'Processing...' : 'Create Workspace'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Surface>
        </div>
    );
}

