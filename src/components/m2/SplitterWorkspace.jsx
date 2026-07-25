import React, { useState, useEffect } from 'react';
import SplitterJobItem from './SplitterJobItem.jsx';
import { PlaylistSplitterEngine } from '../../services/m2/PlaylistSplitterEngine.js';

export default function SplitterWorkspace({ panelId, isDevMode, addLog, addNotification }) {
  const [outputFolder, setOutputFolder] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [queue, setQueue] = useState(() => {
    try {
      const saved = localStorage.getItem(`m2_splitter_queue_${panelId}`);
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(`m2_splitter_queue_${panelId}`, JSON.stringify(queue));
  }, [queue, panelId]);

  // Resume polling on mount for active jobs
  useEffect(() => {
    queue.forEach(job => {
      if (
        job.status !== 'Completed' && 
        job.status !== 'Failed' && 
        job.status !== 'Playlist Structure Not Supported' && 
        job.status !== 'Metadata Not Found'
      ) {
        if (job.backendJobId) {
          // Simple deduplication: pollProgress handles its own interval, 
          // but we only want to start it if it wasn't already started.
          // It's safe on mount because interval closures are fresh.
          pollProgress(job.id, job.backendJobId);
        } else {
          // If it was interrupted before getting a backend job ID (stuck in Reading Metadata/Waiting)
          updateJob(job.id, { status: 'Failed', error: 'Interrupted by application restart.' });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleSelectFolder = async () => {
    try {
      const res = await fetch('/api/m2/dialog/folder', { method: 'POST' });
      if (res.ok) {
        const { path } = await res.json();
        if (path) setOutputFolder(path);
      }
    } catch (err) {
      addNotification?.('Error', 'Failed to open folder picker');
    }
  };

  const handleRemoveJob = (id) => {
    setQueue(prev => prev.filter(job => job.id !== id));
  };

  const handleClearQueue = () => {
    setQueue([]);
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (!outputFolder) {
      addNotification?.('Error', 'Please select an output folder first.');
      return;
    }
    
    const newJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      url: urlInput.trim(),
      status: 'Waiting',
      progress: 0,
      metadata: null,
      songs: [],
      error: null,
      outputFolder: outputFolder
    };
    
    setQueue(prev => [...prev, newJob]);
    setUrlInput('');
    processJob(newJob.id);
  };

  const updateJob = (id, updates) => {
    setQueue(prev => prev.map(job => job.id === id ? { ...job, ...updates } : job));
  };

  const processJob = async (jobId) => {
    const job = queue.find(q => q.id === jobId) || { id: jobId };
    
    try {
      // 1. Fetch Metadata
      updateJob(jobId, { status: 'Reading Metadata' });
      const metadata = await PlaylistSplitterEngine.fetchMetadata(job.url || urlInput.trim());
      updateJob(jobId, { metadata });
      
      // 2. Analyze Playlist
      updateJob(jobId, { status: 'Analyzing' });
      const analysis = PlaylistSplitterEngine.parseSongs(metadata);
      
      let aiTitles = [];
      
      // Priority 1: Titles parsed directly from description (deterministic, no AI)
      if (analysis.source === 'description_titles' && analysis.titles && analysis.titles.length > 0) {
        aiTitles = analysis.titles;
        updateJob(jobId, { status: `Found ${aiTitles.length} titles in description` });
      }
      // Priority 2: Gemini AI as last resort (only for silence_detection with no parsed titles)
      else if (analysis.source === 'silence_detection') {
        const apiKeysRaw = localStorage.getItem('mf_api_keys');
        if (apiKeysRaw) {
          try {
            const keys = JSON.parse(apiKeysRaw);
            const googleKeyObj = keys.find(k => k.platform === 'google' && k.key);
            if (googleKeyObj && metadata.thumbnailUrl) {
              updateJob(jobId, { status: 'Scanning Thumbnail (AI)' });
              const visionRes = await fetch('/api/m2/splitter/vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  thumbnailUrl: metadata.thumbnailUrl, 
                  description: metadata.description,
                  apiKey: googleKeyObj.key 
                })
              });
              if (visionRes.ok) {
                const data = await visionRes.json();
                if (data.titles && data.titles.length > 0) {
                  aiTitles = data.titles;
                }
              }
            }
          } catch(e) {}
        }
      }

      if (!analysis.success) {
        updateJob(jobId, { status: 'Playlist Structure Not Supported', error: analysis.error });
        return;
      }
      
      // If we only have titles but NO explicit timestamps, trigger Manual Slicing instead of auto-split
      if (aiTitles.length > 0 && analysis.songs.length === 0) {
        updateJob(jobId, { 
          songs: [], 
          aiTitles: aiTitles, 
          status: 'Needs Manual Slicing',
          metadata: metadata
        });
        return; // Pause flow here!
      }
      
      updateJob(jobId, { songs: analysis.songs });
      
      // 3. Start Process (Download & Split)
      updateJob(jobId, { status: 'Downloading' });
      const processRes = await PlaylistSplitterEngine.startProcessJob(
        job.url || urlInput.trim(), 
        outputFolder, 
        analysis.songs, 
        metadata.videoId, 
        metadata.videoTitle,
        aiTitles,
        metadata.videoDuration
      );
      
      // Poll progress
      updateJob(jobId, { backendJobId: processRes.jobId });
      pollProgress(jobId, processRes.jobId);
      
    } catch (err) {
      updateJob(jobId, { status: 'Metadata Not Found', error: err.message });
    }
  };

  const pollProgress = async (localJobId, backendJobId) => {
    const interval = setInterval(async () => {
      try {
        const pollRes = await PlaylistSplitterEngine.pollJobStatus(backendJobId);
        updateJob(localJobId, { 
          status: pollRes.status, 
          progress: pollRes.progress, 
          error: pollRes.error,
          songs: pollRes.songs
        });
        
        if (pollRes.status === 'Completed' || pollRes.status === 'Failed') {
          clearInterval(interval);
        }
      } catch (err) {
        clearInterval(interval);
        updateJob(localJobId, { status: 'Failed', error: 'Lost connection to backend' });
      }
    }, 1000);
  };

  const handleManualExport = async (jobId, finalSongs) => {
    const job = queue.find(q => q.id === jobId);
    if (!job) return;
    
    try {
      updateJob(jobId, { status: 'Downloading', songs: finalSongs });
      const processRes = await PlaylistSplitterEngine.startProcessJob(
        job.url, 
        job.outputFolder, 
        finalSongs, 
        job.metadata.videoId, 
        job.metadata.videoTitle,
        job.aiTitles,
        job.metadata.videoDuration
      );
      
      updateJob(jobId, { backendJobId: processRes.jobId });
      pollProgress(jobId, processRes.jobId);
    } catch (err) {
      updateJob(jobId, { status: 'Failed', error: err.message });
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] flex flex-col h-full overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
      
      {/* Header */}
      <div className="px-4 py-3 bg-black/20 border-b border-[#2a2c33] shrink-0 relative z-10 flex items-center justify-between">
        <h3 className="text-[12px] font-bold text-white tracking-wide uppercase flex items-center gap-2 m5-white-glow">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
          WORKSPACE {panelId}
        </h3>
      </div>
      
      {/* Controls */}
      <div className="p-3 shrink-0 flex flex-col gap-3 relative z-10 border-b border-[#2a2c33]">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSelectFolder}
            className="shrink-0 bg-[#1e2230] hover:bg-[#2d3247] border border-[#2d3247] text-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors"
          >
            Select Output
          </button>
          <div className="flex-1 text-[10px] text-gray-400 bg-[#0a0b0f] border border-[#2d3247] px-2 py-1.5 rounded truncate" title={outputFolder}>
            {outputFolder || 'No output folder selected'}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
            placeholder="Paste YouTube URL here..."
            className="flex-1 bg-[#0a0b0f] border border-[#2d3247] text-gray-200 px-3 py-1.5 rounded text-[11px] focus:outline-none focus:border-orange-500 transition-colors"
          />
          <button 
            onClick={handleAddUrl}
            disabled={!urlInput.trim() || !outputFolder}
            className="shrink-0 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase transition-colors shadow-[0_0_10px_rgba(249,115,22,0.3)]"
          >
            Add to Queue
          </button>
          <button 
            onClick={handleClearQueue}
            disabled={queue.length === 0}
            className="shrink-0 bg-red-900/50 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-red-200 border border-red-800 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors"
            title="Clear entire queue"
          >
            Clear
          </button>
        </div>
      </div>
      
      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 relative z-10 custom-scrollbar">
        {queue.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-4 text-center gap-2">
            <div className="text-3xl opacity-20 mb-1">📋</div>
            <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">Queue Empty</div>
            <div className="text-[10px] text-gray-600">
              Paste a URL and select an output folder to begin.
            </div>
          </div>
        ) : (
          queue.map((job) => (
            <SplitterJobItem 
              key={job.id} 
              job={job} 
              onRemove={handleRemoveJob} 
              onManualExport={handleManualExport}
            />
          ))
        )}
      </div>
    </div>
  );
}
