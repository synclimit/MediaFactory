import re

with open('vite-plugin-render-engine.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Locate the backendApp setup block
old_code = """    const router = require('./backend/api/router.js');
    backendApp = express();"""

new_code = """    // Cache-bust backend modules for proper HMR
    Object.keys(require.cache).forEach(key => {
        if (key.includes('backend\\\\') || key.includes('backend/')) {
            delete require.cache[key];
        }
    });

    const router = require('./backend/api/router.js');
    backendApp = express();"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open('vite-plugin-render-engine.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched vite-plugin-render-engine.js successfully.")
else:
    print("Could not find the target code to patch in vite-plugin-render-engine.js.")
