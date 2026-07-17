import { AssetResolver } from './AssetResolver.js';

export class FrameBuilder {
  static async build(job) {
    const overlayEffect = job.effects?.overlay;
    if (!overlayEffect || !overlayEffect.enabled) return null;
    
    // Resolve asset path via Workspace Integration
    const assetPath = await AssetResolver.resolve(overlayEffect.asset || 'frame.png');
    
    // Default position: Top Left
    const position = overlayEffect.position || 'top-left';
    let xStr = '0';
    let yStr = '0';
    
    if (position === 'top-right') { xStr = 'W-w'; yStr = '0'; }
    if (position === 'bottom-left') { xStr = '0'; yStr = 'H-h'; }
    if (position === 'bottom-right') { xStr = 'W-w'; yStr = 'H-h'; }
    if (position === 'center') { xStr = '(W-w)/2'; yStr = '(H-h)/2'; }
    
    return { 
      inputs: [{ path: assetPath, args: [['-loop', '1']] }],
      filter: `overlay=x=${xStr}:y=${yStr}:shortest=0` 
    };
  }
}
