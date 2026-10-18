export class OverlayBuilder {
  static async build(job) {
    const nodes = [];
    
    // Watermark
    const { WatermarkBuilder } = await import('./WatermarkBuilder.js');
    const watermarkNode = await WatermarkBuilder.build(job);
    if (watermarkNode) nodes.push(watermarkNode);
    
    // Watermark/Logo
    const { LogoBuilder } = await import('./LogoBuilder.js');
    const logoNode = await LogoBuilder.build(job);
    if (logoNode) nodes.push(logoNode);
    
    // Frame Overlay
    const { FrameBuilder } = await import('./FrameBuilder.js');
    const frameNode = await FrameBuilder.build(job);
    if (frameNode) nodes.push(frameNode);
    
    // Subscribe Animation
    const { SubscribeBuilder } = await import('./SubscribeBuilder.js');
    const subscribeNode = await SubscribeBuilder.build(job);
    if (subscribeNode) nodes.push(subscribeNode);
    
    return nodes;
  }
}
