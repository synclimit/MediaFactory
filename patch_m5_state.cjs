const fs = require('fs');

let content = fs.readFileSync('src/components/m5/M5NewsCreator.jsx', 'utf8');

// Insert useWorkspaceState definition inside the component
const hookCode = `
  const useWorkspaceState = (key, initialValue) => {
    const fullKey = \`m5_\${activeWorkspace}_news_\${key}\`;
    const [state, setState] = useState(() => {
      const stored = localStorage.getItem(fullKey);
      return stored !== null ? stored : initialValue;
    });
    useEffect(() => {
      localStorage.setItem(fullKey, state);
    }, [state, fullKey]);
    return [state, setState];
  };
`;

content = content.replace(
  `export default function M5NewsCreator({ m5Queue = [], setM5Queue, activeWorkspace = 'default' }) {`,
  `export default function M5NewsCreator({ m5Queue = [], setM5Queue, activeWorkspace = 'default' }) {\n${hookCode}`
);

// Replace the simple states
const stateVars = [
  {name: 'cardTheme', def: "'Glass Box'"},
  {name: 'colorPrimary', def: "'#ef4444'"},
  {name: 'colorBackground', def: "'#0f172a'"},
  {name: 'borderRadius', def: "12"},
  
  {name: 'headline', def: "'Presiden AS Joe Biden Kunjungi Vietnam, Bahas Kerja Sama Ekonomi & Keamanan'"},
  {name: 'headlineFont', def: "'Inter'"},
  {name: 'headlineSize', def: "24"},
  {name: 'headlineColor', def: "'#ffffff'"},
  {name: 'headlineAnim', def: "'Fade In Up'"},
  {name: 'headlineAlign', def: "'left'"},
  {name: 'headlineWeight', def: "'bold'"},
  {name: 'headlineItalic', def: "false"},
  
  {name: 'summary', def: "'Kunjungan ini menandai langkah baru dalam hubungan bilateral kedua negara yang semakin erat dalam beberapa tahun terakhir.'"},
  {name: 'summaryFont', def: "'Inter'"},
  {name: 'summarySize', def: "13"},
  {name: 'summaryColor', def: "'#d1d5db'"},
  {name: 'summaryAnim', def: "'Fade In Up'"},
  {name: 'summaryAlign', def: "'left'"},
  {name: 'summaryWeight', def: "'normal'"},
  {name: 'summaryItalic', def: "false"},
  
  {name: 'boxScale', def: "100"},
  {name: 'boxWidth', def: "100"},
  
  {name: 'imageScale', def: "100"},
  {name: 'imagePosX', def: "50"},
  {name: 'imagePosY', def: "10"}
];

for (const v of stateVars) {
    const search = `const [${v.name}, set${v.name.charAt(0).toUpperCase() + v.name.slice(1)}] = useState(${v.def});`;
    const replace = `const [${v.name}, set${v.name.charAt(0).toUpperCase() + v.name.slice(1)}] = useWorkspaceState('${v.name}', ${v.def});`;
    content = content.replace(search, replace);
}

// Special cases that might be objects
const boxPosSearch = `const [boxPos, setBoxPos] = useState({ x: 0, y: 0 });`;
const boxPosReplace = `
  const [boxPos, setBoxPos] = useState(() => {
     try { const v = localStorage.getItem(\`m5_\${activeWorkspace}_news_boxPos\`); return v ? JSON.parse(v) : { x: 0, y: 0 }; } catch(e) { return { x: 0, y: 0 }; }
  });
  useEffect(() => { localStorage.setItem(\`m5_\${activeWorkspace}_news_boxPos\`, JSON.stringify(boxPos)); }, [boxPos, activeWorkspace]);
`;
content = content.replace(boxPosSearch, boxPosReplace);

fs.writeFileSync('src/components/m5/M5NewsCreator.jsx', content, 'utf8');
console.log('Patched M5NewsCreator.jsx');
