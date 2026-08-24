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
    
    // Default position: Top Left (1)
    const position = watermarkEffect.position || 'top-left';
    let xStr = '10';
    let yStr = '10';
    
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
      // Pre-filter: Mini corner watermark (~55px max) with 70% opacity
      preFilter: 'scale=55:-1,format=yuva420p,colorchannelmixer=aa=0.70',
      filter: `overlay=x=${xStr}:y=${yStr}:shortest=0` 
    };
  }
}
