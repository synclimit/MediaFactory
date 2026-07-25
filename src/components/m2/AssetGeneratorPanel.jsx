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
        <div className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden bg-[#111318] z-10 relative">
            {/* LEFT COLUMN: Controls & Status */}
            <div className="col-span-12 xl:col-span-5 flex flex-col gap-3 overflow-hidden h-full">
                <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-lg flex flex-col group z-10 overflow-hidden h-full">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 z-0 pointer-events-none"></div>
                    
                    <div className="px-4 py-3 bg-black/20 border-b border-[#2a2c33] shrink-0 relative z-10">
                        <h3 className="text-[12px] font-bold text-white tracking-wide uppercase flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
                            Asset Generator
                        </h3>
                    </div>

                    <div className="p-4 flex flex-col gap-4">
                        <div className="text-[11px] text-gray-400">
                            Select a folder containing audio files. MediaFactory will recursively scan for supported formats (MP3, WAV, FLAC, M4A, AAC, OGG) and generate required assets (.srt & .analysis.json) for M3.
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleSelectFolder}
                                    disabled={isProcessing}
                                    className="shrink-0 bg-[#1e2230] hover:bg-[#2d3247] disabled:opacity-50 border border-[#2d3247] text-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors"
                                >
                                    Folder
                                </button>
                                <button 
                                    onClick={handleSelectFile}
                                    disabled={isProcessing}
                                    className="shrink-0 bg-[#1e2230] hover:bg-[#2d3247] disabled:opacity-50 border border-[#2d3247] text-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors"
                                >
                                    File
                                </button>
                                <div className="flex-1 text-[10px] text-gray-400 bg-[#0a0b0f] border border-[#2d3247] px-2 py-1.5 rounded truncate" title={targetFolder}>
                                    {targetFolder || 'No source selected'}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 mt-2">
                                <label className="text-[10px] text-gray-500 font-bold uppercase">Whisper Model</label>
                                <select 
                                    value={whisperModel}
                                    onChange={(e) => setWhisperModel(e.target.value)}
                                    disabled={isProcessing}
                                    className="bg-[#0a0b0f] border border-[#2d3247] text-gray-300 px-2 py-1.5 rounded text-[11px] focus:outline-none focus:border-orange-500"
                                >
                                    <option value="tiny">Tiny (Fastest, Low Accuracy)</option>
                                    <option value="base">Base (Fast, Decent Accuracy)</option>
                                    <option value="small">Small (Balanced)</option>
                                    <option value="medium">Medium (Slow, High Accuracy)</option>
                                    <option value="large-v3">Large V3 (Slowest, Best Accuracy)</option>
                                    <option value="turbo">Turbo (Fast + High Accuracy, Recommended)</option>
                                </select>
                            </div>

                            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                                <input 
                                    type="checkbox"
                                    checked={forceRegenerate}
                                    onChange={(e) => setForceRegenerate(e.target.checked)}
                                    disabled={isProcessing}
                                    className="accent-orange-500 w-3.5 h-3.5"
                                />
                                <span className="text-[10px] text-gray-400">Force Re-generate (ignore existing cache)</span>
                            </label>
                            
                            <div className="flex items-center gap-2 mt-2">
                                {!isProcessing ? (
                                    <button 
                                        onClick={handleStart}
                                        disabled={queue.length === 0 || isScanning}
                                        className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-4 py-2 rounded text-[11px] font-bold uppercase transition-colors shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                                    >
                                        Start Generation
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleCancel}
                                        className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-[11px] font-bold uppercase transition-colors shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                                    >
                                        Cancel Generation
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-black/30 border border-[#2d3247] rounded-lg">
                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Statistics</div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className="text-gray-400">Total Files: <span className="text-white font-mono">{queue.length}</span></div>
                                <div className="text-gray-400">Completed: <span className="text-emerald-400 font-mono">{queue.filter(q => q.status === 'Completed').length}</span></div>
                                <div className="text-gray-400">Skipped: <span className="text-blue-400 font-mono">{queue.filter(q => q.status === 'Skipped').length}</span></div>
                                <div className="text-gray-400">Failed: <span className="text-red-400 font-mono">{queue.filter(q => q.status === 'Failed').length}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Queue List */}
            <div className="col-span-12 xl:col-span-7 flex flex-col gap-3 overflow-hidden h-full">
                <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-lg flex flex-col group z-10 overflow-hidden h-full">
                    <div className="px-4 py-3 bg-black/20 border-b border-[#2a2c33] shrink-0 relative z-10 flex justify-between items-center">
                        <h3 className="text-[12px] font-bold text-gray-300 tracking-wide uppercase">
                            Processing Queue
                        </h3>
                        {isScanning && <span className="text-[10px] text-orange-400 animate-pulse font-bold uppercase">Scanning...</span>}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
                        {queue.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2">
                                <div className="text-3xl opacity-20 mb-1">📂</div>
                                <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">Queue Empty</div>
                                <div className="text-[10px] text-gray-600">Select a folder to discover audio files.</div>
                            </div>
                        ) : (
                            queue.map((job) => (
                                <AssetJobItem key={job.id} job={job} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
