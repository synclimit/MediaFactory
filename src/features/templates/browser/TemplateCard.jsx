import React from 'react';

export default function TemplateCard({ template, isSelected, onClick }) {
    const { name, description, metadata } = template;
    const author = metadata?.author || 'Unknown';
    const category = metadata?.category || 'General';
    const version = metadata?.version || '1.0.0';
    
    // standardized preview format { type, location }
    const previewType = template.preview?.type;
    const previewLocation = template.preview?.location;

    return (
        <div 
            onClick={onClick}
            className={`flex flex-col bg-[#12141c] border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-[#3f4556] ${
                isSelected ? 'border-fuchsia-500 ring-1 ring-fuchsia-500/50' : 'border-[#21232d]'
            }`}
        >
            <div className="h-32 bg-[#1a1d27] border-b border-[#21232d] flex items-center justify-center relative overflow-hidden">
                {previewType === 'image' && previewLocation ? (
                    <img src={previewLocation} alt={`${name} preview`} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                    <span className="text-gray-600 text-xs font-medium">No Preview</span>
                )}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-gray-300">
                    {category}
                </div>
            </div>
            
            <div className="p-3 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-gray-200 truncate mb-1" title={name}>{name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{description || 'No description available.'}</p>
                
                <div className="flex items-center justify-between text-[10px] text-gray-500 mt-auto pt-2 border-t border-[#2d313d]">
                    <span className="truncate max-w-[100px]" title={author}>By {author}</span>
                    <span>v{version}</span>
                </div>
            </div>
        </div>
    );
}
