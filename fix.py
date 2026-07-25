import sys

with open('src/components/m3/M3ObjectInspector.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("case 'Effects': return renderEffectsInspector();\n      ", "")

with open('src/components/m3/M3ObjectInspector.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Replaced content.')
