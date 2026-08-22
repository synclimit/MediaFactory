import { generateGeometry as g1 } from './src/visualizers/categories/waves/W01_Oscilloscope.js';
import { generateGeometry as g2 } from './src/visualizers/categories/waves/W02_FilledSine.js';
import { generateGeometry as g3 } from './src/visualizers/categories/waves/W03_SymmetricalDual.js';

const sampleFFT = { spectrum: new Uint8Array(64).fill(128), waveform: new Uint8Array(256).fill(128) };
const sampleViewport = { width: 1920, height: 1080 };
const sampleConfig = { barCount: 64, color: '#00ffcc' };

console.log('W01:', g1(sampleFFT, sampleViewport, sampleConfig, {}));
console.log('W02:', g2(sampleFFT, sampleViewport, sampleConfig, {}));
console.log('W03:', g3(sampleFFT, sampleViewport, sampleConfig, {}));
