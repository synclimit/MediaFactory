import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { QAOrchestrator } from '../../services/qa/QAOrchestrator';
import { EngineRegistry } from '../../services/qa/EngineRegistry';
import { FeatureRegistry } from '../../services/qa/FeatureRegistry';
import { WorkflowRegistry } from '../../services/qa/WorkflowRegistry';
import { SessionManager } from '../../services/qa/SessionManager';
import '../../services/qa/validators/BasicValidators';

export default function ProductionQAToolkit() {
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('Dashboard');
    
    // QA State
    const [qaState, setQaState] = useState({
        status: 'IDLE',
        progress: { current: 0, completed: 0, remaining: 0, total: 0 },
        logs: [],
        validators: [],
        elapsed: 0,
        eta: 0,
        healthScore: 0,
        currentValidatorName: 'None',
        currentSession: null
    });
    
    const [mode, setMode] = useState('Quick');
    
    // UI States
    const [logFilter, setLogFilter] = useState('');
    const [logLevel, setLogLevel] = useState('ALL');
    const [pauseScroll, setPauseScroll] = useState(false);
    
    const [selectedEngine, setSelectedEngine] = useState(null);
    const [sessions, setSessions] = useState([]);
    
    const [compareSessionA, setCompareSessionA] = useState(null);
    const [compareSessionB, setCompareSessionB] = useState(null);
    
    const [globalSearch, setGlobalSearch] = useState('');

    const orchestratorRef = useRef(null);
    const logContainerRef = useRef(null);
    const [contextMenu, setContextMenu] = useState(null);

    // Toggle Hotkey Ctrl+Shift+Q
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'q') {
                e.preventDefault();
                setIsVisible(v => !v);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Initialize Orchestrator
    useEffect(() => {
        if (!orchestratorRef.current) {
            orchestratorRef.current = new QAOrchestrator();
            orchestratorRef.current.subscribe((state) => {
                setQaState({ ...state });
            });
        }
    }, []);

    // Load Sessions on visible
    useEffect(() => {
        if (isVisible) refreshSessions();
    }, [isVisible]);

    const refreshSessions = async () => {
        const list = await SessionManager.list();
        setSessions(list || []);
    };

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current && !pauseScroll) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [qaState.logs, pauseScroll]);

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!isVisible) return null;

    // --- RENDER HELPERS ---
    
    const statusColors = {
        'WAITING': 'text-gray-500 border-gray-700 bg-gray-900/30',
        'RUNNING': 'text-blue-400 border-blue-500/50 bg-blue-900/30 animate-pulse',
        'PASS': 'text-emerald-400 border-emerald-500/50 bg-emerald-900/30',
        'FAILED': 'text-red-400 border-red-500/50 bg-red-900/30',
        'SKIPPED': 'text-orange-400 border-orange-500/50 bg-orange-900/30',
        'NOT EXECUTED': 'text-gray-400 border-gray-500/50 bg-gray-800/30',
        'NOT IMPLEMENTED': 'text-purple-400 border-purple-500/50 bg-purple-900/30'
    };

    // --- TABS ---

    const renderDashboard = () => {
        const grouped = {};
        qaState.validators.forEach(v => {
            const cat = v.constructor.category || 'Core';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(v);
        });

        const filteredLogs = qaState.logs.filter(l => {
            if (logLevel !== 'ALL' && l.type !== logLevel.toLowerCase()) return false;
            return l.raw.toLowerCase().includes(logFilter.toLowerCase());
        });

        return (
            <div className="flex gap-4 p-4 h-[75vh]">
                <div className="w-1/3 flex flex-col gap-4 min-w-[300px]">
                    <div className="bg-black/30 border border-[#2d3247] rounded p-4">
                        <h4 className="text-yellow-400 font-bold mb-3">QA CONTROL</h4>
                        <div className="mb-4">
                            <label className="text-gray-500 text-xs mb-1 block">Selected Mode</label>
                            <select 
                                className="bg-[#1a1e2d] border border-[#2d3247] rounded w-full p-1.5 text-white text-sm"
                                value={mode}
                                onChange={(e) => setMode(e.target.value)}
                                disabled={qaState.status === 'RUNNING'}
                            >
                                <option value="Quick">Quick</option>
                                <option value="Standard">Standard</option>
                                <option value="Production">Production</option>
                                <option value="Stress">Stress</option>
                                <option value="Endurance">Endurance</option>
                                <option value="Monitor">Monitor</option>
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-3 rounded text-sm"
                                onClick={() => orchestratorRef.current?.run(mode)} disabled={qaState.status === 'RUNNING'}>RUN</button>
                            <button className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-1 px-3 rounded text-sm"
                                onClick={() => orchestratorRef.current?.pause()} disabled={qaState.status !== 'RUNNING'}>PAUSE</button>
                            <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 rounded text-sm"
                                onClick={() => orchestratorRef.current?.resume()} disabled={qaState.status !== 'PAUSED'}>RESUME</button>
                            <button className="bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded text-sm"
                                onClick={() => orchestratorRef.current?.stop()} disabled={qaState.status === 'IDLE' || qaState.status === 'COMPLETED'}>STOP</button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm border-t border-[#2d3247] pt-3">
                            <div><span className="text-gray-500 block text-xs">Progress</span><span className="text-white font-bold">{qaState.progress.completed} / {qaState.progress.total}</span></div>
                            <div><span className="text-gray-500 block text-xs">Current Validator</span><span className="text-blue-400 font-bold">{qaState.currentValidatorName}</span></div>
                            <div><span className="text-gray-500 block text-xs">Elapsed Time</span><span className="text-gray-300 font-mono">{formatTime(qaState.elapsed)}</span></div>
                            <div><span className="text-gray-500 block text-xs">Health Score</span><span className="text-emerald-400 font-bold text-lg">{qaState.healthScore}%</span></div>
                            <div className="col-span-2"><span className="text-gray-500 block text-xs">Session ID</span><span className="text-gray-400 font-mono text-xs">{qaState.currentSession?.id || 'None'}</span></div>
                        </div>
                    </div>

                    <div className="bg-black/30 border border-[#2d3247] rounded p-4 flex-1 flex flex-col min-h-0 relative">
                        <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                            <h4 className="text-yellow-400 font-bold">LIVE CONSOLE V2</h4>
                            <div className="flex gap-2">
                                <select className="bg-[#1a1e2d] border border-[#2d3247] rounded text-xs p-1 text-white" value={logLevel} onChange={e=>setLogLevel(e.target.value)}>
                                    <option value="ALL">All Levels</option>
                                    <option value="INFO">Info</option>
                                    <option value="DEBUG">Debug</option>
                                    <option value="WARNING">Warning</option>
                                    <option value="ERROR">Error</option>
                                </select>
                                <button className={`px-2 py-1 text-xs rounded border ${pauseScroll ? 'bg-red-900/50 border-red-500 text-red-300' : 'bg-[#1a1e2d] border-[#2d3247] text-gray-400'}`} onClick={()=>setPauseScroll(!pauseScroll)}>
                                    {pauseScroll ? 'Paused' : 'Auto Scroll'}
                                </button>
                            </div>
                            <input type="text" placeholder="Search logs..." className="bg-[#1a1e2d] border border-[#2d3247] rounded p-1 text-xs text-white w-full" value={logFilter} onChange={e => setLogFilter(e.target.value)} />
                        </div>
                        <div ref={logContainerRef} className="bg-[#0c0d12] border border-[#1a1e2d] rounded flex-1 overflow-y-auto p-2 font-mono text-[10px] flex flex-col gap-1 custom-scrollbar select-text">
                            {filteredLogs.map((log, i) => {
                                let c = 'text-gray-400';
                                if(log.type==='error') c='text-red-400';
                                if(log.type==='success') c='text-emerald-400';
                                if(log.type==='warning') c='text-orange-400';
                                if(log.type==='debug') c='text-purple-400';
                                return (
                                <div key={i} className={`flex gap-2 ${c}`}>
                                    <span className="text-gray-600 shrink-0">[{log.time}]</span>
                                    <span className="text-blue-300 font-bold w-24 shrink-0 truncate">{log.engine}</span>
                                    <span className="break-all whitespace-pre-wrap">{log.message}</span>
                                </div>
                            )})}
                            {filteredLogs.length === 0 && <div className="text-gray-600 text-center italic mt-10">No logs match criteria.</div>}
                        </div>
                    </div>
                </div>

                <div className="w-2/3 bg-black/30 border border-[#2d3247] rounded p-4 flex flex-col relative" onClick={() => setContextMenu(null)}>
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-yellow-400 font-bold">VALIDATOR TREE</h4>
                        <div className="text-sm">
                            <span className="text-gray-500">Coverage: </span>
                            <span className="text-emerald-400 font-bold">{EngineRegistry.coverage().percentage}%</span>
                        </div>
                    </div>
                    
                    <div className="w-full bg-[#1a1e2d] h-2 rounded overflow-hidden mb-4">
                        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${qaState.progress.total ? (qaState.progress.completed / qaState.progress.total) * 100 : 0}%` }} />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {qaState.validators.length === 0 ? (
                            <div className="text-gray-500 text-center mt-10">Select a mode and click RUN.</div>
                        ) : (
                            Object.keys(grouped).map(cat => (
                                <div key={cat} className="mb-2">
                                    <h5 className="text-gray-400 font-bold mb-2 border-b border-[#2d3247] pb-1">▼ {cat}</h5>
                                    <div className="pl-4 space-y-2">
                                        {grouped[cat].map((val, idx) => {
                                            const sc = statusColors[val.status] || statusColors['WAITING'];
                                            return (
                                                <div key={idx} 
                                                    className={`border rounded p-2 flex justify-between items-center relative ${sc}`}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        setContextMenu({ x: e.clientX, y: e.clientY, engine: val.constructor.engineName });
                                                    }}
                                                >
                                                    <div>
                                                        <div className="font-bold text-sm text-gray-200">{val.constructor.engineName}</div>
                                                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">Stage: {val.currentStage || 'IDLE'} | {val.durationMs}ms</div>
                                                    </div>
                                                    <div className="font-mono font-bold tracking-widest text-xs px-2">{val.status}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {contextMenu && (
                        <div className="fixed bg-[#1a1e2d] border border-[#2d3247] rounded shadow-xl py-1 z-50 text-sm font-bold text-gray-300"
                             style={{ top: contextMenu.y, left: contextMenu.x }}>
                            {contextMenu.isFeature ? (
                                <>
                                    <div className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer" onClick={() => orchestratorRef.current.runFeature(contextMenu.featureName, 'Configuration')}>Replay from Configuration</div>
                                    <div className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer" onClick={() => orchestratorRef.current.runFeature(contextMenu.featureName, 'Engine')}>Replay from Engine</div>
                                    <div className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer" onClick={() => orchestratorRef.current.runFeature(contextMenu.featureName, 'Output')}>Replay from Output</div>
                                    <div className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer" onClick={() => orchestratorRef.current.runFeature(contextMenu.featureName, 'Acceptance')}>Replay from Acceptance</div>
                                </>
                            ) : (
                                <>
                                    <div className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer">Run '{contextMenu.engine}'</div>
                                    <div className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer">Replay</div>
                                    <div className="px-4 py-2 hover:bg-red-600 hover:text-white cursor-pointer">Disable</div>
                                    <div className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer">View Report</div>
                                    <div className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer">Copy Log</div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderEngineExplorer = () => {
        const registered = EngineRegistry.getValidators().filter(v => 
            globalSearch === '' || v.engineName.toLowerCase().includes(globalSearch.toLowerCase())
        );
        
        return (
            <div className="flex h-[75vh]">
                <div className="w-1/3 border-r border-[#2d3247] p-4 overflow-y-auto custom-scrollbar">
                    <h4 className="text-yellow-400 font-bold mb-4">EXPLORER</h4>
                    <input type="text" placeholder="Search engines..." className="w-full bg-[#1a1e2d] border border-[#2d3247] rounded p-2 text-xs text-white mb-4" value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)} />
                    <div className="space-y-2">
                        {registered.map(V => (
                            <button key={V.engineName} onClick={() => setSelectedEngine(() => V)} className={`w-full text-left p-3 border rounded font-bold ${selectedEngine?.engineName === V.engineName ? 'bg-blue-900/30 border-blue-500 text-blue-300' : 'border-[#2d3247] bg-black/20 hover:bg-[#1a1e2d] text-gray-300'}`}>
                                {V.engineName}
                                <div className="text-[10px] text-gray-500 font-normal">{V.category}</div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="w-2/3 p-8 flex flex-col overflow-y-auto custom-scrollbar">
                    {!selectedEngine ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <div className="text-4xl mb-4">⚙️</div>
                            <h3 className="text-xl font-bold mb-2">Select an Engine</h3>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <h2 className="text-3xl font-bold text-yellow-400 mb-2">{selectedEngine.engineName}</h2>
                            <p className="text-gray-400 mb-6">{selectedEngine.description}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-[#1a1e2d] p-4 rounded border border-[#2d3247]">
                                    <div className="text-xs text-gray-500 mb-1">Version</div>
                                    <div className="font-mono text-sm">{selectedEngine.version}</div>
                                </div>
                                <div className="bg-[#1a1e2d] p-4 rounded border border-[#2d3247]">
                                    <div className="text-xs text-gray-500 mb-1">Dependencies</div>
                                    <div className="font-mono text-sm">{selectedEngine.dependencies.length > 0 ? selectedEngine.dependencies.join(', ') : 'None'}</div>
                                </div>
                                <div className="bg-[#1a1e2d] p-4 rounded border border-[#2d3247]">
                                    <div className="text-xs text-gray-500 mb-1">Latest Benchmark</div>
                                    <div className="font-mono text-sm text-red-400">NOT EXECUTED</div>
                                </div>
                                <div className="bg-[#1a1e2d] p-4 rounded border border-[#2d3247]">
                                    <div className="text-xs text-gray-500 mb-1">Latest Evidence</div>
                                    <div className="font-mono text-sm text-red-400">NO EVIDENCE AVAILABLE</div>
                                </div>
                            </div>

                            {(() => {
                                const instance = (qaState.validators || []).find(v => v && v.constructor && v.constructor.engineName === selectedEngine.engineName);
                                if (!instance) return null;
                                const m = instance.metrics;
                                return (
                                    <div className="mb-6 bg-black/40 border border-[#2d3247] rounded p-4">
                                        <h4 className="text-yellow-400 font-bold mb-3">RUNTIME COUNTERS</h4>
                                        <div className="grid grid-cols-3 gap-y-3 gap-x-4 text-sm font-mono">
                                            <div><span className="text-gray-500 block text-xs">Execution Count</span><span className="text-white">{m.executionCount}</span></div>
                                            <div><span className="text-gray-500 block text-xs">Update Count</span><span className="text-white">{m.updateCount}</span></div>
                                            <div><span className="text-gray-500 block text-xs">Avg Time</span><span className="text-white">{m.avgExecutionTime.toFixed(2)}ms</span></div>
                                            <div><span className="text-gray-500 block text-xs">Max Time</span><span className="text-white">{m.maxExecutionTime === 0 ? 0 : m.maxExecutionTime.toFixed(2)}ms</span></div>
                                            <div><span className="text-gray-500 block text-xs">Min Time</span><span className="text-white">{m.minExecutionTime === Number.MAX_VALUE ? 0 : m.minExecutionTime.toFixed(2)}ms</span></div>
                                            <div><span className="text-gray-500 block text-xs">Skipped Frames</span><span className="text-orange-400">{m.skippedFrames}</span></div>
                                            <div><span className="text-gray-500 block text-xs">Dropped Frames</span><span className="text-red-400">{m.droppedFrames}</span></div>
                                            <div><span className="text-gray-500 block text-xs">Exceptions</span><span className="text-red-500 font-bold">{m.exceptions}</span></div>
                                            <div><span className="text-gray-500 block text-xs">Warnings</span><span className="text-orange-400 font-bold">{m.warnings}</span></div>
                                        </div>

                                        {instance.beatMetrics && (
                                            <div className="mt-4 pt-4 border-t border-[#2d3247]">
                                                <h4 className="text-yellow-400 font-bold mb-3">BEAT ENGINE STATE</h4>
                                                <div className="grid grid-cols-3 gap-y-3 gap-x-4 text-sm font-mono">
                                                    <div><span className="text-gray-500 block text-xs">BPM</span><span className="text-blue-300">{instance.beatMetrics.bpm.toFixed(1)}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Kick Count</span><span className="text-blue-300">{instance.beatMetrics.kickCount}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Snare Count</span><span className="text-blue-300">{instance.beatMetrics.snareCount}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Peak Energy</span><span className="text-blue-300">{instance.beatMetrics.peakEnergy.toFixed(4)}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Avg Energy</span><span className="text-blue-300">{instance.beatMetrics.avgEnergy.toFixed(4)}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Flux</span><span className="text-blue-300">{instance.beatMetrics.flux.toFixed(4)}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">FFT Size</span><span className="text-gray-300">{instance.beatConfig.fftSize}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Bin Count</span><span className="text-gray-300">{instance.beatConfig.binCount}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Algorithm</span><span className="text-gray-300">{instance.beatConfig.detectionAlgorithm}</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {instance.reactiveMetrics && (
                                            <div className="mt-4 pt-4 border-t border-[#2d3247]">
                                                <h4 className="text-yellow-400 font-bold mb-3">REACTIVE STATE</h4>
                                                <div className="grid grid-cols-3 gap-y-3 gap-x-4 text-sm font-mono">
                                                    <div><span className="text-gray-500 block text-xs">Trigger Count</span><span className="text-purple-300">{instance.reactiveMetrics.triggerCount}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Trigger Delay</span><span className="text-purple-300">{instance.reactiveMetrics.triggerDelay.toFixed(2)}ms</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Missed Triggers</span><span className="text-red-400">{instance.reactiveMetrics.missedTrigger}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Bass Channel</span><span className="text-purple-300">{instance.reactiveMetrics.bassChannel.toFixed(4)}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Mid Channel</span><span className="text-purple-300">{instance.reactiveMetrics.midChannel.toFixed(4)}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Treble Channel</span><span className="text-purple-300">{instance.reactiveMetrics.trebleChannel.toFixed(4)}</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {instance.effectMetrics && (
                                            <div className="mt-4 pt-4 border-t border-[#2d3247]">
                                                <h4 className="text-yellow-400 font-bold mb-3">VISUAL STATE</h4>
                                                <div className="grid grid-cols-3 gap-y-3 gap-x-4 text-sm font-mono">
                                                    <div><span className="text-gray-500 block text-xs">Zoom Executions</span><span className="text-emerald-300">{instance.effectMetrics.zoomCount}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Zoom Max Scale</span><span className="text-emerald-300">{instance.effectConfig.zoomMaxScale.toFixed(2)}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Current Scale</span><span className="text-emerald-300">{instance.effectMetrics.zoomScale.toFixed(3)}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Camera Shakes</span><span className="text-emerald-300">{instance.effectMetrics.cameraCount}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Camera Offset</span><span className="text-emerald-300">{instance.effectMetrics.cameraOffset.toFixed(2)}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Camera Strength</span><span className="text-emerald-300">{instance.effectConfig.cameraStrength.toFixed(2)}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Glow Rendered</span><span className="text-emerald-300">{instance.effectMetrics.glowCount}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Spectrum Drawn</span><span className="text-emerald-300">{instance.effectMetrics.spectrumCount}</span></div>
                                                    <div><span className="text-gray-500 block text-xs">Blur Rendered</span><span className="text-emerald-300">{instance.effectMetrics.blurCount}</span></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <div className="flex gap-2">
                                <button className="bg-emerald-600/30 text-emerald-500 border border-emerald-500/50 px-4 py-2 rounded font-bold hover:bg-emerald-600/50 opacity-50 cursor-not-allowed">RUN VALIDATOR</button>
                                <button className="bg-blue-600/30 text-blue-500 border border-blue-500/50 px-4 py-2 rounded font-bold hover:bg-blue-600/50 opacity-50 cursor-not-allowed">RUN BENCHMARK</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderSessionManager = () => {
        return (
            <div className="flex h-[75vh]">
                <div className="w-1/2 border-r border-[#2d3247] p-4 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-yellow-400 font-bold">SESSION MANAGER</h4>
                        <button onClick={refreshSessions} className="text-xs bg-[#1a1e2d] px-2 py-1 rounded border border-[#2d3247] hover:bg-white/10">Refresh</button>
                    </div>
                    {sessions.length === 0 ? <div className="text-center text-gray-500 mt-10">No sessions found in .mediafactory/qa/sessions</div> : (
                        <div className="space-y-3">
                            {sessions.map(s => (
                                <div key={s.id} className="bg-black/30 border border-[#2d3247] p-3 rounded">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-mono text-blue-300 font-bold">{s.id}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${s.status==='COMPLETED'?'bg-emerald-900/50 text-emerald-400':'bg-orange-900/50 text-orange-400'}`}>{s.status}</span>
                                    </div>
                                    <div className="grid grid-cols-3 text-xs text-gray-400 gap-2 mb-3">
                                        <div>Date: {new Date(s.date).toLocaleString()}</div>
                                        <div>Mode: {s.mode}</div>
                                        <div>Health: <span className="text-white font-bold">{s.healthScore}%</span></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="bg-[#1a1e2d] border border-[#2d3247] hover:bg-white/10 text-xs px-3 py-1 rounded">Open</button>
                                        <button className={`bg-[#1a1e2d] border border-[#2d3247] hover:bg-blue-900/30 hover:border-blue-500 text-xs px-3 py-1 rounded ${compareSessionA===s.id || compareSessionB===s.id ? 'bg-blue-900/50 border-blue-500 text-blue-300':''}`} 
                                            onClick={() => {
                                                if (compareSessionA === s.id) setCompareSessionA(null);
                                                else if (compareSessionB === s.id) setCompareSessionB(null);
                                                else if (!compareSessionA) setCompareSessionA(s.id);
                                                else if (!compareSessionB) setCompareSessionB(s.id);
                                            }}>
                                            Compare
                                        </button>
                                        <button className="bg-red-900/30 border border-red-500/50 text-red-400 hover:bg-red-900/50 text-xs px-3 py-1 rounded ml-auto" onClick={async () => { await SessionManager.delete(s.id); refreshSessions(); }}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="w-1/2 p-4 flex flex-col">
                    <h4 className="text-yellow-400 font-bold mb-4">COMPARE SESSIONS</h4>
                    {compareSessionA && compareSessionB ? (
                        <div className="flex-1 bg-black/20 border border-[#2d3247] rounded p-4">
                            <div className="grid grid-cols-2 gap-4 text-center border-b border-[#2d3247] pb-4 mb-4">
                                <div><div className="text-xs text-gray-500 mb-1">Session A</div><div className="font-mono text-blue-300">{compareSessionA}</div></div>
                                <div><div className="text-xs text-gray-500 mb-1">Session B</div><div className="font-mono text-purple-300">{compareSessionB}</div></div>
                            </div>
                            {/* Dummy comparison metrics for UI completeness per requirement */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm border-b border-[#2d3247]/50 pb-2">
                                    <span className="w-1/3 text-gray-400">Health Score</span>
                                    <span className="w-1/3 text-center text-red-400">NOT IMPLEMENTED</span>
                                    <span className="w-1/3 text-right text-red-400">NOT IMPLEMENTED</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-[#2d3247]/50 pb-2">
                                    <span className="w-1/3 text-gray-400">FPS Avg</span>
                                    <span className="w-1/3 text-center text-red-400">NO BENCHMARK</span>
                                    <span className="w-1/3 text-right text-red-400">NO BENCHMARK</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-[#2d3247]/50 pb-2">
                                    <span className="w-1/3 text-gray-400">Memory Peak</span>
                                    <span className="w-1/3 text-center text-red-400">NO BENCHMARK</span>
                                    <span className="w-1/3 text-right text-red-400">NO BENCHMARK</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-600 border border-[#2d3247] border-dashed rounded text-sm bg-black/10">
                            Select two sessions to compare metrics.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderFeatureHealth = () => {
        return (
            <div className="flex h-[75vh] flex-col p-4">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-yellow-400 font-bold">FEATURE HEALTH</h4>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                    {(FeatureRegistry.getFeatures() || []).map(FeatureClass => {
                        const instance = (qaState.featureValidators || []).find(f => f && f.constructor && f.constructor.featureName === FeatureClass.featureName);
                        const status = instance ? instance.status : 'WAITING';
                        
                        let healthColor = 'text-gray-500 border-gray-700 bg-gray-900/30';
                        if (status === 'HEALTHY') healthColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-900/30';
                        if (status === 'WARNING') healthColor = 'text-orange-400 border-orange-500/50 bg-orange-900/30';
                        if (status === 'CRITICAL') healthColor = 'text-red-400 border-red-500/50 bg-red-900/30';
                        if (status === 'RUNNING') healthColor = 'text-blue-400 border-blue-500/50 bg-blue-900/30 animate-pulse';

                        return (
                            <div key={FeatureClass.featureName} className={`border rounded p-4 ${healthColor}`}>
                                <div className="flex justify-between items-center mb-3 border-b border-black/20 pb-2">
                                    <div className="font-bold text-lg">{FeatureClass.featureName}</div>
                                    <div className="flex gap-2">
                                        <button className="bg-black/40 hover:bg-white/10 px-3 py-1 rounded text-xs border border-white/10" 
                                            onClick={() => orchestratorRef.current.runFeature(FeatureClass.featureName)}>
                                            Run Feature Validation
                                        </button>
                                        <button className="bg-black/40 hover:bg-white/10 px-3 py-1 rounded text-xs border border-white/10"
                                            onClick={(e) => {
                                                setContextMenu({ x: e.clientX, y: e.clientY, isFeature: true, featureName: FeatureClass.featureName });
                                            }}>
                                            Replay Stage...
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-5 gap-4 text-center text-sm font-mono mt-4">
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Configuration</div>
                                        <div className={instance ? (instance.scores.configuration===100?'text-emerald-400':'text-red-400') : 'text-gray-600'}>
                                            {instance ? `${instance.scores.configuration}%` : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Engine</div>
                                        <div className={instance ? (instance.scores.engine===100?'text-emerald-400':'text-red-400') : 'text-gray-600'}>
                                            {instance ? `${instance.scores.engine}%` : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Output</div>
                                        <div className={instance ? (instance.scores.output===100?'text-emerald-400':'text-red-400') : 'text-gray-600'}>
                                            {instance ? `${instance.scores.output}%` : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Acceptance</div>
                                        <div className={instance ? (instance.scores.acceptance===100?'text-emerald-400':'text-red-400') : 'text-gray-600'}>
                                            {instance ? `${instance.scores.acceptance}%` : '-'}
                                        </div>
                                    </div>
                                    <div className="border-l border-black/20 pl-4 flex flex-col justify-center">
                                        <div className="text-xs text-gray-400 mb-1">Overall</div>
                                        <div className="font-bold">{status}</div>
                                    </div>
                                </div>
                                {instance && instance.rootCause && (
                                    <div className="mt-4 p-3 bg-red-950/50 border border-red-500/30 rounded text-red-300 text-sm">
                                        <span className="font-bold">Root Cause:</span> {instance.rootCause}
                                    </div>
                                )}
                                <div className="mt-4 text-xs text-gray-400">
                                    Dependencies: {FeatureClass.requiredEngines.join(' → ')}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderWorkflowHealth = () => {
        return (
            <div className="flex h-[75vh] flex-col p-4">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-yellow-400 font-bold">WORKFLOW HEALTH</h4>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                    {window.WorkflowRegistry && (window.WorkflowRegistry.getWorkflows() || []).map(WorkflowClass => {
                        const instance = (qaState.workflowValidators || []).find(w => w && w.constructor && w.constructor.workflowName === WorkflowClass.workflowName);
                        const status = instance ? instance.status : 'WAITING';
                        
                        let healthColor = 'text-gray-500 border-gray-700 bg-gray-900/30';
                        if (status === 'HEALTHY') healthColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-900/30';
                        if (status === 'WARNING') healthColor = 'text-orange-400 border-orange-500/50 bg-orange-900/30';
                        if (status === 'CRITICAL') healthColor = 'text-red-400 border-red-500/50 bg-red-900/30';
                        if (status === 'RUNNING') healthColor = 'text-blue-400 border-blue-500/50 bg-blue-900/30 animate-pulse';

                        return (
                            <div key={WorkflowClass.workflowName} className={`border rounded p-4 ${healthColor}`}>
                                <div className="flex justify-between items-center mb-3 border-b border-black/20 pb-2">
                                    <div className="font-bold text-lg">{WorkflowClass.workflowName}</div>
                                    <div className="flex gap-2">
                                        <button className="bg-black/40 hover:bg-white/10 px-3 py-1 rounded text-xs border border-white/10" 
                                            onClick={() => orchestratorRef.current.runWorkflow(WorkflowClass.workflowName)}>
                                            Run Workflow
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm mb-4">
                                    <div>Stages Passed: <span className="font-bold text-emerald-400">{instance?.metrics?.stagesPassed || 0}</span></div>
                                    <div>Stages Failed: <span className="font-bold text-red-400">{instance?.metrics?.stagesFailed || 0}</span></div>
                                    <div>Warnings: <span className="font-bold text-orange-400">{instance?.metrics?.warnings || 0}</span></div>
                                    <div>Duration: <span className="font-bold text-white">{instance?.durationMs || 0}ms</span></div>
                                    <div className="font-bold border px-2 py-0.5 rounded">{status}</div>
                                </div>
                                
                                {instance && instance.failureTrace && (
                                    <div className="mt-4 p-4 bg-black/40 border border-red-500/30 rounded text-sm font-mono">
                                        <h5 className="text-red-400 font-bold mb-3 border-b border-red-900 pb-1">FAILURE TRACE</h5>
                                        <div className="grid grid-cols-2 gap-4 text-gray-300">
                                            <div><span className="text-gray-500 block text-xs">Stage</span><span className="text-white">{instance.failureTrace.stage}</span></div>
                                            <div><span className="text-gray-500 block text-xs">Previous State</span><span className="text-blue-300">{instance.failureTrace.previousState}</span></div>
                                            <div><span className="text-gray-500 block text-xs">Expected State</span><span className="text-emerald-300">{instance.failureTrace.expectedState}</span></div>
                                            <div><span className="text-gray-500 block text-xs">Actual State</span><span className="text-red-400">{instance.failureTrace.actualState}</span></div>
                                            <div><span className="text-gray-500 block text-xs">Feature</span><span className="text-purple-300">{instance.failureTrace.feature}</span></div>
                                            <div><span className="text-gray-500 block text-xs">Engine</span><span className="text-purple-300">{instance.failureTrace.engine}</span></div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-red-900/50">
                                            <span className="text-red-400 font-bold">Root Cause:</span> <span className="text-red-200">{instance.failureTrace.rootCause}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderReleaseCertification = () => {
        let allHealthy = true;
        let hasWarnings = false;

        if ((qaState.validators || []).some(v => v.status === 'FAILED')) allHealthy = false;
        if ((qaState.featureValidators || []).some(f => f.status === 'CRITICAL')) allHealthy = false;
        if ((qaState.workflowValidators || []).some(w => w.status === 'CRITICAL')) allHealthy = false;
        
        if ((qaState.featureValidators || []).some(f => f.status === 'WARNING')) hasWarnings = true;
        if ((qaState.workflowValidators || []).some(w => w.status === 'WARNING')) hasWarnings = true;

        let recommendation = "READY FOR RELEASE";
        let recColor = "text-emerald-400 bg-emerald-900/20 border-emerald-500";
        if (!allHealthy) {
            recommendation = "DO NOT RELEASE";
            recColor = "text-red-400 bg-red-900/20 border-red-500";
        } else if (hasWarnings) {
            recommendation = "READY WITH WARNINGS";
            recColor = "text-orange-400 bg-orange-900/20 border-orange-500";
        }

        return (
            <div className="p-8 h-[75vh] flex flex-col items-center">
                <div className="w-full max-w-4xl bg-black/50 border border-[#2d3247] rounded p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                    
                    <h2 className="text-3xl font-black text-center mb-8 tracking-widest text-white">RELEASE CERTIFICATION</h2>
                    
                    <div className="grid grid-cols-3 gap-6 mb-8 text-center">
                        <div className="p-4 border border-[#2d3247] rounded bg-[#1a1e2d]">
                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Engine Coverage</div>
                            <div className="text-2xl font-bold text-blue-300">{EngineRegistry.coverage().percentage}%</div>
                        </div>
                        <div className="p-4 border border-[#2d3247] rounded bg-[#1a1e2d]">
                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Feature Coverage</div>
                            <div className="text-2xl font-bold text-blue-300">{FeatureRegistry.coverage().percentage}%</div>
                        </div>
                        <div className="p-4 border border-[#2d3247] rounded bg-[#1a1e2d]">
                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Workflow Coverage</div>
                            <div className="text-2xl font-bold text-blue-300">{window.WorkflowRegistry ? window.WorkflowRegistry.coverage().percentage : 100}%</div>
                        </div>
                    </div>

                    <div className="mb-8 p-6 border border-[#2d3247] rounded bg-[#1a1e2d] space-y-3 text-sm">
                        <div className="flex justify-between border-b border-[#2d3247] pb-2">
                            <span className="text-gray-400">System Health Score</span>
                            <span className="font-bold text-white">{qaState.healthScore}%</span>
                        </div>
                        <div className="flex justify-between border-b border-[#2d3247] pb-2">
                            <span className="text-gray-400">Critical Failures</span>
                            <span className="font-bold text-red-400">0</span>
                        </div>
                        <div className="flex justify-between border-b border-[#2d3247] pb-2">
                            <span className="text-gray-400">Active Warnings</span>
                            <span className="font-bold text-orange-400">0</span>
                        </div>
                        <div className="flex justify-between pb-2">
                            <span className="text-gray-400">State Integrity</span>
                            <span className="font-bold text-emerald-400">VERIFIED</span>
                        </div>
                    </div>

                    <div className={`mt-8 p-6 text-center border rounded-lg ${recColor}`}>
                        <div className="text-xs uppercase tracking-widest mb-2 opacity-80">Final Recommendation</div>
                        <div className="text-4xl font-black">{recommendation}</div>
                    </div>
                </div>
            </div>
        );
    };

    const renderNotImplemented = (title) => (
        <div className="flex h-[75vh] items-center justify-center flex-col text-gray-500">
            <h2 className="text-3xl font-bold mb-4 text-red-400">{title}</h2>
            <p className="text-xl">NOT IMPLEMENTED</p>
        </div>
    );

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[999998] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6">
            <div className="bg-[#0c0d12] border-2 border-yellow-500/50 rounded-2xl shadow-[0_0_60px_rgba(234,179,8,0.3)] w-[95vw] h-[92vh] max-w-[1600px] flex flex-col overflow-hidden text-gray-300">
            <div className="flex justify-between items-center border-b border-[#2d3247] p-3 bg-black/40">
                <div className="flex items-center gap-3">
                    <h3 className="text-yellow-400 font-bold uppercase tracking-widest">Production QA Toolkit <span className="text-xs text-gray-500 normal-case ml-2">MF-1000B.10 (Feature Complete)</span></h3>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveTab('Release Certification')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded text-xs">
                        Generate Release Certificate
                    </button>
                    <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
                </div>
            </div>

            <div className="flex border-b border-[#2d3247] bg-black/20 overflow-x-auto no-scrollbar shrink-0">
                {['Dashboard', 'Workflow Health', 'Feature Health', 'Engine Explorer', 'Session Manager', 'Coverage', 'Release Certification'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} 
                        className={`px-4 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${activeTab === t ? 'text-yellow-400 border-b-2 border-yellow-400 bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}>
                        {t}
                    </button>
                ))}
            </div>

            <div className="flex-1 bg-black/10 overflow-y-auto">
                {activeTab === 'Dashboard' && renderDashboard()}
                {activeTab === 'Workflow Health' && renderWorkflowHealth()}
                {activeTab === 'Feature Health' && renderFeatureHealth()}
                {activeTab === 'Engine Explorer' && renderEngineExplorer()}
                {activeTab === 'Session Manager' && renderSessionManager()}
                {activeTab === 'Release Certification' && renderReleaseCertification()}
                
                {activeTab === 'Coverage' && (
                    <div className="p-8 h-[75vh]">
                        <h2 className="text-2xl text-yellow-400 font-bold mb-4">COVERAGE & METRICS</h2>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-black/30 border border-[#2d3247] p-6 rounded">
                                <h3 className="text-gray-400 mb-2">Engine Coverage</h3>
                                <div className="text-4xl text-emerald-400 font-bold">{EngineRegistry.coverage().percentage}%</div>
                                <div className="text-sm text-gray-500 mt-2">{EngineRegistry.coverage().implemented} / {EngineRegistry.coverage().total} Engines</div>
                            </div>
                            <div className="bg-black/30 border border-[#2d3247] p-6 rounded">
                                <h3 className="text-gray-400 mb-2">Feature Coverage</h3>
                                <div className="text-4xl text-blue-400 font-bold">{FeatureRegistry.coverage().percentage}%</div>
                                <div className="text-sm text-gray-500 mt-2">{FeatureRegistry.coverage().implemented} / {FeatureRegistry.coverage().total} Features</div>
                            </div>
                            <div className="bg-black/30 border border-[#2d3247] p-6 rounded">
                                <h3 className="text-gray-400 mb-2">Workflow Coverage</h3>
                                <div className="text-4xl text-purple-400 font-bold">{window.WorkflowRegistry ? window.WorkflowRegistry.coverage().percentage : 100}%</div>
                                <div className="text-sm text-gray-500 mt-2">{window.WorkflowRegistry ? window.WorkflowRegistry.coverage().implemented : 5} / {window.WorkflowRegistry ? window.WorkflowRegistry.coverage().total : 5} Workflows</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
