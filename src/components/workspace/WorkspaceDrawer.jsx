import React, { useState, useEffect } from 'react';
import Drawer from '../ui/Drawer';
import Avatar from '../ui/Avatar';
import { Edit2, Check, X, Camera, Image as ImageIcon, Wand2 } from 'lucide-react';
import { getApiUrl } from '../../utils/apiUrl';
import ImageProcessorModal from './ImageProcessorModal';

export default function WorkspaceDrawer({ activeWorkspace, isOpen, onClose, onSwitch, onRename }) {
    const [settings, setSettings] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Rename state
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState('');
    const [renameError, setRenameError] = useState('');
    const [isRenamingLoading, setIsRenamingLoading] = useState(false);

    // Image Processor Modal State
    const [editorModal, setEditorModal] = useState({
        isOpen: false,
        imageSrc: null,
        assetType: 'logo',
        fileName: 'asset.png'
    });

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

    // Convert any image file to clean PNG DataURL
    const convertFileToPngDataUrl = (file) => {
        return new Promise((resolve) => {
            const isVid = file.type?.startsWith('video/') || file.name?.match(/\.(mp4|webm|mov|mkv)$/i);
            const reader = new FileReader();
            reader.onload = (e) => {
                const rawDataUrl = e.target?.result;
                if (isVid || !rawDataUrl) {
                    return resolve({ dataUrl: rawDataUrl, fileName: file.name });
                }
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const pngDataUrl = canvas.toDataURL('image/png');
                    const baseName = file.name.replace(/\.[^/.]+$/, "");
                    resolve({ dataUrl: pngDataUrl, fileName: `${baseName}.png` });
                };
                img.onerror = () => resolve({ dataUrl: rawDataUrl, fileName: file.name });
                img.src = rawDataUrl;
            };
            reader.readAsDataURL(file);
        });
    };

    // Handle Upload / Change Workspace Avatar
    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { dataUrl } = await convertFileToPngDataUrl(file);
            if (dataUrl) {
                setAvatarUrl(dataUrl);
                localStorage.setItem(`mf_workspace_avatar_${activeWorkspace}`, dataUrl);
                
                // Update settings
                setSettings(prev => {
                    const updated = {
                        ...(prev || {}),
                        general: { ...(prev?.general || {}), channelThumbnail: dataUrl },
                        branding: { ...(prev?.branding || {}), logo: dataUrl }
                    };
                    return updated;
                });

                window.dispatchEvent(new CustomEvent('workspace_avatar_updated', {
                    detail: { workspaceName: activeWorkspace, avatar: dataUrl }
                }));

                // Auto save avatar to backend
                try {
                    await fetch(getApiUrl(`/api/v1/system/workspace/${encodeURIComponent(activeWorkspace)}/settings`), {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...(settings || {}),
                            general: { ...(settings?.general || {}), channelThumbnail: dataUrl },
                            branding: { ...(settings?.branding || {}), logo: dataUrl }
                        })
                    });
                } catch(err) {}
            }
        } catch(err) {
            console.error('Avatar conversion failed:', err);
        }
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

    const [uploadingType, setUploadingType] = useState(null);

    const saveBrandingAssetData = async (type, base64Data, filename) => {
        if (!base64Data || !activeWorkspace) return;
        setUploadingType(type);

        try {
            const res = await fetch(getApiUrl(`/api/v1/system/workspace/${encodeURIComponent(activeWorkspace)}/upload-branding`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    filename: filename || `${type}.png`,
                    base64Data
                })
            });
            const data = await res.json();
            if (data.success && data.filePath) {
                const savedPath = data.filePath;
                setSettings(prev => ({
                    ...(prev || {}),
                    branding: { ...(prev?.branding || {}), [type]: savedPath }
                }));

                if (type === 'logo') {
                    setAvatarUrl(savedPath);
                    localStorage.setItem(`mf_workspace_avatar_${activeWorkspace}`, savedPath);
                    window.dispatchEvent(new CustomEvent('workspace_avatar_updated', {
                        detail: { workspaceName: activeWorkspace, avatar: savedPath }
                    }));
                }
            } else {
                setSettings(prev => ({
                    ...(prev || {}),
                    branding: { ...(prev?.branding || {}), [type]: base64Data }
                }));
            }
        } catch (err) {
            console.warn('[WorkspaceDrawer] Upload fallback:', err);
            setSettings(prev => ({
                ...(prev || {}),
                branding: { ...(prev?.branding || {}), [type]: base64Data }
            }));
        } finally {
            setUploadingType(null);
        }
    };

    const handleAssetFileUpload = async (type, file) => {
        if (!file || !activeWorkspace) return;
        setUploadingType(type);

        try {
            const { dataUrl, fileName } = await convertFileToPngDataUrl(file);
            if (dataUrl) {
                await saveBrandingAssetData(type, dataUrl, fileName);
            }
        } catch (err) {
            console.error('[WorkspaceDrawer] Asset upload conversion error:', err);
        } finally {
            setUploadingType(null);
        }
    };

    const getCleanFileName = (val, defaultName) => {
        if (!val) return '';
        if (typeof val === 'string' && val.startsWith('data:')) {
            return `${defaultName} (Uploaded File)`;
        }
        const parts = val.replace(/\\/g, '/').split('/');
        return parts[parts.length - 1] || defaultName;
    };

    const getPreviewUrl = (val) => {
        if (!val) return null;
        if (val.startsWith('data:') || val.startsWith('blob:') || val.startsWith('http')) return val;
        return getApiUrl(`/api/v1/system/file-view?path=${encodeURIComponent(val)}`);
    };

    const defaultPositions = {
        logo: 'bottom-right',
        watermark: 'top-left',
        overlay: 'bottom-left',
        subscribeAnim: 'bottom-center'
    };

    const objectMeta = {
        logo: { name: 'Logo / Avatar', short: 'LOGO', icon: '🏷️', posKey: 'logoPosition', color: 'from-amber-500 via-orange-500 to-orange-600', border: 'border-orange-300' },
        watermark: { name: 'Watermark', short: 'WM', icon: '💧', posKey: 'watermarkPosition', color: 'from-cyan-500 via-sky-500 to-blue-600', border: 'border-cyan-300' },
        overlay: { name: 'Overlay Frame', short: 'OVERLAY', icon: '🖼️', posKey: 'overlayPosition', color: 'from-purple-500 via-fuchsia-500 to-indigo-600', border: 'border-purple-300' },
        subscribeAnim: { name: 'Subscribe Anim', short: 'SUBSCRIBE', icon: '🔔', posKey: 'subscribeAnimPosition', color: 'from-rose-500 via-red-500 to-pink-600', border: 'border-rose-300' }
    };

    const gridPositions = [
        { id: 'top-left', label: 'Kiri Atas' },
        { id: 'top-center', label: 'Tengah Atas' },
        { id: 'top-right', label: 'Kanan Atas' },
        { id: 'middle-left', label: 'Tengah Kiri' },
        { id: 'center', label: 'Tengah Layar' },
        { id: 'middle-right', label: 'Tengah Kanan' },
        { id: 'bottom-left', label: 'Kiri Bawah' },
        { id: 'bottom-center', label: 'Tengah Bawah' },
        { id: 'bottom-right', label: 'Kanan Bawah' },
    ];

    const getPositionLabel = (posId) => {
        const found = gridPositions.find(p => p.id === posId);
        return found ? found.label : 'Kanan Bawah';
    };

    const renderAssetUploadCard = (label, type, accept, value, formats = "PNG, JPG, WEBP") => {
        const hasValue = Boolean(value);
        const isVideo = type === 'subscribeAnim' || (value && (value.includes('.mp4') || value.includes('.webm') || value.includes('.mov')));
        const previewUrl = getPreviewUrl(value);
        const fileName = getCleanFileName(value, label);
        const isCurrentUploading = uploadingType === type;
        const fileInputId = `asset-upload-input-${type}`;
        const currentPosition = settings.branding?.[`${type}Position`] || defaultPositions[type] || 'bottom-right';

        return (
            <div className="mb-3.5 p-3.5 rounded-xl bg-[#111218] border border-[#2d3142] hover:border-orange-500/40 transition-all">
                <input 
                    type="file" 
                    id={fileInputId} 
                    accept={accept} 
                    className="hidden" 
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAssetFileUpload(type, file);
                        e.target.value = '';
                    }} 
                />

                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        <span className="text-gray-300 font-black text-[12px] uppercase tracking-wider font-['Rajdhani']">{label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{formats}</span>
                </div>

                {hasValue ? (
                    <div className="flex items-center gap-3 bg-[#181a24] border border-white/5 rounded-lg p-2.5">
                        {/* Thumbnail / Video badge */}
                        <div className="w-12 h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative">
                            {isVideo ? (
                                <div className="flex flex-col items-center justify-center text-orange-500">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    </svg>
                                </div>
                            ) : (
                                <img 
                                    src={previewUrl} 
                                    alt={label} 
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-[12px] font-bold truncate font-mono" title={fileName}>
                                {fileName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
                                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Asset Saved in App</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {!isVideo && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setEditorModal({
                                            isOpen: true,
                                            imageSrc: previewUrl,
                                            assetType: type,
                                            fileName: fileName || `${type}.png`
                                        });
                                    }}
                                    className="px-2.5 py-1.5 rounded-md bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border border-orange-500/30 flex items-center gap-1 shadow-[0_0_8px_rgba(249,115,22,0.2)]"
                                    title="Hapus Background / Edit PNG"
                                >
                                    <Wand2 className="w-3.5 h-3.5" />
                                    <span>Edit BG</span>
                                </button>
                            )}
                            <button 
                                type="button"
                                onClick={() => document.getElementById(fileInputId)?.click()}
                                disabled={isCurrentUploading}
                                className="px-3 py-1.5 rounded-md bg-[#252836] hover:bg-orange-600 hover:text-white text-gray-300 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border border-white/10"
                            >
                                {isCurrentUploading ? 'Uploading...' : 'Ganti'}
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    setSettings(prev => ({
                                        ...(prev || {}),
                                        branding: { ...(prev?.branding || {}), [type]: '' }
                                    }));
                                    if (type === 'logo') {
                                        setAvatarUrl('');
                                        localStorage.removeItem(`mf_workspace_avatar_${activeWorkspace}`);
                                        window.dispatchEvent(new CustomEvent('workspace_avatar_updated', {
                                            detail: { workspaceName: activeWorkspace, avatar: '' }
                                        }));
                                    }
                                }}
                                className="p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer border border-red-500/20"
                                title="Hapus Asset"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div 
                        onClick={() => document.getElementById(fileInputId)?.click()}
                        className="group flex flex-col items-center justify-center p-4 border border-dashed border-gray-700 hover:border-orange-500/70 bg-[#161822]/60 hover:bg-orange-500/5 rounded-lg transition-all cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 group-hover:bg-orange-500/20 flex items-center justify-center text-orange-500 mb-1.5 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <span className="text-gray-300 group-hover:text-orange-400 font-bold text-[11px] uppercase tracking-wider transition-colors">
                            {isCurrentUploading ? 'Mengunggah file...' : `+ Upload ${label}`}
                        </span>
                        <span className="text-gray-500 text-[10px] mt-0.5">Klik untuk memilih file dari komputer</span>
                    </div>
                )}

                {/* Luxury Cyber Viewport 16:9 Object Stage */}
                <div className="mt-3.5 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.9)] animate-pulse"></span>
                            <span className="text-[11px] font-black text-gray-300 font-['Rajdhani'] uppercase tracking-widest">
                                Layar 16:9 • Penempatan Objek
                            </span>
                        </div>
                        <div className="px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_8px_rgba(249,115,22,0.2)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
                            <span>{getPositionLabel(currentPosition)}</span>
                        </div>
                    </div>

                    {/* 16:9 Simulated Studio Viewport Display */}
                    <div className="relative w-full aspect-[16/6.8] bg-gradient-to-b from-[#0d0f16] via-[#08090d] to-[#040508] border border-[#2b3044] rounded-xl p-2 shadow-[inset_0_2px_10px_rgba(0,0,0,0.9),0_2px_12px_rgba(0,0,0,0.5)] overflow-hidden">
                        
                        {/* Viewport Crosshair & Grid Lines */}
                        <div className="absolute inset-0 pointer-events-none opacity-20">
                            <div className="w-full h-full border border-dashed border-white/30 m-auto"></div>
                            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
                        </div>

                        {/* Corner HUD Ticks */}
                        <span className="absolute top-1 left-2 text-[8px] font-mono text-gray-600 select-none">⌜ 16:9 LIVE</span>
                        <span className="absolute top-1 right-2 text-[8px] font-mono text-gray-600 select-none">⌝</span>
                        <span className="absolute bottom-1 left-2 text-[8px] font-mono text-gray-600 select-none">⌞</span>
                        <span className="absolute bottom-1 right-2 text-[8px] font-mono text-gray-600 select-none">⌟</span>

                        {/* 3x3 Stage Matrix */}
                        <div className="relative z-10 w-full h-full grid grid-cols-3 grid-rows-3 gap-1.5">
                            {gridPositions.map(pos => {
                                const isCurrent = currentPosition === pos.id;
                                
                                // Check if another object is occupying this slot
                                const occupiedObj = Object.entries(objectMeta).find(
                                    ([t, info]) => t !== type && (settings.branding?.[info.posKey] || defaultPositions[t]) === pos.id
                                );

                                if (isCurrent) {
                                    // Active Object Glowing Pill
                                    const meta = objectMeta[type];
                                    return (
                                        <div
                                            key={pos.id}
                                            className={`relative rounded-lg bg-gradient-to-br ${meta.color} border ${meta.border} text-white shadow-[0_0_15px_rgba(249,115,22,0.9),inset_0_1px_2px_rgba(255,255,255,0.7)] flex items-center justify-center gap-1 px-1 font-mono font-black text-[9px] uppercase tracking-wider scale-105 z-20`}
                                        >
                                            <span className="text-[10px]">{meta.icon}</span>
                                            <span className="truncate">{meta.short}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
                                        </div>
                                    );
                                }

                                if (occupiedObj) {
                                    // Occupied by another branding asset -> Show that asset badge with swap interaction
                                    const [occType, occMeta] = occupiedObj;
                                    return (
                                        <button
                                            key={pos.id}
                                            type="button"
                                            onClick={() => {
                                                // Swap positions seamlessly
                                                setSettings(prev => ({
                                                    ...(prev || {}),
                                                    branding: {
                                                        ...(prev?.branding || {}),
                                                        [occMeta.posKey]: currentPosition,
                                                        [`${type}Position`]: pos.id
                                                    }
                                                }));
                                            }}
                                            title={`Posisi ditempati oleh ${occMeta.name}. Klik untuk menukar posisi!`}
                                            className="group/occ relative rounded-lg bg-[#141622]/85 hover:bg-[#212538] border border-white/10 hover:border-orange-500/40 flex items-center justify-center gap-1 px-1 transition-all cursor-pointer"
                                        >
                                            <span className="text-[9px] opacity-70 group-hover/occ:opacity-100">{occMeta.icon}</span>
                                            <span className="text-gray-400 group-hover/occ:text-gray-200 font-mono text-[8px] font-bold truncate">
                                                {occMeta.short}
                                            </span>
                                            <span className="text-[7px] text-gray-500 group-hover/occ:text-orange-400 font-mono">⇄</span>
                                        </button>
                                    );
                                }

                                // Empty Slot -> Minimalist Target Dot (No Numbers!)
                                return (
                                    <button
                                        key={pos.id}
                                        type="button"
                                        onClick={() => {
                                            setSettings(prev => ({
                                                ...(prev || {}),
                                                branding: {
                                                    ...(prev?.branding || {}),
                                                    [`${type}Position`]: pos.id
                                                }
                                            }));
                                        }}
                                        title={`Tempatkan ${objectMeta[type].name} di sini`}
                                        className="group/slot relative rounded-lg bg-[#12141c]/50 hover:bg-orange-500/15 border border-dashed border-white/5 hover:border-orange-500/60 flex items-center justify-center transition-all cursor-pointer"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover/slot:bg-orange-400 transition-colors shadow-sm" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
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
                                {renderAssetUploadCard('Logo / Avatar', 'logo', 'image/*', settings.branding?.logo, 'PNG, JPG, WEBP')}
                                {renderAssetUploadCard('Watermark', 'watermark', 'image/*', settings.branding?.watermark, 'PNG, JPG, WEBP')}
                                {renderAssetUploadCard('Overlay Frame', 'overlay', 'image/*', settings.branding?.overlay, 'PNG, JPG, WEBP')}
                                {renderAssetUploadCard('Subscribe Animation', 'subscribeAnim', 'video/*,image/*', settings.branding?.subscribeAnim, 'MP4, WEBM, MOV')}
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

            {/* Background Remover & PNG Converter Modal */}
            <ImageProcessorModal 
                isOpen={editorModal.isOpen}
                onClose={() => setEditorModal(prev => ({ ...prev, isOpen: false }))}
                imageSrc={editorModal.imageSrc}
                assetType={editorModal.assetType}
                onSave={(processedPngDataUrl) => {
                    const cleanName = editorModal.fileName?.replace(/\.[^/.]+$/, "") || editorModal.assetType;
                    saveBrandingAssetData(editorModal.assetType, processedPngDataUrl, `${cleanName}_nobg.png`);
                }}
            />
        </Drawer>
    );
}
