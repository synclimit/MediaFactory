import { AssetResolver } from './AssetResolver.js';

export class LogoBuilder {
  static async build(job) {
    const logoEffect = job.effects?.logo;
    if (!logoEffect || !logoEffect.enabled) return null;
    
    // Resolve asset path via Workspace Integration
    const assetPath = await AssetResolver.resolve(logoEffect.asset || 'watermark.png');
    
    // Default position: Bottom Right
    const position = logoEffect.position || 'bottom-right';
    let xStr = 'W-w-50';
    let yStr = 'H-h-50';
    
    if (position === 'top-left') { xStr = '50'; yStr = '50'; }
    if (position === 'top-right') { xStr = 'W-w-50'; yStr = '50'; }
    if (position === 'bottom-left') { xStr = '50'; yStr = 'H-h-50'; }
    if (position === 'bottom-center') { xStr = '(W-w)/2'; yStr = 'H-h-50'; }
    
    return { 
      inputs: [{ path: assetPath, args: [['-loop', '1']] }],
      filter: `overlay=x=${xStr}:y=${yStr}:shortest=0` 
    };
  }
}
