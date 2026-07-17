import os

files = [
    'src/components/m5/M5NewsCreator.jsx',
    'src/components/m5-editor/EditorUI.jsx'
]

for f in files:
    with open(f, 'r', encoding='utf8') as file:
        content = file.read()
    
    # Replace literal backslash followed by backtick
    content = content.replace('\\`', '`')
    # Replace literal backslash followed by dollar
    content = content.replace('\\$', '$')
    
    with open(f, 'w', encoding='utf8') as file:
        file.write(content)

print("Fixed all escapes!")
