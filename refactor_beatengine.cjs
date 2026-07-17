const fs = require('fs');
const file = 'd:/MediaFactory/src/services/audio/BeatEngine.js';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
const before = lines.slice(0, 37).join('\n');
const after = lines.slice(625).join('\n');
const imports = `import {
    FFTAnalyzer,
    BandExtractor,
    EnvelopeBank,
    BeatDetector,
    BeatClassifier,
    AudioFeatureExtractor,
    HypothesisTempoEstimator
} from './AudioDSP';`;
fs.writeFileSync(file, before + '\n' + imports + '\n' + after);
console.log('BeatEngine refactored');
