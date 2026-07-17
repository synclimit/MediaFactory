import React from 'react';
import { Search, RefreshCw, Filter } from 'lucide-react';

export default function TemplateToolbar({ state, controller }) {
    const handleSearch = (e) => {
        controller.setSearch(e.target.value);
    };

    const handleSortChange = (e) => {
        controller.setSort(e.target.value);
    };

    return (
        <div className="flex items-center justify-between p-3 border-b border-[#21232d] bg-[#0f111a]">
            <div className="flex items-center gap-3 flex-1">
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-1.5 w-4 h-4 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search templates..." 
                        value={state.search}
                        onChange={handleSearch}
                        className="w-full bg-[#1e2230] border border-[#2d313d] rounded-md pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select 
                        value={state.sort}
                        onChange={handleSortChange}
                        className="bg-[#1e2230] border border-[#2d313d] rounded-md px-2 py-1.5 text-xs text-white focus:outline-none"
                    >
                        <option value="-createdAt">Newest First</option>
                        <option value="createdAt">Oldest First</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="-name">Name (Z-A)</option>
                    </select>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => controller.refresh()}
                    disabled={state.loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e2230] hover:bg-[#2d313d] text-xs font-medium text-gray-300 border border-[#2d313d] rounded-md transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${state.loading ? 'animate-spin text-fuchsia-400' : ''}`} />
                    Refresh
                </button>
            </div>
        </div>
    );
}
