import React, { useState, useEffect } from 'react';
import { m2TemplateManager } from '../../services/m2/TemplateManagerService.js';
import { createProductionTemplate } from '../../entities/m2/ProductionTemplateEntity.js';

function Tooltip({ text }) {
  return (
    <div className="group relative inline-block ml-1 cursor-pointer">
      <span className="text-[9px] text-gray-500 bg-[#2d313d] hover:bg-[#3f4556] rounded-full w-3 h-3 inline-flex items-center justify-center font-bold">?</span>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 w-48 -translate-x-1/2 rounded bg-[#1e2230] border border-[#2d313d] p-2 text-[10px] text-gray-300 shadow-xl opacity-0 transition-opacity group-hover:opacity-100 leading-normal">
        {text}
        <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#1e2230] border-r border-b border-[#2d313d]"></div>
      </div>
    </div>
  );
}

export default function TemplateLibraryPanel({ currentWorkspaceState, currentSchedulerState, onLoadTemplate, onLog, addNotification }) {
  const [templates, setTemplates] = useState([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveType, setSaveType] = useState('DYNAMIC');

  const refreshList = () => {
    setTemplates(m2TemplateManager.listTemplates());
  };

  useEffect(() => {
    refreshList();
    const handleRefresh = () => refreshList();
    window.addEventListener('m2_templates_refresh', handleRefresh);
    return () => window.removeEventListener('m2_templates_refresh', handleRefresh);
  }, []);

  const handleSave = () => {
    if (!saveName.trim()) {
      addNotification('Error', 'Template name required');
      return;
    }
    const template = createProductionTemplate(saveName.trim(), saveType, currentWorkspaceState, currentSchedulerState);
    const result = m2TemplateManager.saveTemplate(template);
    
    if (result === 'TEMPLATE_LIMIT_REACHED') {
      addNotification('Error', 'Maximum 100 templates reached.');
      onLog('[M2 Template] Save Failed (Limit Reached)');
    } else {
      addNotification('Template Saved', `${saveName} saved successfully.`);
      onLog('[M2 Template] Saved');
      setShowSaveForm(false);
      setSaveName('');
      refreshList();
    }
  };

  const handleLoad = (template) => {
    onLoadTemplate(template);
    addNotification('Template Loaded', `${template.name} applied to workspace.`);
    onLog('[M2 Template] Loaded');
  };

  const handleDelete = (id) => {
    m2TemplateManager.deleteTemplate(id);
    addNotification('Template Deleted');
    onLog('[M2 Template] Deleted');
    refreshList();
  };

  const handleDuplicate = (id) => {
    const result = m2TemplateManager.duplicateTemplate(id);
    if (result === 'TEMPLATE_LIMIT_REACHED') {
      addNotification('Error', 'Maximum 100 templates reached.');
      onLog('[M2 Template] Duplicate Failed (Limit Reached)');
    } else {
      addNotification('Template Duplicated');
      onLog('[M2 Template] Duplicated');
      refreshList();
    }
  };

  return (
    <div className="bg-[#0b0c10] border border-[#21232d] rounded-lg flex flex-col w-full mt-2">
      <div className="px-3 py-2 border-b border-[#21232d] bg-[#0f111a] flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center">
            <span className="text-[14px] text-fuchsia-400 mr-2 leading-none">⑪</span>
            <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wide">
              TEMPLATE LIBRARY
            </span>
            <Tooltip text="Save and load complete production workflows. Does not affect active queue or history." />
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowSaveForm(!showSaveForm)}
            className="px-2 py-1 text-[9px] font-bold rounded bg-fuchsia-900/40 hover:bg-fuchsia-800/60 text-fuchsia-300 border border-fuchsia-700/50 transition-colors"
          >
            {showSaveForm ? 'Cancel Save' : 'Save Current Settings'}
          </button>
        </div>
      </div>

      {showSaveForm && (
        <div className="p-3 bg-[#12141c] border-b border-[#21232d] flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Template Name..." 
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              className="flex-1 bg-[#0b0c10] border border-[#2d313d] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-fuchsia-500"
            />
            <select 
              value={saveType} 
              onChange={e => setSaveType(e.target.value)}
              className="bg-[#0b0c10] border border-[#2d313d] rounded px-2 py-1 text-[11px] text-white focus:outline-none"
            >
              <option value="DYNAMIC">Dynamic Sources</option>
              <option value="FIXED">Fixed Sources</option>
            </select>
            <button 
              onClick={handleSave}
              className="px-3 py-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[11px] font-bold rounded transition-colors"
            >
              Save
            </button>
          </div>
          <div className="text-[9px] text-gray-500">
            {saveType === 'DYNAMIC' ? 'Saves all settings without locking specific sources.' : 'Locks your current source pool items into the template.'}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 p-2 max-h-[300px] overflow-y-auto bg-[#0a0a0f] custom-scrollbar">
        {templates.length === 0 ? (
          <div className="py-4 text-center text-[10px] text-gray-500">No templates found. Save your current workflow above.</div>
        ) : (
          templates.map(t => (
            <div key={t.id} className="flex flex-col p-2 bg-[#12141c] border border-[#21232d] rounded group hover:border-[#3f4556] transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.type === 'DYNAMIC' ? 'bg-indigo-900/40 text-indigo-300' : 'bg-amber-900/40 text-amber-300'}`}>
                    {t.type}
                  </span>
                  <span className="text-[12px] font-bold text-gray-200">{t.name}</span>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleLoad(t)} className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#1e2230] hover:bg-fuchsia-900/40 hover:text-fuchsia-300 border border-[#2d313d] text-gray-300 transition-colors">Load</button>
                  <button onClick={() => handleDuplicate(t.id)} className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#1e2230] hover:bg-[#2d313d] border border-[#2d313d] text-gray-300 transition-colors">Duplicate</button>
                  <button onClick={() => handleDelete(t.id)} className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#1e2230] hover:bg-red-900/40 hover:text-red-300 border border-[#2d313d] text-gray-300 transition-colors">Delete</button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-400">
                <div>Created: <span className="text-gray-300">{new Date(t.createdAt).toLocaleDateString()}</span></div>
                <div>Mastering: <span className="text-amber-400">{t.masteringSettings ? t.masteringSettings.name : 'N/A'}</span></div>
                <div>Scheduler: <span className={t.schedulerSettings?.enabled ? "text-emerald-400" : "text-gray-500"}>{t.schedulerSettings?.enabled ? 'Enabled' : 'Disabled'}</span></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
