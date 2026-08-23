import path from 'path-browserify';
import Process from 'core/Process';
import { replaceExt } from 'utils/file';
import videoConfig from 'config/video.json';

export default class AudioProcess extends Process {
  start({ audioFile, outputFile, codec, timeStart, timeEnd }) {
    return new Promise((resolve, reject) => {
      const safeCodec = (codec || 'x264').toLowerCase();
      const codecConfig = videoConfig.codecs[safeCodec] || videoConfig.codecs['x264'];
      const ext = path.extname(audioFile);
      const duration = timeEnd - timeStart;
      const { encoder, extension, settings } = codecConfig.audio;
      const output = replaceExt(outputFile, `.${extension}`);

      let finalEncoder = encoder;
      // If source is already in correct format, just copy
      if (
        (/x264|nvenc/.test(safeCodec) && /\.(mp4|aac)/.test(ext)) ||
        (safeCodec === 'webm' && ext === '.ogg')
      ) {
        finalEncoder = 'copy';
      }

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

      // Universal audio encoding options
      const args = [
        '-y',
        '-i',
        audioFile,
        '-ss',
        String(timeStart || 0),
        '-t',
        String(duration || 10),
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        output,
      ];

      super.start(args);
    });
  }
}
