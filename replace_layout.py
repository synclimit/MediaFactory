import sys, re
content = open('src/App.jsx', 'r', encoding='utf-8').read()

col4_re = re.compile(r'<div className="flex flex-col gap-2 h-full min-h-0">.*?<SchedulerPanel />.*?</div>.*?</div>', re.DOTALL)

newHTML = '''                <div className="flex flex-col gap-2 h-full min-h-0 overflow-y-auto pr-1 custom-scrollbar">
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
                </div>'''

# Verify if it matches
match = col4_re.search(content)
if match:
    content = col4_re.sub(newHTML, content, count=1)
    open('src/App.jsx', 'w', encoding='utf-8').write(content)
    print("Replaced successfully")
else:
    print("No match found")
