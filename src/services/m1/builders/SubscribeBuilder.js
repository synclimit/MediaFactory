import { AssetResolver } from './AssetResolver.js';

export class SubscribeBuilder {
  static async build(job) {
    const subscribeEffect = job.effects?.subscribe;
    if (!subscribeEffect || !subscribeEffect.enabled) return null;
    
    // Resolve asset path
    const assetPath = await AssetResolver.resolve(subscribeEffect.asset || 'subscribe.webm');
    
    // Default config or consume from payload
    const minDelay = subscribeEffect.minDelay || 10;
    const maxDelay = subscribeEffect.maxDelay || 30;
    const duration = subscribeEffect.duration || 10;
    const position = subscribeEffect.position || 'bottom-center';
    
    // Generate random appearance timing (e.g. interval)
    // We'll calculate a fixed interval for this render job based on random delay
    const interval = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    
    // Position parsing
    let xStr = '(W-w)/2';
    let yStr = 'H-h-50'; // Default bottom center
    
    if (position === 'top-left') { xStr = '50'; yStr = '50'; }
    if (position === 'top-right') { xStr = 'W-w-50'; yStr = '50'; }
    if (position === 'bottom-left') { xStr = '50'; yStr = 'H-h-50'; }
    if (position === 'bottom-right') { xStr = 'W-w-50'; yStr = 'H-h-50'; }
    
    return { 
      inputs: [{ path: assetPath, args: [['-stream_loop', '-1']] }],
      // mod(t, interval+duration) < duration shows it for 'duration' secs every 'interval+duration' secs
      filter: `overlay=x=${xStr}:y=${yStr}:enable='lt(mod(t\\,${interval+duration})\\,${duration})'`
    };
  }
}
