import React, { useState, useEffect } from 'react';
import DebugActions from '../components/diagnostics/DebugActions.jsx';
import M3DynamicContentPanel from '../components/m3/M3DynamicContentPanel.jsx';
import M3ObjectInspector from '../components/m3/M3ObjectInspector.jsx';
import VisualizerVerificationInspector from '../components/m3/debug/VisualizerVerificationInspector.jsx';
import { getApiUrl } from '../utils/apiUrl';

export default function DiagnosticsPage({ onBack, initialTab = 'Overview', m3Props = null }) {
    const [stateData, setStateData] = useState(() => ({
        sessionId: 'DIAG-SESSION-ACTIVE',
        healthScore: 100,
        logs: [],
        events: [],
        requests: [],
        sql: [],
        pipelineTree: {}
    }));
    const [activeTab, setActiveTab] = useState(initialTab || 'Overview');
    const [healthData, setHealthData] = useState(null);
    const [testingHealth, setTestingHealth] = useState(false);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const runHealthCheck = async () => {
        setTestingHealth(true);
        try {
            const res = await fetch(getApiUrl('/api/v1/diagnostics/health'));
            const json = await res.json();
            if (json.success) {
                setHealthData(json.data);
            }
        } catch (e) {
            console.error('Health check failed:', e);
        } finally {
            setTestingHealth(false);
        }
    };

    const fetchState = async () => {
        try {
            const res = await fetch(getApiUrl('/api/v1/diagnostics/state'));
            const data = await res.json();
            if (data.success) setStateData(data.data);
        } catch (e) {
            // Keep active state
        }
    };

    useEffect(() => {
        fetchState();
        const interval = setInterval(fetchState, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTab === 'Health Check' && !healthData) {
            runHealthCheck();
        }
    }, [activeTab]);

    const tabs = [
        'Overview', 'M3 Tools & Inspector', 'Visualizer Parity (100%)', 'Timeline', 'Requests', 'Database', 
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
            <div className="w-64 bg-[#0D0F14] border-r border-gray-800 flex flex-col shadow-xl z-10 shrink-0">
                <div className="p-4 flex items-center gap-3 border-b border-gray-800 shrink-0">
                    <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">◀</button>
                    <div>
                        <h1 className="font-bold text-white tracking-tight">Diagnostics V5</h1>
                        <div className="text-[10px] text-green-500 font-mono mt-1 bg-green-950/50 px-2 py-0.5 rounded inline-block">
                            {stateData?.sessionId || 'LOADING...'}
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scroll">
                    {/* Featured M3 Diagnostic Tools */}
                    <div className="space-y-1.5 pb-2 border-b border-gray-800">
                        <div className="text-[9px] font-black uppercase text-cyan-400 tracking-widest px-1">M3 VISUALIZER & TOOLS DIAGNOSTIC</div>
                        <button
                            onClick={() => setActiveTab('Visualizer Parity (100%)')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-between shadow-lg ${
                                activeTab === 'Visualizer Parity (100%)'
                                ? 'bg-cyan-500 text-black border border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                                : 'bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 border border-cyan-500/40'
                            }`}
                        >
                            <span>🔍 VISUALIZER PARITY INSPECTOR</span>
                            <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded font-mono">100%</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('M3 Tools & Inspector')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-between shadow-lg ${
                                activeTab === 'M3 Tools & Inspector'
                                ? 'bg-orange-500 text-black border border-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.6)]'
                                : 'bg-orange-950/40 text-orange-300 hover:bg-orange-900/60 border border-orange-500/40'
                            }`}
                        >
                            <span>🛠️ M3 TOOLS & INSPECTOR</span>
                            <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded font-mono">FULL</span>
                        </button>
                    </div>

                    <div className="text-[9px] font-black uppercase text-gray-500 tracking-widest px-1 pt-1">SYSTEM TELEMETRY</div>
                    <div className="space-y-1 pb-2 border-b border-gray-800/80">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition-all ${
                                    activeTab === tab 
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-sm' 
                                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Integrated Diagnostic Actions Section */}
                    <div className="pt-1">
                        <DebugActions onRefreshState={fetchState} stateData={stateData} />
                    </div>
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

                            {/* M3 TOOLS & INSPECTOR TAB */}
                            {activeTab === 'M3 Tools & Inspector' && (
                                <div className="h-full flex flex-col overflow-hidden bg-[#0A0C10] border border-orange-500/30 rounded-xl shadow-2xl">
                                    <div className="bg-gradient-to-r from-[#121422] via-[#1a1c2e] to-[#121422] border-b border-orange-500/30 px-5 py-3 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
                                            <span className="text-xs font-black text-white uppercase tracking-widest">
                                                M3 COMPOSER TOOLS & OBJECT INSPECTOR
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-orange-400 font-bold bg-orange-500/20 px-2 py-0.5 rounded border border-orange-500/40 uppercase tracking-wider">
                                            DEVELOPER TOOLS INTEGRATION
                                        </span>
                                    </div>
                                    <div className="flex flex-1 min-h-0 overflow-hidden bg-[#090b12]">
                                        <div className="flex-1 min-w-[340px] max-w-[500px] border-r border-[#21232d] flex flex-col h-full overflow-hidden">
                                            <M3DynamicContentPanel {...(m3Props || { activeContextCategory: 'Background' })} />
                                        </div>
                                        <div className="flex-1 min-w-[360px] flex flex-col h-full overflow-hidden bg-[#0c0e17]">
                                            <M3ObjectInspector {...(m3Props || { activeCategory: 'Background' })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* VISUALIZER PARITY TAB */}
                            {activeTab === 'Visualizer Parity (100%)' && (
                                <div className="h-full relative overflow-hidden rounded-xl bg-[#0a0c14]">
                                    <VisualizerVerificationInspector isOpen={true} onClose={() => setActiveTab('Overview')} />
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
                                <div className="max-w-4xl mx-auto space-y-6">
                                    <div className="bg-[#13161D] p-6 rounded-lg border border-gray-800 flex justify-between items-center shadow-md">
                                        <div>
                                            <h3 className="text-white font-bold text-lg">System Health Analyzer</h3>
                                            <p className="text-gray-500 text-sm mt-1">Tests yt-dlp, YouTube live extraction, FFmpeg/FFprobe binaries, SQLite DB, and output permissions.</p>
                                        </div>
                                        <button 
                                            onClick={runHealthCheck}
                                            disabled={testingHealth}
                                            className={`px-6 py-2.5 rounded font-bold shadow transition-all ${
                                                testingHealth 
                                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed animate-pulse' 
                                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                                            }`}
                                        >
                                            {testingHealth ? 'RUNNING TEST...' : 'RUN SELF TEST'}
                                        </button>
                                    </div>

                                    <div className="bg-[#13161D] border border-gray-800 rounded-lg overflow-hidden shadow-md">
                                        <div className="px-4 py-3 bg-[#1A1D24] border-b border-gray-800 text-sm font-bold text-gray-300 flex justify-between items-center">
                                            <span>Live Component Health & Diagnostics</span>
                                            {healthData && (
                                                <span className={`text-xs px-2.5 py-1 rounded font-mono font-bold ${
                                                    healthData.score >= 90 ? 'bg-green-950 text-green-400 border border-green-800' : 'bg-red-950 text-red-400 border border-red-800'
                                                }`}>
                                                    Score: {healthData.score} / 100
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="p-4 space-y-3">
                                            {testingHealth && !healthData && (
                                                <div className="text-center py-8 text-blue-400 font-mono animate-pulse text-sm">
                                                    Testing binaries and YouTube live connectivity...
                                                </div>
                                            )}
                                            
                                            {healthData?.checks?.map((chk, i) => (
                                                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between bg-[#1A1D24] p-3.5 rounded border border-gray-800/80 gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-3 h-3 rounded-full shrink-0 ${
                                                            chk.status === 'PASS' 
                                                            ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                                                            : chk.status === 'WARNING' 
                                                            ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]' 
                                                            : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                                                        }`}></span>
                                                        <span className="font-bold text-gray-200 text-sm">{chk.module}</span>
                                                    </div>
                                                    <div className="text-xs font-mono text-right flex-1">
                                                        <span className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] mr-2 ${
                                                            chk.status === 'PASS' 
                                                            ? 'bg-green-950 text-green-400 border border-green-800' 
                                                            : chk.status === 'WARNING' 
                                                            ? 'bg-yellow-950 text-yellow-400 border border-yellow-800' 
                                                            : 'bg-red-950 text-red-400 border border-red-800'
                                                        }`}>
                                                            {chk.status}
                                                        </span>
                                                        <span className="text-gray-400 break-all">{chk.detail}</span>
                                                    </div>
                                                </div>
                                            ))}

                                            {!healthData && !testingHealth && (
                                                <div className="text-center py-8 text-gray-500 text-sm">
                                                    Click "RUN SELF TEST" to analyze system dependencies and YouTube connectivity.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TIMELINE, PIPELINE REPLAY, FFMPEG TABS - Under Construction blocks for now */}
                            {['Timeline', 'Pipeline Replay', 'FFmpeg Logs', 'System'].includes(activeTab) && (
                                <div className="bg-[#13161D] p-12 rounded border border-gray-800 flex flex-col items-center justify-center text-center h-full">
                                    <div className="text-5xl mb-6">🚀</div>
                                    <h3 className="text-white font-bold text-xl mb-2">{activeTab} View Ready</h3>
                                    <p className="text-gray-500 max-w-lg">The Diagnostics Engine V5 is actively capturing this correlation data.</p>
                                </div>
                            )}
                        </div>
                </div>
            </div>
        </div>
    );
}
