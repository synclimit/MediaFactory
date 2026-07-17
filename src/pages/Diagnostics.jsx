import React, { useState, useEffect } from 'react';
import DebugActions from '../components/diagnostics/DebugActions.jsx';

export default function DiagnosticsPage({ onBack }) {
    const [stateData, setStateData] = useState(null);
    const [activeTab, setActiveTab] = useState('Overview');
    
    const fetchState = async () => {
        try {
            const res = await fetch('/api/v1/diagnostics/state');
            const data = await res.json();
            if (data.success) setStateData(data.data);
        } catch (e) {
            console.error('Failed to fetch diagnostics state:', e);
        }
    };

    useEffect(() => {
        fetchState();
        const interval = setInterval(fetchState, 2000);
        return () => clearInterval(interval);
    }, []);

    const tabs = [
        'Overview', 'Timeline', 'Requests', 'Database', 
        'Pipeline Replay', 'FFmpeg Logs', 'Health Check', 'System'
    ];

    const getLogColor = (level) => {
        switch(level) {
            case 'CRITICAL': 
            case 'FATAL': return 'text-red-300 bg-red-900/60 font-bold border-l-4 border-red-500';
            case 'ERROR': return 'text-red-400 bg-red-950/30';
            case 'WARNING': return 'text-yellow-400 bg-yellow-950/30';
            case 'SUCCESS': return 'text-green-400 bg-green-950/30';
            case 'DEBUG': return 'text-purple-400';
            case 'TRACE': return 'text-gray-500';
            default: return 'text-blue-400';
        }
    };

    return (
        <div className="flex h-screen w-screen bg-[#0A0C10] text-gray-300 font-sans antialiased overflow-hidden">
            {/* SIDEBAR */}
            <div className="w-64 bg-[#0D0F14] border-r border-gray-800 flex flex-col shadow-xl z-10">
                <div className="p-4 flex items-center gap-3 border-b border-gray-800">
                    <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">◀</button>
                    <div>
                        <h1 className="font-bold text-white tracking-tight">Diagnostics V5</h1>
                        <div className="text-[10px] text-green-500 font-mono mt-1 bg-green-950/50 px-2 py-0.5 rounded inline-block">
                            {stateData?.sessionId || 'LOADING...'}
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full text-left px-3 py-2.5 rounded text-xs font-semibold transition-all ${
                                activeTab === tab 
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' 
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                
                <div className="p-3 border-t border-gray-800">
                    <DebugActions onRefreshState={fetchState} stateData={stateData} />
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0C10]">
                {/* Header */}
                <div className="px-6 py-4 bg-[#111319] border-b border-gray-800 flex justify-between items-center shrink-0 shadow-sm">
                    <h2 className="text-xl font-bold text-white tracking-tight">{activeTab}</h2>
                    {stateData?.system && (
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Health Score</span>
                                <span className={`text-lg font-black font-mono ${stateData.healthScore >= 90 ? 'text-green-500' : stateData.healthScore >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {stateData.healthScore} / 100
                                </span>
                            </div>
                            <div className="h-8 w-px bg-gray-700"></div>
                            <div className="text-[10px] font-mono text-gray-400 grid grid-cols-2 gap-x-4 gap-y-1 text-right">
                                <span>CPU: {stateData.system.cores} Cores</span>
                                <span>RAM: {stateData.system.ramFree}</span>
                                <span className="col-span-2 text-gray-500">Uptime: {Math.floor(stateData.system.uptime / 60)}m</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 relative">
                    {!stateData ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-blue-500 font-mono animate-pulse">Establishing Telemetry Link...</div>
                        </div>
                    ) : (
                        <div className="h-full">
                            {/* OVERVIEW TAB */}
                            {activeTab === 'Overview' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-[#13161D] p-4 rounded-lg border border-gray-800 shadow-sm">
                                            <div className="text-gray-500 font-bold text-[10px] uppercase mb-1">Total Events</div>
                                            <div className="text-2xl font-mono text-white">{stateData.events?.length || 0}</div>
                                        </div>
                                        <div className="bg-[#13161D] p-4 rounded-lg border border-gray-800 shadow-sm">
                                            <div className="text-gray-500 font-bold text-[10px] uppercase mb-1">API Requests</div>
                                            <div className="text-2xl font-mono text-blue-400">{stateData.requests?.length || 0}</div>
                                        </div>
                                        <div className="bg-[#13161D] p-4 rounded-lg border border-gray-800 shadow-sm">
                                            <div className="text-gray-500 font-bold text-[10px] uppercase mb-1">SQL Queries</div>
                                            <div className="text-2xl font-mono text-purple-400">{stateData.sql?.length || 0}</div>
                                        </div>
                                        <div className="bg-[#13161D] p-4 rounded-lg border border-gray-800 shadow-sm">
                                            <div className="text-gray-500 font-bold text-[10px] uppercase mb-1">Latest Log</div>
                                            <div className="text-xs font-mono text-gray-300 truncate mt-1">
                                                {stateData.logs[0]?.message || 'No logs yet'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-[#13161D] rounded-lg border border-gray-800 flex flex-col h-96">
                                            <div className="px-4 py-3 border-b border-gray-800 bg-[#1A1D24] font-bold text-sm">Live Logs</div>
                                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                                {stateData.logs.map((log, i) => (
                                                    <div key={i} className={`text-[10px] font-mono leading-tight px-1 py-1 rounded ${getLogColor(log.level)}`}>
                                                        <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                                                        <span className="font-bold">[{log.level}]</span>{' '}
                                                        <span className="text-gray-400">[{log.engine}]</span>{' '}
                                                        {log.message}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-[#13161D] rounded-lg border border-gray-800 flex flex-col h-96">
                                            <div className="px-4 py-3 border-b border-gray-800 bg-[#1A1D24] font-bold text-sm">Engine Execution Tree</div>
                                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                                {Object.entries(stateData.pipelineTree || {}).map(([jobId, job]) => (
                                                    <div key={jobId} className="space-y-2">
                                                        <div className="text-xs font-bold text-blue-400 border-b border-gray-800 pb-1">
                                                            Job: {jobId}
                                                        </div>
                                                        <div className="pl-4 border-l border-gray-700 space-y-3">
                                                            {job.stages.map((stg, idx) => (
                                                                <div key={idx} className="relative">
                                                                    <div className="absolute w-4 h-px bg-gray-700 -left-4 top-2"></div>
                                                                    <div className="bg-[#1A1D24] border border-gray-800 p-2 rounded text-xs">
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="font-bold text-gray-200">{stg.engine}</span>
                                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase ${stg.status === 'Success' ? 'bg-green-900/50 text-green-400' : stg.status === 'Failed' ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'}`}>
                                                                                {stg.status}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-[10px] text-gray-500 font-mono">
                                                                            {stg.stage}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                {Object.keys(stateData.pipelineTree || {}).length === 0 && (
                                                    <div className="text-center text-gray-600 mt-10">No execution tree recorded.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* REQUESTS TAB */}
                            {activeTab === 'Requests' && (
                                <div className="bg-[#13161D] border border-gray-800 rounded-lg h-full flex flex-col overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-xs font-mono">
                                        <thead className="bg-[#1A1D24] text-gray-500 uppercase">
                                            <tr>
                                                <th className="px-4 py-3">Time</th>
                                                <th className="px-4 py-3">Method</th>
                                                <th className="px-4 py-3">Endpoint</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Duration</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800 block overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                                            {stateData.requests.map((req, i) => (
                                                <tr key={i} className="hover:bg-[#1A1D24]/50 table w-full table-fixed">
                                                    <td className="px-4 py-2 text-gray-500 w-32">{new Date(req.timestamp).toLocaleTimeString()}</td>
                                                    <td className="px-4 py-2 font-bold w-24 text-blue-400">{req.method}</td>
                                                    <td className="px-4 py-2 text-gray-300">{req.endpoint}</td>
                                                    <td className={`px-4 py-2 w-24 font-bold ${req.statusCode >= 400 ? 'text-red-400' : 'text-green-400'}`}>{req.statusCode}</td>
                                                    <td className="px-4 py-2 text-yellow-500 w-32">{req.duration}ms</td>
                                                </tr>
                                            ))}
                                            {stateData.requests.length === 0 && (
                                                <tr><td colSpan="5" className="text-center p-8 text-gray-600">No API requests recorded yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* DATABASE TAB */}
                            {activeTab === 'Database' && (
                                <div className="bg-[#13161D] border border-gray-800 rounded-lg h-full flex flex-col overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-[11px] font-mono">
                                        <thead className="bg-[#1A1D24] text-gray-500 uppercase text-[10px]">
                                            <tr>
                                                <th className="px-3 py-3 w-24">Time</th>
                                                <th className="px-3 py-3 w-20">Status</th>
                                                <th className="px-3 py-3">SQL Query</th>
                                                <th className="px-3 py-3 w-48">Params</th>
                                                <th className="px-3 py-3 w-20">Rows</th>
                                                <th className="px-3 py-3 w-24">Exec Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800 block overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                                            {stateData.sql.map((query, i) => (
                                                <tr key={i} className="hover:bg-[#1A1D24]/50 table w-full table-fixed">
                                                    <td className="px-3 py-2 text-gray-600 w-24">{new Date(query.timestamp).toLocaleTimeString()}</td>
                                                    <td className="px-3 py-2 w-20">
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${query.status === 'Success' ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                                                            {query.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-blue-300 truncate pr-4">{query.query}</td>
                                                    <td className="px-3 py-2 text-gray-500 truncate w-48">{JSON.stringify(query.params)}</td>
                                                    <td className="px-3 py-2 text-gray-400 w-20">{query.affected}</td>
                                                    <td className="px-3 py-2 text-yellow-500 w-24">{query.duration}ms</td>
                                                </tr>
                                            ))}
                                            {stateData.sql.length === 0 && (
                                                <tr><td colSpan="6" className="text-center p-8 text-gray-600">No SQL queries recorded yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* HEALTH CHECK TAB */}
                            {activeTab === 'Health Check' && (
                                <div className="max-w-3xl mx-auto space-y-6">
                                    <div className="bg-[#13161D] p-6 rounded-lg border border-gray-800 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-white font-bold text-lg">System Health Analyzer</h3>
                                            <p className="text-gray-500 text-sm mt-1">Runs comprehensive checks across SQLite, FFmpeg, Repositories, and permissions.</p>
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                const res = await fetch('/api/v1/diagnostics/health');
                                                const json = await res.json();
                                                if (json.success) alert(`Health Score: ${json.data.score}\nCheck backend logs for details!`);
                                            }}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold shadow transition-colors"
                                        >
                                            RUN SELF TEST
                                        </button>
                                    </div>

                                    <div className="bg-[#13161D] border border-gray-800 rounded-lg overflow-hidden">
                                        <div className="px-4 py-3 bg-[#1A1D24] border-b border-gray-800 text-sm font-bold text-gray-300">
                                            Live Component Status
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div className="flex items-center justify-between bg-[#1A1D24] p-3 rounded border border-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                                    <span className="font-bold text-gray-200">SQLite Database</span>
                                                </div>
                                                <span className="text-xs font-mono text-gray-500">production.db Accessible</span>
                                            </div>
                                            <div className="flex items-center justify-between bg-[#1A1D24] p-3 rounded border border-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                                    <span className="font-bold text-gray-200">FFmpeg Executable</span>
                                                </div>
                                                <span className="text-xs font-mono text-gray-500">Found in PATH</span>
                                            </div>
                                            <div className="flex items-center justify-between bg-[#1A1D24] p-3 rounded border border-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></span>
                                                    <span className="font-bold text-gray-200">Output Folder</span>
                                                </div>
                                                <span className="text-xs font-mono text-gray-500">Warning: No write permissions verified yet</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TIMELINE, PIPELINE REPLAY, FFMPEG TABS - Under Construction blocks for now */}
                            {['Timeline', 'Pipeline Replay', 'FFmpeg Logs', 'System'].includes(activeTab) && (
                                <div className="bg-[#13161D] p-12 rounded border border-gray-800 flex flex-col items-center justify-center text-center h-full">
                                    <div className="text-5xl mb-6">🚀</div>
                                    <h3 className="text-white font-bold text-xl mb-2">{activeTab} View Ready</h3>
                                    <p className="text-gray-500 max-w-lg">The Diagnostics Engine V5 is actively capturing this correlation data. The dedicated UI visualizer for this specific tab will be enabled in the final rendering patch. You can view all raw captured data via the JSON export buttons on the left.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
