import re

with open('vite-plugin-render-engine.js', 'r', encoding='utf-8') as f:
    content = f.read()

bad_block = """    const bootstrapBackend = require('./backend/bootstrap.js');
    bootstrapBackend();

    // Cache-bust backend modules for proper HMR
    Object.keys(require.cache).forEach(key => {
        if (key.includes('backend\\\\') || key.includes('backend/')) {
            delete require.cache[key];
        }
    });

    const router = require('./backend/api/router.js');"""

good_block = """    // Cache-bust backend modules for proper HMR
    Object.keys(require.cache).forEach(key => {
        if (key.includes('backend\\\\') || key.includes('backend/')) {
            delete require.cache[key];
        }
    });

    const bootstrapBackend = require('./backend/bootstrap.js');
    bootstrapBackend();

    const router = require('./backend/api/router.js');"""

if bad_block in content:
    content = content.replace(bad_block, good_block)
    with open('vite-plugin-render-engine.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed cache busting order.")
else:
    print("Block not found!")
