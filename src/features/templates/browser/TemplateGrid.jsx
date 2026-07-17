import React from 'react';
import TemplateCard from './TemplateCard';

export default function TemplateGrid({ state, controller }) {
    if (state.loading && state.templates.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#0b0c10]">
                <span className="text-sm text-gray-500">Loading templates...</span>
            </div>
        );
    }

    if (state.templates.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#0b0c10]">
                <span className="text-sm text-gray-500">No templates found.</span>
            </div>
        );
    }

    const totalPages = Math.ceil(state.total / state.limit);

    return (
        <div className="flex-1 flex flex-col bg-[#0b0c10] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {state.templates.map(template => (
                        <TemplateCard 
                            key={template.id} 
                            template={template} 
                            isSelected={state.selectedTemplate?.id === template.id}
                            onClick={() => controller.selectTemplate(template)}
                        />
                    ))}
                </div>
            </div>
            
            {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-[#21232d] bg-[#0f111a]">
                    <div className="text-xs text-gray-500">
                        Showing {(state.page - 1) * state.limit + 1} to {Math.min(state.page * state.limit, state.total)} of {state.total} templates
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={state.page <= 1}
                            onClick={() => controller.setPage(state.page - 1)}
                            className="px-2 py-1 bg-[#1e2230] hover:bg-[#2d313d] text-xs font-medium text-gray-300 border border-[#2d313d] rounded transition-colors disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-xs text-gray-400">Page {state.page} of {totalPages}</span>
                        <button 
                            disabled={state.page >= totalPages}
                            onClick={() => controller.setPage(state.page + 1)}
                            className="px-2 py-1 bg-[#1e2230] hover:bg-[#2d313d] text-xs font-medium text-gray-300 border border-[#2d313d] rounded transition-colors disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
