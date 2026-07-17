const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

const import_insert = `import SchedulerPanel from './components/m2/SchedulerPanel.jsx';
import WorkspacePanel from './components/m2/WorkspacePanel.jsx';
import { m2WorkspacePersistence } from './services/m2/WorkspacePersistenceService.js';`;

content = content.replace("import SchedulerPanel from './components/m2/SchedulerPanel.jsx';", import_insert);

const auto_save_restore_code = `
  // --- Workspace Persistence ---
  
  // Register log callback
  useEffect(() => {
    m2WorkspacePersistence.registerLogCallback((msg) => addLog(msg));
  }, []);

  // Auto Restore on Startup
  useEffect(() => {
    const ws = m2WorkspacePersistence.restoreWorkspace();
    if (ws) {
      if (ws.sources && ws.sources.length > 0) setM2AudioPool(ws.sources);
      if (ws.renderPlans && ws.renderPlans.length > 0) setM2Plans(ws.renderPlans);
      if (ws.queue && ws.queue.length > 0) setM2Queue(ws.queue);
      if (ws.scheduler) {
        m2SchedulerService.updateSettings(ws.scheduler);
      }
      setTimeout(() => addLog('[M2 Workspace] Auto Restore Complete'), 500);
    }
  }, []);

  // Auto Save Hook
  useEffect(() => {
    m2WorkspacePersistence.saveWorkspace({
      sources: m2AudioPool,
      renderPlans: m2Plans,
      queue: m2Queue,
      scheduler: typeof m2SchedulerService.getState === 'function' ? m2SchedulerService.getState() : {},
      cacheSnapshot: { fileCount: 0, sizeMb: 0 }
    });
  }, [m2AudioPool, m2Plans, m2Queue]);

  // Handlers for Workspace Panel
  const handleWorkspaceSaveNow = () => {
    m2WorkspacePersistence.saveWorkspace({
      sources: m2AudioPool,
      renderPlans: m2Plans,
      queue: m2Queue,
      scheduler: typeof m2SchedulerService.getState === 'function' ? m2SchedulerService.getState() : {},
      cacheSnapshot: { fileCount: 0, sizeMb: 0 }
    });
  };

  const handleWorkspaceRestoreNow = () => {
    const ws = m2WorkspacePersistence.restoreWorkspace();
    if (ws) {
      if (ws.sources) setM2AudioPool(ws.sources);
      if (ws.renderPlans) setM2Plans(ws.renderPlans);
      if (ws.queue) setM2Queue(ws.queue);
      if (ws.scheduler) m2SchedulerService.updateSettings(ws.scheduler);
    }
  };

  const handleWorkspaceReset = () => {
    m2WorkspacePersistence.resetWorkspace();
  };
`;

content = content.replace("const handleAddSelectedToQueue = (selectedPlans) => {", auto_save_restore_code + "\n  const handleAddSelectedToQueue = (selectedPlans) => {");

const render_ws_code = `                  <div className="flex-1 min-h-0">
                    <WorkspacePanel 
                      onSaveNow={handleWorkspaceSaveNow}
                      onRestoreNow={handleWorkspaceRestoreNow}
                      onResetWorkspace={handleWorkspaceReset}
                    />
                  </div>`;

content = content.replace(`                  <div className="flex-1 min-h-0">
                    <SchedulerPanel />
                  </div>`, `                  <div className="flex-1 min-h-0">
                    <SchedulerPanel />
                  </div>
` + render_ws_code);

fs.writeFileSync('src/App.jsx', content, 'utf8');
