import fs from 'node:fs';
import path from 'node:path';

// Minimal 1x1 orange PNG hex buffer
const pngHex =
  '89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c4944415408d763f8cfc000000301010018dd8dbe0000000049454e44ae426082';
const buffer = Buffer.from(pngHex, 'hex');

const iconsDir = path.resolve('assets/icons');
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const file = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(file, buffer);
}

/* eslint-disable no-console */
console.log('Extension icons generated successfully.');
