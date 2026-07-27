import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { foundation, getBootstrapData } from '../../foundation/index.js';
import { SOURCE_TYPE, SOURCE_STATUS, METADATA_STATUS, sumTotalDuration } from '../../entities/m2/SourceEntity.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getContext() {
  const bd = getBootstrapData();
  return {
    workspaceId: bd?.workspace?.id || '',
    userId: bd?.user?.id || '',
  };
}

// ─── Type Badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const map = {
    [SOURCE_TYPE.AUDIO_FILE]:   { label: 'Audio File',   cls: 'bg-blue-900/50 text-blue-300 border-blue-700/50' },
    [SOURCE_TYPE.FOLDER_AUDIO]: { label: 'Folder Track', cls: 'bg-violet-900/50 text-violet-300 border-violet-700/50' },
    [SOURCE_TYPE.YOUTUBE_URL]:  { label: 'YouTube',      cls: 'bg-red-900/50 text-red-300 border-red-700/50' },
  };
  const { label, cls } = map[type] || { label: type, cls: 'bg-gray-800 text-gray-400 border-gray-700' };
  return (
    <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    [SOURCE_STATUS.READY]:   { cls: 'text-emerald-400', icon: '✓' },
    [SOURCE_STATUS.PENDING]: { cls: 'text-amber-400',   icon: '⟳' },
    [SOURCE_STATUS.INVALID]: { cls: 'text-red-400',     icon: '✗' },
    [SOURCE_STATUS.FAILED]:  { cls: 'text-red-500',     icon: '!' },
  };
  const { cls, icon } = map[status] || { cls: 'text-gray-500', icon: '?' };
  return (
    <span className={`text-[9px] font-bold ${cls}`}>
      {icon} {status}
    </span>
  );
}

// ─── Metadata Status Pill ─────────────────────────────────────────────────────

function MetadataPill({ source }) {
  if (!source || !source.metadataStatus) return null;
  const status = source.metadataStatus;
  const progressText = source.metadataProgressText || 'Fetching...';
  const fetchedAt = source.metadataFetchedAt ? `Fetched: ${new Date(source.metadataFetchedAt).toLocaleTimeString('en-GB')}` : '';

  if (status === 'idle') {
    return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-amber-900/40 text-amber-300 border-amber-700/30">Metadata Pending</span>;
  }
  if (status === 'fetching') {
    return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-blue-900/40 text-blue-300 border-blue-700/30 animate-pulse">{progressText}</span>;
  }
  if (status === 'ready') {
    return (
      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-emerald-900/40 text-emerald-300 border-emerald-700/30 whitespace-nowrap">
        ✓ Metadata Ready
        {fetchedAt && <span className="ml-1.5 border-l border-emerald-700/30 pl-1.5 text-emerald-400/80">{fetchedAt}</span>}
      </span>
    );
  }
  if (status === 'failed') {
    return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-red-900/40 text-red-300 border-red-700/30">✗ {source.metadataError || 'Unable to retrieve YouTube metadata'}</span>;
  }
  
  return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-gray-800 text-gray-500 border-gray-700">{status}</span>;
}

// ─── Thumbnail Preview ────────────────────────────────────────────────────────

