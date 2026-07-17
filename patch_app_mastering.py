import sys

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_statement = "import WorkspacePanel from './components/m2/WorkspacePanel.jsx';"
new_imports = import_statement + "\nimport MasteringPanel from './components/m2/MasteringPanel.jsx';\nimport { getDefaultMasteringSettings } from './entities/m2/MasteringProfileEntity.js';"
content = content.replace(import_statement, new_imports)

state_declaration = "const [m2Queue, setM2Queue] = useState(() => {"
new_state = "const [m2MasteringSettings, setM2MasteringSettings] = useState(getDefaultMasteringSettings());\n  " + state_declaration
content = content.replace(state_declaration, new_state)

workspace_panel = '''                  <details className="bg-[#1e2230] rounded-xl border border-[#2d313d] overflow-hidden shadow-2xl group" open>
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
                  </details>'''

mastering_panel = '''
                  <details className="bg-[#1e2230] rounded-xl border border-[#2d313d] overflow-hidden shadow-2xl group" open>
                    <summary className="cursor-pointer p-3 bg-[#1a1d27] text-gray-200 text-sm font-bold flex justify-between items-center group-open:border-b border-[#2d313d] select-none">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-mono text-xs">⑨</span>
                        <span className="tracking-wider">MASTERING</span>
                      </div>
                      <span className="text-gray-500 text-xs transition-transform group-open:rotate-180">▼</span>
                    </summary>
                    <div className="p-0">
                      <MasteringPanel 
                        masteringSettings={m2MasteringSettings}
                        setMasteringSettings={setM2MasteringSettings}
                      />
                    </div>
                  </details>
'''
content = content.replace(workspace_panel, workspace_panel + mastering_panel)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
