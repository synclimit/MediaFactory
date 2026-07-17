import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Import
import_statement = "import ApiKeysModal from './components/ApiKeysModal.jsx';\n"
if 'ApiKeysModal' not in content:
    content = content.replace("import { m2WorkspacePersistence } from './services/m2/WorkspacePersistenceService.js';", import_statement + "\nimport { m2WorkspacePersistence } from './services/m2/WorkspacePersistenceService.js';")

# 2. Add State Variables
state_vars = """
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const stored = localStorage.getItem('mf_api_keys');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('mf_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);
"""
if 'isApiKeysModalOpen' not in content:
    content = content.replace("const [pipelineDrawerCollapsed, setPipelineDrawerCollapsed] = useState(() => {", state_vars + "\n  const [pipelineDrawerCollapsed, setPipelineDrawerCollapsed] = useState(() => {")

# 3. Add Button in Settings Menu
button_html = """
                <div className="border-t border-white/10 pt-1.5 mt-1.5 space-y-1">
                  <button
                    onClick={() => { setIsApiKeysModalOpen(true); setIsSettingsOpen(false); }}
                    className="w-full text-left text-[10px] text-gray-300 hover:text-white hover:bg-white/5 px-2 py-1 rounded flex items-center gap-1.5 transition-colors"
                  >
                    <span className="text-[10px]">🔑</span> Manage API Keys
                  </button>
                </div>
"""
if 'Manage API Keys' not in content:
    content = content.replace("Developer Mode\n                </label>", "Developer Mode\n                </label>\n" + button_html)

# 4. Render Modal at the end
modal_html = """
      {/* ─── API Keys Modal ─────────────────────────────────────────── */}
      {isApiKeysModalOpen && (
        <ApiKeysModal
          onClose={() => setIsApiKeysModalOpen(false)}
          apiKeys={apiKeys}
          setApiKeys={setApiKeys}
        />
      )}
"""
if 'ApiKeysModal' not in content:
    content = content.replace("      <DevPanel", modal_html + "\n      <DevPanel")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("App.jsx updated successfully!")
