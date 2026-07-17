export const QAModes = {
  QUICK: {
    id: 'quick',
    name: 'Quick',
    durationSec: 30,
    fps: 30,
    description: '30 seconds smoke test',
    exportEnabled: false,
    whisperEnabled: false,
  },
  STANDARD: {
    id: 'standard',
    name: 'Standard',
    durationSec: 300,
    fps: 60,
    description: '5 minutes default developer validation',
    exportEnabled: true,
    whisperEnabled: true,
  },
  PRODUCTION: {
    id: 'production',
    name: 'Production',
    durationSec: 600,
    fps: 60,
    description: '10 minutes release validation',
    exportEnabled: true,
    whisperEnabled: true,
  },
  STRESS: {
    id: 'stress',
    name: 'Stress',
    durationSec: 1800,
    fps: 60,
    description: '30 minutes sustained workload',
    exportEnabled: true,
    whisperEnabled: true,
  },
  ENDURANCE: {
    id: 'endurance',
    name: 'Endurance',
    durationSec: 7200,
    fps: 60,
    description: '2 hours memory leak detection',
    exportEnabled: true,
    whisperEnabled: true,
  },
  CUSTOM: {
    id: 'custom',
    name: 'Custom',
    durationSec: 600, // default, overridden by UI
    fps: 60,
    description: 'User configurable',
    exportEnabled: true,
    whisperEnabled: true,
  }
};

export const QAConfig = {
  defaultMode: 'PRODUCTION',
  getMode: (modeId) => Object.values(QAModes).find(m => m.id === modeId) || QAModes.PRODUCTION,
};
