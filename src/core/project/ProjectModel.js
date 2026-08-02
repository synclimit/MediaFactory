/**
 * ProjectModel.js
 * MediaFactory V3 Production Project Model & Timeline Core (MF-4001 Architecture)
 * Single Source of Truth for timeline configuration, tracks, assets, and clips.
 */

export class ProjectModel {
  /**
   * Constructs a ProjectModel instance.
   * @param {Object} [data={}] Initial project state data
   */
  constructor(data = {}) {
    this.metadata = {
      id: data.metadata?.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      title: data.metadata?.title || 'Untitled Project',
      version: data.metadata?.version || '3.0.0',
      createdAt: data.metadata?.createdAt || new Date().toISOString(),
      updatedAt: data.metadata?.updatedAt || new Date().toISOString()
    };

    this.width = data.width || 1920;
    this.height = data.height || 1080;
    this.fps = data.fps || 30;
    this.totalFrameCount = data.totalFrameCount || 300;

    this.assets = Array.isArray(data.assets) ? [...data.assets] : [];
    this.tracks = Array.isArray(data.tracks) && data.tracks.length > 0
      ? data.tracks.map(t => this._normalizeTrack(t))
      : [
          {
            id: 'track_1',
            name: 'Audio Visualizer Track',
            type: 'visualizer',
            enabled: true,
            locked: false,
            clips: []
          }
        ];
  }

  /**
   * Computed project duration in seconds.
   * @returns {number}
   */
  get duration() {
    return this.totalFrameCount / this.fps;
  }

  /**
   * Normalizes track object structure.
   * @private
   */
  _normalizeTrack(track) {
    const trackId = track.id || `track_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      id: trackId,
      name: track.name || 'Track',
      type: track.type || 'generic',
      enabled: track.enabled ?? true,
      locked: track.locked ?? false,
      clips: Array.isArray(track.clips) ? track.clips.map(c => this._normalizeClip(c, trackId)) : []
    };
  }

  /**
   * Normalizes clip object structure matching strict MF-4001 schema.
   * @private
   */
  _normalizeClip(clip, trackId) {
    return {
      id: clip.id || `clip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      assetId: clip.assetId || null,
      trackId: clip.trackId || trackId || 'track_1',
      startFrame: typeof clip.startFrame === 'number' ? clip.startFrame : 0,
      endFrame: typeof clip.endFrame === 'number' ? clip.endFrame : this.totalFrameCount,
      offsetFrame: typeof clip.offsetFrame === 'number' ? clip.offsetFrame : 0,
      playbackRate: typeof clip.playbackRate === 'number' ? clip.playbackRate : 1.0,
      enabled: clip.enabled ?? true,
      locked: clip.locked ?? false
    };
  }

  /**
   * Adds a clip to a specific track.
   * @param {string} trackId Target track ID
   * @param {Object} clipData Clip configuration
   */
  addClip(trackId, clipData = {}) {
    const track = this.tracks.find(t => t.id === trackId);
    if (!track) {
      throw new Error(`[ProjectModel] Track '${trackId}' not found.`);
    }
    const newClip = this._normalizeClip(clipData, trackId);
    track.clips.push(newClip);
    this.metadata.updatedAt = new Date().toISOString();
    return newClip;
  }

  /**
   * Returns complete visualizer configuration extracted from project tracks/clips.
   * @returns {Object}
   */
  getVisualizerConfig() {
    const visualizerTrack = this.tracks.find(t => t.type === 'visualizer' || t.name?.toLowerCase().includes('visualizer'));
    const clipConfig = visualizerTrack?.clips?.[0]?.config || {};

    return {
      visualizerId: visualizerTrack?.visualizerId || clipConfig.visualizerId || 'bars-classic-vertical',
      shape: visualizerTrack?.shape || clipConfig.shape || 'bar',
      style: visualizerTrack?.style || clipConfig.style || 'Vertical',
      geometry: visualizerTrack?.geometry || clipConfig.geometry || {
        shape: 'bar',
        thickness: 4,
        spacing: 2,
        center: true,
        mirror: false,
        radius: 100
      },
      colors: visualizerTrack?.colors || clipConfig.colors || ['#AB55F7', '#F59E0B'],
      gradients: visualizerTrack?.gradients || clipConfig.gradients || ['#AB55F7', '#F59E0B'],
      fftGain: visualizerTrack?.fftGain ?? clipConfig.fftGain ?? 100,
      barCount: visualizerTrack?.barCount ?? clipConfig.barCount ?? 256,
      thickness: visualizerTrack?.thickness ?? clipConfig.thickness ?? 4,
      spacing: visualizerTrack?.spacing ?? clipConfig.spacing ?? 2,
      mirror: visualizerTrack?.mirror ?? clipConfig.mirror ?? false,
      center: visualizerTrack?.center ?? clipConfig.center ?? true,
      opacity: visualizerTrack?.opacity ?? clipConfig.opacity ?? 100,
      transform: visualizerTrack?.transform || clipConfig.transform || { x: 0, y: 0, scale: 1, rotation: 0 },
      blendMode: visualizerTrack?.blendMode || clipConfig.blendMode || 'normal',
      position: visualizerTrack?.position || clipConfig.position || { x: 960, y: 540 },
      size: visualizerTrack?.size || clipConfig.size || { width: 1920, height: 1080 },
      colorLeft: visualizerTrack?.colorLeft || clipConfig.colorLeft || '#AB55F7',
      colorRight: visualizerTrack?.colorRight || clipConfig.colorRight || '#F59E0B',
      ...clipConfig,
      ...visualizerTrack
    };
  }

  /**
   * Returns exact configuration options required by RenderSchedulerInstances.
   * @returns {{ fps: number, frameCount: number, width: number, height: number, visualizerConfig: Object }}
   */
  getSchedulerOptions() {
    return {
      fps: this.fps,
      frameCount: this.totalFrameCount,
      width: this.width,
      height: this.height,
      visualizerConfig: this.getVisualizerConfig()
    };
  }

  /**
   * Returns a plain JSON representation of the project model.
   * @returns {Object}
   */
  toJSONObject() {
    return {
      metadata: { ...this.metadata },
      width: this.width,
      height: this.height,
      fps: this.fps,
      totalFrameCount: this.totalFrameCount,
      duration: this.duration,
      assets: [...this.assets],
      tracks: this.tracks.map(t => ({
        ...t,
        clips: t.clips.map(c => ({ ...c }))
      }))
    };
  }

  /**
   * Creates an independent deep clone of this project model.
   * @returns {ProjectModel}
   */
  clone() {
    return new ProjectModel(this.toJSONObject());
  }
}

/**
 * Serializes a ProjectModel instance to a formatted JSON string.
 * @param {ProjectModel} projectModel Project model instance
 * @returns {string} Formatted JSON string
 */
export function saveProject(projectModel) {
  if (!(projectModel instanceof ProjectModel)) {
    throw new Error('[ProjectModel] saveProject requires a valid ProjectModel instance.');
  }
  return JSON.stringify(projectModel.toJSONObject(), null, 2);
}

/**
 * Deserializes a JSON string or plain object into a fresh ProjectModel instance.
 * @param {string|Object} jsonOrObj Serialized JSON string or object
 * @returns {ProjectModel}
 */
export function loadProject(jsonOrObj) {
  const data = typeof jsonOrObj === 'string' ? JSON.parse(jsonOrObj) : jsonOrObj;
  return new ProjectModel(data);
}
