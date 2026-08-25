import path from 'path-browserify';
import RenderProcess from 'video/RenderProcess';
import AudioProcess from 'video/AudioProcess';
import MergeProcess from 'video/MergeProcess';
import { api, logger, stage } from 'view/global';
import { updateState } from 'actions/video';
import { raiseError } from 'actions/error';
import { uniqueId } from 'utils/crypto';
import { sleep } from 'utils/work';

export default class VideoRenderer {
  constructor(renderer) {
    const { FFMPEG_BINARY = 'ffmpeg' } = (api && typeof api.getEnvironment === 'function') ? api.getEnvironment() : {};

    this.renderer = renderer;
    this.renderProcess = new RenderProcess(FFMPEG_BINARY);
    this.audioProcess = new AudioProcess(FFMPEG_BINARY);
    this.mergeProcess = new MergeProcess(FFMPEG_BINARY);

    this.renderProcess.on('output', data => {
      logger.log(data);

      // Start rendering frames when ffmpeg is ready
      if (!this.running && /^ffmpeg version/.test(data)) {
        setTimeout(() => {
          this.running = true;

          this.renderFrames();
        }, 500);
      }
    });

    this.audioProcess.on('output', data => {
      logger.log(data);
    });

    this.mergeProcess.on('output', data => {
      logger.log(data);
    });
  }

  async start({ videoFile, audioFile, fps, quality, codec, timeStart, timeEnd }) {
    try {
      const safeQuality = (quality || 'high').toLowerCase();
      const safeCodec = (codec || 'x264').toLowerCase();

      this.renderer.stop();
      this.startTime = Date.now();
      this.running = false;
      this.finished = false;
      this.currentProcess = null;
      this.fps = fps;
      this.totalFrames = fps * (timeEnd - timeStart);
      this.startFrame = fps * timeStart;
      this.endFrame = this.startFrame + this.totalFrames;

      const { renderProcess, audioProcess, mergeProcess } = this;

      const id = uniqueId();
      const { TEMP_PATH = 'D:\\MediaFactory\\Output\\Temp' } = (api && typeof api.getEnvironment === 'function') ? api.getEnvironment() : {};
      const tempVideoFile = path.join(TEMP_PATH, `${id}.video`);
      const tempAudioFile = path.join(TEMP_PATH, `${id}.audio`);

      logger.log('Starting video render', id);

      // Render video
      updateState({ status: 'Rendering video' });
      this.currentProcess = renderProcess;
      const { width, height } = stage.getSize();
      const outputVideoFile = await renderProcess.start({
        outputFile: tempVideoFile,
        codec: safeCodec,
        fps,
        quality: safeQuality,
        width,
        height,
      });

      // Render audio
      updateState({ status: 'Rendering audio' });
      this.currentProcess = audioProcess;
      const outputAudioFile = await audioProcess.start({
        audioFile,
        outputFile: tempAudioFile,
        codec: safeCodec,
        timeStart,
        timeEnd,
      });

      // Merge audio and video
      updateState({ status: 'Merging audio and video' });
      this.currentProcess = mergeProcess;
      await mergeProcess.start({
        inputFiles: [outputVideoFile, outputAudioFile],
        outputFile: videoFile,
      });

      this.finished = true;

      updateState({ active: false, status: 'Finished', finished: true });
    } catch (error) {
      if (error.message.indexOf('Process terminated') < 0) {
        updateState({ active: false, status: 'Error' });

        raiseError('Video rendering failed.', error);
      }
    } finally {
      this.stop();

      this.running = false;

      this.renderer.start();
      updateState({ active: false });
    }
  }

  stop() {
    if (this.currentProcess && typeof this.currentProcess.stop === 'function') {
      this.currentProcess.stop();
    }
    this.running = false;
    this.renderer.start();
    updateState({ active: false });

    logger.log('Video rendering stopped.');
  }

  async renderFrames() {
    const { renderer, renderProcess, startTime, startFrame, endFrame, totalFrames, fps } = this;

    try {
      this.frame = startFrame;
      let lastProgressUpdate = 0;

      while (this.frame < endFrame && this.running) {
        const image = await renderer.renderFrame(this.frame, fps);

        if (image) {
          renderProcess.push(image);
        }

        this.frame += 1;

        // Throttle progress updates to ~4 times per second to prevent React UI re-render lag
        const now = Date.now();
        if (now - lastProgressUpdate > 250 || this.frame >= endFrame) {
          lastProgressUpdate = now;
          updateState({
            currentFrame: totalFrames - (endFrame - this.frame),
            totalFrames,
            startTime,
          });
        }

        // Yield to the main event loop cleanly so user input & live editor remain 100% interactive
        if (this.frame % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } catch (error) {
      if (!error.message.includes('write EPIPE')) {
        raiseError('Frame rendering failed.', error);

        this.stop();
      }
    } finally {
      renderProcess.end();
    }
  }
}
