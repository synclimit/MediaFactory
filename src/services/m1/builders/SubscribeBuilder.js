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
    
    // Position parsing with safe 30-40px screen margins
    let xStr = '(W-w)/2';
    let yStr = 'H-h-40'; // Default bottom center
    
    if (position === 'top-left') { xStr = '30'; yStr = '30'; }
    if (position === 'top-right') { xStr = 'W-w-30'; yStr = '30'; }
    if (position === 'bottom-left') { xStr = '30'; yStr = 'H-h-40'; }
    if (position === 'bottom-right') { xStr = 'W-w-30'; yStr = 'H-h-40'; }
    if (position === 'center' || position === 'bottom-center') { xStr = '(W-w)/2'; yStr = 'H-h-40'; }
    
    return { 
      inputs: [{ path: assetPath, args: [] }],
      // Pre-filter: Scale down to sleek banner (~340px max), remove green screen, preserve alpha transparency
      preFilter: 'scale=340:-1,colorkey=0x00FF00:0.32:0.1,format=yuva420p',
      // Overlay with eof_action=pass so animation cleanly disappears after playing once
      filter: `overlay=x=${xStr}:y=${yStr}:eof_action=pass`
    };
  }
}
