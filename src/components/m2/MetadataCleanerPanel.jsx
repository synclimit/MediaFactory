import React, { useState, useCallback, useEffect, useRef } from 'react';
import { foundation, getBootstrapData } from '../../foundation/index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getContext() {
  const bd = getBootstrapData();
  return {
    workspaceId: bd?.workspace?.id || '',
    userId: bd?.user?.id || '',
  };
}

// ─── Title Source Badge ────────────────────────────────────────────────────────

function TitleSourceBadge({ source }) {
  if (!source) return null;
  const map = {
    path:     { label: 'File',    cls: 'bg-blue-900/40 text-blue-300 border-blue-700/30' },
    youtube:  { label: 'YouTube', cls: 'bg-red-900/40 text-red-300 border-red-700/30' },
    manual:   { label: 'Manual',  cls: 'bg-amber-900/40 text-amber-300 border-amber-700/30' },
    fallback: { label: 'Fallback', cls: 'bg-gray-800 text-gray-500 border-gray-700' },
  };
  const { label, cls } = map[source] || map.fallback;
  return (
    <span className={`text-[7px] font-bold uppercase tracking-wide px-1 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Source Row ────────────────────────────────────────────────────────────────

function CleanerRow({ source, isCleaned }) {
  const rawDisplay = source.rawTitle || source.title || '—';

  return (
    <div
      className={`grid gap-2 px-3 py-2 border-b border-[#21232d] last:border-0 transition-colors ${
        isCleaned ? 'bg-[#0a0b10] hover:bg-[#0f1018]' : 'bg-[#0f0f0a] hover:bg-[#13130d]'
      }`}
      style={{ gridTemplateColumns: '1fr 1fr' }}
    >
      {/* Raw Title */}
      <div className="min-w-0">
        <div className="text-[9px] text-gray-400 font-mono truncate leading-tight" title={rawDisplay}>
          {rawDisplay}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <TitleSourceBadge source={source.titleSource} />
        </div>
      </div>

      {/* Clean Title */}
      <div className="min-w-0">
        {source.cleanTitle ? (
          <div className="text-[9px] text-emerald-300 font-semibold truncate leading-tight" title={source.cleanTitle}>
            {source.cleanTitle}
          </div>
        ) : (
          <div className="text-[9px] text-gray-600 italic">Not cleaned yet</div>
        )}
      </div>
    </div>
  );
}

// ─── Metadata Cleaner Panel ────────────────────────────────────────────────────

export default function MetadataCleanerPanel({ isDevMode = false }) {
  const [sources, setSources]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [cleaning, setCleaning]     = useState(false);
  const [feedback, setFeedback]     = useState(null);
  const [cleaningId, setCleaningId] = useState(null);

  const feedbackTimer = useRef(null);

  // ─── Load data ──────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [all, s] = await Promise.all([
        foundation.metadataCleanerService.getAllSources(),
        foundation.metadataCleanerService.getStats(),
      ]);
      setSources(all.filter(src => src.status !== 'invalid'));
      setStats(s);
    } catch (err) {
      console.error('[MetadataCleanerPanel] loadAll error:', err);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const intervalId = setInterval(() => {
      loadAll();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [loadAll]);

  // ─── Feedback helper ────────────────────────────────────────────────────────
  const showFeedback = (type, message, ms = 3500) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ type, message });
    feedbackTimer.current = setTimeout(() => setFeedback(null), ms);
  };

  // ─── Clean All ──────────────────────────────────────────────────────────────
  const handleCleanAll = async () => {
    setCleaning(true);
    try {
      const ctx = getContext();
      const { cleaned, skipped } = await foundation.metadataCleanerService.cleanAll(ctx);
      showFeedback('success', `✓ Cleaned ${cleaned} title${cleaned !== 1 ? 's' : ''}.${skipped > 0 ? ` (${skipped} already clean)` : ''}`);
      await loadAll();
    } catch (err) {
      showFeedback('error', `Clean failed: ${err.message}`);
    } finally {
      setCleaning(false);
    }
  };

  // ─── Clean Single ────────────────────────────────────────────────────────────
  const handleCleanSingle = async (id) => {
    setCleaningId(id);
    try {
      await foundation.metadataCleanerService.cleanSource(id, getContext());
      await loadAll();
    } catch (err) {
      showFeedback('error', `Clean failed: ${err.message}`);
    } finally {
      setCleaningId(null);
    }
  };

  const cleanedCount = sources.filter(s => s.cleanTitle).length;
  const totalCount   = sources.length;
  const allCleaned   = totalCount > 0 && cleanedCount === totalCount;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#0b0c10] border border-[#21232d] rounded-lg overflow-hidden flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0f111a] border-b border-[#21232d] shrink-0">
        <div>
          <div className="flex items-center">
            <span className="text-[14px] text-purple-400 mr-2 leading-none">②</span>
            <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wide">
              CLEAN TITLES {allCleaned && <span className="text-gray-400 ml-1.5">✓</span>}
            </span>
            {totalCount > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ml-2 ${
                allCleaned ? 'bg-emerald-900/40 text-emerald-400' : 'bg-[#21232d] text-gray-400'
              }`}>
                {cleanedCount}/{totalCount} cleaned
              </span>
            )}
          </div>
          <div className="text-[9px] text-gray-500 mt-0.5">
            Removes noise — years, platform labels, viral tags
          </div>
        </div>
        <button
          id="m2-clean-all-btn"
          onClick={handleCleanAll}
          disabled={cleaning || totalCount === 0}
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold bg-[#1e2a1a] hover:bg-[#243520] border border-emerald-700/30 hover:border-emerald-600/60 text-emerald-300 rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {cleaning ? '⟳ Cleaning…' : '✨ Clean All'}
        </button>
      </div>

      {/* ── Feedback Banner ─────────────────────────────────────────────────── */}
      {feedback && (
        <div className={`px-3 py-1.5 text-[10px] font-medium border-b shrink-0 ${
          feedback.type === 'success' ? 'bg-emerald-950/60 border-emerald-900/40 text-emerald-300' :
          feedback.type === 'error'   ? 'bg-red-950/60 border-red-900/40 text-red-300' :
                                        'bg-blue-950/60 border-blue-900/40 text-blue-300'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* ── Source Table ─────────────────────────────────────────────────────── */}
      {totalCount === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2 opacity-20">✨</div>
            <div className="text-[10px] text-gray-600">No sources to clean.</div>
            <div className="text-[9px] text-gray-700 mt-1">Add sources in the Audio Sources panel.</div>
          </div>
        </div>
      ) : (
        <>
          {/* Column Headers */}
          <div
            className="grid px-3 py-1 bg-[#0a0a0e] border-b border-[#21232d] shrink-0"
            style={{ gridTemplateColumns: '1fr 1fr' }}
          >
            <div className="text-[8px] text-gray-600 uppercase font-bold tracking-wide">Raw Title</div>
            <div className="text-[8px] text-emerald-700 uppercase font-bold tracking-wide">Clean Title</div>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {sources.map(source => (
              <div key={source.id} className="relative group">
                <CleanerRow
                  source={source}
                  isCleaned={!!source.cleanTitle}
                />
                {/* Per-row clean button on hover */}
                {!source.cleanTitle && (
                  <button
                    onClick={() => handleCleanSingle(source.id)}
                    disabled={cleaningId === source.id}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[8px] px-1.5 py-0.5 bg-emerald-900/50 hover:bg-emerald-800/60 border border-emerald-700/30 text-emerald-300 rounded transition-all"
                  >
                    {cleaningId === source.id ? '⟳' : 'Clean'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── DevMode Stats ─────────────────────────────────────────────────────── */}
      {isDevMode && stats && (
        <div className="border-t border-red-900/30 bg-[#0a0005] px-3 py-2 space-y-1 shrink-0">
          <div className="text-[8px] font-bold text-red-400 uppercase tracking-wide">Dev Stats — Metadata Cleaner</div>
          <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
            <div><span className="text-gray-600">Total:</span> <span className="text-gray-300">{stats.total}</span></div>
            <div><span className="text-gray-600">Raw:</span> <span className="text-amber-400">{stats.rawTitleCount}</span></div>
            <div><span className="text-gray-600">Cleaned:</span> <span className="text-emerald-400">{stats.cleanTitleCount}</span></div>
            <div><span className="text-gray-600">Uncleaned:</span> <span className="text-red-400">{stats.uncleaned}</span></div>
          </div>
          {stats.byTitleSource && (
            <div className="grid grid-cols-3 gap-2 text-[9px] font-mono mt-0.5">
              <div><span className="text-gray-600">From File:</span> <span className="text-blue-400">{stats.byTitleSource.path}</span></div>
              <div><span className="text-gray-600">YouTube:</span> <span className="text-red-400">{stats.byTitleSource.youtube}</span></div>
              <div><span className="text-gray-600">Fallback:</span> <span className="text-gray-500">{stats.byTitleSource.fallback}</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
