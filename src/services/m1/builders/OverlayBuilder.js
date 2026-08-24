export class OverlayBuilder {
  static async build(job) {
    const nodes = [];
    const ts = Date.now();
    
    // Watermark
    const { WatermarkBuilder } = await import(`./WatermarkBuilder.js?v=${ts}`);
    const watermarkNode = await WatermarkBuilder.build(job);
    if (watermarkNode) nodes.push(watermarkNode);
    
    // Watermark/Logo
    const { LogoBuilder } = await import(`./LogoBuilder.js?v=${ts}`);
    const logoNode = await LogoBuilder.build(job);
    if (logoNode) nodes.push(logoNode);
    
    // Frame Overlay
    const { FrameBuilder } = await import(`./FrameBuilder.js?v=${ts}`);
    const frameNode = await FrameBuilder.build(job);
    if (frameNode) nodes.push(frameNode);
    
    // Subscribe Animation
    const { SubscribeBuilder } = await import(`./SubscribeBuilder.js?v=${ts}`);
    const subscribeNode = await SubscribeBuilder.build(job);
    if (subscribeNode) nodes.push(subscribeNode);
    
    return nodes;
  }
}
