import React, { useState, useEffect } from 'react';
import Drawer from '../ui/Drawer';
import Avatar from '../ui/Avatar';
import Status from '../ui/Status';
import Button from '../ui/Button';

export default function WorkspaceDrawer({ activeWorkspace, isOpen, onClose, onSwitch }) {
    const [settings, setSettings] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen || !activeWorkspace) return;
        
        const loadSettings = async () => {
            try {
                const res = await fetch(`/api/v1/system/workspace/${activeWorkspace}/settings`);
                const data = await res.json();
                if (data.success && data.data) {
                    setSettings(data.data.data || {});
                }
            } catch (e) {
                console.error(e);
            }
        };
        loadSettings();
    }, [activeWorkspace, isOpen]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await fetch(`/api/v1/system/workspace/${activeWorkspace}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (settings?.output?.main) {
                localStorage.setItem(`mf_workspace_output_${activeWorkspace}`, settings.output.main);
            }
            window.dispatchEvent(new CustomEvent('workspace_settings_updated', { detail: { activeWorkspace, settings } }));
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileBrowse = async (isFolder, callback) => {
        try {
            const endpoint = isFolder ? '/api/v1/m5/dialog/folder' : '/api/v1/m5/dialog/file';
            const res = await fetch(endpoint, { method: 'POST' });
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

    // Using M1 Header Style
    const renderPanelHeader = (title) => (
        <div className="mb-4 mt-6 px-1">
            <h2 className="text-white font-black text-[16px] tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] uppercase">
                {title}
            </h2>
        </div>
    );

    // Using exact M1 input styles - Scaled up for better legibility
    const renderInput = (label, value, onChange, placeholder = "", iconType = null, browseType = null) => (
        <div className="mb-5 px-1">
            <label className="block text-gray-400 font-bold text-[12px] mb-2 uppercase tracking-widest">{label}</label>
            <div className="flex gap-2 items-center w-full">
                <div className="flex-1 min-w-0 flex items-center bg-gradient-to-br from-[#1a1c23] to-[#111216] border border-[#333] focus-within:border-orange-500/80 rounded-lg p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_0_10px_rgba(249,115,22,0.1)] transition-colors h-[42px]">
                    {iconType && (
                        <div className="pl-3 pr-2 shrink-0 flex items-center justify-center opacity-60">
                            {renderIcon(iconType)}
                        </div>
                    )}
                    <input 
                        type="text" 
                        placeholder={placeholder}
                        value={value} 
                        onChange={onChange} 
                        className="flex-1 w-full bg-transparent text-white font-mono font-bold text-[13px] outline-none px-2 placeholder-[#444]" 
                    />
                </div>
                
                {browseType && (
                    <button 
                        className="px-4 h-[42px] shrink-0 bg-black/60 border border-[#333] hover:border-orange-500/50 hover:text-white text-gray-400 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-200"
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
                
                {/* Decorative Tech Lines */}
                <div className="absolute left-4 top-1/4 w-[1px] h-16 bg-white/10"></div>
                <div className="absolute left-4 bottom-1/4 w-[1px] h-16 bg-white/10"></div>
            </div>

            {/* Content Wrap - Maximize width with px-4 */}
            <div className="relative z-10 flex flex-col h-full px-4 py-8">
                {/* Header section */}
                <div className="flex items-center gap-4 mb-4 px-1">
                    <div className="relative shrink-0 w-[60px] h-[60px] rounded-[14px] flex items-center justify-center border-2 bg-gradient-to-br from-orange-600 to-orange-500 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)]">
                        <span className="font-black text-white text-[22px] tracking-tighter drop-shadow-md">
                            {activeWorkspace ? activeWorkspace.substring(0, 2).toUpperCase() : 'MF'}
                        </span>
                    </div>
                    <div className="min-w-0 flex-1 z-10">
                        <h2 className="text-[28px] leading-tight font-black text-white tracking-[0.02em] mb-0 break-words uppercase drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]">
                            {activeWorkspace || 'No Workspace'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-[8px] h-[8px] rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,1)]"></div>
                            <p className="text-[11px] text-emerald-400 font-bold tracking-[0.2em] uppercase">System Ready</p>
                        </div>
                    </div>
                </div>

                {/* Switch Account Button */}
                <div className="px-1 mb-6">
                    <button 
                        onClick={onSwitch}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-br from-[#1b1d22] to-[#111216] border border-[#2a2c33] hover:border-orange-500/50 hover:bg-[#1a1c23] rounded-lg text-gray-300 hover:text-white font-bold text-[11px] tracking-widest uppercase transition-all shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] group"
                    >
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Switch Account
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
                                {renderInput('Channel Alias', settings.general?.channelName || '', e => setSettings({...settings, general: {...settings.general, channelName: e.target.value}}), 'Channel alias', 'channel')}
                            </div>

                            {/* BRANDING SECTION */}
                            {renderPanelHeader('Default Assets')}
                            <div className="mb-6 space-y-2">
                                {renderInput('Logo Path', settings.branding?.logo || '', e => setSettings({...settings, branding: {...settings.branding, logo: e.target.value}}), 'PATH\\TO\\LOGO', 'logo', 'file')}
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
                        className="px-6 justify-center bg-black/60 hover:bg-[#1a1311] border border-[#333] hover:border-orange-500/50 text-gray-400 hover:text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-xl transition-all duration-200"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        className="flex-1 justify-center bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 border border-orange-400 text-white font-black uppercase tracking-widest text-[12px] py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.5),inset_0_1px_2px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSave} 
                        disabled={isSaving || !settings}
                    >
                        {isSaving ? 'Deploying...' : 'Save Config'}
                    </button>
                </div>
            </div>
        </Drawer>
    );
}
