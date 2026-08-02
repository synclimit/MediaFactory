const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const RenderStrategy = require('./RenderStrategy');

class MediaCompatibilityValidator {
  /**
   * Probe media metadata using ffprobe
   * @param {string} filePath 
   * @returns {Promise<Object>}
   */
  static async probeMedia(filePath) {
    try {
      const cmd = `ffprobe -v error -show_entries format=format_name,duration:stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,channels,bits_per_raw_sample -of json "${filePath}"`;
      const { stdout } = await execAsync(cmd);
      const data = JSON.parse(stdout);
      
      const format = data.format || {};
      const streams = data.streams || [];
      const videoStream = streams.find(s => s.codec_type === 'video');
      const audioStream = streams.find(s => s.codec_type === 'audio');

      let fps = 30;
      if (videoStream && videoStream.r_frame_rate) {
        const parts = videoStream.r_frame_rate.split('/');
        if (parts.length === 2 && parseFloat(parts[1]) > 0) {
          fps = Math.round(parseFloat(parts[0]) / parseFloat(parts[1]));
        } else {
          fps = Math.round(parseFloat(videoStream.r_frame_rate));
        }
      }

      return {
        formatName: format.format_name || '',
        duration: parseFloat(format.duration || 0),
        hasVideo: !!videoStream,
        hasAudio: !!audioStream,
        videoCodec: videoStream ? videoStream.codec_name : null,
        width: videoStream ? parseInt(videoStream.width) : 0,
        height: videoStream ? parseInt(videoStream.height) : 0,
        fps,
        pixFmt: videoStream ? videoStream.pix_fmt : null,
        audioCodec: audioStream ? audioStream.codec_name : null,
        sampleRate: audioStream ? parseInt(audioStream.sample_rate) : 0,
        channels: audioStream ? parseInt(audioStream.channels) : 0
      };
    } catch (err) {
      console.warn('[MediaCompatibilityValidator] ffprobe failed:', err.message);
      return { hasVideo: false, hasAudio: false, error: err.message };
    }
  }

