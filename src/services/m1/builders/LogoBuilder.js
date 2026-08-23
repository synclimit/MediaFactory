import { AssetResolver } from './AssetResolver.js';

export class LogoBuilder {
  static async build(job) {
    const logoEffect = job.effects?.logo;
    if (!logoEffect || !logoEffect.enabled) return null;
    
    let assetPath;
    try {
      assetPath = await AssetResolver.resolve(logoEffect.asset || 'watermark.png');
    } catch (err) {
      console.warn(`[LogoBuilder] Warning: ${err.message}. Skipping logo effect.`);
      return null;
    }
    
    // Default position: Bottom Right
    const position = logoEffect.position || 'bottom-right';
    let xStr = 'W-w-30';
    let yStr = 'H-h-30';
    
    if (position === 'top-left') { xStr = '30'; yStr = '30'; }
    if (position === 'top-right') { xStr = 'W-w-30'; yStr = '30'; }
    if (position === 'bottom-left') { xStr = '30'; yStr = 'H-h-30'; }
    if (position === 'bottom-center') { xStr = '(W-w)/2'; yStr = 'H-h-30'; }
    
    return { 
      inputs: [{ path: assetPath, args: [['-loop', '1']] }],
      // Pre-filter: Scale down large logos to clean corner badge (~130px max)
      preFilter: 'scale=130:-1,format=yuva420p',
      filter: `overlay=x=${xStr}:y=${yStr}:shortest=0` 
    };
  }
}