function ThumbnailPreview({ url, title, expanded = false }) {
  const [errored, setErrored] = useState(false);
  const sizeClass = expanded ? "w-full aspect-video" : "w-16 h-10";
  if (!url || errored) {
    return (
      <div className={`${sizeClass} rounded bg-[#1a1e2e] border border-[#2d3247] flex items-center justify-center shrink-0`}>
        <span className="text-[14px] opacity-30">▶</span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={title || 'thumbnail'}
      className={`${sizeClass} object-cover rounded border border-[#2d3247] shrink-0`}
      onError={() => setErrored(true)}
    />
  );
}

// ─── YouTube Source Row (Compact List) ────────────────────────────────────────

function YouTubeSourceCard({ source, onRemove, onToggleSelect, onFetchMetadata, onUpdateCleanTitle, isFetching, dlStatus }) {
  const hasMetadata = source.metadataStatus === METADATA_STATUS.READY;
  const isFetchingThis = source.metadataStatus === METADATA_STATUS.FETCHING || isFetching;
  const hasFailed = source.metadataStatus === METADATA_STATUS.FAILED;
  const canFetch = !source.validationErrors?.length && source.youtubeId &&
    source.metadataStatus !== METADATA_STATUS.FETCHING &&
    source.status !== SOURCE_STATUS.INVALID;

  const [cleanTitle, setCleanTitle] = useState(source.cleanTitle || source.title || '');
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => { setCleanTitle(source.cleanTitle || source.title || ''); }, [source.cleanTitle, source.title]);

  const handleBlur = () => {
    setIsEditing(false);
    if (cleanTitle.trim() !== (source.cleanTitle || source.title || '').trim()) {
      onUpdateCleanTitle(source.id, cleanTitle);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
    else if (e.key === 'Escape') {
      setCleanTitle(source.cleanTitle || source.title || '');
      setIsEditing(false);
    }
  };

  return (
    <div className={`
      flex items-center gap-3 px-3 py-1.5 transition-all duration-150 group border-b border-[#21232d] last:border-0
      ${source.selected
        ? 'bg-[#f97316]/10 border-l-2 border-l-[#f97316]'
        : 'bg-[#161822] hover:bg-[#1a1d27] border-l-2 border-l-transparent'}
    `}>
      <input
        type="checkbox"
        checked={source.selected}
        onChange={() => onToggleSelect(source.id)}
        className="accent-[#f97316] cursor-pointer shrink-0"
      />
      
      {isFetchingThis ? (
        <div className="w-8 h-5 rounded bg-[#1e2230] animate-pulse border border-[#2d3247] shrink-0" />
      ) : (
        <div className="w-8 h-5 overflow-hidden rounded shrink-0 border border-[#2d3247]">
          {source.thumbnailUrl ? <img src={source.thumbnailUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#1a1e2e]" />}
        </div>
      )}

      <div className="flex-1 min-w-0 flex items-center gap-3">
        {/* Title Editor */}
        <div className="w-[40%] min-w-[150px] shrink-0">
          {isEditing ? (
            <input 
              autoFocus value={cleanTitle} onChange={e => setCleanTitle(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown}
              className="w-full bg-[#0a0b0f] border border-[#f97316] rounded px-2 py-0.5 text-[10px] font-semibold text-white focus:outline-none"
            />
          ) : (
            <div onClick={() => setIsEditing(true)} className="w-full px-1 text-[10px] font-semibold text-gray-200 cursor-text hover:bg-[#1e2230] rounded truncate border border-transparent hover:border-[#424867]">
              {cleanTitle || (source.youtubeId ? `YT: ${source.youtubeId}` : 'Untitled')}
            </div>
          )}
        </div>

        {/* Info Badges */}
        <div className="flex-1 flex items-center gap-2 overflow-hidden">
          <TypeBadge type={source.sourceType} />
          {hasMetadata ? (
            dlStatus ? (
               <div className="flex-1 min-w-[100px] max-w-[140px] bg-black/60 rounded h-4 overflow-hidden ml-2 border border-[#3a3f58] relative shadow-inner">
                 <div 
                   className={`h-full ${dlStatus.status === 'extracting' ? 'bg-amber-500/80 animate-pulse w-full' : 'bg-orange-500/80 transition-all duration-300'}`} 
                   style={{ width: dlStatus.status === 'extracting' ? '100%' : `${dlStatus.progress}%` }} 
                 />
                 <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tracking-wider text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                   {dlStatus.status === 'extracting' ? 'EXTRACTING...' : `DOWNLOADING ${dlStatus.progress}%`}
                 </span>
               </div>
            ) : (
               <>
                 <span className="text-[9px] text-gray-500 truncate max-w-[100px]">{source.channelName}</span>
                 <span className="text-[9px] text-emerald-400 font-mono">{source.duration}</span>
               </>
            )
          ) : (
            <MetadataPill source={source} />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {canFetch && !hasMetadata && (
          <button onClick={() => onFetchMetadata(source.id)} disabled={isFetchingThis} className="px-2 py-0.5 text-[8px] font-bold rounded bg-blue-900/40 hover:bg-blue-800 border border-blue-700/50 text-blue-300 transition-colors">
            {isFetchingThis ? 'Fetching...' : 'Fetch Meta'}
          </button>
        )}
        {hasFailed && (
          <button onClick={() => onFetchMetadata(source.id)} disabled={isFetchingThis} className="px-2 py-0.5 text-[8px] font-bold rounded bg-red-900/40 hover:bg-red-800 border border-red-700/50 text-red-300 transition-colors">
            Retry
          </button>
        )}
        <button onClick={() => onRemove(source.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]" title="Remove">✕</button>
      </div>
    </div>
  );
}

// ─── Audio Source Row (Compact List) ──────────────────────────────────────────

function AudioSourceCard({ source, onRemove, onToggleSelect, onUpdateCleanTitle, onRelink }) {
  const hasErrors = source.validationErrors?.length > 0;
  const [cleanTitle, setCleanTitle] = useState(source.cleanTitle || source.title || '');
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => { setCleanTitle(source.cleanTitle || source.title || ''); }, [source.cleanTitle, source.title]);

  const handleBlur = () => {
    setIsEditing(false);
    if (cleanTitle.trim() !== (source.cleanTitle || source.title || '').trim()) {
      onUpdateCleanTitle(source.id, cleanTitle);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
    else if (e.key === 'Escape') {
      setCleanTitle(source.cleanTitle || source.title || '');
      setIsEditing(false);
    }
  };

  return (
    <div className={`
      flex items-center gap-3 px-3 py-1.5 transition-all duration-150 group border-b border-[#21232d] last:border-0
      ${source.selected
        ? 'bg-[#f97316]/10 border-l-2 border-l-[#f97316]'
        : hasErrors
          ? 'bg-red-900/10 border-l-2 border-l-red-500'
          : 'bg-[#161822] hover:bg-[#1a1d27] border-l-2 border-l-transparent'}
    `}>
      <input
        type="checkbox"
        checked={source.selected}
        onChange={() => onToggleSelect(source.id)}
        className="accent-[#f97316] cursor-pointer shrink-0"
      />
      
      <div className="w-8 h-5 flex items-center justify-center bg-[#1a1e2e] rounded border border-[#2d3247] shrink-0 text-[10px]">
        {source.sourceType === SOURCE_TYPE.FOLDER_AUDIO ? '📁' : '🎵'}
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-3">
        {/* Title Editor */}
        <div className="w-[40%] min-w-[150px] shrink-0">
          {isEditing ? (
            <input 
              autoFocus value={cleanTitle} onChange={e => setCleanTitle(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown}
              className="w-full bg-[#0a0b0f] border border-[#f97316] rounded px-2 py-0.5 text-[10px] font-semibold text-white focus:outline-none"
            />
          ) : (
            <div onClick={() => setIsEditing(true)} className="w-full px-1 text-[10px] font-semibold text-gray-200 cursor-text hover:bg-[#1e2230] rounded truncate border border-transparent hover:border-[#424867]">
              {cleanTitle || source.title || 'Untitled'}
            </div>
          )}
        </div>

        {/* Info Badges */}
        <div className="flex-1 flex items-center gap-2 overflow-hidden">
          <TypeBadge type={source.sourceType} />
          {source.isUnlinked ? (
            <span className="text-[8px] font-bold text-amber-500 border border-amber-600/50 bg-amber-900/30 px-1 rounded">UNLINKED</span>
          ) : (
            <StatusBadge status={source.status} />
          )}
          {source.duration && <span className="text-[9px] text-gray-500 font-mono">{source.duration}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {source.isUnlinked && (
          <button onClick={() => onRelink(source.id)} className="px-2 py-0.5 text-[8px] font-bold rounded bg-amber-900/40 hover:bg-amber-800 border border-amber-700/50 text-amber-300 transition-colors">
            Relink File
          </button>
        )}
        <button onClick={() => onRemove(source.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]" title="Remove">✕</button>
      </div>
    </div>
  );
}

// ─── Selected Source Editor (Side Drawer) ─────────────────────────────────────

function SelectedSourceEditor({ source, onUpdateCleanTitle, onFetchMetadata, isFetching }) {
  const [cleanTitle, setCleanTitle] = useState(source.cleanTitle || source.title || '');
  useEffect(() => { setCleanTitle(source.cleanTitle || source.title || ''); }, [source.cleanTitle, source.title]);

  const handleBlur = () => {
    if (cleanTitle.trim() !== (source.cleanTitle || source.title || '').trim()) {
      onUpdateCleanTitle(source.id, cleanTitle);
    }
  };

  const isYT = source.sourceType === SOURCE_TYPE.YOUTUBE_URL;
  const isFetchingThis = source.metadataStatus === METADATA_STATUS.FETCHING || isFetching;

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 bg-[#0f111a] border-b border-[#21232d]">
        <div className="text-[11px] font-bold text-gray-200 uppercase tracking-wide">
          Selected Source Details
        </div>
      </div>
      <div className="p-3 space-y-3 overflow-y-auto flex-1">
        {isYT && (
          <div className="mb-2">
            <ThumbnailPreview url={source.thumbnailUrl} title={source.title} expanded />
          </div>
        )}
        
        <div>
          <label className="block text-[9px] text-gray-500 uppercase font-bold tracking-wide mb-1">Raw Title</label>
          <div className="text-[11px] text-gray-400 bg-[#080910] border border-[#21232d] p-1.5 rounded break-words">
            {source.title || (source.youtubeId ? `YouTube: ${source.youtubeId}` : 'Untitled')}
          </div>
        </div>

        <div>
          <label className="block text-[9px] text-blue-400 uppercase font-bold tracking-wide mb-1">Clean Title</label>
          <input 
            value={cleanTitle}
            onChange={e => setCleanTitle(e.target.value)}
            onBlur={handleBlur}
            placeholder="Clean Title..."
            className="w-full bg-[#181922] border border-[#2563eb]/40 focus:border-[#2563eb] rounded px-2 py-1.5 text-[11px] font-semibold text-gray-200 focus:outline-none transition-colors shadow-inner"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#21232d]">
          <div>
            <label className="block text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">Type</label>
            <TypeBadge type={source.sourceType} />
          </div>
          <div>
            <label className="block text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">Status</label>
            <StatusBadge status={source.status} />
          </div>
          {source.duration && (
            <div>
              <label className="block text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">Duration</label>
              <div className="text-[10px] text-emerald-400 font-mono">{source.duration}</div>
            </div>
          )}
          {isYT && source.channelName && (
            <div className="col-span-2">
              <label className="block text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">Channel Name</label>
              <div className="text-[10px] text-gray-300">{source.channelName}</div>
            </div>
          )}
          {isYT && source.metadataProvider && (
            <div className="col-span-2">
              <label className="block text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">Metadata Source</label>
              <div className="text-[10px] text-blue-400 font-bold">{source.metadataProvider}</div>
            </div>
          )}
          {source.localPath && (
            <div className="col-span-2">
              <label className="block text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">Local Path</label>
              <div className="text-[9px] text-gray-500 font-mono break-all">{source.localPath}</div>
            </div>
          )}
        </div>

        {isYT && (
          <div className="pt-2 border-t border-[#21232d]">
            <label className="block text-[9px] text-gray-500 uppercase tracking-wide mb-1.5">Metadata</label>
            {isFetchingThis && (
              <div className="text-[9px] text-blue-400/80 font-mono mb-2">
                Fetching Metadata<br/>
                <span className="opacity-70 truncate block">{source.youtubeUrl}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <MetadataPill source={source} />
            </div>
            {source.metadataStatus !== METADATA_STATUS.READY && source.metadataStatus !== METADATA_STATUS.FETCHING && (
               <button
                onClick={() => onFetchMetadata(source.id)}
                disabled={isFetchingThis}
                className="w-full flex justify-center items-center gap-1 px-2 py-1 text-[9px] font-bold rounded bg-[#1a2a3a] hover:bg-[#1d3a5c] border border-blue-700/30 text-blue-300 transition-all"
              >
                {isFetchingThis ? '⟳ Fetching…' : '⬇ Fetch Metadata'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Import Modals ────────────────────────────────────────────────────────────

function ModalShell({ title, children, onClose }) {
  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f111a] border border-[#2d3247] rounded-lg p-4 w-full max-w-sm shadow-2xl">
        <div className="text-[11px] font-bold text-gray-300 mb-3">{title}</div>
        {children}
        <div className="flex gap-2 mt-3 justify-end">
          <button onClick={onClose} className="px-3 py-1 text-[9px] bg-[#21232d] hover:bg-[#2d3044] text-gray-400 rounded transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
  
  return createPortal(modalContent, document.body);
}


function AddYouTubeModal({ onAdd, onClose }) {
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);
  useEffect(() => inputRef.current?.focus(), []);
  return (
    <ModalShell title="▶ Add YouTube URL" onClose={onClose}>
      <label className="block text-[9px] text-gray-500 mb-1 mt-2">YouTube URL</label>
      <input
        ref={inputRef}
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onAdd(url); if (e.key === 'Escape') onClose(); }}
        placeholder="https://www.youtube.com/watch?v=..."
        className="w-full bg-[#181922] border border-[#2d3247] rounded px-2 py-1.5 text-gray-300 text-[10px] focus:outline-none focus:border-red-500/60 font-mono"
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={() => onAdd(url)}
          disabled={!url.trim()}
          className="px-3 py-1 text-[9px] bg-red-700 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add URL
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Source Pool Panel ────────────────────────────────────────────────────────

export default function SourcePoolPanel({ isDevMode = false, addLog, addNotification, onSourcesChanged, onAddToQueue }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingIds, setFetchingIds] = useState(new Set());
  const [bulkFetching, setBulkFetching] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [modal, setModal] = useState(null);
  const [stats, setStats] = useState(null);
  const [bulkProgress, setBulkProgress] = useState(null);
  const [portalTarget, setPortalTarget] = useState(null);
  const [downloadStatuses, setDownloadStatuses] = useState({});

  useEffect(() => {
    setPortalTarget(document.getElementById('m2-add-to-queue-portal-target'));
    const intv = setInterval(async () => {
      try {
        const res = await fetch('/api/m2/yt-downloads');
        if (res.ok) {
          const data = await res.json();
          setDownloadStatuses(data);
        }
      } catch (e) {}
    }, 1500);
    return () => clearInterval(intv);
  }, []);

  const loadSources = useCallback(async () => {
    try {
      const all = await foundation.sourceService.getAll(getContext());
      setSources(all);
      const s = await foundation.sourceService.getStats(getContext());
      setStats(s);

      console.log(`LOAD_SOURCES_RESULT\ncount=${all.length}`);
      
      all.forEach(s => {
        console.log('SOURCE_LOADED', JSON.stringify({
          id: s.id,
          duration: s.duration,
          videoDuration: s.videoDuration
        }));
      });
    } catch (err) {
      console.error('[SourcePoolPanel] loadSources error:', err);
    }
  }, []);

  useEffect(() => {
    loadSources();
    foundation.sourceService.addEventListener('sources_updated', loadSources);
    return () => {
      foundation.sourceService.removeEventListener('sources_updated', loadSources);
    };
  }, [loadSources]);

  const showFeedback = (type, message, ms = 3500) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), ms);
  };

  const handleImportFile = async (path) => {
    setModal(null);
    if (!path?.trim()) { showFeedback('error', 'File path cannot be empty.'); return; }
    setLoading(true);
    try {
      const { source, skipped, reason } = await foundation.sourceService.importAudioFile(path.trim(), getContext());
      skipped ? showFeedback('info', `Skipped: ${reason}`) : showFeedback('success', `✓ Imported: ${source.title}`);
      if (!skipped) {
        addNotification?.('Source Added', `Pool: ${sources.length} -> ${sources.length + 1}`);
        addLog?.('[M2] Source Added');
        onSourcesChanged?.();
      }
      await loadSources();
    } catch (err) { showFeedback('error', `Import failed: ${err.message}`); }
    finally { setLoading(false); }
  };

  const handleImportFolder = async (folderPath) => {
    setModal(null);
    if (!folderPath?.trim()) { showFeedback('error', 'Folder path cannot be empty.'); return; }
    setLoading(true);
    try {
      const { added, skipped } = await foundation.sourceService.importFolder(folderPath.trim(), getContext());
      if (added.length === 0 && skipped > 0) {
        showFeedback('info', `All files already in pool (${skipped} skipped).`);
      } else {
        const total = added.length + skipped;
        const summary = `Files Found: ${total}\nImported: ${added.length}\nDuplicates Skipped: ${skipped}`;
        showFeedback('success', summary, 6000);
        setTimeout(() => alert(`Folder Import Summary\n\n${summary}`), 100);
        addNotification?.('Source Added', `Pool: ${sources.length} -> ${sources.length + added.length}`);
        addLog?.('[M2] Source Added');
        onSourcesChanged?.();
      }
      await loadSources();
    } catch (err) { showFeedback('error', `Folder import failed: ${err.message}`); }
    finally { setLoading(false); }
  };

  const handleFileButtonClick = async () => {
    try {
      const res = await fetch('/api/m2/dialog/file', { method: 'POST' });
      if (res.ok) {
        const { path } = await res.json();
        if (path) handleImportFile(path);
      }
    } catch (err) {
      showFeedback('error', 'Failed to open file picker');
    }
  };

  const handleFolderButtonClick = async () => {
    try {
      const res = await fetch('/api/m2/dialog/folder', { method: 'POST' });
      if (res.ok) {
        const { path } = await res.json();
        if (path) handleImportFolder(path);
      }
    } catch (err) {
      showFeedback('error', 'Failed to open folder picker');
    }
  };

  const handleAddYouTube = async (url) => {
    setModal(null);
    if (!url?.trim()) { showFeedback('error', 'URL cannot be empty.'); return; }
    setLoading(true);
    try {
      const { source, skipped, reason } = await foundation.sourceService.addYouTubeUrl(url.trim(), getContext());
      if (skipped) {
        showFeedback('info', `Skipped: ${reason}`);
      } else {
        showFeedback('success', `✓ Added YouTube source. Fetching metadata...`);
        addNotification?.('Source Added', `Pool: ${sources.length} -> ${sources.length + 1}`);
        addLog?.('[M2] Source Added');
        onSourcesChanged?.();
        // Auto-trigger fetch
        if (source && source.id) {
          setTimeout(() => handleFetchMetadata(source.id), 500);
        }
      }
      await loadSources();
    } catch (err) { showFeedback('error', `Add URL failed: ${err.message}`); }
    finally { setLoading(false); }
  };

  const handleUpdateCleanTitle = async (id, cleanTitle) => {
    try {
      await foundation.sourceService.updateCleanTitle(id, cleanTitle, getContext());
      // Only refresh local state instead of full load to prevent jitter during edits
      setSources(prev => prev.map(s => s.id === id ? { ...s, cleanTitle: cleanTitle.trim() } : s));
      addNotification?.('Clean Title Updated');
      addLog?.('[M2] Clean Title Updated');
      onSourcesChanged?.();
    } catch (err) {
      showFeedback('error', `Update title failed: ${err.message}`);
    }
  };

  const handleRelink = async (id) => {
    try {
      const res = await fetch('/api/m2/dialog/file', { method: 'POST' });
      if (res.ok) {
        const { path } = await res.json();
        if (path) {
          await foundation.sourceService.relinkSource(id, path, getContext());
          addNotification?.('Source Relinked');
          addLog?.('[M2] Source Relinked');
          await loadSources();
          onSourcesChanged?.();
        }
      }
    } catch (err) {
      showFeedback('error', 'Failed to relink file');
    }
  };

  const handleFetchMetadata = async (id) => {
    setFetchingIds(prev => new Set([...prev, id]));
    setSources(prev => prev.map(s => s.id === id ? { ...s, metadataStatus: 'fetching' } : s));
    try {
      const ctx = getContext();
      const { source, success, error } = await foundation.sourceService.fetchMetadata(id, ctx);
      if (success) {
        showFeedback('success', `✓ Metadata fetched: ${source.videoTitle}`);
        addNotification?.('Metadata Ready');
        addLog?.('[M2] Metadata Ready');
      } else {
        showFeedback('error', `Metadata failed: ${error}`);
      }
      await loadSources();
    } catch (err) {
      showFeedback('error', `Fetch error: ${err.message}`);
      await loadSources();
    } finally {
      setFetchingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleFetchSelectedMetadata = async () => {
    const ytSelected = sources.filter(s =>
      s.selected &&
      s.sourceType === SOURCE_TYPE.YOUTUBE_URL &&
      s.status !== SOURCE_STATUS.INVALID &&
      s.metadataStatus !== METADATA_STATUS.READY
    );
    if (ytSelected.length === 0) {
      showFeedback('info', 'No unfetched YouTube sources selected.');
      return;
    }
    setBulkFetching(true);
    setBulkProgress({ done: 0, total: ytSelected.length });
    try {
      const ctx = getContext();
      const { succeeded, failed, skipped } = await foundation.sourceService.fetchMetadataBulk(
        ytSelected.map(s => s.id),
        ctx,
        (progress) => {
          setBulkProgress({ done: progress.done, total: progress.total });
          loadSources();
        }
      );
      showFeedback(
        failed > 0 ? 'error' : 'success',
        `Bulk fetch: ${succeeded} succeeded, ${failed} failed, ${skipped} skipped.`
      );
      if (succeeded > 0) {
        addNotification?.('Metadata Ready', `${succeeded} sources updated`);
        addLog?.('[M2] Metadata Ready');
      }
      await loadSources();
    } catch (err) {
      showFeedback('error', `Bulk fetch error: ${err.message}`);
    } finally {
      setBulkFetching(false);
      setBulkProgress(null);
    }
  };

  const handleRemove = async (id) => {
    setLoading(true);
    try {
      await foundation.sourceService.removeSource(id, getContext());
      addNotification?.('Source Removed', `Pool: ${sources.length} -> ${sources.length - 1}`);
      addLog?.('[M2] Source Removed');
      await loadSources();
      onSourcesChanged?.();
    } catch (err) { showFeedback('error', `Remove failed: ${err.message}`); }
    finally { setLoading(false); }
  };

  const handleRemoveSelected = async () => {
    const ids = sources.filter(s => s.selected).map(s => s.id);
    if (ids.length === 0) return;
    setLoading(true);
    try {
      const count = await foundation.sourceService.removeSources(ids, getContext());
      showFeedback('success', `Removed ${count} source${count !== 1 ? 's' : ''}.`);
      addNotification?.('Source Removed', `Pool: ${sources.length} -> ${sources.length - count}`);
      addLog?.('[M2] Source Removed');
      await loadSources();
      onSourcesChanged?.();
    } catch (err) { showFeedback('error', `Remove failed: ${err.message}`); }
    finally { setLoading(false); }
  };

  const handleToggleSelect = (id) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const handleSelectAll = () => {
    const allSelected = sources.every(s => s.selected);
    setSources(prev => prev.map(s => ({ ...s, selected: !allSelected })));
  };

  const handleDeselectAll = () => {
    setSources(prev => prev.map(s => ({ ...s, selected: false })));
  };

  const handleClearAll = async () => {
    if (sources.length === 0) return;
    setLoading(true);
    try {
      const count = sources.length;
      await foundation.sourceService.clearPool(getContext());
      showFeedback('success', 'Source Pool cleared.');
      addNotification?.('Source Removed', `Pool: ${count} -> 0`);
      addLog?.('[M2] Source Removed');
      await loadSources();
      onSourcesChanged?.();
    } catch (err) { showFeedback('error', `Clear failed: ${err.message}`); }
    finally { setLoading(false); }
  };

  const selectedCount = sources.filter(s => s.selected).length;
  const allSelected = sources.length > 0 && sources.every(s => s.selected);

  const filteredSources = sources.filter(s => s.status !== SOURCE_STATUS.INVALID);

  return (
    <>
      {modal === 'youtube' && <AddYouTubeModal onAdd={handleAddYouTube}  onClose={() => setModal(null)} />}

      <div className={`flex flex-col xl:flex-row gap-4 h-full transition-all duration-300`}>
        {/* Main Source List Pane */}
        <div className="flex-1 bg-transparent overflow-hidden flex flex-col min-w-0">
          <div className="flex items-center justify-between px-4 py-3 bg-black/20 border-b border-[#2a2c33] shrink-0 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[12px] font-bold text-white tracking-wide uppercase flex items-center gap-2 m5-white-glow">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
                  IMPORT SOURCES {sources.length > 0 && <span className="text-orange-400 ml-1.5">✓</span>}
                </h3>
                {stats && (
                  <span className="text-[9px] bg-black/40 text-gray-400 px-1.5 py-0.5 rounded font-mono ml-2 border border-[#2a2c33]">
                    {stats.total} source{stats.total !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button id="m2-add-file-btn" onClick={handleFileButtonClick} disabled={loading}
                className="px-3 py-1 text-[10px] bg-[#161822] hover:bg-orange-500/10 text-orange-400 font-bold rounded-full transition-colors disabled:opacity-40 flex items-center gap-1.5 border border-transparent hover:border-orange-500/30">
                🎵 File
              </button>
              <button id="m2-add-folder-btn" onClick={handleFolderButtonClick} disabled={loading}
                className="px-3 py-1 text-[10px] bg-[#161822] hover:bg-orange-500/10 text-orange-400 font-bold rounded-full transition-colors disabled:opacity-40 flex items-center gap-1.5 border border-transparent hover:border-orange-500/30">
                📁 Folder
              </button>
              <button id="m2-add-youtube-btn" onClick={() => setModal('youtube')} disabled={loading}
                className="px-3 py-1 text-[10px] bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)] transition-colors disabled:opacity-40 flex items-center gap-1.5">
                ▶ YouTube
              </button>
            </div>
          </div>

          {feedback && (
            <div className={`px-3 py-1.5 text-[10px] font-medium border-b ${
              feedback.type === 'success' ? 'bg-emerald-950/60 border-emerald-900/40 text-emerald-300' :
              feedback.type === 'error'   ? 'bg-red-950/60 border-red-900/40 text-red-300' :
                                            'bg-blue-950/60 border-blue-900/40 text-blue-300'
            }`}>
              {feedback.message}
            </div>
          )}

          {bulkProgress && (
            <div className="px-3 py-1.5 bg-blue-950/40 border-b border-blue-900/30 flex items-center gap-2">
              <div className="flex-1 h-1 bg-[#21232d] rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-blue-400 font-mono shrink-0">
                {bulkProgress.done} / {bulkProgress.total}
              </span>
            </div>
          )}

          {sources.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-black/20 border-b border-[#2a2c33] flex-wrap shadow-inner relative z-10">
              <button
                id="m2-select-all-btn"
                onClick={allSelected ? handleDeselectAll : handleSelectAll}
                className="text-[9px] text-gray-500 hover:text-gray-300 transition-colors select-none cursor-pointer"
              >
                {allSelected ? '☑ Deselect All' : '☐ Select All'}
              </button>

              <span className="text-[9px] text-gray-700">|</span>
              
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors ${selectedCount > 0 ? 'text-orange-400 bg-orange-950/30 border-orange-500/20' : 'text-gray-600 bg-gray-900/50 border-gray-800'}`}>
                {selectedCount} selected
              </span>

              <button
                id="m2-remove-selected-btn"
                onClick={handleRemoveSelected}
                disabled={selectedCount === 0}
                className="text-[9px] text-red-400 hover:text-red-300 hover:bg-red-950/30 px-2 py-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                🗑 Remove Selected
              </button>

              <div className="flex-1" />
              <button
                onClick={handleClearAll}
                className="text-[9px] text-gray-600 hover:text-red-400 hover:bg-red-950/20 px-2 py-0.5 rounded transition-colors"
              >
                ✕ Clear All
              </button>
            </div>
          )}

          <div className="max-h-[300px] overflow-y-auto">
            {loading && filteredSources.length === 0 ? (
              <div className="p-6 text-center text-[10px] text-gray-600 italic">Loading…</div>
            ) : filteredSources.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-2xl mb-2 opacity-30">🎵</div>
                <div className="text-[10px] text-gray-600 font-medium">No sources in pool.</div>
                <div className="text-[9px] text-gray-700 mt-1">
                  Import audio files, folders, or YouTube URLs to begin.
                </div>
              </div>
            ) : (
              <div className="flex flex-col border-b border-[#21232d]">
                {filteredSources.map(source =>
                  source.sourceType === SOURCE_TYPE.YOUTUBE_URL ? (
                    <YouTubeSourceCard
                      key={source.id}
                      source={source}
                      onRemove={handleRemove}
                      onToggleSelect={handleToggleSelect}
                      onFetchMetadata={handleFetchMetadata}
                      onUpdateCleanTitle={handleUpdateCleanTitle}
                      isFetching={fetchingIds.has(source.id)}
                      dlStatus={downloadStatuses[source.youtubeUrl] || downloadStatuses[source.youtubeUrl?.replace('ytsearch:', '')]}
                    />
                  ) : (
                    <AudioSourceCard
                      key={source.id}
                      source={source}
                      onRemove={handleRemove}
                      onToggleSelect={handleToggleSelect}
                      onUpdateCleanTitle={handleUpdateCleanTitle}
                      onRelink={handleRelink}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Summary Footer ─────────────────────────────────────────────── */}
      {stats && stats.total > 0 && (
        <div className="border border-[#21232d] rounded-lg bg-[#0a0b0f] px-3 py-2 mt-2">
          <div className="grid grid-cols-5 gap-2 text-center">
            <div>
              <div className="text-[8px] text-gray-600 uppercase">Total</div>
              <div className="text-[11px] font-bold text-gray-200">{stats.total}</div>
            </div>
            <div>
              <div className="text-[8px] text-gray-600 uppercase">Audio</div>
              <div className="text-[11px] font-bold text-blue-400">{stats.audioFileCount}</div>
            </div>
            <div>
              <div className="text-[8px] text-gray-600 uppercase">Folder</div>
              <div className="text-[11px] font-bold text-violet-400">{stats.folderTrackCount}</div>
            </div>
            <div>
              <div className="text-[8px] text-gray-600 uppercase">YouTube</div>
              <div className="text-[11px] font-bold text-red-400">{stats.youtubeCount}</div>
            </div>
            <div>
              <div className="text-[8px] text-gray-600 uppercase">Duration</div>
              <div className="text-[11px] font-bold text-emerald-400">{stats.totalDurationFormatted || '—'}</div>
            </div>
          </div>

          {stats.youtubeCount > 0 && (
            <div className="mt-1.5 flex items-center justify-center gap-3 text-[8px]">
              {stats.metadataReadyCount > 0 && (
                <span className="text-emerald-400">✓ {stats.metadataReadyCount} ready</span>
              )}
              {stats.metadataPendingCount > 0 && (
                <span className="text-amber-400">⟳ {stats.metadataPendingCount} pending</span>
              )}
              {stats.metadataFetchingCount > 0 && (
                <span className="text-blue-400 animate-pulse">↓ {stats.metadataFetchingCount} fetching</span>
              )}
              {stats.metadataFailedCount > 0 && (
                <span className="text-red-400">✗ {stats.metadataFailedCount} failed</span>
              )}
            </div>
          )}

          {stats.invalidCount > 0 && (
            <div className="mt-1 text-center text-[8px] text-red-400">
              ⚠ {stats.invalidCount} source{stats.invalidCount !== 1 ? 's' : ''} invalid
            </div>
          )}
        </div>
      )}

      {/* ── DevMode Stats ──────────────────────────────────────────────── */}
      {isDevMode && stats && (
        <div className="border border-red-900/30 rounded-lg bg-[#0a0005] px-3 py-2 space-y-1 mt-2">
          <div className="text-[8px] font-bold text-red-400 uppercase tracking-wide">Dev Stats — Source Pool (Task 02)</div>
          <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
            <div><span className="text-gray-600">Ready:</span> <span className="text-emerald-400">{stats.readyCount}</span></div>
            <div><span className="text-gray-600">Pending:</span> <span className="text-amber-400">{stats.pendingCount}</span></div>
            <div><span className="text-gray-600">Invalid:</span> <span className="text-red-400">{stats.invalidCount}</span></div>
            <div><span className="text-gray-600">Audio Files:</span> <span className="text-blue-400">{stats.audioFileCount}</span></div>
            <div><span className="text-gray-600">Folder Tracks:</span> <span className="text-violet-400">{stats.folderTrackCount}</span></div>
            <div><span className="text-gray-600">YouTube:</span> <span className="text-red-400">{stats.youtubeCount}</span></div>
          </div>
          {stats.youtubeCount > 0 && (
            <>
              <div className="text-[8px] font-bold text-amber-600 uppercase tracking-wide mt-1">YouTube Metadata Lifecycle</div>
              <div className="grid grid-cols-4 gap-2 text-[9px] font-mono">
                <div><span className="text-gray-600">Pending:</span> <span className="text-amber-400">{stats.metadataPendingCount}</span></div>
                <div><span className="text-gray-600">Fetching:</span> <span className="text-blue-400">{stats.metadataFetchingCount}</span></div>
                <div><span className="text-gray-600">Ready:</span> <span className="text-emerald-400">{stats.metadataReadyCount}</span></div>
                <div><span className="text-gray-600">Failed:</span> <span className="text-red-400">{stats.metadataFailedCount}</span></div>
              </div>
            </>
          )}
        </div>
      )}
      {/* ── Giant Add To Queue Button (Portal) ─────────────────────────── */}
      {portalTarget && createPortal(
        <button
          id="m2-add-queue-giant-btn"
          onClick={() => {
            if (selectedCount > 0 && onAddToQueue) {
               const selectedItems = sources.filter(s => s.selected);
               if (selectedItems.length > 0) {
                 onAddToQueue([{
                   renderId: 'direct-' + Date.now(),
                   renderName: selectedItems.length > 1 
                     ? `M2 Compilation (${selectedItems.length} Tracks)` 
                     : (selectedItems[0].cleanTitle || selectedItems[0].title || 'M2 Compilation'),
                   selected: true,
                   trackCount: selectedItems.length,
                   totalDurationSec: sumTotalDuration(selectedItems),
                   trackList: selectedItems
                 }]);
                 handleDeselectAll();
               }
            }
          }}
          disabled={selectedCount === 0}
          className={`w-[110px] h-full rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-1 group relative overflow-hidden ${
            selectedCount > 0 
              ? 'bg-gradient-to-br from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 cursor-pointer' 
              : 'bg-[#161822] border-[#2d3247] opacity-50 cursor-not-allowed'
          }`}
        >
          {selectedCount > 0 && (
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out pointer-events-none"></div>
          )}
          <div className="flex items-center gap-1.5">
            <span className={`text-lg drop-shadow-md transition-transform duration-300 ${selectedCount > 0 ? 'group-hover:-translate-y-1' : ''} ${selectedCount > 0 ? 'grayscale-0' : 'grayscale'}`}>🚀</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider drop-shadow-md leading-tight text-center ${selectedCount > 0 ? 'text-white' : 'text-gray-500'}`}>Add to<br/>Queue</span>
          </div>
          <span className={`text-[8px] font-mono ${selectedCount > 0 ? 'text-orange-200 bg-orange-950/50 px-2 py-0.5 rounded' : 'text-gray-600'}`}>
            {selectedCount} selected
          </span>
        </button>,
        portalTarget
      )}
    </>
  );
}
