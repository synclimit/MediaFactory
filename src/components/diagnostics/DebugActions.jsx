import React, { useState } from 'react';
import { getApiUrl } from '../../utils/apiUrl';

export default function DebugActions({ onRefreshState, stateData }) {
    const [actionStatus, setActionStatus] = useState(null);
    const [showInspection, setShowInspection] = useState(false);
    const [showSimulation, setShowSimulation] = useState(false);

    const callApi = async (action) => {
        try {
            const res = await fetch(getApiUrl('/api/v1/diagnostics/test-action'), {
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
            const res = await fetch(getApiUrl('/api/v1/diagnostics/report'));
            const data = await res.json();
            if (data.data) {
                await navigator.clipboard.writeText(data.data);
                setActionStatus('Markdown Report copied to clipboard!');
            } else {
                setActionStatus('Failed to retrieve report data');
            }
            setTimeout(() => setActionStatus(null), 3000);
        } catch (e) {
            setActionStatus('Failed to copy report: ' + e.message);
            setTimeout(() => setActionStatus(null), 3000);
        }
    };

    const handleExportZip = () => {
        window.location.href = getApiUrl('/api/v1/diagnostics/export');
    };

    const copyJSON = async (obj) => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(obj || {}, null, 2));
            setActionStatus('JSON Copied!');
        } catch (e) {
            setActionStatus('Copy failed');
        }
        setTimeout(() => setActionStatus(null), 3000);
    };

    return (
        <div className="bg-[#0f1115] p-3 rounded-lg border border-gray-800/80 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    DIAGNOSTIC ACTIONS
                </h3>
            </div>
            
            {actionStatus && (
                <div className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 p-2 rounded text-[10px] font-mono animate-fade-in">
                    {actionStatus}
                </div>
            )}

            <div className="grid grid-cols-1 gap-1.5">
                <button 
                    onClick={handleCopyReport}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 rounded text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                >
                    <span>📋</span> COPY AI REPORT
                </button>
                
                <button 
                    onClick={handleExportZip}
                    className="bg-[#2d3247] hover:bg-[#3b415c] text-white font-bold py-1.5 px-3 rounded text-xs transition-all flex items-center justify-center gap-1.5 border border-gray-700/50 shadow-sm active:scale-[0.98]"
                >
                    <span>📦</span> EXPORT CRASH PACKAGE
                </button>
            </div>

            {/* DIRECT INSPECTION ACCORDION */}
            <div className="border-t border-gray-800/80 pt-2">
                <button
                    onClick={() => setShowInspection(!showInspection)}
                    className="w-full flex items-center justify-between text-gray-400 hover:text-gray-200 text-[10px] font-bold uppercase tracking-wider py-1 transition-colors"
                >
                    <span>🔍 DIRECT INSPECTION</span>
                    <span>{showInspection ? '▲' : '▼'}</span>
                </button>

                {showInspection && (
                    <div className="grid grid-cols-2 gap-1.5 mt-2 animate-fade-in">
                        <button onClick={() => copyJSON(stateData?.pipelineTree)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-1.5 rounded text-[10px] truncate">Pipeline Tree</button>
                        <button onClick={() => copyJSON(stateData?.events)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-1.5 rounded text-[10px] truncate">Events</button>
                        <button onClick={() => copyJSON(stateData?.system)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-1.5 rounded text-[10px] truncate">System Info</button>
                        <button onClick={() => copyJSON(stateData?.sql)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-1.5 rounded text-[10px] truncate">SQL History</button>
                    </div>
                )}
            </div>

            {/* TESTS & SIMULATION ACCORDION */}
            <div className="border-t border-gray-800/80 pt-2">
                <button
                    onClick={() => setShowSimulation(!showSimulation)}
                    className="w-full flex items-center justify-between text-gray-400 hover:text-gray-200 text-[10px] font-bold uppercase tracking-wider py-1 transition-colors"
                >
                    <span>🧪 TESTS & SIMULATION</span>
                    <span>{showSimulation ? '▲' : '▼'}</span>
                </button>

                {showSimulation && (
                    <div className="grid grid-cols-1 gap-1.5 mt-2 animate-fade-in">
                        <button onClick={() => callApi('clear-logs')} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 rounded text-[10px] font-mono">Clear Current Session Logs</button>
                        <button onClick={() => callApi('test-crash')} className="bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/40 py-1 rounded text-[10px] font-mono">Generate Test Crash</button>
                        <button onClick={() => callApi('test-exception')} className="bg-orange-950/40 hover:bg-orange-900/50 text-orange-400 border border-orange-800/40 py-1 rounded text-[10px] font-mono">Generate Test Exception</button>
                        <button onClick={() => callApi('test-warning')} className="bg-yellow-950/40 hover:bg-yellow-900/50 text-yellow-400 border border-yellow-800/40 py-1 rounded text-[10px] font-mono">Generate Test Warning</button>
                    </div>
                )}
            </div>
        </div>
    );
}

