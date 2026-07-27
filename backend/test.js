const https = require('https');
https.get('https://freesound.org/people/BonnyOrbit/sounds/645926/', (res) => {
  let d = '';
  res.on('data', (c) => d+=c);
  res.on('end', () => console.log(d.match(/https:\/\/cdn\.freesound\.org\/previews\/[^\"]+/g)))
});
