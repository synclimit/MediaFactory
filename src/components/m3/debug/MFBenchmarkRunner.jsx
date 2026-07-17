import React, { useState, useEffect } from 'react';
import { beatDebuggerCore } from '../../../services/debug/BeatDebuggerCore';
import { visualRuntime } from '../../../services/visual/VisualRuntime';

export default function MFBenchmarkRunner() {
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);

    const genres = [
        'EDM', 'Rock', 'Pop', 'LoFi', 'Cinematic',
        'Classical', 'Jazz', 'Metal', 'Acoustic', 'Podcast'
    ];

    const runBenchmark = async () => {
        setIsRunning(true);
        setProgress(0);
        setResults(null);

        const benchmarkData = [];

        // Run benchmark for each genre (simulate running against live playing audio)
        // We will switch the visual profiles to the target genre, and collect 120 frames (approx 2 seconds)
        // to measure real performance metrics.
        for (let i = 0; i < genres.length; i++) {
            const genre = genres[i];
            
            // Set styles
            visualRuntime.setZoomStyle(genre);
            visualRuntime.setGlowStyle(genre);
            visualRuntime.setCameraStyle(genre);
            visualRuntime.setParticleStyle(genre === 'Podcast' ? 'Podcast' : 'Burst');
            visualRuntime.setBlurStyle(genre === 'Classical' || genre === 'Podcast' ? 'Podcast' : 'Gaussian');
            visualRuntime.setSpectrumStyle(genre);

            let frameCount = 0;
            let totalFrameTime = 0;
            let totalMemory = 0;
            let totalCpuLoad = 0;
            
            // Collect metrics over 120 frames
            await new Promise(resolve => {
                const unsubscribe = beatDebuggerCore.subscribe((snapshot) => {
                    frameCount++;
                    totalFrameTime += snapshot.system.frameTime;
                    totalCpuLoad += snapshot.system.cpuLoad;
                    totalMemory += snapshot.system.memoryUsedMB;

                    if (frameCount >= 120) {
                        unsubscribe();
                        resolve();
                    }
                });
            });

            benchmarkData.push({
                genre,
                avgFrameTimeMs: totalFrameTime / 120,
                avgCpuLoadPct: totalCpuLoad / 120,
                avgMemoryMB: totalMemory / 120,
                fpsStability: (totalFrameTime / 120) < 17 ? 'Stable (60fps)' : 'Unstable'
            });

            setProgress(((i + 1) / genres.length) * 100);
        }

        setResults(benchmarkData);
        setIsRunning(false);
    };

    const handleDownloadReport = () => {
        if (!results) return;

        let md = '# MF-400B Real Benchmark Report\n\n';
        md += '| Genre | Avg FrameTime (ms) | Estimated CPU Load | Memory (MB) | Stability |\n';
        md += '|-------|--------------------|--------------------|-------------|-----------|\n';
        
        results.forEach(r => {
            md += `| ${r.genre} | ${r.avgFrameTimeMs.toFixed(2)} | ${r.avgCpuLoadPct.toFixed(1)}% | ${r.avgMemoryMB.toFixed(1)} | ${r.fpsStability} |\n`;
        });

        beatDebuggerCore.triggerDownload(md, `MF-400B_REAL_BENCHMARK_${Date.now()}.md`, 'text/markdown');
    };

    return (
        <div className="bg-gray-800 p-4 mt-4 rounded border border-blue-500/50">
            <h3 className="text-blue-400 font-bold mb-2">MF-400B Production Benchmark Framework</h3>
            <p className="text-xs text-gray-400 mb-4">
                Executes the actual renderer pipeline over all 10 genres to measure true frame times, CPU load, and GC memory stability. 
                (Audio must be playing).
            </p>
            
            {isRunning ? (
                <div>
                    <div className="w-full bg-gray-700 h-2 rounded mb-1">
                        <div className="bg-blue-500 h-2 rounded transition-all duration-200" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 text-center">Running benchmark... {Math.round(progress)}%</div>
                </div>
            ) : (
                <div className="flex gap-2">
                    <button 
                        onClick={runBenchmark}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs"
                    >
                        RUN REAL BENCHMARK
                    </button>
                    {results && (
                        <button 
                            onClick={handleDownloadReport}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-xs"
                        >
                            DOWNLOAD REPORT
                        </button>
                    )}
                </div>
            )}

            {results && !isRunning && (
                <div className="mt-4 grid grid-cols-5 gap-2 text-[10px] text-gray-300">
                    <div className="font-bold border-b border-gray-600 pb-1">Genre</div>
                    <div className="font-bold border-b border-gray-600 pb-1">FrameTime</div>
                    <div className="font-bold border-b border-gray-600 pb-1">CPU Load</div>
                    <div className="font-bold border-b border-gray-600 pb-1">Memory</div>
                    <div className="font-bold border-b border-gray-600 pb-1">Stability</div>
                    
                    {results.map(r => (
                        <React.Fragment key={r.genre}>
                            <div className="text-blue-300">{r.genre}</div>
                            <div>{r.avgFrameTimeMs.toFixed(2)}ms</div>
                            <div className={r.avgCpuLoadPct > 80 ? "text-red-400" : "text-green-400"}>{r.avgCpuLoadPct.toFixed(1)}%</div>
                            <div>{r.avgMemoryMB.toFixed(1)}MB</div>
                            <div>{r.fpsStability}</div>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
}
