import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function WorkspaceSettingsModal({ workspaceName, isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('General');
    const [settings, setSettings] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        
        const loadSettings = async () => {
            try {
                const res = await fetch(`/api/v1/system/workspace/${workspaceName}/settings`);
                const data = await res.json();
                if (data.success && data.data) {
                    setSettings(data.data.data || {});
                }
            } catch (e) {
                console.error(e);
            }
        };
        loadSettings();
    }, [workspaceName, isOpen]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await fetch(`/api/v1/system/workspace/${workspaceName}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (settings?.output?.main) {
                localStorage.setItem(`mf_workspace_output_${workspaceName}`, settings.output.main);
            }
            window.dispatchEvent(new CustomEvent('workspace_settings_updated', { detail: { workspaceName, settings } }));
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;
    if (!settings) return (
        <Modal isOpen={isOpen} title="Workspace Settings" subtitle={workspaceName}>
            <div className="flex-1 flex items-center justify-center text-[#B6C2D1]">Loading settings...</div>
        </Modal>
    );

    const tabs = ['General', 'Branding', 'Output', 'Hardware Performance', 'Video Output'];

    const renderInput = (label, value, onChange, type = "text") => (
        <div>
            <label className="block text-[11px] font-semibold text-[#738091] uppercase tracking-wider mb-2">{label}</label>
            <input 
                type={type} 
                value={value} 
                onChange={onChange} 
                className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] focus:border-[#32D8FF] rounded-[8px] p-3 text-white transition-colors duration-250 outline-none" 
            />
        </div>
    );

    const renderSelect = (label, value, options, onChange) => (
        <div>
            <label className="block text-[11px] font-semibold text-[#738091] uppercase tracking-wider mb-2">{label}</label>
            <select 
                value={value} 
                onChange={onChange} 
                className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] focus:border-[#32D8FF] rounded-[8px] p-3 text-white transition-colors duration-250 outline-none appearance-none"
            >
                {options.map(opt => <option key={opt} value={opt} className="bg-[#122535]">{opt}</option>)}
            </select>
        </div>
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Workspace Settings" 
            subtitle={workspaceName}
            seed={workspaceName?.length * 20 || 42}
            footer={
                <>
                    <button onClick={onClose} className="px-6 py-2 text-[14px] font-medium text-[#B6C2D1] hover:text-white transition-colors">Cancel</button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Workspace Defaults'}
                    </Button>
                </>
            }
        >
            <div className="w-[260px] border-r border-[rgba(255,255,255,0.06)] p-4 space-y-1 bg-[rgba(0,0,0,0.1)]">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`w-full text-left px-4 py-3 rounded-[12px] text-[14px] font-medium transition-all duration-250 ${
                            activeTab === tab 
                                ? 'bg-[linear-gradient(90deg,rgba(50,216,255,0.15),transparent)] text-white border-l-2 border-[#32D8FF]' 
                                : 'text-[#738091] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#B6C2D1] border-l-2 border-transparent'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                {activeTab === 'General' && (
                    <div className="space-y-6 max-w-2xl animate-in fade-in duration-250">
                        {renderInput('Channel Name', settings.general?.channelName || '', e => setSettings({...settings, general: {...settings.general, channelName: e.target.value}}))}
                        {renderInput('Channel Thumbnail URL', settings.general?.channelThumbnail || '', e => setSettings({...settings, general: {...settings.general, channelThumbnail: e.target.value}}))}
                    </div>
                )}

                {activeTab === 'Branding' && (
                    <div className="space-y-6 max-w-2xl animate-in fade-in duration-250">
                        <p className="text-[13px] text-[#B6C2D1] mb-6">These default assets will automatically be applied to every new project in this workspace.</p>
                        {['logo', 'watermark', 'overlay', 'subscribeAnim', 'intro', 'outro', 'defaultFont'].map(field => (
                            <div key={field}>
                                <label className="block text-[11px] font-semibold text-[#738091] uppercase tracking-wider mb-2">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                                <div className="flex gap-3">
                                    <input type="text" placeholder={`Select ${field}...`} value={settings.branding?.[field] || ''} onChange={e => setSettings({...settings, branding: {...settings.branding, [field]: e.target.value}})} className="flex-1 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] focus:border-[#32D8FF] rounded-[8px] p-3 text-white transition-colors duration-250 outline-none" />
                                    <Button variant="secondary" className="!px-4">Browse</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'Output' && (
                    <div className="space-y-6 max-w-2xl animate-in fade-in duration-250">
                        <p className="text-[13px] text-[#B6C2D1] mb-6">Renders will automatically save to these locations without prompting.</p>
                        <div>
                            <label className="block text-[11px] font-semibold text-[#738091] uppercase tracking-wider mb-2">Output Folder</label>
                            <input type="text" value={settings.output?.main || ''} onChange={e => setSettings({...settings, output: {...settings.output, main: e.target.value}})} className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] focus:border-[#32D8FF] rounded-[8px] p-3 text-white font-mono text-[13px] transition-colors duration-250 outline-none" />
                        </div>
                    </div>
                )}

                {activeTab === 'Hardware Performance' && (
                    <div className="space-y-6 max-w-2xl animate-in fade-in duration-250">
                        <p className="text-[13px] text-[#B6C2D1] mb-6">Controls how aggressively MediaFactory uses the computer. Does not affect video quality.</p>
                        
                        {renderSelect('Performance Profile', settings.hardware?.profile || 'Balanced', ['Eco', 'Balanced', 'High Performance', 'Maximum Performance', 'Custom'], e => setSettings({...settings, hardware: {...settings.hardware, profile: e.target.value}}))}

                        {settings.hardware?.profile === 'Custom' && (
                            <div className="grid grid-cols-2 gap-6 p-6 border border-[rgba(255,255,255,0.06)] rounded-[12px] bg-[rgba(0,0,0,0.2)]">
                                {renderInput('CPU Limit (%)', '80', () => {}, 'number')}
                                {renderInput('RAM Limit (GB)', '16', () => {}, 'number')}
                                {renderInput('Threads', '8', () => {}, 'number')}
                            </div>
                        )}

                        {renderSelect('Preferred Encoder', settings.hardware?.preferredEncoder || 'Auto', ['Auto', 'CPU (libx264)', 'NVIDIA (nvenc)', 'Intel (qsv)', 'AMD (amf)'], e => setSettings({...settings, hardware: {...settings.hardware, preferredEncoder: e.target.value}}))}
                    </div>
                )}

                {activeTab === 'Video Output' && (
                    <div className="space-y-6 max-w-2xl animate-in fade-in duration-250">
                        <p className="text-[13px] text-[#B6C2D1] mb-6">Controls the final exported video quality independent of hardware performance.</p>
                        
                        <div className="grid grid-cols-2 gap-6">
                            {renderSelect('Resolution', settings.videoOutput?.resolution || '1080p', ['720p', '1080p', '1440p', '2160p', 'Custom'], e => setSettings({...settings, videoOutput: {...settings.videoOutput, resolution: e.target.value}}))}
                            {renderSelect('FPS', settings.videoOutput?.fps || 30, ['24', '30', '50', '60'], e => setSettings({...settings, videoOutput: {...settings.videoOutput, fps: parseInt(e.target.value)}}))}
                            {renderSelect('Codec', settings.videoOutput?.codec || 'H264', ['H264', 'H265', 'AV1'], e => setSettings({...settings, videoOutput: {...settings.videoOutput, codec: e.target.value}}))}
                            {renderSelect('Pixel Format', settings.videoOutput?.pixelFormat || 'YUV420P', ['YUV420P', 'YUV422P', 'YUV444P'], e => setSettings({...settings, videoOutput: {...settings.videoOutput, pixelFormat: e.target.value}}))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
