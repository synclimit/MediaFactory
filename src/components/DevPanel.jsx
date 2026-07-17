import React, { useState, useEffect, useCallback } from 'react';
import { foundation, getBootstrapData } from '../foundation/index.js';

// ─── Helper: Format date ──────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' });
  } catch { return iso; }
}

// ─── Helper: SyncStatus Badge ─────────────────────────────────────────────────
function SyncBadge({ status }) {
  const map = {
    local:   'bg-gray-700 text-gray-300',
    pending: 'bg-amber-900/50 text-amber-300',
    synced:  'bg-emerald-900/50 text-emerald-400',
    failed:  'bg-red-900/50 text-red-400',
  };
  return (
    <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-wide ${map[status] || 'bg-gray-800 text-gray-400'}`}>
      {status || 'unknown'}
    </span>
  );
}

// ─── Entity Table ─────────────────────────────────────────────────────────────
function EntityTable({ rows, columns }) {
  if (!rows || rows.length === 0) {
    return <div className="text-[10px] text-gray-600 italic py-2 px-1">No records.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[9px] font-mono border-collapse">
        <thead>
          <tr className="border-b border-[#2d3247]">
            {columns.map(col => (
              <th key={col.key} className="text-left py-1 px-2 text-gray-500 uppercase tracking-wide font-bold whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i} className="border-b border-[#1a1c24] hover:bg-[#181922] transition-colors">
              {columns.map(col => (
                <td key={col.key} className="py-1 px-2 text-gray-300 whitespace-nowrap">
                  {col.key === 'syncStatus' ? (
                    <SyncBadge status={row[col.key]} />
                  ) : col.key === 'createdAt' || col.key === 'updatedAt' ? (
                    <span className="text-gray-500">{formatDate(row[col.key])}</span>
                  ) : col.render ? (
                    col.render(row[col.key], row)
                  ) : (
                    <span className="truncate block max-w-[200px]">
                      {typeof row[col.key] === 'object'
                        ? JSON.stringify(row[col.key])
                        : String(row[col.key] ?? '—')}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ title, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#2d3247] rounded overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-[#0f111a] hover:bg-[#181922] transition-colors text-left"
      >
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wide">{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-[#2d3247] text-gray-400 px-1.5 py-0.5 rounded font-mono">
            {count ?? '?'} record{count !== 1 ? 's' : ''}
          </span>
          <span className="text-gray-500 text-[10px]">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="bg-[#0c0d12] p-2">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main DevPanel ────────────────────────────────────────────────────────────
export default function DevPanel({ isOpen, onClose }) {
  const [data, setData] = useState({
    workspace: null,
    user: null,
    projects: [],
    activities: [],
    queue: [],
    templates: [],
    presets: [],
    settings: [],
    // M2
    sources: [],
    m2Stats: null,
    cleanerStats: null,
  });
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const bootstrapData = getBootstrapData();
      const workspaceId = bootstrapData?.workspace?.id;

      const [workspace, user, projects, activities, queue, templates, presets, settings, sources, m2Stats, cleanerStats] = await Promise.all([
        foundation.workspaceService.getDefault(),
        foundation.userService.getLocalUser(),
        foundation.projectService.getAll(),
        foundation.activityService.getAll(),
        foundation.queueService.getAll(),
        foundation.templateService.getAll(),
        foundation.presetService.getAll(),
        foundation.settingsService.getAll(),
        // M2
        foundation.sourceService.getAll(),
        foundation.sourceService.getStats(),
        foundation.metadataCleanerService.getStats(),
      ]);

      setData({ workspace, user, projects, activities, queue, templates, presets, settings, sources, m2Stats, cleanerStats });
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('[DevPanel] Refresh failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-auto bg-black/70 backdrop-blur-sm pt-10 pb-10">
      <div className="w-full max-w-5xl bg-[#0b0c10] border border-[#2d3247] rounded-lg shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0f111a] border-b border-[#2d3247] rounded-t-lg shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Developer Mode</span>
            </div>
            <span className="text-[9px] text-gray-600 font-mono">Platform Foundation Debug Panel</span>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-[9px] text-gray-600 font-mono">Last refresh: {lastRefresh}</span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="text-[9px] px-2 py-0.5 bg-[#2563eb]/20 hover:bg-[#2563eb]/40 border border-[#2563eb]/40 text-blue-400 rounded transition-colors"
            >
              {loading ? '⟳ Refreshing...' : '⟳ Refresh'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors text-sm ml-2"
              aria-label="Close Developer Panel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">

          {/* Bootstrap Summary */}
          <div className="bg-[#0f111a] border border-[#2d3247] rounded p-3 grid grid-cols-2 gap-4 text-[9px] font-mono">
            <div>
              <div className="text-gray-500 uppercase mb-1 font-bold">Active Workspace</div>
              {data.workspace ? (
                <div className="space-y-0.5">
                  <div><span className="text-gray-500">ID:</span> <span className="text-emerald-400">{data.workspace.id}</span></div>
                  <div><span className="text-gray-500">Name:</span> <span className="text-gray-200">{data.workspace.name}</span></div>
                  <div><span className="text-gray-500">Created:</span> <span className="text-gray-400">{formatDate(data.workspace.createdAt)}</span></div>
                  <div><span className="text-gray-500">syncStatus:</span> <SyncBadge status={data.workspace.syncStatus} /></div>
                </div>
              ) : <div className="text-gray-600 italic">Not initialized</div>}
            </div>
            <div>
              <div className="text-gray-500 uppercase mb-1 font-bold">Active User</div>
              {data.user ? (
                <div className="space-y-0.5">
                  <div><span className="text-gray-500">ID:</span> <span className="text-emerald-400">{data.user.id}</span></div>
                  <div><span className="text-gray-500">Name:</span> <span className="text-gray-200">{data.user.name}</span></div>
                  <div><span className="text-gray-500">Role:</span> <span className="text-blue-400 font-bold">{data.user.role}</span></div>
                  <div><span className="text-gray-500">syncStatus:</span> <SyncBadge status={data.user.syncStatus} /></div>
                </div>
              ) : <div className="text-gray-600 italic">Not initialized</div>}
            </div>
          </div>

          {/* Projects */}
          <Section title="Projects" count={data.projects.length}>
            <EntityTable
              rows={data.projects}
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Name' },
                { key: 'status', label: 'Status' },
                { key: 'workspaceId', label: 'Workspace' },
                { key: 'syncStatus', label: 'Sync' },
                { key: 'createdAt', label: 'Created' },
              ]}
            />
          </Section>

          {/* Queue Jobs */}
          <Section title="Queue Jobs (Foundation Registry)" count={data.queue.length}>
            <div className="text-[8px] text-amber-600 italic mb-2 px-1">
              ⚠ This is the foundation registry. M1 in-memory queue state is separate and not shown here.
            </div>
            <EntityTable
              rows={data.queue}
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'mode', label: 'Mode' },
                { key: 'status', label: 'Status' },
                { key: 'createdBy', label: 'User' },
                { key: 'syncStatus', label: 'Sync' },
                { key: 'createdAt', label: 'Created' },
              ]}
            />
          </Section>

          {/* M2 Source Pool */}
          <Section title="M2 Source Pool" count={data.sources.length}>
            {data.m2Stats && (
              <>
                <div className="grid grid-cols-4 gap-2 mb-1 text-[9px] font-mono px-1">
                  <div><span className="text-gray-500">Audio:</span> <span className="text-blue-400">{data.m2Stats.audioFileCount}</span></div>
                  <div><span className="text-gray-500">Folder:</span> <span className="text-violet-400">{data.m2Stats.folderTrackCount}</span></div>
                  <div><span className="text-gray-500">YouTube:</span> <span className="text-red-400">{data.m2Stats.youtubeCount}</span></div>
                  <div><span className="text-gray-500">Invalid:</span> <span className="text-red-500">{data.m2Stats.invalidCount}</span></div>
                </div>
                {data.m2Stats.youtubeCount > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2 text-[9px] font-mono px-1 border-t border-amber-900/20 pt-1">
                    <div className="col-span-4 text-[8px] text-amber-600 uppercase font-bold mb-0.5">YouTube Metadata Lifecycle</div>
                    <div><span className="text-gray-500">Pending:</span> <span className="text-amber-400">{data.m2Stats.metadataPendingCount}</span></div>
                    <div><span className="text-gray-500">Fetching:</span> <span className="text-blue-400">{data.m2Stats.metadataFetchingCount}</span></div>
                    <div><span className="text-gray-500">Ready:</span> <span className="text-emerald-400">{data.m2Stats.metadataReadyCount}</span></div>
                    <div><span className="text-gray-500">Failed:</span> <span className="text-red-400">{data.m2Stats.metadataFailedCount}</span></div>
                  </div>
                )}
              </>
            )}
            <EntityTable
              rows={data.sources}
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'title', label: 'Title' },
                { key: 'rawTitle', label: 'Raw Title' },
                { key: 'cleanTitle', label: 'Clean Title' },
                { key: 'titleSource', label: 'Title Src' },
                { key: 'sourceType', label: 'Type' },
                { key: 'status', label: 'Status' },
                { key: 'metadataStatus', label: 'Meta' },
                { key: 'channelName', label: 'Channel' },
                { key: 'duration', label: 'Duration' },
                { key: 'syncStatus', label: 'Sync' },
                { key: 'createdAt', label: 'Created' },
              ]}
            />
          </Section>

          {/* M2 Metadata Cleaner */}
          <Section title="M2 Metadata Cleaner" count={data.cleanerStats?.cleanTitleCount ?? 0}>
            {data.cleanerStats && (
              <div className="grid grid-cols-4 gap-2 mb-2 text-[9px] font-mono px-1">
                <div><span className="text-gray-500">Raw Titles:</span> <span className="text-amber-400">{data.cleanerStats.rawTitleCount}</span></div>
                <div><span className="text-gray-500">Clean Titles:</span> <span className="text-emerald-400">{data.cleanerStats.cleanTitleCount}</span></div>
                <div><span className="text-gray-500">Uncleaned:</span> <span className="text-red-400">{data.cleanerStats.uncleaned}</span></div>
                <div><span className="text-gray-500">Pattern:</span> <span className="text-blue-400">{data.cleanerStats.pattern}</span></div>
                <div><span className="text-gray-500">DJ Prefix:</span> <span className={data.cleanerStats.djPrefix ? 'text-emerald-400' : 'text-gray-600'}>{data.cleanerStats.djPrefix ? 'ON' : 'OFF'}</span></div>
                <div><span className="text-gray-500">From File:</span> <span className="text-blue-300">{data.cleanerStats.byTitleSource?.path ?? 0}</span></div>
                <div><span className="text-gray-500">From YT:</span> <span className="text-red-400">{data.cleanerStats.byTitleSource?.youtube ?? 0}</span></div>
                <div><span className="text-gray-500">Fallback:</span> <span className="text-gray-500">{data.cleanerStats.byTitleSource?.fallback ?? 0}</span></div>
              </div>
            )}
          </Section>


          {/* Activity Logs */}
          <Section title="Activity Logs" count={data.activities.length} defaultOpen={true}>
            <EntityTable
              rows={[...data.activities].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50)}
              columns={[
                { key: 'createdAt', label: 'Time' },
                { key: 'action', label: 'Action' },
                { key: 'userId', label: 'User' },
                { key: 'projectId', label: 'Project' },
                { key: 'syncStatus', label: 'Sync' },
              ]}
            />
          </Section>

          {/* Templates */}
          <Section title="Templates" count={data.templates.length}>
            <EntityTable
              rows={data.templates}
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Name' },
                { key: 'type', label: 'Type' },
                { key: 'syncStatus', label: 'Sync' },
                { key: 'createdAt', label: 'Created' },
              ]}
            />
          </Section>

          {/* Presets */}
          <Section title="Presets" count={data.presets.length}>
            <EntityTable
              rows={data.presets}
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Name' },
                { key: 'type', label: 'Type' },
                { key: 'syncStatus', label: 'Sync' },
                { key: 'createdAt', label: 'Created' },
              ]}
            />
          </Section>

          {/* Settings */}
          <Section title="Settings" count={data.settings.length}>
            <EntityTable
              rows={data.settings}
              columns={[
                { key: 'key', label: 'Key' },
                { key: 'value', label: 'Value' },
                { key: 'scope', label: 'Scope' },
                { key: 'syncStatus', label: 'Sync' },
                { key: 'updatedAt', label: 'Updated' },
              ]}
            />
          </Section>

          {/* Storage Inspector */}
          <Section title="LocalStorage Collections" count={foundation._provider.getStoredCollections().length}>
            <div className="flex flex-wrap gap-1.5 p-1">
              {foundation._provider.getStoredCollections().map(col => (
                <span key={col} className="text-[9px] bg-[#181922] border border-[#2d3247] text-blue-400 px-2 py-0.5 rounded font-mono">
                  mf_{col}
                </span>
              ))}
              {foundation._provider.getStoredCollections().length === 0 && (
                <span className="text-[9px] text-gray-600 italic">No collections stored yet.</span>
              )}
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#0a0b0f] border-t border-[#2d3247] flex items-center justify-between shrink-0 rounded-b-lg">
          <span className="text-[8px] text-gray-700 font-mono">
            MediaFactory Platform Foundation v1.0 — Phase 1 (LocalStorageProvider) — Developer Mode
          </span>
          <span className="text-[8px] text-red-900 font-mono">HIDDEN IN PRODUCTION</span>
        </div>
      </div>
    </div>
  );
}
