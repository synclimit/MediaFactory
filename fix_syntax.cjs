const fs = require('fs');
let content = fs.readFileSync('src/components/ApiKeysModal.jsx', 'utf-8');
content = content.replace(/\\\`/g, '`');
content = content.replace(/\\\$/g, '$');
fs.writeFileSync('src/components/ApiKeysModal.jsx', content);
console.log('Fixed syntax!');
