const FilterGraphBuilder = require('./backend/m5/ffmpeg/builders/FilterGraphBuilder');
const { createNode } = require('./backend/m5/rendergraph/NodeFactory');
const fs = require('fs');

const txtPath = 'C:/Users/Server Abal/AppData/Local/Temp/m5_cta_test.txt';
fs.writeFileSync(txtPath, 'Apakah kamu sayang ibu kamu?\\n\\nKalau iya...\\n\\nKlik Subscribe ❤️', 'utf-8');

const textOverlay = createNode("TextOverlayNode", {
    textfile: txtPath,
    text: 'Apakah kamu sayang ibu kamu?',
    start: 0,
    duration: 9999,
    size: 50,
    color: "white"
}, []);

const fg = FilterGraphBuilder.build({
    nodes: { [textOverlay.id]: textOverlay },
    edges: [],
    metadata: { resolution: { width: 1080, height: 1920 }, optimizationPlan: { filterChains: [] } }
});

console.log(JSON.stringify(fg.nodes, null, 2));
