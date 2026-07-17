import { sumTotalDuration, formatDuration } from './src/entities/m2/SourceEntity.js';

const sources = [
  { id: 1, title: 'A', duration: '4m 00s', videoDuration: 240 },
  { id: 2, title: 'B', duration: '4m 00s', videoDuration: 240 }
];

console.log('Shuffled', [...sources].sort(() => Math.random() - 0.5));
