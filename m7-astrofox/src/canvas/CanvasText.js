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
    this._lastRenderKey = '';
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
    const mappedWeight = weightMap[weight] || weight || '800';
    const italicStyle = isItalic ? 'italic' : 'normal';
    const family = fontName || 'Segoe UI';
    return `${italicStyle} ${mappedWeight} ${Math.round(size)}px "${family}", sans-serif`;
  }

  render(force = false) {
    const { canvas, context } = this;
    const p = this.properties;
    const fontSize = Math.max(10, p.fontSize || p.size || 40);
    const fontFamily = p.fontFamily || p.font || 'Segoe UI';
    const fontWeight = p.fontWeight || 'Extra-Bold';
    const align = (p.align || 'Center').toLowerCase();
    const color = p.color || '#ffffff';
    const strokeEnabled = !!p.strokeEnabled && (p.stroke || 0) > 0;
    const strokeWidth = p.stroke || 0;
    const strokeColor = p.strokeColor || '#000000';
    const glowEnabled = (p.glowEnabled !== false) && (p.glow || 0) > 0;
    const glowAmount = p.glow || 0;
    const glowColor = p.glowColor || color;

    // 1. Determine rendered text and sublabel
    let mainText = p.text || p.name || 'Custom Text';
    let sublabel = '';
    let trackListItems = [];

    const isCurrentTrack = !!p.bindToCurrentTrack || p.textType === 'title' || p.name === '{current_track}';
    const isPlaylistLayout = p.type === 'playlist' || p.textType === 'playlist';

    // Active track index resolution
    const activeTrackIdx = (typeof window !== 'undefined' && (window.__M7_ACTIVE_TRACK_INDEX__ !== undefined ? window.__M7_ACTIVE_TRACK_INDEX__ : window.activeSelectedTrackIndex)) ?? 0;
    const highlightActive = p.highlightActiveTrack !== false;
    const activeColor = p.activeColor || '#f97316';
    const activeMarker = p.activeMarker || '▶';

    if (isCurrentTrack) {
      if (typeof window !== 'undefined' && window.__ASTROFOX_AUDIO__ && window.__ASTROFOX_AUDIO__.audioStore) {
        const audioState = window.__ASTROFOX_AUDIO__.audioStore.getState();
        if (audioState && audioState.file) {
          mainText = audioState.file.replace(/\.[^/.]+$/, ''); // Clean song name
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

    // Performance Optimization: Dirty-check key to avoid re-rendering 60fps if nothing changed
    const renderKey = [
      mainText,
      sublabel,
      fontSize,
      fontFamily,
      fontWeight,
      align,
      color,
      strokeEnabled,
      strokeWidth,
      strokeColor,
      glowEnabled,
      glowAmount,
      glowColor,
      p.columns || 1,
      p.labelSize || 0.4,
      p.labelColor || '',
      p.labelBold !== false,
      p.labelItalic,
      p.labelAlign || 'Center',
      trackListItems.length,
      highlightActive ? activeTrackIdx : -1,
      activeColor,
      activeMarker
    ].join('|');

    if (!force && this._lastRenderKey === renderKey && canvas.width > 1) {
      return; // No changes, keep existing rendered canvas
    }
    this._lastRenderKey = renderKey;

    // 2. Compute required canvas dimensions
    const padding = Math.max(20, glowAmount * 2, strokeWidth * 2);
    let totalW = 400;
    let totalH = 100;

    const mainFont = this.getFont(fontSize, fontWeight, fontFamily, p.italic);
    context.font = mainFont;

    if (isPlaylistLayout && trackListItems.length > 0) {
      const cols = Math.max(1, p.columns || 1);
      const rows = Math.ceil(trackListItems.length / cols);
      const rowH = fontSize * 1.5;

      let maxColTrackW = 260;
      trackListItems.forEach((track, idx) => {
        const cleanName = (track.name || 'Track').replace(/\.[^/.]+$/, '');
        const numStr = String(idx + 1).padStart(2, '0');
        const m = context.measureText(`▶ ${numStr}. ${cleanName}`);
        if (m.width > maxColTrackW) maxColTrackW = m.width;
      });

      const colW = maxColTrackW + 30;
      totalW = Math.ceil(cols * colW + padding * 2);
      totalH = Math.ceil(rows * rowH + padding * 2);
    } else {
      const lines = String(mainText).split('\n');
      let maxLineWidth = 0;
      lines.forEach(l => {
        const m = context.measureText(l);
        if (m.width > maxLineWidth) maxLineWidth = m.width;
      });

      let sublabelW = 0;
      let labelH = 0;
      if (sublabel) {
        const labelSizePx = fontSize * (p.labelSize || 0.45);
        const subFont = this.getFont(labelSizePx, p.labelBold !== false ? 'Bold' : 'Normal', fontFamily, p.labelItalic);
        context.font = subFont;
        sublabelW = context.measureText(sublabel).width;
        labelH = labelSizePx * 1.6;
      }

      const maxContentW = Math.max(maxLineWidth, sublabelW);
      totalW = Math.ceil(maxContentW + padding * 2 + 20);
      totalH = Math.ceil((lines.length * fontSize * 1.25) + labelH + padding * 2);
    }

    totalW = Math.min(3840, Math.max(120, totalW));
    totalH = Math.min(2160, Math.max(50, totalH));

    resetCanvas(canvas, totalW, totalH);

    context.save();

    // 3. Setup draw styles
    const centerX = totalW / 2;
    const centerY = totalH / 2;

    let drawX = centerX;
    if (align === 'left') drawX = padding;
    if (align === 'right') drawX = totalW - padding;

    context.textAlign = align === 'left' ? 'left' : (align === 'right' ? 'right' : 'center');
    context.textBaseline = 'middle';

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
      const cols = Math.max(1, p.columns || 1);
      const rowsPerCol = Math.ceil(trackListItems.length / cols);
      const colW = (totalW - padding * 2) / cols;
      const rowH = fontSize * 1.5;

      context.textAlign = 'left';

      trackListItems.forEach((track, idx) => {
        const colIdx = Math.floor(idx / rowsPerCol);
        const rowIdx = idx % rowsPerCol;
        const itemX = padding + colIdx * colW + 10;
        const itemY = padding + rowIdx * rowH + (rowH / 2);

        const cleanName = (track.name || 'Track').replace(/\.[^/.]+$/, '');
        const numStr = String(idx + 1).padStart(2, '0');
        const isCurrent = highlightActive && (idx === activeTrackIdx);
        const prefix = isCurrent ? `${activeMarker} ` : '   ';
        const itemText = `${prefix}${numStr}. ${cleanName}`;
        const itemCol = isCurrent ? activeColor : color;

        drawStyledLine(itemText, itemX, itemY, mainFont, itemCol);
      });
    } else {
      const lines = String(mainText).split('\n');
      const labelSizePx = fontSize * (p.labelSize || 0.45);
      const labelH = sublabel ? (labelSizePx * 1.6) : 0;
      const textBlockH = (lines.length * fontSize * 1.25);
      const totalContentH = textBlockH + labelH;
      const startContentY = centerY - (totalContentH / 2);

      // Draw Sub-label if present ("CURRENT PLAYING")
      if (sublabel) {
        const labelFont = this.getFont(labelSizePx, p.labelBold !== false ? 'Bold' : 'Normal', fontFamily, p.labelItalic);
        const labelY = startContentY + (labelSizePx / 2);

        context.save();
        context.globalAlpha = 0.9;
        let subX = drawX;
        if (p.labelAlign === 'Left') subX = padding;
        if (p.labelAlign === 'Right') subX = totalW - padding;
        drawStyledLine(sublabel, subX, labelY, labelFont, p.labelColor || color);
        context.restore();
      }

      // Draw Main Text lines
      const textStartY = startContentY + labelH + (fontSize * 0.6);
      lines.forEach((line, lineIdx) => {
        drawStyledLine(line, drawX, textStartY + lineIdx * (fontSize * 1.25), mainFont, color);
      });
    }

    context.restore();
  }
}
