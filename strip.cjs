const fs = require('fs');
function stripQuotes(file) {
  let content = fs.readFileSync(file, 'utf8').trim();
  if (content.startsWith('"')) content = content.substring(1);
  if (content.endsWith('"')) content = content.substring(0, content.length - 1);
  fs.writeFileSync(file, content);
}
stripQuotes('d:\\MediaFactory\\src\\components\\m3\\panels\\BackgroundPanel.jsx');
stripQuotes('d:\\MediaFactory\\src\\components\\m3\\panels\\VisualizerPanel.jsx');
console.log('Stripped');
