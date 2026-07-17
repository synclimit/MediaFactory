import React, { useState, useCallback, useRef, useEffect } from 'react';
import { foundation, getBootstrapData } from '../../foundation/index.js';
import { SOURCE_TYPE, SOURCE_STATUS, METADATA_STATUS } from '../../entities/m2/SourceEntity.js';

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

// ─── YouTube Source Card (expanded view) ──────────────────────────────────────

function YouTubeSourceCard({ source, onRemove, onToggleSelect, onFetchMetadata, onUpdateCleanTitle, isFetching }) {
  const hasMetadata = source.metadataStatus === METADATA_STATUS.READY;
  const isFetchingThis = source.metadataStatus === METADATA_STATUS.FETCHING || isFetching;
  const hasFailed = source.metadataStatus === METADATA_STATUS.FAILED;
  const canFetch = !source.validationErrors?.length && source.youtubeId &&
    source.metadataStatus !== METADATA_STATUS.FETCHING &&
    source.status !== SOURCE_STATUS.INVALID;

  const [cleanTitle, setCleanTitle] = useState(source.cleanTitle || source.title || '');
  useEffect(() => { setCleanTitle(source.cleanTitle || source.title || ''); }, [source.cleanTitle, source.title]);

  const handleBlur = () => {
    if (cleanTitle.trim() !== (source.cleanTitle || source.title || '').trim()) {
      onUpdateCleanTitle(source.id, cleanTitle);
    }
  };

  return (
    <div className={`
      rounded border transition-all duration-150 overflow-hidden
      ${source.selected ? 'border-[#2563eb]/60 bg-[#0f1420]' : 'border-[#21232d] bg-[#0a0b0f] hover:border-[#3d4157]'}
    `}>
      {/* Card Header */}
      <div className="flex items-start gap-2 p-1.5">
        <input
          type="checkbox"
          checked={source.selected}
          onChange={() => onToggleSelect(source.id)}
          className="mt-1 accent-[#2563eb] cursor-pointer shrink-0"
        />
        <ThumbnailPreview url={source.thumbnailUrl} title={source.title} />

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-500 leading-tight line-clamp-1 flex-1 min-w-0" title={source.rawVideoTitle || source.rawTitle || source.title}>
              {source.cleanTitle || source.title || (source.youtubeId ? `YouTube: ${source.youtubeId}` : 'Untitled Source')}
            </span>
            <TypeBadge type={source.sourceType} />
          </div>
          
          <div>
            <input 
              value={cleanTitle}
              onChange={e => setCleanTitle(e.target.value)}
              onBlur={handleBlur}
              placeholder="Clean Title..."
              className="w-full bg-[#080910] border border-[#2d3247] hover:border-[#3d425c] focus:border-[#2563eb] rounded px-1.5 py-0.5 text-[11px] font-semibold text-gray-200 focus:outline-none transition-colors"
            />
          </div>

          {hasMetadata && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] mt-1">
              <div className="truncate"><span className="text-gray-600">Channel:</span> <span className="text-gray-300 font-medium">{source.channelName || '—'}</span></div>
              <div><span className="text-gray-600">Duration:</span> <span className="text-emerald-400 font-mono font-medium">{source.duration || '—'}</span></div>
            </div>
          )}

          {isFetchingThis && (
            <div className="text-[8px] text-blue-400/80 font-mono mt-1">
              Fetching Metadata<br/>
              <span className="opacity-70 truncate block max-w-[260px]">{source.youtubeUrl}</span>
            </div>
          )}

          {!hasMetadata && !isFetchingThis && source.youtubeUrl && (
            <div className="text-[8px] text-gray-600 font-mono truncate max-w-[260px]">
              {source.youtubeUrl}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap mt-1">
            <MetadataPill source={source} />
            {!hasMetadata && !source.validationErrors?.length && (
              <StatusBadge status={source.status} />
            )}
          </div>
        </div>

        <button
          onClick={() => onRemove(source.id)}
          className="text-gray-600 hover:text-red-400 transition-colors text-xs shrink-0 mt-0.5 ml-1"
          title="Remove source"
        >
          🗑
        </button>
      </div>

      {/* Fetch Metadata Footer */}
      {canFetch && !hasMetadata && (
        <div className="border-t border-[#1a1e2e] px-2 py-1 flex items-center justify-between bg-[#080910]">
          <span className="text-[8px] text-gray-600 italic">
            {isFetchingThis ? 'Fetching metadata…' : 'Metadata not yet fetched.'}
          </span>
          <button
            id={`m2-fetch-btn-${source.id}`}
            onClick={() => onFetchMetadata(source.id)}
            disabled={isFetchingThis}
            className={`
              flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded transition-all
              ${isFetchingThis
                ? 'bg-blue-900/30 text-blue-500 cursor-not-allowed'
                : 'bg-[#1a2a3a] hover:bg-[#1d3a5c] border border-blue-700/30 hover:border-blue-600/60 text-blue-300'}
            `}
          >
            {isFetchingThis ? '⟳ Fetching…' : '⬇ Fetch Metadata'}
          </button>
        </div>
      )}
      
      {/* Retry after fail */}
      {hasFailed && (
        <div className="border-t border-red-900/20 px-2 py-1 flex items-center justify-between bg-[#0a0508]">
          <span className="text-[8px] text-red-600 italic">Metadata fetch failed.</span>
          <button
            onClick={() => onFetchMetadata(source.id)}
            disabled={isFetchingThis}
            className="px-2 py-0.5 text-[9px] font-bold rounded bg-red-900/30 hover:bg-red-800/40 border border-red-700/30 text-red-300 transition-all disabled:opacity-40"
          >
            ↺ Retry
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Audio Source Card (compact) ──────────────────────────────────────────────

function AudioSourceCard({ source, onRemove, onToggleSelect, onUpdateCleanTitle, onRelink }) {
  const hasErrors = source.validationErrors?.length > 0;
  const [cleanTitle, setCleanTitle] = useState(source.cleanTitle || source.title || '');
  useEffect(() => { setCleanTitle(source.cleanTitle || source.title || ''); }, [source.cleanTitle, source.title]);

  const handleBlur = () => {
    if (cleanTitle.trim() !== (source.cleanTitle || source.title || '').trim()) {
      onUpdateCleanTitle(source.id, cleanTitle);
    }
  };

  return (
    <div className={`
      flex items-start gap-2 p-1.5 rounded border transition-all duration-150
      ${source.selected
        ? 'bg-[#1a1e2e] border-[#2563eb]/60'
        : hasErrors
          ? 'bg-[#1a0e0e] border-red-900/40 hover:border-red-700/50'
          : 'bg-[#0f1018] border-[#21232d] hover:border-[#3d4157]'}
    `}>
      <input
        type="checkbox"
        checked={source.selected}
        onChange={() => onToggleSelect(source.id)}
        className="mt-0.5 accent-[#2563eb] cursor-pointer shrink-0"
      />
      <span className="text-sm shrink-0 mt-0.5">
        {source.sourceType === SOURCE_TYPE.FOLDER_AUDIO ? '📁' : '🎵'}
      </span>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-gray-500 truncate max-w-[220px]" title={source.rawVideoTitle || source.rawTitle || source.title}>
            {source.cleanTitle || source.title || 'Untitled Source'}
          </span>
          <TypeBadge type={source.sourceType} />
        </div>
        <div>
          <input 
            value={cleanTitle}
            onChange={e => setCleanTitle(e.target.value)}
            onBlur={handleBlur}
            placeholder="Clean Title..."
            className="w-full bg-[#080910] border border-[#2d3247] hover:border-[#3d425c] focus:border-[#2563eb] rounded px-1.5 py-0.5 text-[11px] font-semibold text-gray-200 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap mt-1">
          {source.isUnlinked ? (
            <span className="text-[9px] font-bold text-amber-500 border border-amber-600/50 bg-amber-900/30 px-1.5 py-0.5 rounded">⚠ UNLINKED</span>
          ) : (
            <StatusBadge status={source.status} />
          )}
          {source.duration && (
            <span className="text-[9px] text-gray-500 font-mono">{source.duration}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1 mt-0.5 shrink-0 items-end">
        <button
          onClick={() => onRemove(source.id)}
          className="text-gray-600 hover:text-red-400 transition-colors text-xs"
          title="Remove source"
        >
          🗑
        </button>
        {source.isUnlinked && (
          <button
            onClick={() => onRelink(source.id)}
            className="px-2 py-0.5 text-[9px] font-bold rounded bg-amber-900/40 hover:bg-amber-800 border border-amber-700/50 text-amber-300 transition-colors"
          >
            Relink File
          </button>
        )}
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
  return (
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
}


function AddYouTubeModal({ onAdd, onClose }) {
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);
  useEffect(() => inputRef.current?.focus(), []);
  return (
    <ModalShell title="▶ Add YouTube URL" onClose={onClose}>
      <div className="text-[8px] text-gray-500 bg-[#181922] border border-[#21232d] rounded px-2 py-1 mb-2 leading-relaxed">
        URL stored immediately. Click <span className="text-blue-400 font-bold">Fetch Metadata</span> on the card to pull title, channel, and duration.
      </div>
      <label className="block text-[9px] text-gray-500 mb-1">YouTube URL</label>
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

export default function SourcePoolPanel({ isDevMode = false, addLog, addNotification, onSourcesChanged }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingIds, setFetchingIds] = useState(new Set());
  const [bulkFetching, setBulkFetching] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [modal, setModal] = useState(null);
  const [stats, setStats] = useState(null);
  const [bulkProgress, setBulkProgress] = useState(null);

  const loadSources = useCallback(async () => {
    try {
      const all = await foundation.sourceService.getAll();
      setSources(all);
      const s = await foundation.sourceService.getStats();
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
      if (window.showOpenFilePicker) {
        try {
          const [fileHandle] = await window.showOpenFilePicker({
            types: [{ description: 'Audio Files', accept: {'audio/*': ['.mp3', '.wav', '.flac', '.m4a']} }]
          });
          const file = await fileHandle.getFile();
          const path = file.path || file.name;
          handleImportFile(path);
          return;
        } catch(e) {
          if (e.name === 'AbortError') return;
        }
      }
      
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
      if (window.showDirectoryPicker) {
        try {
          const dirHandle = await window.showDirectoryPicker();
          const folderPath = dirHandle.name;
          handleImportFolder(folderPath);
          return;
        } catch(e) {
          if (e.name === 'AbortError') return;
        }
      }
      
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
        showFeedback('success', `✓ Added YouTube source (metadata not yet fetched).`);
        addNotification?.('Source Added', `Pool: ${sources.length} -> ${sources.length + 1}`);
        addLog?.('[M2] Source Added');
        onSourcesChanged?.();
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
      if (window.showOpenFilePicker) {
        try {
          const [fileHandle] = await window.showOpenFilePicker({
            types: [{ description: 'Audio Files', accept: {'audio/*': ['.mp3', '.wav', '.flac', '.m4a']} }]
          });
          const file = await fileHandle.getFile();
          const path = file.path || file.name;
          await foundation.sourceService.relinkSource(id, path, getContext());
          addNotification?.('Source Relinked');
          addLog?.('[M2] Source Relinked');
          await loadSources();
          onSourcesChanged?.();
          return;
        } catch(e) {
          if (e.name === 'AbortError') return;
        }
      }
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
  const selectedYTUnfetched = sources.filter(s =>
    s.selected && s.sourceType === SOURCE_TYPE.YOUTUBE_URL &&
    s.metadataStatus !== METADATA_STATUS.READY &&
    s.status !== SOURCE_STATUS.INVALID
  ).length;

  const showDetailsPanel = selectedCount === 1;
  const selectedSource = showDetailsPanel ? sources.find(s => s.selected) : null;

  // Filter out INVALID sources from the UI
  const filteredSources = sources.filter(s => s.status !== SOURCE_STATUS.INVALID);

  console.log('--- Step 5 ---');
  console.log('Before render: Log any filtering operation.');
  console.log('Exact code path: const filteredSources = sources.filter(s => s.status !== SOURCE_STATUS.INVALID);');
  console.log('original counts: ' + sources.length);
  console.log('resulting counts: ' + filteredSources.length);

  return (
    <>
      {modal === 'youtube' && <AddYouTubeModal onAdd={handleAddYouTube}  onClose={() => setModal(null)} />}

      <div className={`flex flex-col xl:flex-row gap-2 h-full transition-all duration-300`}>
        {/* Main Source List Pane */}
        <div className="flex-1 bg-[#0b0c10] border border-[#21232d] rounded-lg overflow-hidden flex flex-col min-w-0">
          <div className="flex items-center justify-between px-3 py-2 bg-[#0f111a] border-b border-[#21232d]">
            <div>
              <div className="flex items-center">
                <span className="text-[14px] text-purple-400 mr-2 leading-none">①</span>
                <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wide">
                  IMPORT SOURCES {sources.length > 0 && <span className="text-gray-400 ml-1.5">✓</span>}
                </span>
                {stats && (
                  <span className="text-[9px] bg-[#21232d] text-gray-400 px-1.5 py-0.5 rounded font-mono ml-2">
                    {stats.total} source{stats.total !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button id="m2-add-file-btn" onClick={handleFileButtonClick} disabled={loading}
                className="flex items-center gap-1 px-2 py-1 text-[9px] bg-[#1e2a3d] hover:bg-[#1d3a5c] border border-[#2563eb]/30 hover:border-[#2563eb]/60 text-blue-300 rounded transition-all disabled:opacity-40">
                🎵 File
              </button>
              <button id="m2-add-folder-btn" onClick={handleFolderButtonClick} disabled={loading}
                className="flex items-center gap-1 px-2 py-1 text-[9px] bg-[#1e1d3d] hover:bg-[#2d1f5e] border border-violet-700/30 hover:border-violet-600/60 text-violet-300 rounded transition-all disabled:opacity-40">
                📁 Folder
              </button>
              <button id="m2-add-youtube-btn" onClick={() => setModal('youtube')} disabled={loading}
                className="flex items-center gap-1 px-2 py-1 text-[9px] bg-[#2a1010] hover:bg-[#3d1515] border border-red-800/30 hover:border-red-700/60 text-red-300 rounded transition-all disabled:opacity-40">
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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0c0d12] border-b border-[#21232d] flex-wrap">
              <button
                id="m2-select-all-btn"
                onClick={allSelected ? handleDeselectAll : handleSelectAll}
                className="text-[9px] text-gray-500 hover:text-gray-300 transition-colors select-none cursor-pointer"
              >
                {allSelected ? '☑ Deselect All' : '☐ Select All'}
              </button>
              {selectedCount > 0 && (
                <>
                  <span className="text-[9px] text-gray-700">|</span>
                  <span className="text-[9px] text-blue-400 font-mono">{selectedCount} selected</span>
                  {selectedYTUnfetched > 0 && (
                    <button
                      id="m2-fetch-selected-btn"
                      onClick={handleFetchSelectedMetadata}
                      disabled={bulkFetching}
                      className="text-[9px] text-blue-300 hover:text-blue-200 hover:bg-blue-950/30 px-2 py-0.5 rounded transition-colors disabled:opacity-40"
                    >
                      ⬇ Fetch {selectedYTUnfetched} Metadata
                    </button>
                  )}
                  <button
                    id="m2-remove-selected-btn"
                    onClick={handleRemoveSelected}
                    className="text-[9px] text-red-400 hover:text-red-300 hover:bg-red-950/30 px-2 py-0.5 rounded transition-colors"
                  >
                    🗑 Remove Selected
                  </button>
                </>
              )}
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
              <div className={showDetailsPanel ? "p-1.5 space-y-1.5 grid grid-cols-1" : "p-1.5 grid grid-cols-1 md:grid-cols-2 gap-1.5"}>
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

        {/* Selected Source Editor Pane */}
        {showDetailsPanel && selectedSource && (
          <div className="w-full xl:w-1/3 xl:min-w-[320px] bg-[#0b0c10] border border-[#21232d] rounded-lg overflow-hidden flex flex-col shrink-0 animate-in fade-in slide-in-from-right-4 duration-200">
            <SelectedSourceEditor 
              source={selectedSource}
              onUpdateCleanTitle={handleUpdateCleanTitle}
              onFetchMetadata={handleFetchMetadata}
              isFetching={fetchingIds.has(selectedSource.id)}
            />
          </div>
        )}
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
    </>
  );
}
