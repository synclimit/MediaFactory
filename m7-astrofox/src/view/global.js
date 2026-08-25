import EventEmitter from 'core/EventEmitter';
import Logger from 'core/Logger';
import Renderer from 'core/Renderer';
import Reactors from 'core/Reactors';
import Stage from 'core/Stage';
import Audio from 'audio/Audio';
import Player from 'audio/Player';
import SpectrumAnalyzer from 'audio/SpectrumAnalyzer';
import VideoRenderer from 'video/VideoRenderer';
import { SAMPLE_RATE } from './constants';

const defaultEnv = {
  FFMPEG_BINARY: 'ffmpeg',
  TEMP_PATH: 'D:\\MediaFactory\\Output\\Temp',
  APP_NAME: 'Astrofox',
  APP_VERSION: '1.4.0',
  PLUGIN_PATH: ''
};

export const api = window.__ASTROFOX__ || {
  getEnvironment: () => defaultEnv,
  getPlugins: () => ({}),
  on: () => {},
  off: () => {},
  invoke: async () => ({}),
  spawnProcess: () => ({ stop: () => {}, push: () => {}, end: () => {} }),
  loadConfig: async () => ({}),
  saveConfig: async () => ({}),
  loadAudioTags: async () => ({}),
  readAudioFile: async () => ({}),
  readImageFile: async () => ({}),
  saveImageFile: async () => ({}),
  loadProjectFile: async () => ({}),
  saveProjectFile: async () => ({}),
  showOpenDialog: async () => ({ filePaths: [], canceled: true }),
  showSaveDialog: async () => ({ filePath: '', canceled: true }),
  openDevTools: () => {},
  minimizeWindow: () => {},
  maximizeWindow: () => {},
  unmaximizeWindow: () => {},
  closeWindow: () => {},
  getWindowState: () => ({ isMaximized: false, isMinimized: false, isFullScreen: false })
};
export const env = (api && typeof api.getEnvironment === 'function') ? api.getEnvironment() : defaultEnv;
export const audioContext = new window.AudioContext({ sampleRate: SAMPLE_RATE });
export const logger = new Logger('astrofox');
export const events = new EventEmitter();
export const stage = new Stage();
export const player = new Player(audioContext);
export const analyzer = new SpectrumAnalyzer(audioContext);
export const reactors = new Reactors();
export const renderer = new Renderer();
export const videoRenderer = new VideoRenderer(renderer);
export const library = new Map();

// Expose safe core handles on window for MediaFactory M3 / M7 bridge
try {
  window.__ASTROFOX_CORE__ = {
    stage,
    player,
    renderer,
    analyzer,
    reactors,
    events,
    library,
    audioContext,
    Audio,
    videoRenderer
  };
} catch(e) {}
