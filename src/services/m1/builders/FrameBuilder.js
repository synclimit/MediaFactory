import { AssetResolver } from './AssetResolver.js';

export class FrameBuilder {
  static async build(job) {
    const overlayEffect = job.effects?.overlay;
    if (!overlayEffect || !overlayEffect.enabled) return null;
    
    let assetPath;
    try {
      assetPath = await AssetResolver.resolve(overlayEffect.asset || 'frame.png');
    } catch (err) {
      console.warn(`[FrameBuilder] Warning: ${err.message}. Skipping overlay effect.`);
      return null;
    }
    
    // Default position: Bottom Left (7)
    const position = overlayEffect.position || 'bottom-left';
    let xStr = '10';
    let yStr = 'H-h-10';
    
    if (position === 'top-left' || position === '1') { xStr = '10'; yStr = '10'; }
    else if (position === 'top-center' || position === '2') { xStr = '(W-w)/2'; yStr = '10'; }
    else if (position === 'top-right' || position === '3') { xStr = 'W-w-10'; yStr = '10'; }
    else if (position === 'middle-left' || position === '4') { xStr = '10'; yStr = '(H-h)/2'; }
    else if (position === 'center' || position === '5') { xStr = '(W-w)/2'; yStr = '(H-h)/2'; }
    else if (position === 'middle-right' || position === '6') { xStr = 'W-w-10'; yStr = '(H-h)/2'; }
    else if (position === 'bottom-left' || position === '7') { xStr = '10'; yStr = 'H-h-10'; }
    else if (position === 'bottom-center' || position === '8') { xStr = '(W-w)/2'; yStr = 'H-h-10'; }
    else if (position === 'bottom-right' || position === '9') { xStr = 'W-w-10'; yStr = 'H-h-10'; }
    
    return { 
      inputs: [{ path: assetPath, args: [['-loop', '1']] }],
      // Pre-filter: Mini corner badge (~65px max) for zero video obstruction
      preFilter: 'scale=65:-1,format=yuva420p',
      filter: `overlay=x=${xStr}:y=${yStr}:shortest=0` 
    };
  }
}
