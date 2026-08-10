import React, { useState, useEffect } from 'react';
import { beatDebuggerCore } from '../../../services/debug/BeatDebuggerCore';
import { visualRuntime } from '../../../services/visual/VisualRuntime';
import MFBenchmarkRunner from './MFBenchmarkRunner';
import { subtitleEditorService } from '../../../services/audio/subtitle/SubtitleEditorService';

export default function BeatDebuggerPanel() {
    const [snapshot, setSnapshot] = useState(null);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        beatDebuggerCore.start();
        const unsubscribe = beatDebuggerCore.subscribe((data) => {
            setSnapshot(data);
        });

        return () => {
            unsubscribe();
            beatDebuggerCore.stop();
        };
    }, []);

    const handleToggleRecord = () => {
        if (isRecording) {
            beatDebuggerCore.stopRecording();
            setIsRecording(false);
        } else {
            beatDebuggerCore.startRecording();
            setIsRecording(true);
        }
    };

    const handleExportJSON = () => {
        const data = beatDebuggerCore.exportJSON();
        beatDebuggerCore.triggerDownload(data, `beat_debug_${Date.now()}.json`, 'application/json');
    };

    const handleExportCSV = () => {
        const data = beatDebuggerCore.exportCSV();
        beatDebuggerCore.triggerDownload(data, `beat_debug_${Date.now()}.csv`, 'text/csv');
    };

    const handleExportTXT = () => {
        const data = beatDebuggerCore.exportTXT();
        beatDebuggerCore.triggerDownload(data, `beat_debug_${Date.now()}.txt`, 'text/plain');
    };

    const handleExportProof = () => {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            alert('No canvas found to record!');
            return;
        }
        
        const stream = canvas.captureStream(60);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks = [];
        
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `MF-305A-Glow-Proof-${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        
        recorder.start();
        setTimeout(() => recorder.stop(), 5000); // Record for 5 seconds
    };

    if (!snapshot) {
        return <div className="p-4 text-gray-500">Waiting for BeatEngine data...</div>;
    }

    const { beatState, adapterState, system } = snapshot;

    return (
        <div className="bg-gray-900 text-gray-200 p-4 rounded-lg shadow-lg font-mono text-xs w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h2 className="text-lg font-bold text-white">MF-203 Beat Debugger Core</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={handleToggleRecord} 
                        className={`px-3 py-1 rounded font-bold ${isRecording ? 'bg-red-600 animate-pulse text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                        {isRecording ? '● RECORDING' : '○ RECORD'}
                    </button>
                    <button onClick={handleExportJSON} disabled={isRecording || beatDebuggerCore.logData.length === 0} className="px-2 py-1 bg-blue-600 rounded disabled:opacity-50">JSON</button>
                    <button onClick={handleExportCSV} disabled={isRecording || beatDebuggerCore.logData.length === 0} className="px-2 py-1 bg-green-600 rounded disabled:opacity-50">CSV</button>
                    <button onClick={handleExportTXT} disabled={isRecording || beatDebuggerCore.logData.length === 0} className="px-2 py-1 bg-purple-600 rounded disabled:opacity-50">TXT</button>
                    <button onClick={handleExportProof} className="px-2 py-1 bg-pink-600 text-white rounded shadow-[0_0_10px_rgba(219,39,119,0.5)] font-bold">Proof (WebM)</button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* System Section */}
                <div className="bg-black/30 p-3 rounded">
                    <h3 className="text-blue-400 font-bold mb-2 uppercase border-b border-blue-900/50">System</h3>
                    <div className="flex justify-between"><span className="text-gray-500">Update Rate</span><span className="text-blue-300">{system.updateRate.toFixed(1)} FPS</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Frame Time</span><span>{system.frameTime.toFixed(2)} ms</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Latency</span><span>{system.latency.toFixed(2)} ms</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Thread Load</span><span className={system.cpuLoad > 80 ? "text-red-400 font-bold" : "text-gray-300"}>{system.cpuLoad.toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Memory</span><span className="text-gray-300">{system.memoryUsedMB > 0 ? system.memoryUsedMB.toFixed(1) + ' MB' : 'N/A'}</span></div>
                </div>

                {/* Adapter Section */}
                <div className="bg-black/30 p-3 rounded">
                    <h3 className="text-orange-400 font-bold mb-2 uppercase border-b border-orange-900/50">Audio Driven Adapter</h3>
                    <div className="flex justify-between"><span className="text-gray-500">Impulse</span><span className="text-white">{adapterState.impulse.toFixed(3)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Accent</span><span>{adapterState.accent.toFixed(3)}</span></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mt-4 text-sm font-mono text-gray-300">
                <div className="bg-gray-800 p-2 rounded col-span-2 md:col-span-4 border border-purple-900/50">
                    <div className="text-purple-400 mb-1 font-bold">Visual Composition (Aggregated)</div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                            <div className="text-gray-500 underline mb-1">Transform</div>
                            <div className="flex justify-between"><span>Scale:</span><span className="text-white">{snapshot.visual.transform.scale.toFixed(3)}</span></div>
                            <div className="flex justify-between"><span>Rotation:</span><span className="text-white">{snapshot.visual.transform.rotation.toFixed(3)}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Camera</div>
                            <div className="flex justify-between"><span>Zoom:</span><span className="text-white">{snapshot.visual.camera.zoom.toFixed(3)}</span></div>
                            <div className="flex justify-between"><span>ShakeX:</span><span className="text-white">{snapshot.visual.camera.shakeX.toFixed(3)}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">PostProcess</div>
                            <div className="flex justify-between"><span>Glow:</span><span className="text-white">{snapshot.visual.postProcess.glowIntensity.toFixed(3)}</span></div>
                            <div className="flex justify-between"><span>Blur:</span><span className="text-white">{snapshot.visual.postProcess.blur.toFixed(3)}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Overlay</div>
                            <div className="flex justify-between"><span>Opacity:</span><span className="text-white">{snapshot.visual.overlay.opacity.toFixed(3)}</span></div>
                            <div className="flex justify-between text-yellow-300 mt-1"><span>Active Effects:</span></div>
                            <div className="text-yellow-200">{snapshot.visual.activeEffects.length > 0 ? snapshot.visual.activeEffects.join(', ') : 'None'}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 p-2 rounded">
                    <div className="text-gray-500 mb-1">Time & Frame</div>
                    <div>T: {(snapshot.timestamp / 1000).toFixed(2)}s</div>
                    <div>BPM: {snapshot.beatState.bpm.toFixed(1)}</div>
                    <div>FPS: {snapshot.system.updateRate.toFixed(1)}</div>
                    <div>Latency: {snapshot.system.latency.toFixed(2)}ms</div>
                </div>

                <div className="bg-gray-800 p-2 rounded">
                    <div className="text-gray-500 mb-1">Beat Energy</div>
                    <div className={snapshot.beatState.downbeat ? "text-red-400 font-bold" : "text-white"}>
                        DWNBT: {snapshot.beatState.downbeat ? 'YES' : 'NO'}
                    </div>
                    <div className={snapshot.beatState.beat ? "text-yellow-400 font-bold" : "text-white"}>
                        BEAT: {snapshot.beatState.beat ? 'YES' : 'NO'}
                    </div>
                    <div>Kick: {snapshot.beatState.kick.toFixed(2)}</div>
                    <div>Conf: {snapshot.beatState.confidence.toFixed(2)}</div>
                </div>

                <div className="bg-gray-800 p-2 rounded">
                    <div className="text-gray-500 mb-1 flex justify-between items-center">
                        <span>Musical Feel</span>
                    </div>
                    <div>Punch: {snapshot.musicalFeel?.punch.toFixed(2)}</div>
                    <div>Sustain: {snapshot.musicalFeel?.sustain.toFixed(2)}</div>
                    <div>Agility: {snapshot.musicalFeel?.agility.toFixed(2)}</div>
                    <div>Groove: {snapshot.musicalFeel?.groove.toFixed(2)}</div>
                </div>

                <div className="bg-gray-800 p-2 rounded border border-orange-900/50 col-span-2 md:col-span-4 mt-2">
                    <div className="text-orange-400 mb-1 font-bold flex justify-between items-center">
                        <span>Subtitle Pipeline</span>
                    </div>
                    <div className="grid grid-cols-6 gap-2 text-xs">
                        <div>
                            <div className="text-gray-500 underline mb-1">State</div>
                            <div className="flex justify-between"><span>Cache Hit:</span><span className={snapshot.subtitle.cacheHit ? "text-green-300 font-bold" : "text-white"}>{snapshot.subtitle.cacheHit ? "YES" : "NO"}</span></div>
                            <div className="flex justify-between"><span>Layout Cache:</span><span className={snapshot.subtitle.diagnostics?.layoutCacheHit ? "text-green-300 font-bold" : "text-white"}>{snapshot.subtitle.diagnostics?.layoutCacheHit ? "HIT" : "MISS"}</span></div>
                            <div className="flex justify-between"><span>Lang:</span><span className="text-white">{snapshot.subtitle.language}</span></div>
                            <div className="flex justify-between"><span>Style:</span><span className="text-white text-[10px]">{snapshot.subtitle.style || 'Classic'}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Lines</div>
                            <div className="flex justify-between"><span>Prev:</span><span className="text-white truncate max-w-[60px]" title={snapshot.subtitle.previousLine ? snapshot.subtitle.previousLine.map(w=>w.word).join(' ') : "-"}>{snapshot.subtitle.previousLine ? snapshot.subtitle.previousLine.map(w=>w.word).join(' ') : "-"}</span></div>
                            <div className="flex justify-between"><span>Curr:</span><span className="text-white truncate max-w-[60px]" title={snapshot.subtitle.currentLine ? snapshot.subtitle.currentLine.map(w=>w.word).join(' ') : "-"}>{snapshot.subtitle.currentLine ? snapshot.subtitle.currentLine.map(w=>w.word).join(' ') : "-"}</span></div>
                            <div className="flex justify-between"><span>Next:</span><span className="text-white truncate max-w-[60px]" title={snapshot.subtitle.nextLine ? snapshot.subtitle.nextLine.map(w=>w.word).join(' ') : "-"}>{snapshot.subtitle.nextLine ? snapshot.subtitle.nextLine.map(w=>w.word).join(' ') : "-"}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Animation</div>
                            <div className="flex justify-between"><span>Phase:</span><span className="text-white">{snapshot.subtitle.animationState?.phase}</span></div>
                            <div className="flex justify-between"><span>Progress:</span><span className="text-white">{snapshot.subtitle.animationState?.progress?.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Lines:</span><span className="text-white">{snapshot.subtitle.styleState?.displayLines?.length || 0}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Indices</div>
                            <div className="flex justify-between"><span>Segment:</span><span className="text-white">{snapshot.subtitle.segmentIndex}</span></div>
                            <div className="flex justify-between"><span>Word:</span><span className="text-white">{snapshot.subtitle.wordIndex}</span></div>
                            <div className="flex justify-between"><span>Line:</span><span className="text-white">{snapshot.subtitle.currentLineIndex}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Performance</div>
                            <div className="flex justify-between"><span>Lookup:</span><span className="text-white">{snapshot.subtitle.diagnostics?.lookupTimeMicroseconds?.toFixed(1) || 0} us</span></div>
                            <div className="flex justify-between"><span>Layout:</span><span className="text-white">{snapshot.subtitle.diagnostics?.layoutTimeMicroseconds?.toFixed(1) || 0} us</span></div>
                            <div className="flex justify-between"><span>Anim:</span><span className="text-white">{snapshot.subtitle.diagnostics?.animationTimeMicroseconds?.toFixed(1) || 0} us</span></div>
                            <div className="flex justify-between"><span>Style:</span><span className="text-white">{snapshot.subtitle.diagnostics?.styleTimeMicroseconds?.toFixed(1) || 0} us</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Editor State</div>
                            <div className="flex justify-between"><span>Mode:</span><span className="text-white">{subtitleEditorService.getState().editMode}</span></div>
                            <div className="flex justify-between"><span>Sel Seg:</span><span className="text-white">{subtitleEditorService.getState().selectedSegmentIndex}</span></div>
                            <div className="flex justify-between"><span>Dirty:</span><span className={subtitleEditorService.getState().isDirty ? "text-yellow-400 font-bold" : "text-white"}>{subtitleEditorService.getState().isDirty ? "YES" : "NO"}</span></div>
                            <div className="flex justify-between"><span>Undo Sz:</span><span className="text-white">{subtitleEditorService.getState().undoStackSize}</span></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 p-2 rounded border border-pink-900/50 mt-2">
                    <div className="text-pink-400 mb-1 font-bold flex justify-between items-center">
                        <span>Zoom Pipeline</span>
                        <select 
                            onChange={(e) => visualRuntime.setZoomStyle(e.target.value)} 
                            className="bg-gray-700 text-xs px-1 py-0.5 rounded outline-none border border-gray-600"
                            defaultValue="Default"
                        >
                            <option value="Default">Default</option>
                            <option value="EDM">EDM</option>
                            <option value="Rock">Rock</option>
                            <option value="Pop">Pop</option>
                            <option value="LoFi">LoFi</option>
                            <option value="Cinematic">Cinematic</option>
                        </select>
                    </div>
                    <div className="flex justify-between">
                        <span>Scale (Internal):</span>
                        <span className="text-white">{snapshot.visual.transform.scale.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>State:</span>
                        <span className={snapshot.visual.zoomState !== 'IDLE' ? 'text-pink-300 font-bold' : ''}>{snapshot.visual.zoomState}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Adaptive Timing:</div>
                    <div className="flex justify-between text-xs">
                        <span>Atk: {(snapshot.visual.adaptiveAttack * 1000).toFixed(0)}ms</span>
                        <span>Dec: {(snapshot.visual.adaptiveDecay * 1000).toFixed(0)}ms</span>
                    </div>
                </div>

                <div className="bg-gray-800 p-2 rounded border border-yellow-900/50">
                    <div className="text-yellow-400 mb-1 font-bold flex justify-between items-center">
                        <span>Glow Pipeline</span>
                        <select 
                            onChange={(e) => visualRuntime.setGlowStyle(e.target.value)} 
                            className="bg-gray-700 text-xs px-1 py-0.5 rounded outline-none border border-gray-600"
                            defaultValue="Default"
                        >
                            <option value="Default">Default</option>
                            <option value="EDM">EDM</option>
                            <option value="Rock">Rock</option>
                            <option value="Pop">Pop</option>
                            <option value="LoFi">LoFi</option>
                            <option value="Cinematic">Cinematic</option>
                        </select>
                    </div>
                    <div className="flex justify-between">
                        <span>Intensity:</span>
                        <span className="text-white">{snapshot.visual.postProcess.glowIntensity.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Radius:</span>
                        <span className="text-white">{snapshot.visual.postProcess.glowRadius.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Opacity:</span>
                        <span className="text-white">{snapshot.visual.postProcess.glowOpacity.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>State:</span>
                        <span className={snapshot.visual.glowState !== 'IDLE' ? 'text-yellow-300 font-bold' : ''}>{snapshot.visual.glowState}</span>
                    </div>
                </div>

                <div className="bg-gray-800 p-2 rounded border border-cyan-900/50">
                    <div className="text-cyan-400 mb-1 font-bold flex justify-between items-center">
                        <span>Blur Pipeline</span>
                        <select 
                            onChange={(e) => visualRuntime.setBlurStyle(e.target.value)} 
                            className="bg-gray-700 text-xs px-1 py-0.5 rounded outline-none border border-gray-600"
                            defaultValue="Gaussian"
                        >
                            <option value="Gaussian">Gaussian</option>
                            <option value="Motion">Motion</option>
                            <option value="Radial">Radial</option>
                            <option value="Box">Box</option>
                            <option value="Reactive">Reactive</option>
                        </select>
                    </div>
                    <div className="flex justify-between">
                        <span>Radius:</span>
                        <span className="text-white">{snapshot.visual.postProcess.blur.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Direction:</span>
                        <span className="text-white">{snapshot.visual.postProcess.blurDirection.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Strength:</span>
                        <span className="text-white">{snapshot.visual.postProcess.blurStrength.toFixed(3)}</span>
                    </div>
                </div>

                <div className="bg-gray-800 p-2 rounded border border-green-900/50 col-span-2 md:col-span-4 mt-2">
                    <div className="text-green-400 mb-1 font-bold flex justify-between items-center">
                        <span>Camera Pipeline</span>
                        <select 
                            onChange={(e) => visualRuntime.setCameraStyle(e.target.value)} 
                            className="bg-gray-700 text-xs px-1 py-0.5 rounded outline-none border border-gray-600"
                            defaultValue="Default"
                        >
                            <option value="Default">Default</option>
                            <option value="EDM">EDM</option>
                            <option value="Rock">Rock</option>
                            <option value="Pop">Pop</option>
                            <option value="LoFi">LoFi</option>
                            <option value="Cinematic">Cinematic</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                            <div className="text-gray-500 underline mb-1">Position</div>
                            <div className="flex justify-between"><span>X:</span><span className="text-white">{snapshot.visual.camera.posX.toFixed(3)}</span></div>
                            <div className="flex justify-between"><span>Y:</span><span className="text-white">{snapshot.visual.camera.posY.toFixed(3)}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Rotation</div>
                            <div className="flex justify-between"><span>Roll:</span><span className="text-white">{snapshot.visual.camera.roll.toFixed(3)}</span></div>
                            <div className="flex justify-between"><span>Zoom:</span><span className="text-white">{snapshot.visual.camera.zoom.toFixed(3)}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Physics</div>
                            <div className="flex justify-between"><span>Velocity:</span><span className="text-white">{snapshot.visual.camera.velocity.toFixed(3)}</span></div>
                            <div className="flex justify-between"><span>Momentum:</span><span className="text-white">{snapshot.visual.camera.momentum.toFixed(3)}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Status</div>
                            <div className="flex justify-between"><span>State:</span><span className={snapshot.visual.cameraState !== 'IDLE' ? 'text-green-300 font-bold' : ''}>{snapshot.visual.cameraState}</span></div>
                            <div className="flex justify-between"><span>Shake:</span><span className="text-white">{Math.abs(snapshot.visual.camera.shakeX).toFixed(3)}</span></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 p-2 rounded border border-blue-900/50 col-span-2 md:col-span-4 mt-2">
                    <div className="text-blue-400 mb-1 font-bold flex justify-between items-center">
                        <span>Particle Pipeline</span>
                        <select 
                            onChange={(e) => visualRuntime.setParticleStyle(e.target.value)} 
                            className="bg-gray-700 text-xs px-1 py-0.5 rounded outline-none border border-gray-600"
                            defaultValue="Burst"
                        >
                            <option value="Burst">Burst</option>
                            <option value="Continuous">Continuous</option>
                            <option value="Spark">Spark</option>
                            <option value="Dust">Dust</option>
                            <option value="Rain">Rain</option>
                            <option value="Snow">Snow</option>
                            <option value="Reactive">Reactive</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                            <div className="text-gray-500 underline mb-1">Emission</div>
                            <div className="flex justify-between"><span>Rate:</span><span className="text-white">{snapshot.visual.overlay.particleSpawnRate.toFixed(1)}/s</span></div>
                            <div className="flex justify-between"><span>Burst:</span><span className={snapshot.visual.overlay.particleBurstCount > 0 ? "text-blue-300 font-bold" : "text-white"}>{snapshot.visual.overlay.particleBurstCount}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Physics</div>
                            <div className="flex justify-between"><span>Velocity:</span><span className="text-white">{snapshot.visual.overlay.particleVelocity.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Spread:</span><span className="text-white">{snapshot.visual.overlay.particleSpread.toFixed(1)}°</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Appearance</div>
                            <div className="flex justify-between"><span>Opacity:</span><span className="text-white">{snapshot.visual.overlay.particleOpacity.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Life:</span><span className="text-white">{snapshot.visual.overlay.particleLifetime.toFixed(2)}s</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Status</div>
                            <div className="flex justify-between"><span>Status:</span><span className="text-white">Active</span></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 p-2 rounded border border-purple-900/50 col-span-2 md:col-span-4 mt-2">
                    <div className="text-purple-400 mb-1 font-bold flex justify-between items-center">
                        <span>Spectrum Pipeline</span>
                        <select 
                            onChange={(e) => visualRuntime.setSpectrumStyle(e.target.value)} 
                            className="bg-gray-700 text-xs px-1 py-0.5 rounded outline-none border border-gray-600"
                            defaultValue="Classic"
                        >
                            <option value="Classic">Classic</option>
                            <option value="Punchy">Punchy</option>
                            <option value="Smooth">Smooth</option>
                            <option value="Reactive">Reactive</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                            <div className="text-gray-500 underline mb-1">Resolution</div>
                            <div className="flex justify-between"><span>Bands:</span><span className="text-white">{snapshot.visual.geometry.spectrumBands}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Analysis</div>
                            <div className="flex justify-between"><span>Peak:</span><span className="text-white">{snapshot.visual.geometry.spectrumPeak.toFixed(3)}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Appearance</div>
                            <div className="flex justify-between"><span>Color Bias:</span><span className="text-white">{snapshot.visual.geometry.spectrumColorWeight.toFixed(3)}</span></div>
                        </div>
                        <div>
                            <div className="text-gray-500 underline mb-1">Source</div>
                            <div className="flex justify-between"><span>Data:</span><span className="text-green-300 font-bold">Cached FFT</span></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-2 text-right text-[10px] text-gray-600">
                Logged Frames: {beatDebuggerCore.logData.length}
            </div>

            <MFBenchmarkRunner />
        </div>
    );
}
