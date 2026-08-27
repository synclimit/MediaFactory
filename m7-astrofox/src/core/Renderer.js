import { events, stage, player, analyzer, reactors } from 'view/global';
import { clamp } from 'utils/math';
import Clock from './Clock';

const STOP_RENDERING = 0;
const VIDEO_RENDERING = -1;

export default class Renderer {
  constructor() {
    this.rendering = false;
    this.clock = new Clock();

    // Frame render data
    this.frameData = {
      id: 0,
      delta: 0,
      fft: null,
      td: null,
      volume: 0,
      audioPlaying: false,
      hasUpdate: false,
      reactors: {},
    };

    // Bind context
    this.render = this.render.bind(this);

    // Events
    player.on('playback-change', this.resetAnalyzer);
  }

  resetAnalyzer() {
    const audio = player.getAudio();

    if (audio && !audio.paused) {
      analyzer.reset();
    }
  }

  start() {
    if (!this.rendering) {
      this.time = Date.now();
      this.rendering = true;

      this.resetAnalyzer();
      this.render();
    }
  }

  stop() {
    const { id } = this.frameData;

    if (id) {
      window.cancelAnimationFrame(id);
    }

    this.frameData.id = STOP_RENDERING;
    this.rendering = false;
  }

  getFrameData(id) {
    const { frameData, clock: { delta } } = this;
    const playing = player.isPlaying();

    frameData.id = id;
    frameData.hasUpdate = playing || id === VIDEO_RENDERING;
    frameData.audioPlaying = playing;
    frameData.gain = analyzer.gain;

    let fft = analyzer.fft;
    let td = analyzer.td;

    // When paused in the live editor (not export rendering), supply an aesthetic live preview wave
    // so visualizers are always visible, customizable, and draggable on the canvas!
    if (!playing && id !== VIDEO_RENDERING) {
      const isSilent = !fft || fft.length === 0 || !Array.from(fft).some(v => v > 1);
      if (isSilent) {
        const fftLen = analyzer.fft?.length || 512;
        const tdLen = analyzer.td?.length || 1024;

        if (!this.previewFFT || this.previewFFT.length !== fftLen) {
          this.previewFFT = new Uint8Array(fftLen);
          this.previewTD = new Float32Array(tdLen);
        }

        const now = Date.now() * 0.003;
        for (let i = 0; i < fftLen; i++) {
          const freq = i / fftLen;
          const bass = Math.sin(now * 1.8 + freq * 5.0) * 0.25 + 0.65;
          const mid = Math.sin(now * 3.2 + freq * 14.0) * 0.2 + 0.45;
          const decay = Math.pow(Math.max(0.01, 1.0 - freq * 0.72), 1.6);
          const val = Math.max(0.12, Math.min(1.0, (bass * 0.6 + mid * 0.4) * decay));
          this.previewFFT[i] = Math.round(val * 240);
        }

        for (let i = 0; i < tdLen; i++) {
          const norm = i / tdLen;
          this.previewTD[i] = Math.sin(now * 4.0 + norm * 12.0) * 0.35 + Math.sin(now * 2.0 + norm * 4.0) * 0.2;
        }

        fft = this.previewFFT;
        td = this.previewTD;
      }
    }

    frameData.fft = fft;
    frameData.td = td;
    frameData.reactors = reactors.getResults(frameData);
    frameData.delta = delta;

    return frameData;
  }

  getAudioSample(time) {
    const { fftSize } = analyzer.analyzer;
    const audio = player.getAudio();
    const pos = audio.getBufferPosition(time);
    const start = pos - fftSize / 2;
    const end = pos + fftSize / 2;

    return audio.getAudioSlice(start, end);
  }

  getFPS() {
    return this.clock.getFPS();
  }

  renderFrame(frame, fps) {
    return new Promise((resolve, reject) => {
      try {
        analyzer.process(this.getAudioSample(frame / fps));

        const frameData = this.getFrameData(VIDEO_RENDERING);
        frameData.delta = 1000 / fps;

        stage.render(frameData);

        resolve(stage.getPixels());
      } catch (e) {
        reject(e);
      }
    });
  }

  render() {
    const id = window.requestAnimationFrame(this.render);

    this.clock.update();

    if (player.isPlaying()) {
      analyzer.process();
    }

    const data = this.getFrameData(id);

    stage.render(data);

    events.emit('render', data);
  }
}
