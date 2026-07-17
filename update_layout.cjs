const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// I will search for the column 4 div and replace it with collapsible sections.
const targetHTML = `<div className="flex flex-col gap-2 h-full min-h-0">
                  <div className="flex-1 min-h-0">
                    <CachePanel
                      addNotification={addNotification}
                      addLog={addLog}
                    />
                  </div>
                  <div className="flex-1 min-h-0">
                    <SchedulerPanel />
                  </div>
                  <div className="flex-1 min-h-0">
                    <WorkspacePanel 
                      onSaveNow={handleWorkspaceSaveNow}
                      onRestoreNow={handleWorkspaceRestoreNow}
                      onResetWorkspace={handleWorkspaceReset}
                    />
                  </div>
                </div>`;

const newHTML = `
                <div className="flex flex-col gap-2 h-full min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                  <details className="bg-[#1e2230] rounded-xl border border-[#2d313d] overflow-hidden shadow-2xl group" open>
                    <summary className="cursor-pointer p-3 bg-[#1a1d27] text-gray-200 text-sm font-bold flex justify-between items-center group-open:border-b border-[#2d313d] select-none">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-mono text-xs">⑥</span>
                        <span className="tracking-wider">CACHE MANAGER</span>
                      </div>
                      <span className="text-gray-500 text-xs transition-transform group-open:rotate-180">▼</span>
                    </summary>
                    <div className="p-0">
                      <CachePanel addNotification={addNotification} addLog={addLog} />
                    </div>
                  </details>

                  <details className="bg-[#1e2230] rounded-xl border border-[#2d313d] overflow-hidden shadow-2xl group" open>
                    <summary className="cursor-pointer p-3 bg-[#1a1d27] text-gray-200 text-sm font-bold flex justify-between items-center group-open:border-b border-[#2d313d] select-none">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-mono text-xs">⑦</span>
                        <span className="tracking-wider">SCHEDULER</span>
                      </div>
                      <span className="text-gray-500 text-xs transition-transform group-open:rotate-180">▼</span>
                    </summary>
                    <div className="p-0">
                      <SchedulerPanel />
                    </div>
                  </details>

                  <details className="bg-[#1e2230] rounded-xl border border-[#2d313d] overflow-hidden shadow-2xl group" open>
                    <summary className="cursor-pointer p-3 bg-[#1a1d27] text-gray-200 text-sm font-bold flex justify-between items-center group-open:border-b border-[#2d313d] select-none">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-mono text-xs">⑧</span>
                        <span className="tracking-wider">WORKSPACE</span>
                      </div>
                      <span className="text-gray-500 text-xs transition-transform group-open:rotate-180">▼</span>
                    </summary>
                    <div className="p-0">
                      <WorkspacePanel 
                        onSaveNow={handleWorkspaceSaveNow}
                        onRestoreNow={handleWorkspaceRestoreNow}
                        onResetWorkspace={handleWorkspaceReset}
                      />
                    </div>
                  </details>
                </div>
`;

// Also, the individual panels (CachePanel, SchedulerPanel, WorkspacePanel) currently draw their own Header. 
// Since we wrapped them in details with headers, let's remove the redundant headers from the components, or just let them be nested for now. 
// The user prompt just said "Use collapsible/accordion style sections if necessary to prevent excessive vertical growth."
// Let's replace the App.jsx column first.
if(content.includes('<div className="flex flex-col gap-2 h-full min-h-0">')) {
  content = content.replace(targetHTML, newHTML);
} else {
  // Try regex or alternative replacement if exact match fails
  const re = /<div className="flex flex-col gap-2 h-full min-h-0">[\s\S]*?<WorkspacePanel[\s\S]*?\/>\s*<\/div>\s*<\/div>/m;
  const match = content.match(re);
  if (match) {
    content = content.replace(match[0], newHTML);
  } else {
    console.error("Could not find column 4 code block to replace.");
  }
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
