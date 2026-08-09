const QUALITY_PRESETS = {
  '240p': 'scale=426:240:force_original_aspect_ratio=increase,crop=426:240,setsar=1',
  '360p': 'scale=640:360:force_original_aspect_ratio=increase,crop=640:360,setsar=1',
  '480p': 'scale=854:480:force_original_aspect_ratio=increase,crop=854:480,setsar=1',
  '720p': 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1',
  '1080p': 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1'
};

export class EncoderBuilder {
  static async build(job) {
    const quality = job.quality || '480p';
    const scaleFilter = QUALITY_PRESETS[quality] || QUALITY_PRESETS['480p'];
    return { filter: scaleFilter };
  }
}
