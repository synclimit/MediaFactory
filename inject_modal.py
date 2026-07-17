import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

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

if '<ApiKeysModal' not in content:
    # Just insert it before <DevPanel
    content = content.replace('<DevPanel', modal_html + '<DevPanel')
    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Injected successfully!")
else:
    print("Already injected.")
