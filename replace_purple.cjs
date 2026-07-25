const fs = require('fs');
const path = 'd:/MediaFactory/src/components/m3/M3ObjectInspector.jsx';

let content = fs.readFileSync(path, 'utf8');

const replacements = [
    { from: /#a855f7/g, to: '#f97316' }, // text/border/bg purple to orange
    { from: /#8b5cf6/g, to: '#f97316' }, // Browse button original bg
    { from: /#7c3aed/g, to: '#ea580c' }, // Browse button hover bg
    { from: /#9333ea/g, to: '#f97316' }, // Modal gradient start
    { from: /#c084fc/g, to: '#fed7aa' }, // Modal gradient hover to
    { from: /text-purple-400/g, to: 'text-orange-400' },
    { from: /bg-purple-500/g, to: 'bg-orange-500' },
    { from: /hover:bg-purple-500/g, to: 'hover:bg-orange-500' },
    { from: /bg-[#0f111a]/g, to: 'bg-[#08090c]' },
    { from: /bg-[#161824]/g, to: 'bg-[#0c0d12]' }, // Secondary panels
    { from: /rgba\(168,85,247/g, to: 'rgba(249,115,22' }, // Box shadows
    { from: /Purple neon color/g, to: 'Orange brand color' },
];

for (let r of replacements) {
    content = content.replace(r.from, r.to);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced colors successfully.');