  /**
   * Validates video compatibility for Stream Copy (-c:v copy)
   * @param {string} sourcePath 
   * @param {Object} targetSettings { targetWidth, targetHeight, fps, hasOverlays }
   * @returns {Promise<Object>} Detailed compatibility report
   */
  static async validateVideoCompatibility(sourcePath, targetSettings = {}) {
    const probe = await this.probeMedia(sourcePath);
    const trace = [];
    
    const targetW = targetSettings.targetWidth || 1920;
    const targetH = targetSettings.targetHeight || 1080;
    const targetFps = parseInt(targetSettings.fps) || 30;
    const hasOverlays = !!targetSettings.hasOverlays;

    if (!probe.hasVideo) {
      trace.push('Has Video Stream: NO');
      return {
        level: 'INCOMPATIBLE',
        decision: RenderStrategy.FULL_ENCODE,
        confidence: 0,
        decisionTrace: trace,
        reason: 'Source file contains no video stream.',
        probe
      };
    }

    trace.push(`Has Video Stream: YES (${probe.videoCodec})`);

    // 1. Overlay Present Check
    if (hasOverlays) {
      trace.push('Overlay Present: YES (Pixel modification required)');
      return {
        level: 'PARTIALLY_COMPATIBLE',
        decision: RenderStrategy.MINIMAL_ENCODE,
        confidence: 85,
        decisionTrace: [...trace, '-> MINIMAL_ENCODE (Pre-encode short clip with overlays)'],
        reason: 'Overlays modify pixels, requiring minimal pre-encoding of master clip.',
        probe
      };
    }
    trace.push('Overlay Present: NO');

    // 2. Resize Required Check
    const widthMatch = probe.width === targetW;
    const heightMatch = probe.height === targetH;
    if (!widthMatch || !heightMatch) {
      trace.push(`Resize Required: YES (Source ${probe.width}x${probe.height} vs Target ${targetW}x${targetH})`);
      return {
        level: 'INCOMPATIBLE',
        decision: RenderStrategy.FULL_ENCODE,
        confidence: 0,
        decisionTrace: [...trace, '-> FULL_ENCODE (Scale filter required)'],
        reason: `Video dimensions (${probe.width}x${probe.height}) differ from target (${targetW}x${targetH}).`,
        probe
      };
    }
    trace.push(`Resize Required: NO (Matches ${targetW}x${targetH})`);

    // 3. FPS Conversion Check
    const fpsMatch = Math.abs(probe.fps - targetFps) <= 1;
    if (!fpsMatch) {
      trace.push(`FPS Conversion: YES (Source ${probe.fps} FPS vs Target ${targetFps} FPS)`);
      return {
        level: 'PARTIALLY_COMPATIBLE',
        decision: RenderStrategy.MINIMAL_ENCODE,
        confidence: 70,
        decisionTrace: [...trace, '-> MINIMAL_ENCODE (Framerate conversion)'],
        reason: `Video framerate (${probe.fps}) differs from target (${targetFps}).`,
        probe
      };
    }
    trace.push(`FPS Conversion: NO (Matches ${targetFps} FPS)`);

    // 4. Codec Compatibility Check
    const codecOk = probe.videoCodec === 'h264';
    if (!codecOk) {
      trace.push(`Codec Compatible: NO (Source codec is ${probe.videoCodec})`);
      return {
        level: 'INCOMPATIBLE',
        decision: RenderStrategy.FULL_ENCODE,
        confidence: 0,
        decisionTrace: [...trace, '-> FULL_ENCODE (Re-encode to H.264 required)'],
        reason: `Codec ${probe.videoCodec} is not native H.264 MP4.`,
        probe
      };
    }
    trace.push('Codec Compatible: YES (H.264)');

    // 5. Pixel Format Compatibility Check
    const pixFmtOk = !probe.pixFmt || probe.pixFmt === 'yuv420p';
    if (!pixFmtOk) {
      trace.push(`Pixel Format Compatible: NO (${probe.pixFmt})`);
      return {
        level: 'PARTIALLY_COMPATIBLE',
        decision: RenderStrategy.FULL_ENCODE,
        confidence: 50,
        decisionTrace: [...trace, '-> FULL_ENCODE (Pixel format conversion)'],
        reason: `Pixel format ${probe.pixFmt} requires conversion to yuv420p.`,
        probe
      };
    }
    trace.push('Pixel Format Compatible: YES (yuv420p)');

    // ALL CHECKS PASSED -> STREAM_COPY!
    trace.push('Container Compatible: YES (MP4)');
    trace.push('-> STREAM_COPY (-c:v copy)');

    return {
      level: 'COMPATIBLE',
      decision: RenderStrategy.STREAM_COPY,
      confidence: 100,
      decisionTrace: trace,
      reason: 'No video transformation required. Direct stream copy enabled.',
      probe
    };
  }

  /**
   * Validates audio compatibility for Stream Copy (-c:a copy)
   * @param {string} sourcePath 
   * @param {string} targetContainer 
   * @returns {Promise<Object>} Detailed compatibility report
   */
  static async validateAudioCompatibility(sourcePath, targetContainer = 'mp4') {
    const probe = await this.probeMedia(sourcePath);
    const trace = [];

    if (!probe.hasAudio) {
      trace.push('Has Audio Stream: NO');
      return {
        level: 'INCOMPATIBLE',
        decision: RenderStrategy.FULL_ENCODE,
        confidence: 0,
        decisionTrace: trace,
        reason: 'Source file contains no audio stream.',
        probe
      };
    }

    trace.push(`Has Audio Stream: YES (${probe.audioCodec})`);

    const compatibleCodecs = ['aac', 'mp3'];
    const isCodecCompatible = compatibleCodecs.includes(probe.audioCodec);

    if (isCodecCompatible) {
      trace.push(`Audio Codec Compatible with ${targetContainer.toUpperCase()}: YES (${probe.audioCodec})`);
      trace.push('-> STREAM_COPY (-c:a copy)');
      return {
        level: 'COMPATIBLE',
        decision: RenderStrategy.STREAM_COPY,
        confidence: 100,
        decisionTrace: trace,
        reason: `Audio codec ${probe.audioCodec} is fully compatible with container. Direct stream copy enabled.`,
        probe
      };
    } else {
      trace.push(`Audio Codec Compatible: NO (${probe.audioCodec})`);
      trace.push('-> FULL_ENCODE (Re-encode audio to AAC)');
      return {
        level: 'INCOMPATIBLE',
        decision: RenderStrategy.FULL_ENCODE,
        confidence: 0,
        decisionTrace: trace,
        reason: `Audio codec ${probe.audioCodec} requires re-encoding to AAC.`,
        probe
      };
    }
  }
}

module.exports = MediaCompatibilityValidator;
