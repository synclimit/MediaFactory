import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { LinearBarEngine } from '../engines/LinearBarEngine.js';

const linearBarEngine = new LinearBarEngine();

export class SpectrumBarsPlugin extends IVisualizerPlugin {
  constructor() {
    super('SPECTRUM_BARS', 'Spectrum Bars Visualizer');
  }

  initialize(renderContext) {
    linearBarEngine.initialize(renderContext);
  }

  render(renderContext) {
    const { audioState, config } = renderContext;
    return linearBarEngine.render(renderContext, audioState, config);
  }

  dispose(renderContext) {
    linearBarEngine.dispose(renderContext);
  }
}
