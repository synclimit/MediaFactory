import re

with open('src/components/m5/M5CreateView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
import_statements = """import React, { useState } from 'react';
import { Clapperboard, FileText } from 'lucide-react';
import M5VideoCreator from './M5VideoCreator';
import M5NewsCreator from './M5NewsCreator';
import EditorUI from '../m5-editor/EditorUI.jsx';
import { useM5EditorStore } from '../../state/m5EditorStore.js';
"""
content = content.replace("import React, { useState } from 'react';\nimport { Clapperboard, FileText } from 'lucide-react';\nimport M5VideoCreator from './M5VideoCreator';\nimport M5NewsCreator from './M5NewsCreator';", import_statements)

# Add hook inside M5CreateView
if 'useM5EditorStore' not in content.split('export default function M5CreateView')[1]:
    content = content.replace(
        "const [creatorMode, setCreatorMode] = useState('video');",
        "const [creatorMode, setCreatorMode] = useState('video');\n  const { isEditorMode } = useM5EditorStore();"
    )

# Render EditorUI at the end of the return block
if '<EditorUI' not in content:
    content = content.replace(
        "    </div>\n  );\n}",
        "      {isEditorMode && <EditorUI />}\n    </div>\n  );\n}"
    )

with open('src/components/m5/M5CreateView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("M5CreateView modified.")
