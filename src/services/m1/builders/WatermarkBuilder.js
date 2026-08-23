import { AssetResolver } from './AssetResolver.js';

export class WatermarkBuilder {
  static async build(job) {
    const watermarkEffect = job.effects?.watermark;
    if (!watermarkEffect || !watermarkEffect.enabled) return null;
    
    let assetPath;
    try {
      assetPath = await AssetResolver.resolve(watermarkEffect.asset || 'watermark.png');
    } catch (err) {
      console.warn(`[WatermarkBuilder] Warning: ${err.message}. Skipping watermark effect.`);
      return null;
    }
    
    // Default position: Top Left
    const position = watermarkEffect.position || 'top-left';
    let xStr = '30';
    let yStr = '30';
    
    if (position === 'top-right') { xStr = 'W-w-30'; yStr = '30'; }
    if (position === 'bottom-left') { xStr = '30'; yStr = 'H-h-30'; }
    if (position === 'bottom-right') { xStr = 'W-w-30'; yStr = 'H-h-30'; }
    if (position === 'bottom-center') { xStr = '(W-w)/2'; yStr = 'H-h-30'; }
    if (position === 'center') { xStr = '(W-w)/2'; yStr = '(H-h)/2'; }
    
    return { 
      inputs: [{ path: assetPath, args: [['-loop', '1']] }],
      // Pre-filter: Scale down to subtle corner watermark (~120px max) with 75% opacity
      preFilter: 'scale=120:-1,format=yuva420p,colorchannelmixer=aa=0.75',
      filter: `overlay=x=${xStr}:y=${yStr}:shortest=0` 
    };
  }
}
