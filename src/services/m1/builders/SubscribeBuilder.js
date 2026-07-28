import { AssetResolver } from './AssetResolver.js';

export class SubscribeBuilder {
  static async build(job) {
    const subscribeEffect = job.effects?.subscribe;
    if (!subscribeEffect || !subscribeEffect.enabled) return null;
    
    let assetPath;
    try {
      assetPath = await AssetResolver.resolve(subscribeEffect.asset || 'subscribe.webm');
    } catch (err) {
      console.warn(`[SubscribeBuilder] Warning: ${err.message}. Skipping subscribe effect.`);
      return null;
    }
    
    const position = subscribeEffect.position || 'center';
    
    // Position parsing
    let xStr = '(W-w)/2';
    let yStr = 'H-h-50'; // Default bottom center
    
    if (position === 'top-left') { xStr = '50'; yStr = '50'; }
    if (position === 'top-right') { xStr = 'W-w-50'; yStr = '50'; }
    if (position === 'bottom-left') { xStr = '50'; yStr = 'H-h-50'; }
    if (position === 'bottom-right') { xStr = 'W-w-50'; yStr = 'H-h-50'; }
    if (position === 'center') { xStr = '(W-w)/2'; yStr = '(H-h)/2'; }
    
    return { 
      // Removed -stream_loop -1 so it only plays once
      inputs: [{ path: assetPath, args: [] }],
      // Use eof_action=pass so the overlay disappears when the short animation finishes
      filter: `overlay=x=${xStr}:y=${yStr}:eof_action=pass`
    };
  }
}
