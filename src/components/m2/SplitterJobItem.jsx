import React from 'react';
import ManualSlicer from './ManualSlicer.jsx';

const formatTime = (sec) => {
  if (sec === null || sec === undefined) return '...';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function SplitterJobItem({ job, onRemove, onManualExport }) {
  const isError = job.status === 'Playlist Structure Not Supported' || job.status === 'Metadata Not Found' || job.status === 'Failed' || job.status === 'Download Failed' || job.status === 'Split Failed';
  const isCompleted = job.status === 'Completed';
  const needsManualSlicing = job.status === 'Needs Manual Slicing';
  
  return (
    <div className={`
      rounded-lg border transition-all duration-150 overflow-hidden shadow-lg backdrop-blur-md p-3
      ${isError ? 'border-red-900/60 bg-red-950/20' : isCompleted ? 'border-emerald-900/60 bg-emerald-950/20' : 'border-[#2d3247] bg-[#161925]/80'}
    `}>
      <div className="flex items-start gap-3">
        {/* Thumbnail or Icon */}
        <div className="w-16 h-10 rounded bg-[#1a1e2e] border border-[#2d3247] flex items-center justify-center shrink-0 overflow-hidden">
          {job.metadata?.thumbnailUrl ? (
            <img src={job.metadata.thumbnailUrl} alt="Thumb" className="w-full h-full object-cover" />
          ) : (
             <span className="text-[14px] opacity-30">▶</span>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="text-[11px] font-bold text-gray-200 truncate" title={job.metadata?.videoTitle || job.url}>
            {job.metadata?.videoTitle || job.url}
          </div>
          
          {job.metadata?.channelName && (
            <div className="text-[9px] text-gray-500 truncate">
              {job.metadata.channelName} • {job.songs?.length || 0} Tracks
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
              isError ? 'bg-red-900/40 text-red-300 border-red-700/30' :
              isCompleted ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/30' :
              'bg-blue-900/40 text-blue-300 border-blue-700/30'
            }`}>
              {job.status}
            </span>
            
            {job.progress > 0 && !isCompleted && !isError && !needsManualSlicing && (
              <span className="text-[9px] font-mono text-gray-400">
                {job.progress.toFixed(1)}%
              </span>
            )}
          </div>
          
          {isError && job.error && (
            <div className="text-[9px] text-red-400 mt-1 whitespace-pre-wrap">
              {job.error}
            </div>
          )}
        </div>

        {/* Remove button */}
        {onRemove && (
          <button 
            onClick={() => onRemove(job.id)}
            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors shrink-0"
            title="Remove from queue"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Progress Bar */}
      {!isError && !isCompleted && !needsManualSlicing && (
        <div className="mt-3 h-1 w-full bg-[#1a1d27] rounded-full overflow-hidden shrink-0 relative">
          <div 
            className={`h-full bg-orange-500 transition-all duration-300 ease-out ${
              (job.status === 'Converting to MP3...' || job.status === 'Detecting Silence') ? 'w-full animate-pulse opacity-75 !bg-blue-500' : ''
            }`}
            style={{ width: (job.status === 'Converting to MP3...' || job.status === 'Detecting Silence') ? '100%' : `${job.progress}%` }}
          />
        </div>
      )}

      {/* Manual Slicer UI */}
      {needsManualSlicing && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <ManualSlicer 
            uri={job.url}
            titles={job.aiTitles}
            duration={job.metadata?.videoDuration}
            onExport={(songs) => onManualExport(job.id, songs)}
          />
        </div>
      )}

      {/* Song List */}
      {job.songs && job.songs.length > 0 && !needsManualSlicing && (
        <div className="mt-3 border-t border-white/5 pt-2 flex flex-col gap-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
          {job.songs.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between text-[10px] bg-black/20 px-2 py-1.5 rounded">
              <span className="text-gray-300 truncate font-medium flex-1 mr-2">{s.title}</span>
              <span className="text-gray-500 font-mono shrink-0">
                {formatTime(s.startTime)} - {s.endTime ? formatTime(s.endTime) : 'End'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
