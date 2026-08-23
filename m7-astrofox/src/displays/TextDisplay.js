import CanvasDisplay from 'core/CanvasDisplay';
import CanvasText from 'canvas/CanvasText';
import fonts from 'config/fonts.json';
import { stageHeight, stageWidth } from 'utils/controls';

const fontOptions = fonts.map(item => ({ label: item, value: item, style: { fontFamily: item } }));

export default class TextDisplay extends CanvasDisplay {
  static config = {
    name: 'TextDisplay',
    description: 'Displays dynamic text, typography, and tracklist.',
    type: 'display',
    label: 'Text',
    defaultProperties: {
      text: 'Custom Text',
      name: 'Custom Text',
      textType: 'custom',
      bindToCurrentTrack: false,
      showLabel: true,
      labelSize: 0.4,
      labelAlign: 'Center',
      labelBold: true,
      labelItalic: false,
      labelColor: '#ffffff',
      font: 'Segoe UI',
      fontFamily: 'Segoe UI',
      fontWeight: 'Extra-Bold',
      size: 40,
      fontSize: 40,
      align: 'Center',
      x: 0,
      y: 0,
      color: '#FFFFFF',
      rotation: 0,
      opacity: 1.0,
      strokeEnabled: false,
      stroke: 0,
      strokeColor: '#000000',
      glowEnabled: true,
      glow: 15,
      glowColor: '#f97316',
      tiltX: 0,
      tiltY: 0,
      perspective: 60,
      depth: 0,
      columns: 1,
      dataSource: 'linked',
      numberFormat: '{number}. {title}',
      highlightActiveTrack: true,
      activeMarker: '▶',
      activeColor: '#f97316'
    },
    controls: {
      text: {
        label: 'Text',
        type: 'text',
      },
      fontSize: {
        label: 'Font Size',
        type: 'number',
      },
      fontFamily: {
        label: 'Font',
        type: 'select',
        items: fontOptions,
      },
      color: {
        label: 'Color',
        type: 'color',
      },
      x: {
        label: 'X',
        type: 'number',
        min: stageWidth(n => -n),
        max: stageWidth(),
        withRange: true,
      },
      y: {
        label: 'Y',
        type: 'number',
        min: stageHeight(n => -n),
        max: stageHeight(),
        withRange: true,
      },
      opacity: {
        label: 'Opacity',
        type: 'number',
        min: 0,
        max: 1.0,
        step: 0.01,
        withRange: true,
      },
    },
  };

  constructor(properties) {
    super(TextDisplay, properties);
  }

  addToScene() {
    this.text = new CanvasText(this.properties, this.canvas);
    this.text.render(true);
  }

  update(properties) {
    if (this.text) {
      this.text.update(properties);
      this.text.render(true);
    }
    return super.update(properties);
  }
}
