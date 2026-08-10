import React, { useState, useEffect, useRef } from 'react';
import { renderFrameStore } from '../../services/pipeline/runtime/RenderFrameStore';
import { reactiveObjectProcessor } from '../../services/audio/ReactiveObjectProcessor';

export default function M3DiagnosticsPanel({ m3Objects, setM3Objects }) {
    const [visible, setVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('Pipeline');
    const [telemetry, setTelemetry] = useState(null);
    const [recording, setRecording] = useState(false);
    const [selectedObjectTrace, setSelectedObjectTrace] = useState(null);
    
    const recordedData = useRef([]);
    const historyRef = useRef({
        frames: [],
        channels: {},
        lastUpdate: performance.now()
    });

    // Hotkey listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                setVisible(v => !v);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Telemetry polling and history
    useEffect(() => {
        if (!visible && !recording) return;

        let frameId;
        
        const loop = (time) => {
            frameId = requestAnimationFrame(loop);
            
            const stats = window.m3Diagnostics || {};
            
            // Use formal renderFrameStore
            const renderFrame = renderFrameStore.getFrame();
            const debugState = renderFrame?.debug || {};
            
            const beat = debugState.beat || {};
            const reactiveChannels = debugState.reactive || {};
            
            const reactiveObjVals = reactiveObjectProcessor.getValues();
            const reactiveDiagnostics = reactiveObjectProcessor.getDiagnostics();
            const domOutputs = stats.domOutputs || {};

            // Record rolling history for 300 frames
            const frame = {
                t: time,
                beatTime: stats.beatTime || 0,
                reactiveTime: stats.reactiveTime || 0,
                processorTime: stats.processorTime || 0,
                renderTime: stats.renderTime || 0,
                frameTotal: (stats.beatTime || 0) + (stats.reactiveTime || 0) + (stats.processorTime || 0) + (stats.renderTime || 0)
            };
            
            const hist = historyRef.current;
            hist.frames.push(frame);
            if (hist.frames.length > 300) hist.frames.shift();

            // Channel Min/Max/Avg tracking
            for (const [key, val] of Object.entries(reactiveChannels)) {
                if (!hist.channels[key]) hist.channels[key] = { min: 1, max: 0, sum: 0, count: 0, peak: 0 };
                const ch = hist.channels[key];
                if (val < ch.min) ch.min = val;
                if (val > ch.max) ch.max = val;
                if (val > ch.peak) ch.peak = val;
                // Decay peak slightly
                ch.peak *= 0.999;
                ch.sum += val;
                ch.count++;
            }

            // High-frequency recording
            if (recording) {
                recordedData.current.push({
                    timestamp: time,
                    frameNumber: stats.frameNumber,
                    beatState: { ...beat },
                    reactiveChannels: { ...reactiveChannels },
                    reactiveObjects: Array.from(reactiveDiagnostics.entries()),
                    domOutputs: { ...domOutputs },
                    perf: { ...stats }
                });

                if (recordedData.current.length >= 600) stopRecording();
            }

            // UI Update at ~10Hz
            if (time - hist.lastUpdate > 100) {
                // Calculate moving averages for pipeline
                const recent120 = hist.frames.slice(-120);
                const calcAvg = (key) => recent120.reduce((acc, f) => acc + f[key], 0) / Math.max(recent120.length, 1);
                const calcMax = (key) => Math.max(...recent120.map(f => f[key]));
                const calcMin = (key) => Math.min(...recent120.map(f => f[key]));

                const pipeline = [
                    { name: 'BeatEngine', avg: calcAvg('beatTime'), min: calcMin('beatTime'), max: calcMax('beatTime'), cur: frame.beatTime },
                    { name: 'ReactiveEngine', avg: calcAvg('reactiveTime'), min: calcMin('reactiveTime'), max: calcMax('reactiveTime'), cur: frame.reactiveTime },
                    { name: 'Processor', avg: calcAvg('processorTime'), min: calcMin('processorTime'), max: calcMax('processorTime'), cur: frame.processorTime },
                    { name: 'Renderer', avg: calcAvg('renderTime'), min: calcMin('renderTime'), max: calcMax('renderTime'), cur: frame.renderTime },
                    { name: 'Total', avg: calcAvg('frameTotal'), min: calcMin('frameTotal'), max: calcMax('frameTotal'), cur: frame.frameTotal }
                ];

                const channels = Object.keys(reactiveChannels).map(k => {
                    const ch = hist.channels[k];
                    return {
                        name: k,
                        current: reactiveChannels[k],
                        peak: ch.peak,
                        min: ch.min,
                        max: ch.max,
                        avg: ch.sum / Math.max(ch.count, 1)
                    };
                });

                const rObjArray = [];
                for (const [id, diag] of reactiveDiagnostics.entries()) {
                    rObjArray.push({ id, ...diag });
                }

                setTelemetry({
                    pipeline,
                    channels,
                    objects: rObjArray,
                    dom: domOutputs,
                    fps: stats.fps || 0,
                    frameNumber: stats.frameNumber || 0,
                    history: [...hist.frames]
                });
                
                hist.lastUpdate = time;
            }
        };

        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [visible, recording]);

    const startRecording = () => {
        recordedData.current = [];
        setRecording(true);
    };

    const stopRecording = () => {
        setRecording(false);
        const dataStr = JSON.stringify(recordedData.current, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reactive_validation_recording.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleStressTest = (count) => {
        if (!setM3Objects) return;
        const newObjs = [];
        for(let i=0; i<count; i++) {
            newObjs.push({
                id: `stress_${Date.now()}_${i}`,
                type: 'reactive',
                effect: i % 2 === 0 ? 'Zoom Pulse' : 'Camera Shake',
                source: i % 3 === 0 ? 'kick' : 'energy',
                enabled: true,
                operation: 'multiply',
                curve: 'easeOut',
                amplitude: Math.random() * 100,
                threshold: Math.random() * 50,
                attack: 10 + Math.random() * 100,
                release: 100 + Math.random() * 500,
                smoothness: 50
            });
        }
        setM3Objects(prev => [...prev, ...newObjs]);
    };

    if (!visible || !telemetry) return null;

    const renderSparkline = (key, color) => {
        const h = telemetry.history;
        if (h.length === 0) return null;
        const maxVal = Math.max(...h.map(f => f[key]), 1);
        return (
            <div className="flex items-end h-8 gap-[1px] opacity-80 mt-1">
                {h.slice(-100).map((f, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ backgroundColor: color, height: `${(f[key] / maxVal) * 100}%` }} />
                ))}
            </div>
        );
    };

    return (
        <div className="fixed top-4 right-4 w-[450px] bg-[#0c0d12]/95 backdrop-blur-xl border border-[#2d3247] rounded-lg text-gray-300 font-mono text-[10px] z-[9999] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-[#2d3247] p-3 bg-black/40 rounded-t-lg">
                <div className="flex items-center gap-3">
                    <h3 className="text-blue-400 font-bold uppercase tracking-widest text-xs">Reactive Validation QA</h3>
                    <span className="bg-[#2d3247] text-[9px] px-1.5 py-0.5 rounded text-gray-400">Frame {telemetry.frameNumber}</span>
                </div>
                <button onClick={() => setVisible(false)} className="text-gray-400 hover:text-white text-lg leading-none">&times;</button>
            </div>

            <div className="flex border-b border-[#2d3247] bg-black/20 overflow-x-auto no-scrollbar shrink-0">
                {['Pipeline', 'Channels', 'Objects', 'Renderer', 'Trace', 'Stress'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 font-bold whitespace-nowrap ${activeTab === t ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>{t}</button>
                ))}
            </div>

            <div className="p-3 overflow-y-auto custom-scrollbar flex-1 relative">
                {activeTab === 'Pipeline' && (
                    <div className="space-y-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-500 border-b border-[#2d3247]">
                                    <th className="py-1">Stage</th>
                                    <th>Cur</th>
                                    <th>Avg</th>
                                    <th>Min</th>
                                    <th>Max</th>
                                </tr>
                            </thead>
                            <tbody>
                                {telemetry.pipeline.map(p => (
                                    <tr key={p.name} className="border-b border-[#2d3247]/50 hover:bg-white/5">
                                        <td className={`py-1 font-bold ${p.name === 'Total' ? 'text-white' : 'text-blue-300'}`}>{p.name}</td>
                                        <td>{p.cur.toFixed(2)}ms</td>
                                        <td>{p.avg.toFixed(2)}ms</td>
                                        <td className="text-green-400">{p.min.toFixed(2)}ms</td>
                                        <td className="text-red-400">{p.max.toFixed(2)}ms</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div>
                            <h4 className="text-gray-500 mb-1">Frame Total Time (300f History)</h4>
                            {renderSparkline('frameTotal', '#60a5fa')}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <h4 className="text-gray-500 text-[9px]">BeatEngine</h4>
                                {renderSparkline('beatTime', '#4ade80')}
                            </div>
                            <div>
                                <h4 className="text-gray-500 text-[9px]">Processor</h4>
                                {renderSparkline('processorTime', '#a78bfa')}
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-blue-900/20 p-2 rounded border border-blue-500/30">
                            <span className="text-blue-300">JSON Exporter</span>
                            <button 
                                onClick={recording ? stopRecording : startRecording}
                                className={`px-2 py-1 rounded border font-bold ${recording ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-[#2d3247] border-[#2d3247] text-white hover:border-blue-500'}`}
                            >
                                {recording ? `RECORDING (${Math.round((recordedData.current.length / 600) * 100)}%)` : 'START RECORD'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'Channels' && (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-500 border-b border-[#2d3247]">
                                <th className="py-1">Channel</th>
                                <th>Cur</th>
                                <th>Peak</th>
                                <th>Avg</th>
                                <th>Min</th>
                                <th>Max</th>
                            </tr>
                        </thead>
                        <tbody>
                            {telemetry.channels.map(c => (
                                <tr key={c.name} className="border-b border-[#2d3247]/50 hover:bg-white/5">
                                    <td className="py-1 text-cyan-300">{c.name}</td>
                                    <td className="text-white font-bold">{c.current.toFixed(2)}</td>
                                    <td className="text-orange-300">{c.peak.toFixed(2)}</td>
                                    <td className="text-gray-400">{c.avg.toFixed(2)}</td>
                                    <td className="text-gray-500">{c.min.toFixed(2)}</td>
                                    <td className="text-gray-500">{c.max.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'Objects' && (
                    <div className="space-y-2">
                        {telemetry.objects.length === 0 ? <div className="text-gray-500 text-center py-4">No active reactive objects.</div> : null}
                        {telemetry.objects.map(obj => (
                            <div key={obj.id} className="bg-black/30 border border-[#2d3247] rounded p-2" onClick={() => { setSelectedObjectTrace(obj); setActiveTab('Trace'); }} style={{cursor: 'pointer'}}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-purple-400 font-bold truncate max-w-[150px]" title={obj.id}>{obj.id}</span>
                                    <span className="bg-[#2d3247] text-gray-300 px-1 rounded text-[9px] uppercase">{obj.config.effect} ({obj.config.source})</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-[#2d3247]/50 text-[9px]">
                                    <div><div className="text-gray-500">Raw</div><div className="text-white">{obj.rawInput.toFixed(3)}</div></div>
                                    <div><div className="text-gray-500">Thresh</div><div className="text-gray-300">{obj.thresholdOutput.toFixed(3)}</div></div>
                                    <div><div className="text-gray-500">Env</div><div className="text-orange-300">{obj.envelopeOutput.toFixed(3)}</div></div>
                                    <div><div className="text-gray-500">Final</div><div className="text-green-400 font-bold">{obj.finalOutput.toFixed(3)}</div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'Renderer' && (
                    <div className="space-y-3">
                        <div className="bg-black/30 border border-[#2d3247] rounded p-2">
                            <h4 className="text-gray-400 font-bold mb-2 border-b border-[#2d3247] pb-1">DOM Transform</h4>
                            <div className="grid grid-cols-2 gap-2 text-white">
                                <span className="text-gray-500">Scale</span> <span className="text-right">{telemetry.dom.scale?.toFixed(4)}</span>
                                <span className="text-gray-500">Translate X</span> <span className="text-right">{telemetry.dom.translateX?.toFixed(2)}px</span>
                                <span className="text-gray-500">Translate Y</span> <span className="text-right">{telemetry.dom.translateY?.toFixed(2)}px</span>
                            </div>
                            <div className="mt-2 text-gray-500 text-[8px] break-all">{telemetry.dom.transform}</div>
                        </div>

                        <div className="bg-black/30 border border-[#2d3247] rounded p-2">
                            <h4 className="text-gray-400 font-bold mb-2 border-b border-[#2d3247] pb-1">DOM Filter</h4>
                            <div className="grid grid-cols-2 gap-2 text-white">
                                <span className="text-gray-500">Brightness</span> <span className="text-right">{telemetry.dom.brightness?.toFixed(1)}%</span>
                                <span className="text-gray-500">Contrast</span> <span className="text-right">{telemetry.dom.contrast?.toFixed(1)}%</span>
                                <span className="text-gray-500">Saturation</span> <span className="text-right">{telemetry.dom.saturation?.toFixed(1)}%</span>
                                <span className="text-gray-500">Blur</span> <span className="text-right">{telemetry.dom.blur?.toFixed(2)}px</span>
                            </div>
                            <div className="mt-2 text-gray-500 text-[8px] break-all">{telemetry.dom.filter}</div>
                        </div>
                    </div>
                )}

                {activeTab === 'Trace' && (
                    <div className="space-y-4">
                        {!selectedObjectTrace ? (
                            <div className="text-gray-500 text-center py-4">Click an object in the 'Objects' tab to view its trace.</div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-full bg-[#1e293b] border border-blue-500/50 rounded p-2 text-center">
                                    <div className="text-blue-300 font-bold">BeatEngine</div>
                                    <div className="text-gray-400 text-[9px] uppercase">{selectedObjectTrace.config.source} Band Extracted</div>
                                </div>
                                <div className="text-gray-500 my-1">↓</div>
                                <div className="w-full bg-[#1e293b] border border-blue-500/50 rounded p-2 text-center">
                                    <div className="text-blue-300 font-bold">ReactiveEngine</div>
                                    <div className="text-white text-lg font-bold">{selectedObjectTrace.rawInput.toFixed(3)}</div>
                                </div>
                                <div className="text-gray-500 my-1">↓</div>
                                <div className="w-full bg-[#312e81] border border-indigo-500/50 rounded p-2 text-center">
                                    <div className="text-indigo-300 font-bold mb-1">ReactiveObjectProcessor</div>
                                    <div className="grid grid-cols-2 gap-1 text-left bg-black/30 p-1 rounded">
                                        <span className="text-gray-400">Threshold ({selectedObjectTrace.config.threshold})</span>
                                        <span className="text-right text-gray-300">{selectedObjectTrace.thresholdOutput.toFixed(3)}</span>
                                        
                                        <span className="text-gray-400">Envelope (A:{selectedObjectTrace.config.attack} R:{selectedObjectTrace.config.release})</span>
                                        <span className="text-right text-orange-300">{selectedObjectTrace.envelopeOutput.toFixed(3)}</span>
                                        
                                        <span className="text-gray-400">Curve & Amplitude</span>
                                        <span className="text-right text-green-400 font-bold text-sm">{selectedObjectTrace.finalOutput.toFixed(3)}</span>
                                    </div>
                                </div>
                                <div className="text-gray-500 my-1">↓</div>
                                <div className="w-full bg-[#14532d] border border-green-500/50 rounded p-2 text-center">
                                    <div className="text-green-300 font-bold">RealtimeEffectRenderer</div>
                                    <div className="text-gray-400 text-[9px]">Translates {selectedObjectTrace.finalOutput.toFixed(3)} to DOM Modifiers</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Stress' && (
                    <div className="space-y-4">
                        <div className="text-gray-400">Spawn multiple randomized reactive objects to test engine scaling and UI freezing.</div>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleStressTest(10)} className="bg-[#1e293b] hover:bg-blue-900 border border-[#2d3247] p-2 rounded text-white">Spawn 10</button>
                            <button onClick={() => handleStressTest(25)} className="bg-[#1e293b] hover:bg-blue-900 border border-[#2d3247] p-2 rounded text-white">Spawn 25</button>
                            <button onClick={() => handleStressTest(50)} className="bg-[#1e293b] hover:bg-blue-900 border border-[#2d3247] p-2 rounded text-white">Spawn 50</button>
                            <button onClick={() => handleStressTest(100)} className="bg-red-900 hover:bg-red-800 border border-red-500 p-2 rounded text-white font-bold">Spawn 100</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
