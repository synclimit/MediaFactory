import Process from 'core/Process';
import { replaceExt } from 'utils/file';
import videoConfig from 'config/video.json';

export default class RenderProcess extends Process {
  start({ outputFile, codec, fps, quality, width, height }) {
    return new Promise((resolve, reject) => {
      const safeCodec = (codec || 'x264').toLowerCase();
      const safeQuality = (quality || 'high').toLowerCase();
      const codecConfig = videoConfig.codecs[safeCodec] || videoConfig.codecs['x264'];
      const { extension, settings, encoder } = codecConfig.video;
      const output = replaceExt(outputFile, `.${extension}`);
      const qualitySettings = settings[safeQuality] || settings['high'] || [];

      this.on('close', code => {
        if (code !== 0) {
          reject(new Error('Process terminated.'));
        }
        resolve(output);
      });

      this.on('error', err => {
        reject(err);
      });

      this.on('stderr', data => {
        this.emit('output', data);
      });

      // Encoding options
      const args = [
        '-loglevel',
        'debug',
        '-y',
        '-stats',
        '-f',
        'rawvideo',
        '-c:v',
        'rawvideo',
        '-pix_fmt',
        'rgba',
        '-s',
        `${width}x${height}`,
        '-r',
        fps,
        ...(settings.input || []),
        '-i',
        'pipe:0',
        '-c:v',
        encoder,
        '-f',
        extension,
        '-pix_fmt',
        'yuv420p',
        '-vf',
        'vflip',
        ...(settings.output || []),
        ...qualitySettings,
        output
      ];

      super.start(args);
    });
  }
}
