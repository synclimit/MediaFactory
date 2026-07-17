import React, { useState } from 'react';
import { X, CheckCircle, Trash2 } from 'lucide-react';

export default function PreviewPanel({ state, controller }) {
    const [applying, setApplying] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const template = state.selectedTemplate;
    if (!template) return null;

    const { name, description, metadata, preview } = template;
    const author = metadata?.author || 'Unknown';
    const version = metadata?.version || '1.0.0';
    const category = metadata?.category || 'General';
    const tags = metadata?.tags || [];
    const createdAt = new Date(metadata?.createdAt || Date.now()).toLocaleDateString();
    
    const previewType = preview?.type;
    const previewLocation = preview?.location;

    const handleApply = async () => {
        setApplying(true);
        const success = await controller.applySelected();
        setApplying(false);
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return;
        setDeleting(true);
        await controller.deleteSelected();
        setDeleting(false);
    };

    return (
        <div className="flex flex-col h-full bg-[#0f111a] overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-[#21232d] bg-[#12141c]">
                <h2 className="text-sm font-bold text-gray-200">Template Details</h2>
                <button 
                    onClick={() => controller.clearSelection()}
                    className="p-1 text-gray-500 hover:text-gray-300 hover:bg-[#2d313d] rounded transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="aspect-video bg-[#1a1d27] border border-[#21232d] rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {previewType === 'image' && previewLocation ? (
                        <img src={previewLocation} alt={`${name} preview`} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-gray-600 text-xs font-medium">No Preview Available</span>
                    )}
                </div>

                <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-200 mb-1">{name}</h3>
                    <div className="text-xs text-fuchsia-400 font-medium mb-2">{category}</div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        {description || 'No description provided for this template.'}
                    </p>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-xs border-b border-[#21232d] pb-2">
                        <span className="text-gray-500">Author</span>
                        <span className="text-gray-300 font-medium">{author}</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-[#21232d] pb-2">
                        <span className="text-gray-500">Version</span>
                        <span className="text-gray-300 font-medium">v{version}</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-[#21232d] pb-2">
                        <span className="text-gray-500">Created Date</span>
                        <span className="text-gray-300 font-medium">{createdAt}</span>
                    </div>
                    {tags && tags.length > 0 && (
                        <div>
                            <span className="text-xs text-gray-500 block mb-2">Tags</span>
                            <div className="flex flex-wrap gap-1.5">
                                {tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-[#1e2230] border border-[#2d313d] rounded text-[10px] text-gray-400">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-[#21232d] bg-[#12141c] flex gap-2">
                <button 
                    onClick={handleApply}
                    disabled={applying}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm font-bold rounded transition-colors disabled:opacity-50"
                >
                    <CheckCircle className={`w-4 h-4 ${applying ? 'animate-pulse' : ''}`} />
                    {applying ? 'Applying...' : 'Apply Template'}
                </button>
                <button 
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center justify-center p-2 bg-[#1e2230] hover:bg-red-900/40 text-gray-400 hover:text-red-400 border border-[#2d313d] hover:border-red-900/50 rounded transition-colors disabled:opacity-50"
                    title="Delete Template"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
