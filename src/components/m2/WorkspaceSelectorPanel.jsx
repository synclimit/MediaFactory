import React, { useState, useEffect } from 'react';
import { m2WorkspaceRegistry } from '../../services/m2/WorkspaceRegistry.js';
import { m2WorkspaceContext } from '../../services/m2/WorkspaceContext.js';

export default function WorkspaceSelectorPanel({ addLog, addNotification }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeId, setActiveId] = useState('');
  
  const refresh = () => {
    setWorkspaces(m2WorkspaceRegistry.listWorkspaces());
    setActiveId(m2WorkspaceContext.getWorkspaceId());
  };

  useEffect(() => {
    refresh();
    const sub = (newId) => {
      setActiveId(newId);
      window.dispatchEvent(new CustomEvent('WORKSPACE_CHANGED'));
    };
    m2WorkspaceContext.subscribe(sub);
    return () => m2WorkspaceContext.unsubscribe(sub);
  }, []);

  const handleSelect = (e) => {
    const id = e.target.value;
    if (id !== activeId) {
      addLog(`[M2 Workspace] Switching context to ${id}`);
      m2WorkspaceRegistry.selectWorkspace(id);
      refresh();
      if (addNotification) addNotification('success', `Switched workspace to ${id}`);
    }
  };

  const handleCreate = () => {
    const name = window.prompt("Enter new workspace name:");
    if (!name || !name.trim()) return;

    const id = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = m2WorkspaceRegistry.createWorkspace(id, name.trim());
    if (res === 'SUCCESS') {
      addLog(`[M2 Workspace] Created ${name}`);
      m2WorkspaceRegistry.selectWorkspace(id);
      refresh();
      if (addNotification) addNotification('success', `Created workspace ${name}`);
    } else {
      addLog(`[M2 Workspace] Create failed: ${res}`);
      if (addNotification) addNotification('error', `Create failed: ${res}`);
    }
  };

  const handleRename = () => {
    const name = window.prompt("Enter new name for current workspace:");
    if (!name || !name.trim()) return;

    const res = m2WorkspaceRegistry.renameWorkspace(activeId, name.trim());
    if (res === 'SUCCESS') {
      addLog(`[M2 Workspace] Renamed to ${name}`);
      refresh();
      if (addNotification) addNotification('success', `Renamed workspace`);
    }
  };

  const handleDelete = () => {
    const res = m2WorkspaceRegistry.deleteWorkspace(activeId);
    if (res === 'ACTIVE_WORKSPACE_DELETE_BLOCKED') {
      addLog('[M2 Workspace] Delete Blocked - Cannot delete active workspace');
      if (addNotification) addNotification('error', 'Cannot delete active workspace');
      alert('Cannot delete the currently active workspace. Switch to another workspace first.');
      return;
    } else if (res === 'WORKSPACE_DELETE_BLOCKED') {
      addLog('[M2 Workspace] Delete Blocked - Active render jobs exist');
      if (addNotification) addNotification('error', 'Cannot delete workspace with active renders');
      alert('Workspace cannot be deleted while active render jobs exist.');
      return;
    }

    // Since we block deleting the active workspace, the user has to switch to another first.
    // However, if they bypass UI, we handle it:
    if (res === 'SUCCESS') {
      addLog('[M2 Workspace] Deleted');
      refresh();
    }
  };

  const promptDeleteOther = (id) => {
    const confirm = window.confirm(`Are you sure you want to delete this workspace? All data will be permanently lost.`);
    if (!confirm) return;

    const res = m2WorkspaceRegistry.deleteWorkspace(id);
    if (res === 'WORKSPACE_DELETE_BLOCKED') {
      addLog('[M2 Workspace] Delete Blocked - Active render jobs exist');
      if (addNotification) addNotification('error', 'Cannot delete workspace with active renders');
      alert('Workspace cannot be deleted while active render jobs exist.');
    } else if (res === 'SUCCESS') {
      addLog(`[M2 Workspace] Deleted workspace ${id}`);
      if (addNotification) addNotification('success', 'Workspace deleted');
      refresh();
    }
  };

  return (
    <div className="bg-[#1e1e24] p-3 rounded-lg border border-[#3f4556] mb-4 flex items-center justify-between text-white shadow-lg">
      <div className="flex items-center gap-4">
        <span className="text-[12px] font-bold uppercase tracking-widest text-fuchsia-400">Context</span>
        <select 
          className="bg-[#0b0c10] border border-[#3f4556] rounded px-3 py-1.5 text-[12px] font-bold text-gray-200 outline-none w-64"
          value={activeId}
          onChange={handleSelect}
        >
          {workspaces.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <div className="text-[10px] text-gray-500 font-mono">ID: {activeId}</div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleCreate} className="px-3 py-1.5 text-[10px] font-bold bg-fuchsia-600 hover:bg-fuchsia-500 rounded transition-colors">
          New Workspace
        </button>
        <button onClick={handleRename} className="px-3 py-1.5 text-[10px] font-bold bg-[#2d313d] hover:bg-[#3d4252] rounded transition-colors">
          Rename
        </button>
      </div>
    </div>
  );
}
