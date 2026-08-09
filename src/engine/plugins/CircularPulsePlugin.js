import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { RadialPolarEngine } from '../engines/RadialPolarEngine.js';

const radialPolarEngine = new RadialPolarEngine();

export class CircularPulsePlugin extends IVisualizerPlugin {
  constructor() {
    super('CIRCULAR_PULSE', 'Circular Pulse Visualizer');
  }

  initialize(renderContext) {
    radialPolarEngine.initialize(renderContext);
  }

  render(renderContext) {
    const { audioState, config } = renderContext;
    return radialPolarEngine.render(renderContext, audioState, config);
  }

  dispose(renderContext) {
    radialPolarEngine.dispose(renderContext);
  }
}
