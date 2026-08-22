/**
 * DeterministicMotionEngine.js
 * Single Source of Truth for Time-Based Deterministic Motion & Audio Reactivity.
 * Guarantees 100% mathematical identity across Live Editor Preview & Backend Offline Render.
 */

export class DeterministicMotionEngine {
  /**
   * Resolve config preset settings for dance styles
   */
  static getPresetConfig(danceStyle = 'Calm Pulse', settings = {}) {
    let style = danceStyle;
    if (style === 'Subtle Sway') style = 'Calm Pulse';
    if (style === 'Pulse') style = 'Deep Kick';
    if (style === 'Heartbeat') style = 'Rhythmic Float';
    if (style === 'Shake') style = 'Adrenaline';

    let cfg = { zoom: 0, swayX: 0, swayY: 0, rotate: 0, shake: 0 };

    if (style === 'Custom (Advanced)') {
      if (settings.motionEnZoom !== false) cfg.zoom = settings.motionValZoom !== undefined ? settings.motionValZoom : 12;
      if (settings.motionEnSwayX) cfg.swayX = settings.motionValSwayX !== undefined ? settings.motionValSwayX : 2.0;
      if (settings.motionEnSwayY) cfg.swayY = settings.motionValSwayY !== undefined ? settings.motionValSwayY : 1.2;
      if (settings.motionEnRotate) cfg.rotate = settings.motionValRotate !== undefined ? settings.motionValRotate : 1.5;
      if (settings.motionEnShake) cfg.shake = settings.motionValShake !== undefined ? settings.motionValShake : 4;
    } else if (style === 'Deep Kick') {
      cfg.zoom = 10;
    } else if (style === 'Rhythmic Float') {
      cfg.swayX = 4; cfg.swayY = 3; cfg.rotate = 2; cfg.zoom = 1;
    } else if (style === 'Adrenaline') {
      cfg.swayX = 3; cfg.swayY = 3; cfg.rotate = 3; cfg.zoom = 8; cfg.shake = 6;
    } else {
      // Default Calm Pulse
      cfg.swayX = 2; cfg.swayY = 1; cfg.zoom = 2; cfg.rotate = 0.5;
    }

    return cfg;
  }

  /**
   * Compute Background Dance Transform deterministically
   */
  static calculateBackgroundTransform(currentTimeSec = 0, settings = {}, audioState = {}) {
    const danceMode = settings.danceMode || 'Off';
    const baseScale = 1 + ((settings.backgroundZoom || 0) / 100);
    const currentHPos = settings.horizontalPosition || 0;
    const currentVPos = settings.verticalPosition || 0;

    if (danceMode === 'Off') {
      return {
        scale: baseScale,
        hPos: currentHPos,
        vPos: currentVPos,
        rotation: 0
      };
    }

    const intensity = (settings.danceIntensity !== undefined ? settings.danceIntensity : 100) / 100;
    const reactsTo = settings.danceReactsTo || 'Whole song';
    const reactLevel = settings.danceReactLevel !== undefined ? settings.danceReactLevel : 45;

    let rawVal = audioState.energy || 0.3;
    if (reactsTo === 'Bass (Low)') rawVal = audioState.bass || 0.3;
    else if (reactsTo === 'Mid') rawVal = audioState.mid || 0.3;
    else if (reactsTo === 'Treble (High)') rawVal = audioState.treble || 0.3;

    const sensitivity = reactLevel / 50;
    const power = (rawVal || 0) * sensitivity * intensity;

    const cfg = this.getPresetConfig(settings.danceStyle || 'Calm Pulse', settings);

    // Pre-scale compensation for panning/rotation
    const maxPan = Math.max(cfg.swayX, cfg.swayY) + cfg.shake;
    let scaleCompensation = 1.0;
    if (maxPan > 0 || cfg.rotate > 0) {
      const panScale = 1 + (maxPan * 2.5 / 100);
      const rotScale = 1 + (cfg.rotate * 0.015);
      scaleCompensation = panScale * rotScale;
    }

    const t = currentTimeSec || 0;
    const zoom = power * cfg.zoom * 0.01;
    const swayX = Math.sin(t * 1.2) * cfg.swayX * power;
    const swayY = Math.cos(t * 0.9) * cfg.swayY * power;
    const rotate = Math.sin(t * 0.8) * cfg.rotate * power;

    const shakeX = (Math.sin(t * 3.1) * 0.5 + Math.cos(t * 2.3) * 0.5) * cfg.shake * power;
    const shakeY = (Math.cos(t * 2.7) * 0.5 + Math.sin(t * 3.4) * 0.5) * cfg.shake * power;

    return {
      scale: baseScale * scaleCompensation + zoom,
      hPos: currentHPos + swayX + shakeX,
      vPos: currentVPos + swayY + shakeY,
      rotation: rotate
    };
  }

  /**
   * Compute Object Motion & Beat Reactivity deterministically
   */
  static calculateObjectTransform(currentTimeSec = 0, el = {}, audioState = {}) {
    let scaleAdd = 0;
    let swayX = 0;
    let swayY = 0;
    let rotate = 0;

    const t = currentTimeSec || 0;

    if (el.beatZoom) {
      const intensity = (el.danceIntensity !== undefined ? el.danceIntensity : 100) / 100;
      const reactLevel = el.danceReactLevel !== undefined ? el.danceReactLevel : 45;
      const reactsTo = el.danceReactsTo || 'Bass (Low)';

      let rawVal = audioState.bass || 0.3;
      if (reactsTo === 'Mid') rawVal = audioState.mid || 0.3;
      else if (reactsTo === 'Treble (High)') rawVal = audioState.treble || 0.3;
      else if (reactsTo === 'Whole song') rawVal = audioState.energy || 0.3;

      const power = (rawVal || 0) * (reactLevel / 50) * intensity;
      const cfg = this.getPresetConfig(el.danceStyle || 'Calm Pulse', el);

      const zoomBoost = 3.0;
      const panBoost = 20.0;

      scaleAdd += power * cfg.zoom * 0.01 * zoomBoost;
      swayX += Math.sin(t * 1.2) * cfg.swayX * power * panBoost;
      swayY += Math.cos(t * 0.9) * cfg.swayY * power * panBoost;
      rotate += Math.sin(t * 0.8) * cfg.rotate * power * 2.0;

      const shakeX = (Math.sin(t * 3.1) * 0.5 + Math.cos(t * 2.3) * 0.5) * cfg.shake * power * panBoost;
      const shakeY = (Math.cos(t * 2.7) * 0.5 + Math.sin(t * 3.4) * 0.5) * cfg.shake * power * panBoost;

      swayX += shakeX;
      swayY += shakeY;
    }

    if (el.beatPump) {
      const pumpVal = (audioState.kick ? 0.4 : 0) + (audioState.bass || 0) * 0.3 + (audioState.energy || 0) * 0.15;
      const intensity = el.pumpIntensity !== undefined ? el.pumpIntensity : 1.5;
      scaleAdd += pumpVal * 0.04 * intensity;
    }

    const baseScale = el.scale !== undefined ? el.scale : 1;
    const baseRotation = el.rotation || 0;

    return {
      finalScale: baseScale + scaleAdd,
      finalRotation: baseRotation + rotate,
      swayX,
      swayY
    };
  }
}
