import React from 'react';
import { useM3Panel } from '../../../hooks/useM3Panel';
import { ThumbnailCard } from '../../ui/Thumbnails';
import { m2WorkspaceContext } from '../../../services/m2/WorkspaceContext';
import { getApiUrl } from '../../../utils/apiUrl';

export default function BrandingPanel({ addObject }) {
    const { initialized, loading, error, settings, markDirty, saveSettings } = useM3Panel('Branding');

    if (!initialized || loading) return <div className="p-4 text-gray-400 text-xs text-center flex-1">Loading Branding Settings...</div>;

    const formatLocalPath = (path) => {
        if (!path) return path;
        if (path.startsWith('http') || path.startsWith('file:///')) return path;
        // Convert Windows backslashes and prepend file:///
        return `file:///${path.replace(/\\/g, '/')}`;
    };

    const handleSelect = async (name, props) => {
        let overrideProps = { ...props };
        const workspaceId = m2WorkspaceContext.getWorkspaceId();
        
        if (workspaceId && workspaceId !== 'default') {
            try {
                const res = await fetch(getApiUrl(`/api/v1/system/workspace/${workspaceId}/settings`));
                const data = await res.json();
                if (data.success && data.data && data.data.data) {
                    const branding = data.data.data.branding;
                    if (branding) {
                        if (name === 'Logo' && branding.logo) overrideProps.source = formatLocalPath(branding.logo);
                        else if (name === 'Watermark' && branding.watermark) overrideProps.source = formatLocalPath(branding.watermark);
                        else if (name === 'Subscribe Animation' && branding.subscribeAnim) overrideProps.source = formatLocalPath(branding.subscribeAnim);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch workspace branding", e);
            }
        }

        const newSettings = { ...settings, activeBranding: [...(settings.activeBranding || []), name] };
        markDirty(newSettings);
        saveSettings(newSettings);
        if (overrideProps) addObject(overrideProps);
    };

    return (
        <div className="space-y-4">
            {error && <div className="bg-red-900/40 border border-red-500 text-red-400 p-2 rounded text-[10px]">{error.message}</div>}

            <div className="space-y-3">
                <ThumbnailCard color="pink" title="Logo" icon="🛡️" onClick={() => handleSelect('Logo', { type: 'image', name: 'Brand Logo', x: '85%', y: '85%', width: '15%', height: '15%', opacity: 100 })} />
                <ThumbnailCard color="pink" title="Watermark" icon="💧" onClick={() => handleSelect('Watermark', { type: 'image', name: 'Watermark', x: '90%', y: '90%', width: '10%', height: '10%', opacity: 50 })} />
                <ThumbnailCard color="pink" title="Intro Sequence" icon="🎬" onClick={() => handleSelect('Intro', { type: 'video', name: 'Intro Sequence', x: '50%', y: '50%', width: '100%', height: '100%' })} />
                <ThumbnailCard color="pink" title="Outro Sequence" icon="🔚" onClick={() => handleSelect('Outro', { type: 'video', name: 'Outro Sequence', x: '50%', y: '50%', width: '100%', height: '100%' })} />
                <ThumbnailCard color="pink" title="Subscribe Animation" icon="🔔" onClick={() => handleSelect('Subscribe Animation', { type: 'social-widget', widgetType: 'subscribe', name: 'Subscribe Animation', x: '50%', y: '85%', width: '30%', height: '15%' })} />
            </div>
        </div>
    );
}
