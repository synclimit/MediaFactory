import React, { useState, useEffect } from 'react';
import AssetJobItem from './AssetJobItem.jsx';
import { AssetGeneratorService } from '../../services/m2/AssetGeneratorService.js';

export default function AssetGeneratorPanel({ isDevMode, addLog, addNotification }) {
    const [targetFolder, setTargetFolder] = useState(() => {
        try {
            return localStorage.getItem('m2_asset_target_folder') || '';
        } catch(e) { return ''; }
    });
    
    const [queue, setQueue] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [whisperModel, setWhisperModel] = useState('base');
    const [forceRegenerate, setForceRegenerate] = useState(false);
    
    const isProcessing = queue.some(j => !['Pending', 'Completed', 'Skipped', 'Failed', 'Cancelled'].includes(j.status));

    // Save target folder to localStorage
    useEffect(() => {
        localStorage.setItem('m2_asset_target_folder', targetFolder);
    }, [targetFolder]);

    // Poll backend status periodically
    useEffect(() => {
        let lastIsProcessing = false;
        let isPolling = false;
        const interval = setInterval(async () => {
            if (isPolling) return;
            isPolling = true;
            try {
                const { queue: latestQueue, isProcessing } = await AssetGeneratorService.pollStatus();
                if (latestQueue && latestQueue.length > 0) {
                    if (isProcessing) {
                        setQueue(latestQueue);
                        lastIsProcessing = true;
                    } else if (lastIsProcessing) {
                        // It just finished processing
                        setQueue(latestQueue);
                        lastIsProcessing = false;
                    }
                }
            } catch (err) {
                // Ignore poll errors to avoid console spam
            } finally {
                isPolling = false;
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Initialize state on mount
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Check if backend already has a queue (processing or recently finished)
                const { queue: latestQueue } = await AssetGeneratorService.pollStatus();
                if (latestQueue && latestQueue.length > 0) {
                    setQueue(latestQueue);
                    return; // Stop here, prioritize backend state
                }
            } catch (err) { /* ignore */ }

            // 2. If backend is empty, fallback to scanning the last saved folder
            const initialFolder = localStorage.getItem('m2_asset_target_folder');
            if (initialFolder) {
                handleScanFolder(initialFolder);
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectFolder = async () => {
        try {
            const path = await AssetGeneratorService.selectFolder();
            if (path) {
                setTargetFolder(path);
                // Auto scan
                handleScanFolder(path);
            }
        } catch (err) {
            addNotification?.('Error', 'Failed to open folder picker');
        }
    };

    const handleSelectFile = async () => {
        try {
            const path = await AssetGeneratorService.selectFile();
            if (path) {
                setTargetFolder(path);
                // Auto scan
                handleScanFolder(path);
            }
        } catch (err) {
            addNotification?.('Error', 'Failed to open file picker');
        }
    };

    const handleScanFolder = async (path) => {
        if (!path) return;
        setIsScanning(true);
        try {
            const files = await AssetGeneratorService.scanFolder(path);
            setQueue(files);
            if (files.length === 0) {
                addNotification?.('Info', 'No supported audio files found in directory.');
            }
        } catch (err) {
            addNotification?.('Error', err.message);
        } finally {
            setIsScanning(false);
        }
    };

    const handleStart = async () => {
        if (queue.length === 0) return;
        
        // Save current queue for rollback if API fails
        const previousQueue = [...queue];
        
        try {
            // Send all as Pending to the backend
            const backendQueue = queue.map(j => ({ ...j, status: 'Pending', error: null }));
            
            // Optimistically set first to Scanning for the local UI
            const frontendQueue = backendQueue.map((j, i) => ({
                ...j,
                status: i === 0 ? 'Scanning' : 'Pending'
            }));
            
            setQueue(frontendQueue);
            await AssetGeneratorService.startProcess(backendQueue, { whisperModel, forceRegenerate });
            addNotification?.('Success', 'Asset generation started');
        } catch (err) {
            setQueue(previousQueue); // Revert optimistic UI
            addNotification?.('Error', err.message);
        }
    };

    const handleCancel = async () => {
        try {
            await AssetGeneratorService.cancelProcess();
            addNotification?.('Warning', 'Asset generation cancelled');
        } catch (err) {
            addNotification?.('Error', err.message);
        }
    };

    return (
        <div className="flex-1 grid grid-cols-12 gap-3 p-4 overflow-hidden bg-transparent z-10 relative font-sans">
            {/* Background elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[100px] mix-blend-screen"></div>
                <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:20px_20px]" style={{ transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)'}}></div>
            </div>

            {/* LEFT COLUMN: Controls & Status */}
            <div className="col-span-12 xl:col-span-5 flex flex-col gap-3 overflow-hidden h-full z-10">
                <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden h-full group z-10">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-20 pointer-events-none"></div>
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
                    
                    <div className="px-5 py-4 bg-black/20 border-b border-[#2a2c33] shrink-0 relative z-10 flex items-center justify-between">
                        <h3 className="text-[12px] font-black text-white tracking-widest uppercase flex items-center gap-2 m5-white-glow">
                            <span className="w-2 h-2 rounded-sm bg-orange-500 shadow-[0_0_10px_#f97316]"></span>
                            Neural Asset Generator
                        </h3>
                        <div className="flex items-center gap-1.5 opacity-50">
                            <div className="w-1 h-3 bg-gray-500"></div>
                            <div className="w-1 h-2 bg-gray-500"></div>
                            <div className="w-1 h-1 bg-gray-500"></div>
                        </div>
                    </div>

                    <div className="p-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar flex-1 relative z-10">
                        <div className="text-[11px] text-gray-300 leading-relaxed font-mono bg-[#161822]/80 p-3 rounded-lg border border-orange-500/20 border-l-orange-500/50 border-l-2 shadow-inner">
                            Select a directory. The engine will recursively extract compatible audio matrix formats and synthesize .srt / .analysis.json payloads.
                        </div>

                        {/* Input Area */}
                        <div className="flex flex-col gap-2 relative">
                            <div className="absolute -inset-2 bg-gradient-to-b from-orange-500/5 to-transparent blur-xl pointer-events-none"></div>
                            <div className="flex items-stretch gap-2 relative z-10">
                                <button 
                                    onClick={handleSelectFolder}
                                    disabled={isProcessing}
                                    className="shrink-0 bg-[#14151a] hover:bg-[#1f2229] disabled:opacity-50 border border-white/10 hover:border-orange-500/50 text-gray-300 px-4 rounded text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                                >
                                    DIR
                                </button>
                                <button 
                                    onClick={handleSelectFile}
                                    disabled={isProcessing}
                                    className="shrink-0 bg-[#14151a] hover:bg-[#1f2229] disabled:opacity-50 border border-white/10 hover:border-orange-500/50 text-gray-300 px-4 rounded text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                                >
                                    FILE
                                </button>
                                <div className="flex-1 text-[11px] font-mono text-gray-300 bg-[#161822]/90 border border-orange-500/20 px-3 py-2.5 rounded shadow-inner truncate flex items-center gap-2" title={targetFolder}>
                                    <span className="opacity-50 text-orange-500">›</span> {targetFolder || 'AWAITING_INPUT'}
                                </div>
                            </div>
                        </div>

                        {/* Settings Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1 h-1 bg-gray-500 rounded-full"></span> Subtitle Engine
                                </label>
                                <div className="relative">
                                    <select 
                                        value={whisperModel}
                                        onChange={(e) => setWhisperModel(e.target.value)}
                                        disabled={isProcessing}
                                        className="w-full bg-[#161822]/90 border border-orange-500/20 text-gray-200 px-3 py-2 pr-8 rounded text-[11px] font-mono focus:outline-none focus:border-orange-500/50 transition-colors shadow-inner appearance-none cursor-pointer"
                                    >
                                        <option value="tiny">TINY (Speed Priority)</option>
                                        <option value="base">BASE (Standard)</option>
                                        <option value="small">SMALL (Balanced)</option>
                                        <option value="medium">MEDIUM (Accuracy Priority)</option>
                                        <option value="large-v3">LARGE-V3 (Maximum Fidelity)</option>
                                        <option value="turbo">TURBO (Optimal Hybrid)</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-orange-500">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-[#161822]/80 p-2.5 rounded border border-orange-500/20 hover:border-orange-500/40 transition-colors shadow-inner">
                                <label className="flex items-center gap-3 cursor-pointer select-none group flex-1">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${forceRegenerate ? 'bg-orange-500 border-orange-500' : 'bg-black/30 border-white/10 group-hover:border-white/20'}`}>
                                        {forceRegenerate && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                    </div>
                                    <input 
                                        type="checkbox"
                                        checked={forceRegenerate}
                                        onChange={(e) => setForceRegenerate(e.target.checked)}
                                        disabled={isProcessing}
                                        className="hidden"
                                    />
                                    <span className="text-[10px] text-gray-300 font-mono uppercase tracking-wide">Force Cache Override</span>
                                </label>
                                <div className="relative group/tooltip flex items-center justify-center ml-2">
                                    <div className="w-4 h-4 rounded-full border border-gray-500/50 flex items-center justify-center text-[10px] text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-colors cursor-help">
                                        ?
                                    </div>
                                    <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-[#111216] border border-orange-500/30 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none flex flex-col gap-2 backdrop-blur-xl">
                                        <div className="text-[10px] text-gray-300 font-sans leading-relaxed normal-case">
                                            <strong className="text-orange-400 block mb-0.5">Fungsi:</strong>
                                            Memaksa sistem memproses ulang video dari awal, abaikan hasil sebelumnya.
                                        </div>
                                        <div className="text-[10px] text-gray-300 font-sans leading-relaxed normal-case border-t border-white/10 pt-2">
                                            <strong className="text-orange-400 block mb-0.5">Contoh:</strong>
                                            Gunakan jika hasil subtitle sebelumnya error, atau saat Anda mengganti Subtitle Engine dan ingin menerjemahkan ulang.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Action Button */}
                        <div className="mt-2 relative">
                            {!isProcessing ? (
                                <button 
                                    onClick={handleStart}
                                    disabled={queue.length === 0 || isScanning}
                                    className="w-full relative group overflow-hidden bg-[#f97316]/10 disabled:opacity-50 border border-[#f97316]/30 hover:bg-[#f97316]/20 rounded-lg h-12 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:shadow-[0_0_25px_rgba(249,115,22,0.2)]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-orange-500/10 to-orange-600/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute top-0 left-[-100%] w-full h-[1px] bg-gradient-to-r from-transparent via-orange-400 to-transparent group-hover:animate-[slideRight_2s_linear_infinite]"></div>
                                    <span className="text-orange-500 group-hover:text-orange-400 font-black text-[12px] uppercase tracking-[0.3em] relative z-10 m5-white-glow flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        Initialize Sequence
                                    </span>
                                </button>
                            ) : (
                                <button 
                                    onClick={handleCancel}
                                    className="w-full relative group overflow-hidden bg-red-950/30 border border-red-500/30 hover:border-red-500 rounded-lg h-12 flex items-center justify-center transition-all shadow-[0_0_20px_rgba(220,38,38,0.1)] hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]"
                                >
                                    <span className="text-red-500 group-hover:text-red-400 font-black text-[12px] uppercase tracking-[0.3em] relative z-10 drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]">
                                        Abort Sequence
                                    </span>
                                </button>
                            )}
                        </div>


                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Queue List */}
            <div className="col-span-12 xl:col-span-7 flex flex-col gap-3 overflow-hidden h-full z-10">
                <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden h-full group z-10">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-20 pointer-events-none"></div>
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
                    
                    <div className="px-5 py-4 bg-black/20 border-b border-[#2a2c33] shrink-0 relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h3 className="text-[12px] font-black text-white tracking-widest uppercase">
                                Execution Pipeline
                            </h3>
                            <div className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                {isProcessing ? 'Active' : 'Standby'}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar relative">
                        {queue.length === 0 ? (
                            <div className="absolute inset-4 flex flex-col items-center justify-center border-2 border-dashed border-[#2a2c33] rounded-xl bg-[#161822]/50 group hover:border-orange-500/20 transition-all duration-500 overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.05)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="relative z-10 w-24 h-24 rounded-full bg-[#161822] border border-[#2a2c33] flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_50px_rgba(249,115,22,0.1)] transition-all duration-500 mb-6">
                                    <div className="absolute inset-0 rounded-full border border-orange-500/10 border-t-orange-500/40 animate-[spin_4s_linear_infinite]"></div>
                                    <div className="absolute inset-2 rounded-full border border-dashed border-gray-600/30 animate-[spin_3s_linear_infinite_reverse]"></div>
                                    <svg className="w-8 h-8 text-gray-600 group-hover:text-orange-500/80 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                                <div className="relative z-10 text-[14px] text-white font-black uppercase tracking-[0.2em] mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">Pipeline Empty</div>
                                <div className="relative z-10 text-[10px] text-gray-500 uppercase tracking-widest max-w-[280px] text-center leading-relaxed">System awaiting dataset injection. Provide source directory to initialize compilation sequence.</div>
                            </div>
                        ) : (
                            queue.map((job) => (
                                <AssetJobItem key={job.id} job={job} />
                            ))
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes slideRight {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
            `}</style>
        </div>
    );
}
