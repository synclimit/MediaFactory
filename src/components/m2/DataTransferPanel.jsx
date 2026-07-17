import React, { useState, useRef } from 'react';
import { m2ExportImport } from '../../services/m2/ExportImportService.js';

export default function DataTransferPanel({ addLog, addNotification }) {
  const [lastExport, setLastExport] = useState('Never');
  const [lastImport, setLastImport] = useState('Never');
  const [validationResult, setValidationResult] = useState('N/A');
  
  const [previewPayload, setPreviewPayload] = useState(null);
  const fileInputRef = useRef(null);

  const downloadJson = (data, filename) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setLastExport(new Date().toLocaleTimeString());
  };

  const handleExportBundle = () => {
    downloadJson(m2ExportImport.exportAll(), `m2_full_bundle_${Date.now()}.json`);
    addLog('[M2 Export] Bundle Exported');
  };

  const handleExportWorkspace = () => {
    downloadJson(m2ExportImport.exportWorkspace(), `m2_workspace_${Date.now()}.json`);
    addLog('[M2 Export] Workspace Exported');
  };

  const handleExportTemplates = () => {
    downloadJson(m2ExportImport.exportTemplates(), `m2_templates_${Date.now()}.json`);
    addLog('[M2 Export] Templates Exported');
  };

  const handleExportHistory = () => {
    downloadJson(m2ExportImport.exportHistory(), `m2_history_${Date.now()}.json`);
    addLog('[M2 Export] History Exported');
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // reset
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    addLog('[M2 Import] Started');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target.result);
        const result = m2ExportImport.validatePayload(payload);
        setValidationResult(result);
        
        if (result === 'VALID') {
          setPreviewPayload(payload);
        } else {
          addLog(`[M2 Import] Failed: ${result}`);
          if (addNotification) addNotification('error', `Import Failed: ${result}`);
        }
      } catch (err) {
        setValidationResult('IMPORT_PAYLOAD_CORRUPTED');
        addLog('[M2 Import] Failed: IMPORT_PAYLOAD_CORRUPTED');
        if (addNotification) addNotification('error', 'Import Failed: Corrupted JSON');
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!previewPayload) return;
    
    addLog('[M2 Import] Backup Created');
    const result = m2ExportImport.importBundle(previewPayload);
    
    if (result === 'SUCCESS') {
      setLastImport(new Date().toLocaleTimeString());
      setPreviewPayload(null);
      addLog('[M2 Import] Completed');
      if (addNotification) addNotification('success', 'Import Completed successfully');
    } else {
      addLog('[M2 Import] Backup Restored');
      addLog(`[M2 Import] Failed: ${result}`);
      if (addNotification) addNotification('error', `Import Failed: ${result}`);
    }
  };

  const cancelImport = () => {
    setPreviewPayload(null);
    setValidationResult('Cancelled');
  };

  return (
    <div className="bg-[#12131a] p-4 text-gray-200 text-xs space-y-4">
      {/* EXPORT SECTION */}
      <div>
        <div className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-widest border-b border-[#2d313d] pb-1">Export</div>
        <div className="flex gap-2">
          <button onClick={handleExportBundle} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors">
            Export Full Bundle
          </button>
          <button onClick={handleExportWorkspace} className="bg-[#2d313d] hover:bg-[#3d4252] text-white px-3 py-1.5 rounded transition-colors">
            Export Workspace
          </button>
          <button onClick={handleExportTemplates} className="bg-[#2d313d] hover:bg-[#3d4252] text-white px-3 py-1.5 rounded transition-colors">
            Export Templates
          </button>
          <button onClick={handleExportHistory} className="bg-[#2d313d] hover:bg-[#3d4252] text-white px-3 py-1.5 rounded transition-colors">
            Export History
          </button>
        </div>
      </div>

      {/* IMPORT SECTION */}
      <div>
        <div className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-widest border-b border-[#2d313d] pb-1">Import</div>
        <div className="flex gap-2">
          <button onClick={triggerFileInput} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors">
            Select JSON to Import
          </button>
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
        </div>
      </div>

      {/* IMPORT PREVIEW */}
      {previewPayload && (
        <div className="bg-[#1a1c22] border border-amber-500/50 rounded p-3 relative">
          <div className="text-[10px] text-amber-500 font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Import Preview
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] mb-4">
            <div><span className="text-gray-500">Workspace:</span> <span className="font-bold">{previewPayload.workspace ? 'Present' : 'Missing'}</span></div>
            <div><span className="text-gray-500">Templates:</span> <span className="font-bold">{previewPayload.templates ? previewPayload.templates.length : 0}</span></div>
            <div><span className="text-gray-500">History:</span> <span className="font-bold">{previewPayload.history ? previewPayload.history.data?.length || 0 : 0}</span></div>
            <div><span className="text-gray-500">Scheduler:</span> <span className="font-bold">{previewPayload.scheduler ? 'Present' : 'Missing'}</span></div>
            <div><span className="text-gray-500">Batch State:</span> <span className="font-bold">{previewPayload.batch ? 'Present' : 'Missing'}</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={confirmImport} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded font-bold transition-colors">
              CONFIRM IMPORT
            </button>
            <button onClick={cancelImport} className="bg-[#2d313d] hover:bg-[#3d4252] text-white px-4 py-1.5 rounded transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* STATUS AREA */}
      <div>
        <div className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-widest border-b border-[#2d313d] pb-1">Status Area</div>
        <div className="flex gap-6 text-[10px]">
          <div><span className="text-gray-500">Last Export:</span> <span className="font-mono text-gray-300">{lastExport}</span></div>
          <div><span className="text-gray-500">Last Import:</span> <span className="font-mono text-gray-300">{lastImport}</span></div>
          <div><span className="text-gray-500">Last Validation:</span> <span className={`font-mono ${validationResult === 'VALID' ? 'text-emerald-400' : validationResult === 'N/A' || validationResult === 'Cancelled' ? 'text-gray-400' : 'text-red-400'}`}>{validationResult}</span></div>
        </div>
      </div>

    </div>
  );
}
