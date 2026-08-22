/**
 * UnifiedSceneRenderer.js
 * MediaFactory Single Engine Pure Canvas 2D Renderer
 * Single Source of Truth for rendering the entire composition frame (Background, Particles, Speaker, Visualizers, Text, Subtitles, Playlists).
 * Guarantees 100% visual parity between Live Editor Preview (Frontend) and Video Export (Backend).
 */

import { VisualizerV5Core } from '../../visualizers/v5/VisualizerV5Core.js';
import { VisualizerV5Audio } from '../../visualizers/v5/VisualizerV5Audio.js';
import { DeterministicMotionEngine } from '../audio/DeterministicMotionEngine.js';
import { ParticleCore } from '../particles/ParticleCore.js';

export class UnifiedSceneRenderer {
  /**
   * Main Frame Renderer for Entire Scene Composition
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context (browser or node-canvas)
   * @param {number} targetWidth - Stage width (e.g. 1920)
   * @param {number} targetHeight - Stage height (e.g. 1080)
   * @param {number} timestamp - Current frame time in seconds
   * @param {Object} options - Scene options: { objects, bgImage, m3BgPool, audioTracks, renderMode, pcmData, audioState }
   */
  static async renderFrame(ctx, targetWidth, targetHeight, timestamp = 0, options = {}) {
    if (!ctx || targetWidth <= 0 || targetHeight <= 0) return;

    const {
      objects = [],
      bgImage = null,
      m3BgPool = [],
      audioTracks = [],
      renderMode = 'normal',
      pcmData = null,
      overrideAudioState = null
    } = options;

    const scaleX = targetWidth / 1920;
    const scaleY = targetHeight / 1080;

    // 1. Resolve Audio State (Unified Single Source of Truth)
    let audioState = overrideAudioState;
    if (!audioState) {
      audioState = VisualizerV5Audio.getAudioState(timestamp, renderMode, {}, null, true);
    }

    // Clear Stage
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    // 2. Render Background Image with Deterministic Motion Dance
    const mainBgObj = objects.find(o => o && o.type === 'background') || (m3BgPool && m3BgPool[0]) || null;
    const bgSettings = (m3BgPool && m3BgPool[0] && m3BgPool[0].settings) || (mainBgObj && mainBgObj.settings) || {};

    if (bgImage) {
      const bgTf = DeterministicMotionEngine.calculateBackgroundTransform(timestamp, bgSettings, audioState);

      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      if (bgTf.rotation) ctx.rotate((bgTf.rotation * Math.PI) / 180);
      if (bgTf.scale && bgTf.scale !== 1) ctx.scale(bgTf.scale, bgTf.scale);

      const shiftX = (bgTf.hPos / 100) * targetWidth;
      const shiftY = (bgTf.vPos / 100) * targetHeight;
      ctx.translate(shiftX, shiftY);

      ctx.drawImage(bgImage, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
      ctx.restore();

      // Dark Overlay / Vignette
      const darkness = bgSettings.overlayDarkness !== undefined ? bgSettings.overlayDarkness : 30;
      if (darkness > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(0,0,0,${darkness / 100})`;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.restore();
      }
    } else {
      // Default dark stage background
      ctx.save();
      ctx.fillStyle = '#12131a';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.restore();
    }

    // Sort visible scene objects by layer
    const validObjects = objects
      .filter(o => o && o.visible !== false)
      .sort((a, b) => (a.layer || 0) - (b.layer || 0));

    // 3. Render Particles
    const particleObjs = validObjects.filter(o => o && (o.type === 'particle' || o.type === 'particles'));
    for (const pObj of particleObjs) {
      ParticleCore.renderFrame(ctx, targetWidth, targetHeight, timestamp, pObj, audioState);
    }

    // 4. Render Procedural Speaker
    const speakerObjs = validObjects.filter(o => o && (o.type === 'procedural-speaker' || o.mediaType === 'procedural'));
    for (const spk of speakerObjs) {
      ctx.save();
      const scx = this.parseCoord(spk.x, 1920, 960) * scaleX;
      const scy = this.parseCoord(spk.y, 1080, 540) * scaleY;
      const spkColor = spk.color || '#00ffcc';
      const baseRadius = 80 * scaleX;
      const pulse = baseRadius * (1 + (audioState.bass || 0) * 0.35);

      ctx.strokeStyle = spkColor;
      ctx.lineWidth = 3 * scaleX;
      ctx.globalAlpha = 0.6 + (audioState.bass || 0) * 0.4;
      ctx.beginPath();
      ctx.arc(scx, scy, pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(scx, scy, pulse * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Render Visualizers
    const vizObjects = validObjects.filter(o => 
      o.type === 'visualizer' || o.type === 'visualizer2' || o.type === 'visualizer3' ||
      o.type === 'visualizer4' || o.type === 'visualizer5' || o.type === 'spectrum' ||
      o.type === 'audio-visualizer' || o.visualizerId
    );

    for (const ov of vizObjects) {
      let rawW = this.parseCoord(ov.width, 1920, 600);
      let rawH = this.parseCoord(ov.height, 1080, 300);
      let rawCx = this.parseCoord(ov.x, 1920, 960);
      let rawCy = this.parseCoord(ov.y, 1080, 540);

      if (ov.beatZoom || ov.beatPump) {
        const objTf = DeterministicMotionEngine.calculateObjectTransform(timestamp, ov, audioState);
        rawCx += objTf.swayX;
        rawCy += objTf.swayY;
      }

      const w = Math.round(rawW * scaleX);
      const h = Math.round(rawH * scaleY);
      const cx = Math.round(rawCx * scaleX);
      const cy = Math.round(rawCy * scaleY);

      const topLeftX = Math.round(cx - (w / 2));
      const topLeftY = Math.round(cy - (h / 2));

      ctx.save();
      ctx.translate(topLeftX, topLeftY);

      const v3Config = {
        colorLeft: ov.colorLeft || ov.primaryColor || '#AB55F7',
        colorRight: ov.colorRight || ov.secondaryColor || '#F59E0B',
        colorMid: ov.colorMid || '#06B6D4',
        colorMode: ov.colorMode || '2 Gradient',
        barCount: parseInt(ov.barCount) || 64,
        thickness: parseInt(ov.thickness) || 4,
        ...ov
      };

      const modeStr = (ov.mode || ov.pluginId || ov.visualizerId || ov.name || '').toLowerCase();
      let pluginIdMode = 'spectrum-bars';
      if (modeStr.includes('wave') || modeStr.includes('cyberpunk')) pluginIdMode = 'cyberpunk-waveform';
      else if (modeStr.includes('particle') || modeStr.includes('orbit')) pluginIdMode = 'particle-orbit';
      else if (modeStr.includes('circular') || modeStr.includes('circle') || modeStr.includes('pulse')) pluginIdMode = 'circular-pulse';

      VisualizerV5Core.renderFrame(ctx, w, h, audioState, { ...v3Config, mode: pluginIdMode });

      ctx.restore();
    }

    // 6. Render Text, Playlists, Social Widgets & Subtitles
    const textObjs = validObjects.filter(o => 
      o.type === 'text' || o.type === 'playlist' || o.type === 'track_list_column' ||
      o.type === 'social-widget' || o.type === 'subtitle'
    );

    let currentTrackTitle = audioTracks.length > 0 ? (audioTracks[0].title || audioTracks[0].filename || 'Track') : '';
    let currentTrackIdx = 0;
    if (audioTracks.length > 0) {
      let acc = 0;
      for (let i = 0; i < audioTracks.length; i++) {
        const trk = audioTracks[i];
        const dur = trk.durationSec || trk.duration || 180;
        if (timestamp >= acc && timestamp < acc + dur) {
          currentTrackTitle = trk.title || trk.filename || trk.name || 'Track';
          currentTrackIdx = i;
          break;
        }
        acc += dur;
      }
    }

    for (const txtObj of textObjs) {
      const objTf = DeterministicMotionEngine.calculateObjectTransform(timestamp, txtObj, audioState);
      let rawCx = this.parseCoord(txtObj.x, 1920, 960);
      let rawCy = this.parseCoord(txtObj.y, 1080, 540);

      rawCx += objTf.swayX;
      rawCy += objTf.swayY;

      const tx = Math.round(rawCx * scaleX);
      const ty = Math.round(rawCy * scaleY);

      const fontSize = Math.max(12, Math.round((txtObj.fontSize || 32) * scaleY));
      const fontFamily = txtObj.fontFamily || 'Inter, sans-serif';
      const weightMap = { 'Light': 300, 'Normal': 400, 'Semi-Bold': 600, 'Bold': 700, 'Extra-Bold': 800 };
      const fontWeight = txtObj.isBold ? 700 : (weightMap[txtObj.fontWeight] || txtObj.fontWeight || 'bold');
      const fontStyle = txtObj.isItalic ? 'italic' : 'normal';

      ctx.save();
      ctx.translate(tx, ty);
      if (objTf.finalRotation) ctx.rotate((objTf.finalRotation * Math.PI) / 180);
      if (objTf.finalScale && objTf.finalScale !== 1) ctx.scale(objTf.finalScale, objTf.finalScale);

      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = txtObj.color || txtObj.primaryColor || '#ffffff';

      if (txtObj.glow > 0) {
        ctx.shadowColor = txtObj.glowColor || txtObj.color || '#ffffff';
        ctx.shadowBlur = Math.round(txtObj.glow * scaleX);
      }

      if (txtObj.type === 'playlist' || txtObj.type === 'track_list_column') {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const limit = Math.min(10, audioTracks.length);
        const itemSpacing = fontSize + 8;
        for (let i = 0; i < limit; i++) {
          const trk = audioTracks[i];
          const itemTitle = `${i + 1}. ${trk.title || trk.filename || 'Track'}`;
          ctx.fillStyle = (i === currentTrackIdx) ? '#f97316' : '#cccccc';
          ctx.fillText(itemTitle, 0, (i - limit / 2) * itemSpacing);
        }
        ctx.restore();
        continue;
      }

      let str = txtObj.text || txtObj.name || '';
      const isTitleType = txtObj.type === 'text' && (txtObj.textType === 'title' || txtObj.bindToCurrentTrack || str.includes('{current_track}') || str.toLowerCase().includes('playing') || str.toLowerCase().includes('current'));
      const hasSubLabel = isTitleType && txtObj.showLabel !== false;

      if (isTitleType) {
        str = currentTrackTitle || str.replace('{current_track}', currentTrackTitle);
      } else if (txtObj.type === 'subtitle') {
        str = txtObj.text || txtObj.currentCue || '';
      }

      const align = (txtObj.align || 'center').toLowerCase();
      ctx.textAlign = align;

      // 1:1 Block Alignment
      const labelFontSize = Math.round(fontSize * 0.40);
      const labelGap = Math.round(fontSize * 0.20);
      const totalBoxHeight = hasSubLabel ? (labelFontSize + labelGap + fontSize) : fontSize;
      const boxTop = - (totalBoxHeight / 2);

      if (hasSubLabel) {
        ctx.save();
        ctx.font = `bold ${labelFontSize}px ${fontFamily}`;
        ctx.fillStyle = txtObj.labelColor || txtObj.color || '#ffffff';
        ctx.globalAlpha = 0.7;
        ctx.textBaseline = 'top';
        ctx.fillText('CURRENT PLAYING', 0, boxTop);
        ctx.restore();
      }

      if (str) {
        const titleY = hasSubLabel ? (boxTop + labelFontSize + labelGap) : boxTop;
        ctx.textBaseline = 'top';
        if (txtObj.stroke > 0) {
          ctx.strokeStyle = txtObj.strokeColor || '#000000';
          ctx.lineWidth = Math.round(txtObj.stroke * scaleX);
          ctx.strokeText(str, 0, titleY);
        }
        ctx.fillText(str, 0, titleY);
      }
      ctx.restore();
    }
  }

  static parseCoord(val, stageDim, defaultVal) {
    if (val === undefined || val === null || val === '') return defaultVal;
    const str = String(val).trim();
    if (str.endsWith('%')) {
      const pct = parseFloat(str);
      return isNaN(pct) ? defaultVal : (pct / 100) * stageDim;
    }
    const num = parseFloat(str);
    return isNaN(num) ? defaultVal : num;
  }
}
