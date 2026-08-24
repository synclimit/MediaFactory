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
    
    // Default position: Bottom Center (8)
    const position = subscribeEffect.position || 'bottom-center';
    let xStr = '(W-w)/2';
    let yStr = 'H-h-8';
    
    if (position === 'top-left' || position === '1') { xStr = '10'; yStr = '10'; }
    else if (position === 'top-center' || position === '2') { xStr = '(W-w)/2'; yStr = '10'; }
    else if (position === 'top-right' || position === '3') { xStr = 'W-w-10'; yStr = '10'; }
    else if (position === 'middle-left' || position === '4') { xStr = '10'; yStr = '(H-h)/2'; }
    else if (position === 'center' || position === '5') { xStr = '(W-w)/2'; yStr = '(H-h)/2'; }
    else if (position === 'middle-right' || position === '6') { xStr = 'W-w-10'; yStr = '(H-h)/2'; }
    else if (position === 'bottom-left' || position === '7') { xStr = '10'; yStr = 'H-h-8'; }
    else if (position === 'bottom-center' || position === '8') { xStr = '(W-w)/2'; yStr = 'H-h-8'; }
    else if (position === 'bottom-right' || position === '9') { xStr = 'W-w-10'; yStr = 'H-h-8'; }
    
    const isMp4OrMov = assetPath.toLowerCase().endsWith('.mp4') || assetPath.toLowerCase().endsWith('.mov');
    
    // Pre-filter: For full 16:9 green-screen MP4, crop the button strip (bottom 28%), remove green cleanly, scale to small 140px
    const preFilter = isMp4OrMov
      ? 'crop=in_w:in_h*0.28:0:in_h*0.70,colorkey=0x00FF00:0.38:0.15,despill=type=green,format=yuva420p,scale=140:-1'
      : 'colorkey=0x00FF00:0.38:0.15,format=yuva420p,scale=140:-1';

    return { 
      inputs: [{ path: assetPath, args: [] }],
      preFilter,
      // Overlay with eof_action=pass so animation cleanly disappears after playing once
      filter: `overlay=x=${xStr}:y=${yStr}:eof_action=pass`
    };
  }
}
