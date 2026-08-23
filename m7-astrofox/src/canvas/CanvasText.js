import Entity from 'core/Entity';
import { resetCanvas } from 'utils/canvas';

export default class CanvasText extends Entity {
  static defaultProperties = {
    text: 'Custom Text',
    name: 'Custom Text',
    textType: 'custom', // 'custom' | 'title' | 'playlist'
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
    color: '#ffffff',
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
    numberFormat: '{number}. {title}'
  };

  constructor(properties, canvas) {
    super('CanvasText', { ...CanvasText.defaultProperties, ...properties });

    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
  }

  getFont(size, weight, fontName, isItalic) {
    const weightMap = {
      'Light': '300',
      'Normal': '400',
      'Semi-Bold': '600',
      'Bold': '700',
      'Extra-Bold': '800',
      'Black': '900'
    };
    const mappedWeight = weightMap[weight] || weight || 'bold';
    const italicStyle = isItalic ? 'italic' : 'normal';
    const family = fontName || 'Segoe UI';
    return `${italicStyle} ${mappedWeight} ${Math.round(size)}px "${family}", sans-serif`;
  }

  render() {
    const { canvas, context } = this;
    const p = this.properties;
    const fontSize = p.fontSize || p.size || 40;
    const fontFamily = p.fontFamily || p.font || 'Segoe UI';
    const fontWeight = p.fontWeight || 'Extra-Bold';
    const align = (p.align || 'Center').toLowerCase();
    const color = p.color || '#ffffff';
    const strokeEnabled = !!p.strokeEnabled && p.stroke > 0;
    const strokeWidth = p.stroke || 0;
    const strokeColor = p.strokeColor || '#000000';
    const glowEnabled = !!p.glowEnabled && p.glow > 0;
    const glowAmount = p.glow || 0;
    const glowColor = p.glowColor || color;

    // 1. Determine rendered text and sublabel
    let mainText = p.text || p.name || 'Custom Text';
    let sublabel = '';
    let trackListItems = [];

    const isCurrentTrack = p.bindToCurrentTrack || p.textType === 'title' || p.name === '{current_track}';
    const isPlaylistLayout = p.type === 'playlist' || p.textType === 'playlist';

    if (isCurrentTrack) {
      if (typeof window !== 'undefined' && window.__ASTROFOX_AUDIO__ && window.__ASTROFOX_AUDIO__.audioStore) {
        const audioState = window.__ASTROFOX_AUDIO__.audioStore.getState();
        if (audioState && audioState.file) {
          mainText = audioState.file.replace(/\.[^/.]+$/, ''); // Strip file extension
        }
      }
      if (p.showLabel !== false) {
        sublabel = 'CURRENT PLAYING';
      }
    } else if (isPlaylistLayout) {
      if (typeof window !== 'undefined' && window.__M7_PLAYLIST_TRACKS__) {
        trackListItems = window.__M7_PLAYLIST_TRACKS__;
      }
    }

    // 2. Compute required canvas dimensions
    const padding = Math.max(60, glowAmount * 3, strokeWidth * 2);
    let totalW = 800;
    let totalH = 400;

    context.font = this.getFont(fontSize, fontWeight, fontFamily, p.italic);

    if (isPlaylistLayout && trackListItems.length > 0) {
      const cols = p.columns || 1;
      const rowH = fontSize * 1.5;
      const rowsPerCol = Math.ceil(trackListItems.length / cols);
      totalH = Math.max(200, rowsPerCol * rowH + padding * 2);
      totalW = Math.max(600, cols * 400 + padding * 2);
    } else {
      const mainMetrics = context.measureText(mainText);
      const subMetrics = sublabel ? context.measureText(sublabel) : { width: 0 };
      const maxTextW = Math.max(mainMetrics.width, subMetrics.width * (p.labelSize || 0.4));
      totalW = Math.ceil(maxTextW + padding * 2 + 100);
      totalH = Math.ceil(fontSize * (sublabel ? 3.5 : 2.2) + padding * 2);
    }

    totalW = Math.min(3840, Math.max(200, totalW));
    totalH = Math.min(2160, Math.max(100, totalH));

    resetCanvas(canvas, totalW, totalH);

    context.save();

    // 3. Setup draw styles
    const centerX = totalW / 2;
    const centerY = totalH / 2;

    context.textAlign = align === 'left' ? 'left' : (align === 'right' ? 'right' : 'center');
    context.textBaseline = 'middle';

    let drawX = centerX;
    if (align === 'left') drawX = padding;
    if (align === 'right') drawX = totalW - padding;

    // Helper draw function for a line of text with outline & glow
    const drawStyledLine = (textStr, x, y, fontStr, fillCol) => {
      context.font = fontStr;
      context.fillStyle = fillCol;

      // Glow pass
      if (glowEnabled) {
        context.shadowColor = glowColor;
        context.shadowBlur = glowAmount;
        context.fillText(textStr, x, y);
      }

      // Stroke pass
      if (strokeEnabled) {
        context.strokeStyle = strokeColor;
        context.lineWidth = strokeWidth * 2;
        context.lineJoin = 'round';
        context.miterLimit = 2;
        context.strokeText(textStr, x, y);
      }

      // Main fill pass
      context.shadowBlur = 0;
      context.fillText(textStr, x, y);
    };

    if (isPlaylistLayout && trackListItems.length > 0) {
      const cols = p.columns || 1;
      const colW = (totalW - padding * 2) / cols;
      const rowH = fontSize * 1.4;

      trackListItems.forEach((track, idx) => {
        const colIdx = Math.floor(idx / Math.ceil(trackListItems.length / cols));
        const rowIdx = idx % Math.ceil(trackListItems.length / cols);
        const itemX = padding + colIdx * colW + (colW / 2);
        const itemY = padding + rowIdx * rowH + (rowH / 2);

        const numStr = String(idx + 1).padStart(2, '0');
        const itemText = `${numStr}. ${track.name || 'Track'}`;
        const itemFont = this.getFont(fontSize, fontWeight, fontFamily, false);

        drawStyledLine(itemText, itemX, itemY, itemFont, color);
      });
    } else {
      let mainY = centerY;

      // Draw Sub-label if present ("CURRENT PLAYING")
      if (sublabel) {
        const labelSizePx = fontSize * (p.labelSize || 0.45);
        const labelFont = this.getFont(labelSizePx, p.labelBold !== false ? 'Bold' : 'Normal', fontFamily, p.labelItalic);
        const labelY = centerY - (fontSize * 0.7);
        mainY = centerY + (fontSize * 0.4);

        context.save();
        context.globalAlpha = 0.85;
        let subX = drawX;
        if (p.labelAlign === 'Left') subX = padding;
        if (p.labelAlign === 'Right') subX = totalW - padding;
        drawStyledLine(sublabel, subX, labelY, labelFont, p.labelColor || color);
        context.restore();
      }

      // Draw Main Text (supports multi-line if \n exists)
      const lines = String(mainText).split('\n');
      const lineHeight = fontSize * 1.25;
      const startLineY = mainY - ((lines.length - 1) * lineHeight) / 2;
      const mainFont = this.getFont(fontSize, fontWeight, fontFamily, p.italic);

      lines.forEach((line, lineIdx) => {
        drawStyledLine(line, drawX, startLineY + lineIdx * lineHeight, mainFont, color);
      });
    }

    context.restore();
  }
}
