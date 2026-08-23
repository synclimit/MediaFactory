import React, { useState, useEffect } from 'react';
import Drawer from '../ui/Drawer';
import Avatar from '../ui/Avatar';
import { Edit2, Check, X, Camera, Image as ImageIcon } from 'lucide-react';
import { getApiUrl } from '../../utils/apiUrl';

export default function WorkspaceDrawer({ activeWorkspace, isOpen, onClose, onSwitch, onRename }) {
    const [settings, setSettings] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Rename state
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState('');
    const [renameError, setRenameError] = useState('');
    const [isRenamingLoading, setIsRenamingLoading] = useState(false);

    // Avatar state
    const [avatarUrl, setAvatarUrl] = useState(() => {
        return localStorage.getItem(`mf_workspace_avatar_${activeWorkspace}`) || null;
    });

    useEffect(() => {
        if (!isOpen || !activeWorkspace) return;
        
        setIsRenaming(false);
        setNewName(activeWorkspace);
        setRenameError('');

        const cachedAvatar = localStorage.getItem(`mf_workspace_avatar_${activeWorkspace}`) || null;
        setAvatarUrl(cachedAvatar);

        const loadSettings = async () => {
            const cachedOut = localStorage.getItem(`mf_workspace_output_${activeWorkspace}`) || '';
            let cachedBranding = {};
            try {
                cachedBranding = JSON.parse(localStorage.getItem(`mf_workspace_branding_${activeWorkspace}`) || '{}');
            } catch(e) {}

            try {
                const res = await fetch(getApiUrl(`/api/v1/system/workspace/${encodeURIComponent(activeWorkspace)}/settings`));
                const data = await res.json();
                let loaded = data.success && data.data ? (data.data.data || {}) : {};
                
                if (!loaded.output) loaded.output = {};
                if (!loaded.output.main && cachedOut) {
                    loaded.output.main = cachedOut;
                }

                if (!loaded.branding) loaded.branding = {};
                if (!loaded.branding.logo && cachedBranding.logo) loaded.branding.logo = cachedBranding.logo;
                if (!loaded.branding.watermark && cachedBranding.watermark) loaded.branding.watermark = cachedBranding.watermark;
                if (!loaded.branding.overlay && cachedBranding.overlay) loaded.branding.overlay = cachedBranding.overlay;
                if (!loaded.branding.subscribeAnim && cachedBranding.subscribeAnim) loaded.branding.subscribeAnim = cachedBranding.subscribeAnim;

                if (loaded.branding?.logo && !cachedAvatar) {
                    setAvatarUrl(loaded.branding.logo);
                    localStorage.setItem(`mf_workspace_avatar_${activeWorkspace}`, loaded.branding.logo);
                }

                setSettings(loaded);
            } catch (e) {
                console.error(e);
                setSettings({ 
                    general: { channelName: activeWorkspace }, 
                    branding: cachedBranding || {}, 
                    output: { main: cachedOut } 
                });
            }
        };
        loadSettings();
    }, [activeWorkspace, isOpen]);

    // Handle Upload / Change Workspace Avatar
    const handleAvatarUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const imgData = event.target?.result;
            if (imgData) {
                setAvatarUrl(imgData);
                localStorage.setItem(`mf_workspace_avatar_${activeWorkspace}`, imgData);
                
                // Update settings
                setSettings(prev => {
                    const updated = {
                        ...(prev || {}),
                        general: { ...(prev?.general || {}), channelThumbnail: imgData },
                        branding: { ...(prev?.branding || {}), logo: imgData }
                    };
                    return updated;
                });

                window.dispatchEvent(new CustomEvent('workspace_avatar_updated', {
                    detail: { workspaceName: activeWorkspace, avatar: imgData }
                }));

                // Auto save avatar to backend
                try {
                    await fetch(getApiUrl(`/api/v1/system/workspace/${encodeURIComponent(activeWorkspace)}/settings`), {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...(settings || {}),
                            general: { ...(settings?.general || {}), channelThumbnail: imgData },
                            branding: { ...(settings?.branding || {}), logo: imgData }
                        })
                    });
                } catch(err) {}
            }
        };
        reader.readAsDataURL(file);
    };

    // Handle Rename Workspace
    const handleSaveRename = async () => {
        const trimmed = (newName || '').trim();
        if (!trimmed) {
            setRenameError('Nama workspace tidak boleh kosong.');
            return;
        }
        if (trimmed === activeWorkspace) {
            setIsRenaming(false);
            return;
        }

        setIsRenamingLoading(true);
        setRenameError('');

        try {
            const res = await fetch(getApiUrl(`/api/v1/system/workspace/${encodeURIComponent(activeWorkspace)}/rename`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newName: trimmed })
            });
            const data = await res.json();
            if (data.error || (data.success === false)) {
                throw new Error(data.error || data.message || 'Gagal mengubah nama workspace.');
            }

            // Migrate local storage keys
            try {
                const oldAvatar = localStorage.getItem(`mf_workspace_avatar_${activeWorkspace}`);
                if (oldAvatar) {
                    localStorage.setItem(`mf_workspace_avatar_${trimmed}`, oldAvatar);
                    localStorage.removeItem(`mf_workspace_avatar_${activeWorkspace}`);
                }

                const oldOut = localStorage.getItem(`mf_workspace_output_${activeWorkspace}`);
                if (oldOut) {
                    localStorage.setItem(`mf_workspace_output_${trimmed}`, oldOut);
                    localStorage.removeItem(`mf_workspace_output_${activeWorkspace}`);
                }

                const oldBrand = localStorage.getItem(`mf_workspace_branding_${activeWorkspace}`);
                if (oldBrand) {
                    localStorage.setItem(`mf_workspace_branding_${trimmed}`, oldBrand);
                    localStorage.removeItem(`mf_workspace_branding_${activeWorkspace}`);
                }

                const cachedList = JSON.parse(localStorage.getItem('mf_created_workspaces') || '[]');
                const updatedList = cachedList.map(n => n === activeWorkspace ? trimmed : n);
                localStorage.setItem('mf_created_workspaces', JSON.stringify(updatedList));
                localStorage.setItem('mf_active_workspace', trimmed);
            } catch(e) {}

            window.dispatchEvent(new CustomEvent('workspace_renamed', {
                detail: { oldName: activeWorkspace, newName: trimmed }
            }));

            if (onRename) onRename(trimmed);
            setIsRenaming(false);
        } catch (err) {
            setRenameError(err.message || 'Gagal mengubah nama workspace.');
        } finally {
            setIsRenamingLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (settings?.output?.main) {
                localStorage.setItem(`mf_workspace_output_${activeWorkspace}`, settings.output.main);
            }
            if (settings?.branding) {
                localStorage.setItem(`mf_workspace_branding_${activeWorkspace}`, JSON.stringify(settings.branding));
            }
            if (avatarUrl) {
                localStorage.setItem(`mf_workspace_avatar_${activeWorkspace}`, avatarUrl);
            }
            await fetch(getApiUrl(`/api/v1/system/workspace/${encodeURIComponent(activeWorkspace)}/settings`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            window.dispatchEvent(new CustomEvent('workspace_settings_updated', { detail: { activeWorkspace, settings } }));
            onClose();
        } catch (e) {
            console.error(e);
            window.dispatchEvent(new CustomEvent('workspace_settings_updated', { detail: { activeWorkspace, settings } }));
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileBrowse = async (isFolder, callback) => {
        try {
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                const paths = await ipcRenderer.invoke('show-open-dialog', {
                    properties: isFolder ? ['openDirectory', 'createDirectory'] : ['openFile']
                });
                if (paths && paths.length > 0) {
                    callback(paths[0]);
                    return;
                }
            }
        } catch (ipcErr) {
            console.warn('[WorkspaceDrawer] IPC browse fallback:', ipcErr);
        }

        try {
            const endpoint = isFolder ? '/api/v1/m5/dialog/folder' : '/api/v1/m5/dialog/file';
            const res = await fetch(getApiUrl(endpoint), { method: 'POST' });
            const data = await res.json();
            if (data && data.path) {
                callback(data.path);
            }
        } catch (e) {
            console.error('Dialog failed:', e);
        }
    };

    const renderIcon = (type) => {
        const svgProps = "w-4 h-4 text-orange-500";
        switch (type) {
            case 'channel': return <svg className={svgProps} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case 'logo': return <svg className={svgProps} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
            case 'watermark': return <svg className={svgProps} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
            case 'overlay': return <svg className={svgProps} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
            case 'anim': return <svg className={svgProps} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case 'folder': return <svg className={svgProps} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
            default: return null;
        }
    };

    const renderPanelHeader = (title) => (
        <div className="mb-4 mt-6 px-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-sm bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,1)]"></span>
            <h2 className="text-white font-black text-[15px] tracking-widest uppercase font-['Rajdhani']">
                {title}
            </h2>
        </div>
    );

    const renderInput = (label, value, onChange, placeholder = "", iconType = null, browseType = null) => (
        <div className="mb-5 px-1">
            <label className="block text-gray-400 font-bold text-[11px] mb-2 uppercase tracking-widest font-['Rajdhani']">{label}</label>
            <div className="flex gap-2 items-center w-full">
                <div className="flex-1 min-w-0 flex items-center bg-[#111218] border border-[#2d3142] focus-within:border-orange-500/80 rounded-lg p-1 shadow-inner transition-colors h-[42px]">
                    {iconType && (
                        <div className="pl-3 pr-2 shrink-0 flex items-center justify-center opacity-70">
                            {renderIcon(iconType)}
                        </div>
                    )}
                    <input 
                        type="text" 
                        placeholder={placeholder}
                        value={value} 
                        onChange={onChange} 
                        className="flex-1 w-full bg-transparent text-white font-mono font-bold text-[12px] outline-none px-2 placeholder-gray-600" 
                    />
                </div>
                
                {browseType && (
                    <button 
                        className="px-4 h-[42px] shrink-0 bg-[#1c1e29] border border-[#2d3142] hover:border-orange-500/50 hover:bg-orange-600 hover:text-white text-gray-300 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer"
                        onClick={() => handleFileBrowse(browseType === 'folder', (path) => {
                            onChange({ target: { value: path } });
                        })}
                    >
                        Browse
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <Drawer isOpen={isOpen} onClose={onClose} seed={activeWorkspace ? activeWorkspace.length * 42 : 99}>
            {/* EXACT M1 THEME BACKGROUND WITH SLEEK BRACKET FRAME */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1b1d22] via-[#14151a] to-[#0d0e12] z-0 overflow-hidden shadow-[-15px_0_40px_rgba(0,0,0,0.8)]">
                
                {/* Clean Orange Left Border Bracket */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)] z-10"></div>
                <div className="absolute left-0 top-0 w-24 h-[3px] bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)] z-10"></div>
                <div className="absolute left-0 bottom-0 w-24 h-[3px] bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)] z-10"></div>
                
                {/* Diagonal striped pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
            </div>

            {/* Content Wrap */}
            <div className="relative z-10 flex flex-col h-full px-4 py-8">
                
                {/* Header section with UPLOADABLE AVATAR & RENAME FEATURE */}
                <div className="flex items-center gap-4 mb-4 px-1">
                    
                    {/* AVATAR WITH UPLOAD OVERLAY */}
                    <div className="relative group shrink-0">
                        <Avatar 
                            name={activeWorkspace} 
                            src={avatarUrl}
                            size={64}
                            className="border-2 border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.5)] cursor-pointer"
                        />

                        {/* Hidden File Input for Avatar */}
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/gif, image/bmp, image/*" 
                            id="workspace-avatar-input"
                            className="hidden" 
                            onChange={handleAvatarUpload}
                        />

                        {/* Hover Change Badge */}
                        <label 
                            htmlFor="workspace-avatar-input"
                            className="absolute inset-0 rounded-[14px] bg-black/80 hover:bg-orange-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[9px] font-bold uppercase tracking-wider z-20"
                            title="Ganti Foto Profil / Logo Channel"
                        >
                            <Camera size={18} className="mb-0.5" />
                            <span>GANTI</span>
                        </label>
                    </div>

                    {/* TITLE / RENAME CONTROL */}
                    <div className="min-w-0 flex-1 z-10">
                        {isRenaming ? (
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveRename();
                                            if (e.key === 'Escape') setIsRenaming(false);
                                        }}
                                        autoFocus
                                        placeholder="Nama Workspace..."
                                        className="w-full bg-[#0d0e14] border border-orange-500 rounded-lg px-3 py-1.5 text-white font-black text-lg tracking-wider outline-none shadow-inner uppercase"
                                    />
                                    <button 
                                        onClick={handleSaveRename}
                                        disabled={isRenamingLoading}
                                        className="p-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-lg transition-all shadow-[0_0_8px_rgba(249,115,22,0.6)] cursor-pointer shrink-0"
                                        title="Simpan Nama"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setIsRenaming(false)}
                                        className="p-2 bg-[#1c1e29] hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0 border border-[#2d3142]"
                                        title="Batal"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                {renameError && <span className="text-red-400 text-[10px] font-bold">{renameError}</span>}
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-[26px] leading-tight font-black text-white tracking-[0.02em] mb-0 break-words uppercase drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] truncate">
                                        {activeWorkspace || 'No Workspace'}
                                    </h2>
                                    <button 
                                        onClick={() => {
                                            setNewName(activeWorkspace);
                                            setIsRenaming(true);
                                        }}
                                        className="p-1.5 bg-[#1a1c27] hover:bg-orange-500 hover:text-white text-gray-400 rounded-lg transition-all border border-[#2d3142] hover:border-orange-400 cursor-pointer shrink-0"
                                        title="Rename Workspace"
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-[8px] h-[8px] rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,1)] animate-pulse"></div>
                                    <p className="text-[11px] text-emerald-400 font-bold tracking-[0.2em] uppercase font-['Rajdhani']">System Ready</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Switch Account Button */}
                <div className="px-1 mb-6">
                    <button 
                        onClick={onSwitch}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-br from-[#1b1d22] to-[#111216] border border-[#2a2c33] hover:border-orange-500/50 hover:bg-[#1a1c23] rounded-lg text-gray-300 hover:text-white font-bold text-[11px] tracking-widest uppercase transition-all shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] group cursor-pointer"
                    >
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Switch Account / Workspace
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-8 pr-2">
                    {!settings ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-[4px] border-orange-500 border-t-transparent rounded-full animate-spin mb-5 shadow-[0_0_15px_rgba(249,115,22,0.6)]"></div>
                            <span className="text-[12px] text-orange-500 font-black tracking-[0.25em] uppercase drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">Accessing...</span>
                        </div>
                    ) : (
                        <div className="px-1 pb-6 w-full">
                            {/* GENERAL SECTION */}
                            {renderPanelHeader('General Setting')}
                            <div className="mb-6">
                                {renderInput('Channel Alias / Name', settings.general?.channelName || '', e => setSettings({...settings, general: {...settings.general, channelName: e.target.value}}), 'Channel alias', 'channel')}
                            </div>

                            {/* BRANDING SECTION */}
                            {renderPanelHeader('Default Branding Assets')}
                            <div className="mb-6 space-y-2">
                                {renderInput('Logo / Avatar Path', settings.branding?.logo || '', e => {
                                    const val = e.target.value;
                                    setSettings({...settings, branding: {...settings.branding, logo: val}});
                                    setAvatarUrl(val);
                                    if (val) {
                                        localStorage.setItem(`mf_workspace_avatar_${activeWorkspace}`, val);
                                        window.dispatchEvent(new CustomEvent('workspace_avatar_updated', {
                                            detail: { workspaceName: activeWorkspace, avatar: val }
                                        }));
                                    }
                                }, 'PATH\\TO\\LOGO', 'logo', 'file')}
                                {renderInput('Watermark Path', settings.branding?.watermark || '', e => setSettings({...settings, branding: {...settings.branding, watermark: e.target.value}}), 'PATH\\TO\\WATERMARK', 'watermark', 'file')}
                                {renderInput('Overlay Path', settings.branding?.overlay || '', e => setSettings({...settings, branding: {...settings.branding, overlay: e.target.value}}), 'PATH\\TO\\OVERLAY', 'overlay', 'file')}
                                {renderInput('Subscribe Anim Path', settings.branding?.subscribeAnim || '', e => setSettings({...settings, branding: {...settings.branding, subscribeAnim: e.target.value}}), 'PATH\\TO\\SUBSCRIBEANIM', 'anim', 'file')}
                            </div>

                            {/* OUTPUTS SECTION */}
                            {renderPanelHeader('Output Routes')}
                            <div className="space-y-2">
                                {renderInput('Output Folder', settings.output?.main || '', e => setSettings({...settings, output: {...settings.output, main: e.target.value}}), 'PATH\\TO\\OUTPUT', 'folder', 'folder')}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-5 flex gap-3 shrink-0 z-10 bg-transparent border-t border-white/5 relative px-1">
                    <button 
                        className="px-6 justify-center bg-black/60 hover:bg-[#1a1311] border border-[#333] hover:border-orange-500/50 text-gray-400 hover:text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-xl transition-all duration-200 cursor-pointer"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        className="flex-1 bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 border border-orange-400 text-white font-black uppercase tracking-widest text-[12px] py-4 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(249,115,22,0.4)] disabled:opacity-50 cursor-pointer"
                        disabled={isSaving}
                        onClick={handleSave}
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>

            </div>
        </Drawer>
    );
}
