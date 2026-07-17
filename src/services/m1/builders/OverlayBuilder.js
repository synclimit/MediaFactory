import { LogoBuilder } from './LogoBuilder.js';
import { SubscribeBuilder } from './SubscribeBuilder.js';
import { FrameBuilder } from './FrameBuilder.js';

export class OverlayBuilder {
  static async build(job) {
    const nodes = [];
    
    // Watermark/Logo
    const logoNode = await LogoBuilder.build(job);
    if (logoNode) nodes.push(logoNode);
    
    // Frame Overlay
    const frameNode = await FrameBuilder.build(job);
    if (frameNode) nodes.push(frameNode);
    
    // Subscribe Animation
    const subscribeNode = await SubscribeBuilder.build(job);
    if (subscribeNode) nodes.push(subscribeNode);
    
    return nodes;
  }
}
