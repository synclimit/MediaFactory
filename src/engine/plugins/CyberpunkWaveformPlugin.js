import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { WaveformPathEngine } from '../engines/WaveformPathEngine.js';

const waveformPathEngine = new WaveformPathEngine();

export class CyberpunkWaveformPlugin extends IVisualizerPlugin {
  constructor() {
    super('CYBERPUNK_WAVEFORM', 'Cyberpunk Waveform Visualizer');
  }

  initialize(renderContext) {
    waveformPathEngine.initialize(renderContext);
  }

  render(renderContext) {
    const { audioState, config } = renderContext;
    return waveformPathEngine.render(renderContext, audioState, config);
  }

  dispose(renderContext) {
    waveformPathEngine.dispose(renderContext);
  }
}
