export const MASTERING_PROFILES = [
  {
    id: 'neutral',
    name: 'Neutral',
    targetLufs: -16,
    limiter: true,
    compressor: false,
    stereoWidth: 100,
    outputGain: '0'
  },
  {
    id: 'broadcast',
    name: 'Broadcast',
    targetLufs: -14,
    limiter: true,
    compressor: true,
    stereoWidth: 100,
    outputGain: '0'
  },
  {
    id: 'loud_dj',
    name: 'Loud DJ',
    targetLufs: -10,
    limiter: true,
    compressor: true,
    stereoWidth: 100,
    outputGain: '1'
  },
  {
    id: 'lofi_warm',
    name: 'Lofi Warm',
    targetLufs: -15,
    limiter: true,
    compressor: false,
    stereoWidth: 80,
    outputGain: '0'
  },
  {
    id: 'podcast_voice',
    name: 'Podcast Voice',
    targetLufs: -16,
    limiter: true,
    compressor: true,
    stereoWidth: 100,
    outputGain: '0'
  },
  {
    id: 'streaming_smooth',
    name: 'Streaming Smooth',
    targetLufs: -14,
    limiter: true,
    compressor: false,
    stereoWidth: 100,
    outputGain: '0'
  }
];

export function getDefaultMasteringSettings() {
  return { ...MASTERING_PROFILES[0] };
}
