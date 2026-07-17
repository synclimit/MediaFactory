const QUALITY_PRESETS = {
  '240p': 'scale=-2:240,pad=ceil(iw/2)*2:ceil(ih/2)*2',
  '360p': 'scale=-2:360,pad=ceil(iw/2)*2:ceil(ih/2)*2',
  '480p': 'scale=-2:480,pad=ceil(iw/2)*2:ceil(ih/2)*2',
  '720p': 'scale=-2:720,pad=ceil(iw/2)*2:ceil(ih/2)*2',
  '1080p': 'scale=-2:1080,pad=ceil(iw/2)*2:ceil(ih/2)*2'
};

export class EncoderBuilder {
  static async build(job) {
    const quality = job.quality || '480p';
    const scaleFilter = QUALITY_PRESETS[quality] || QUALITY_PRESETS['480p'];
    return { filter: scaleFilter };
  }
}
