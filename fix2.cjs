const fs = require('fs');
function fix(file) {
  let content = fs.readFileSync(file, 'utf8').trim();
  if (content.startsWith('"') && content.endsWith('"')) {
    content = content.substring(1, content.length - 1);
  }
  content = content.replace(/\\n/g, '\n').replace(/\\"/g, '"');
  fs.writeFileSync(file, content);
}
fix('d:\\MediaFactory\\src\\components\\m3\\panels\\BackgroundPanel.jsx');
fix('d:\\MediaFactory\\src\\components\\m3\\panels\\VisualizerPanel.jsx');
console.log('Fixed quotes and newlines');
