import os

with open('src/components/m1/M1StudioPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the extra </div>
text = text.replace('            </div>\n\n    </div>\n  );\n}', '    </div>\n  );\n}')

# Fix the corrupted em-dash
text = text.replace('return \'\xef\xbf\xbd?"\';', 'return \'-\';')

with open('src/components/m1/M1StudioPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
