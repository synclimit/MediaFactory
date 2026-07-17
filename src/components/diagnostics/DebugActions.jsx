import React, { useState, useEffect, useRef } from 'react';

export default function DebugActions({ onRefreshState, stateData }) {
    const [actionStatus, setActionStatus] = useState(null);

    const callApi = async (action) => {
        try {
            const res = await fetch('/api/v1/diagnostics/test-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            setActionStatus(data.message || 'Action executed.');
            setTimeout(() => setActionStatus(null), 3000);
            if (onRefreshState) onRefreshState();
        } catch (e) {
            setActionStatus('Error: ' + e.message);
            setTimeout(() => setActionStatus(null), 3000);
        }
    };

    const handleCopyReport = async () => {
        try {
            const res = await fetch('/api/v1/diagnostics/report');
            const data = await res.json();
            await navigator.clipboard.writeText(data.data);
            setActionStatus('Markdown Report copied to clipboard!');
            setTimeout(() => setActionStatus(null), 3000);
        } catch (e) {
            setActionStatus('Failed to copy report: ' + e.message);
        }
    };

    const handleExportZip = () => {
        window.location.href = '/api/v1/diagnostics/export';
    };

    const copyJSON = async (obj) => {
        await navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
        setActionStatus('JSON Copied!');
        setTimeout(() => setActionStatus(null), 3000);
    };

    return (
        <div className="bg-[#0f1115] p-4 rounded-lg border border-gray-800 space-y-4">
            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] border-b border-gray-800 pb-2">Diagnostic Actions</h3>
            
            {actionStatus && (
                <div className="bg-emerald-900/40 text-emerald-400 border border-emerald-800 p-2 rounded text-xs font-mono">
                    {actionStatus}
                </div>
            )}

            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={handleCopyReport}
                    className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <span>📋</span> COPY AI REPORT
                </button>
                
                <button 
                    onClick={handleExportZip}
                    className="col-span-2 bg-[#2d3247] hover:bg-[#3b415c] text-white font-bold py-2 px-4 rounded text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <span>📦</span> EXPORT CRASH PACKAGE
                </button>
            </div>

            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] border-b border-gray-800 pb-2 mt-4 pt-4">Direct Inspection</h3>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => copyJSON(stateData?.pipelineTree)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded text-xs">Copy Pipeline Tree</button>
                <button onClick={() => copyJSON(stateData?.events)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded text-xs">Copy Events</button>
                <button onClick={() => copyJSON(stateData?.system)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded text-xs">Copy System Info</button>
                <button onClick={() => copyJSON(stateData?.sql)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded text-xs">Copy SQL History</button>
            </div>

            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] border-b border-gray-800 pb-2 mt-4 pt-4">Tests & Simulation</h3>
            <div className="grid grid-cols-1 gap-2">
                <button onClick={() => callApi('clear-logs')} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded text-xs font-mono">Clear Current Session Logs</button>
                <button onClick={() => callApi('test-crash')} className="bg-red-900/50 hover:bg-red-800/50 text-red-400 border border-red-800/50 py-1.5 rounded text-xs font-mono">Generate Test Crash</button>
                <button onClick={() => callApi('test-exception')} className="bg-orange-900/50 hover:bg-orange-800/50 text-orange-400 border border-orange-800/50 py-1.5 rounded text-xs font-mono">Generate Test Exception</button>
                <button onClick={() => callApi('test-warning')} className="bg-yellow-900/50 hover:bg-yellow-800/50 text-yellow-400 border border-yellow-800/50 py-1.5 rounded text-xs font-mono">Generate Test Warning</button>
            </div>
        </div>
    );
}
