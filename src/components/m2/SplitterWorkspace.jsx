import React, { useState, useEffect, useRef } from 'react';
import SplitterJobItem from './SplitterJobItem.jsx';
import { PlaylistSplitterEngine } from '../../services/m2/PlaylistSplitterEngine.js';
import { 
  Scissors, Sparkles, Music, FolderOpen, Upload, Play, Volume2, 
  Layers, Radio, Zap, CheckCircle2, ClipboardCopy, FileAudio, 
  Disc, Compass, Waves, Flame, Activity, ArrowRight, CornerDownLeft
} from 'lucide-react';

export default function SplitterWorkspace({ panelId, isDevMode, addLog, addNotification }) {
  const [outputFolder, setOutputFolder] = useState(() => {
    return localStorage.getItem('m2_splitter_output_folder') || '';
  });
  const [urlInput, setUrlInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [queue, setQueue] = useState(() => {
    try {
      const saved = localStorage.getItem(`m2_splitter_queue_${panelId}`);
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });

  // Save queue & outputFolder to localStorage
  useEffect(() => {
    localStorage.setItem(`m2_splitter_queue_${panelId}`, JSON.stringify(queue));
  }, [queue, panelId]);

  useEffect(() => {
    if (outputFolder) {
      localStorage.setItem('m2_splitter_output_folder', outputFolder);
    }
  }, [outputFolder]);

  // Auto-detect default output folder if not set
  useEffect(() => {
    if (!outputFolder) {
      // Try to fetch default Downloads/Music directory from backend
      fetch('/api/m2/dialog/folder', { method: 'POST' })
        .then(() => {})
        .catch(() => {});
    }
  }, [outputFolder]);

  // Resume polling on mount for active jobs
  useEffect(() => {
    queue.forEach(job => {
      if (
        job.status !== 'Completed' && 
        job.status !== 'Failed' && 
        job.status !== 'Playlist Structure Not Supported' && 
        job.status !== 'Metadata Not Found' &&
        job.status !== 'Needs Manual Slicing'
      ) {
        if (job.backendJobId) {
          pollProgress(job.id, job.backendJobId);
        } else {
          setTimeout(() => processJob(job.id), 500);
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
        if (path) {
          setOutputFolder(path);
          localStorage.setItem('m2_splitter_output_folder', path);
        }
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

  const handleSelectFileInput = async () => {
    try {
      const res = await fetch('/api/m2/dialog/file', { method: 'POST' });
      const data = await res.json();
      if (data.path) {
        setUrlInput(data.path);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrlInput(text.trim());
        }
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
    }
  };

  const handleAddUrl = (customUrl = null) => {
    const targetUrl = (customUrl || urlInput).trim();
    if (!targetUrl) return;
    
    // Auto-fallback if output folder not yet chosen
    let effectiveOutput = outputFolder;
    if (!effectiveOutput) {
      effectiveOutput = 'C:\\Users\\Server Abal\\Downloads';
      setOutputFolder(effectiveOutput);
    }
    
    const newJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      url: targetUrl,
      status: 'Waiting',
      progress: 0,
      metadata: null,
      songs: [],
      error: null,
      outputFolder: effectiveOutput
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
      
      // Priority 1: Titles parsed directly from description
      if (analysis.source === 'description_titles' && analysis.titles && analysis.titles.length > 0) {
        aiTitles = analysis.titles;
        updateJob(jobId, { status: `Found ${aiTitles.length} titles in description` });
      }
      // Priority 2: Gemini AI vision as fallback
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
      
      // If we don't have explicit timestamps, trigger Manual Slicing
      if (analysis.songs.length === 0) {
        updateJob(jobId, { 
          songs: [], 
          aiTitles: aiTitles, 
          status: 'Needs Manual Slicing',
          metadata: metadata
        });
        return;
      }
      
      updateJob(jobId, { songs: analysis.songs });
      
      // 3. Start Process
      updateJob(jobId, { status: 'Downloading' });
      const processRes = await PlaylistSplitterEngine.startProcessJob(
        job.url || urlInput.trim(), 
        outputFolder || 'C:\\Users\\Server Abal\\Downloads', 
        analysis.songs, 
        metadata.videoId, 
        metadata.videoTitle,
        aiTitles,
        metadata.videoDuration
      );
      
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
        job.outputFolder || outputFolder || 'C:\\Users\\Server Abal\\Downloads', 
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
    <div className="relative bg-gradient-to-br from-[#1c1e27] via-[#12141c] to-[#0c0d12] rounded-xl border border-[#272b3b] shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col h-full overflow-hidden group">
      
      {/* Top Neon Accent Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.8)] z-20 pointer-events-none" />
      
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 bg-[#0a0b10]/80 backdrop-blur-md border-b border-[#212534] shrink-0 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500 shadow-[0_0_10px_#f97316]" />
          </span>
          <h3 className="text-xs font-black text-white tracking-widest uppercase flex items-center gap-2">
            WORKSPACE {panelId}
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
              SMART SPLITTER
            </span>
          </h3>
        </div>

        {queue.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-mono">
              {queue.length} Active {queue.length === 1 ? 'Job' : 'Jobs'}
            </span>
          </div>
        )}
      </div>
      
      {/* ── Controls Bar ────────────────────────────────────────────────────── */}
      <div className="p-3.5 shrink-0 flex flex-col gap-3 relative z-10 border-b border-[#212534] bg-[#0e1017]/90 backdrop-blur-sm">
        
        {/* Row 1: Output Folder Selector */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSelectFolder}
            className="shrink-0 flex items-center gap-1.5 bg-[#1a1d2b] hover:bg-[#25293d] border border-[#2e344a] text-gray-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-md active:scale-95"
          >
            <FolderOpen size={13} className="text-orange-400" />
            Select Output
          </button>
          <div 
            onClick={handleSelectFolder}
            className="flex-1 text-[10px] text-gray-300 font-mono bg-[#07080c] border border-[#242838] px-3 py-1.5 rounded-lg truncate cursor-pointer hover:border-orange-500/50 transition-colors flex items-center justify-between"
            title={outputFolder || 'Click to select export directory'}
          >
            <span className="truncate">{outputFolder || 'Click to select output destination (default: Downloads)'}</span>
            <span className="text-[9px] text-gray-500 font-sans ml-2 shrink-0">Browse ➔</span>
          </div>
        </div>
        
        {/* Row 2: Input Box with Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex-1 min-w-[220px] relative flex items-center">
            <input 
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
              placeholder="Paste YouTube Mix URL, Album, or Local MP3/WAV file path..."
              className="w-full bg-[#07080c] border border-[#272c3e] text-gray-100 pl-3 pr-20 py-2 rounded-lg text-xs font-mono placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
            />
            
            {/* Quick Paste Button inside input */}
            <button
              onClick={handlePasteClipboard}
              title="Paste from Clipboard"
              className="absolute right-2 px-2 py-1 text-[9px] font-bold rounded bg-[#1c202e] hover:bg-orange-500/20 text-gray-400 hover:text-orange-300 border border-[#2c3247] transition-all flex items-center gap-1"
            >
              <ClipboardCopy size={11} />
              Paste
            </button>
          </div>

          {/* Browse Local File */}
          <button 
            onClick={handleSelectFileInput}
            className="shrink-0 flex items-center gap-1.5 bg-[#1c202e] hover:bg-[#272d42] border border-[#2e344a] text-white px-3 py-2 rounded-lg text-[10px] font-bold transition-all shadow-md active:scale-95"
            title="Browse Local Audio File"
          >
            <Music size={13} className="text-cyan-400" />
            <span>Select File</span>
          </button>

          {/* Add to Queue Button */}
          <button 
            onClick={() => handleAddUrl()}
            disabled={!urlInput.trim()}
            className="shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)] active:scale-95"
          >
            <Plus size={13} />
            Add to Queue
          </button>

          {/* Clear Queue */}
          {queue.length > 0 && (
            <button 
              onClick={handleClearQueue}
              className="shrink-0 bg-red-950/40 hover:bg-red-900/80 text-red-300 border border-red-800/50 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95"
              title="Clear entire queue"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {/* ── Main Queue Content / Futuristic Animated Empty State ────────────── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative z-10 custom-scrollbar">
        {queue.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 text-center select-none relative">
            
            {/* Animated Ambient Glow Sphere */}
            <div className="absolute w-72 h-72 bg-gradient-to-tr from-orange-600/15 via-amber-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* ── Center Animated Cyber Visualizer ─────────────────────────── */}
            <div className="relative mb-5 flex items-center justify-center">
              
              {/* Outer Pulsing Rings */}
              <div className="absolute w-28 h-28 rounded-full border border-orange-500/20 animate-ping opacity-25 pointer-events-none" style={{ animationDuration: '3s' }} />
              <div className="absolute w-24 h-24 rounded-full border border-cyan-500/20 animate-pulse pointer-events-none" />

              {/* Glowing Center Hologram Disc */}
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1f2438] to-[#0c0e17] border-2 border-orange-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.3)] group-hover:border-orange-400 transition-all">
                <Scissors size={28} className="text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
            </div>

            {/* ── Center Dancing Audio Equalizer Bars Animation ────────────── */}
            <div className="flex items-end justify-center gap-1.5 h-8 mb-4">
              {[0.4, 0.8, 0.3, 0.9, 0.5, 1.0, 0.7, 0.4, 0.85, 0.6, 0.95, 0.5, 0.75, 0.3, 0.9].map((heightRatio, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-orange-600 via-amber-400 to-cyan-400 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                  style={{
                    height: `${heightRatio * 100}%`,
                    animation: `pulse ${1 + (i % 5) * 0.25}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>

            {/* Titles & Description */}
            <h4 className="text-sm font-black text-white uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center gap-2 mb-1.5">
              <span>Smart Playlist Splitter Station</span>
            </h4>
            
            <p className="text-xs text-gray-400 max-w-md leading-relaxed mb-6">
              Tempelkan URL video YouTube kompilasi, album, atau drag audio lokal. Sistem akan memotong lagu secara instan dengan deteksi AI.
            </p>

            {/* ── 3 Feature Showcase Cards ──────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl text-left">
              
              {/* Card 1 */}
              <div className="bg-[#10131d]/80 hover:bg-[#151926] border border-[#252b3d] hover:border-orange-500/40 p-3 rounded-xl transition-all duration-300 shadow-lg group/card">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-2 group-hover/card:scale-110 transition-transform">
                  <Sparkles size={16} />
                </div>
                <div className="text-xs font-bold text-white mb-1">AI Tracklist OCR</div>
                <div className="text-[10px] text-gray-400 leading-snug">
                  Membaca tracklist otomatis dari deskripsi, thumbnail, dan chapter YouTube.
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-[#10131d]/80 hover:bg-[#151926] border border-[#252b3d] hover:border-cyan-500/40 p-3 rounded-xl transition-all duration-300 shadow-lg group/card">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2 group-hover/card:scale-110 transition-transform">
                  <Activity size={16} />
                </div>
                <div className="text-xs font-bold text-white mb-1">120 FPS Waveform</div>
                <div className="text-[10px] text-gray-400 leading-snug">
                  Editor waveform manual super mulus dengan zoom presisi hingga 16x.
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#10131d]/80 hover:bg-[#151926] border border-[#252b3d] hover:border-purple-500/40 p-3 rounded-xl transition-all duration-300 shadow-lg group/card">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2 group-hover/card:scale-110 transition-transform">
                  <Zap size={16} />
                </div>
                <div className="text-xs font-bold text-white mb-1">Lossless MP3 Export</div>
                <div className="text-[10px] text-gray-400 leading-snug">
                  Ekspor puluhan lagu individual berkualitas tinggi dalam hitungan detik.
                </div>
              </div>

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
