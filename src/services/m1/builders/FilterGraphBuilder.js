export class FilterGraphBuilder {
  static async buildStage1(job) {
    const nodes = [];
    const ts = Date.now();
    
    const { SegmentBuilder } = await import(`./SegmentBuilder.js?v=${ts}`);
    const segmentNode = await SegmentBuilder.build(job);
    if (segmentNode) nodes.push(segmentNode);
    
    const { PlaybackBuilder } = await import(`./PlaybackBuilder.js?v=${ts}`);
    const playbackNode = await PlaybackBuilder.build(job);
    if (playbackNode) nodes.push(playbackNode);
    
    const { EncoderBuilder } = await import(`./EncoderBuilder.js?v=${ts}`);
    const encoderNode = await EncoderBuilder.build(job);
    if (encoderNode) nodes.push(encoderNode);
    
    return this._assembleGraph(nodes, 1);
  }

  static async buildStage2(job) {
    const nodes = [];
    const ts = Date.now();
    
    const { LoopBuilder } = await import(`./LoopBuilder.js?v=${ts}`);
    const loopNode = await LoopBuilder.build(job);
    if (loopNode) nodes.push(loopNode);
    
    const { OverlayBuilder } = await import(`./OverlayBuilder.js?v=${ts}`);
    const overlayNodes = await OverlayBuilder.build(job);
    nodes.push(...overlayNodes);
    
    return this._assembleGraph(nodes, 1); // inputCount starts at 1, loopNode increments it to 2, so first overlay gets [2:v]
  }

  static _assembleGraph(nodes, initialInputCount) {
    let filterComplex = '';
    let currentPad = '0:v';
    let filterCount = 0;
    
    let inputCount = initialInputCount; 
    const allInputs = [];
    const allGlobalInputArgs = [];
    const allOutputArgs = [];
    
    for (const node of nodes) {
      if (node.globalInputArgs) allGlobalInputArgs.push(...node.globalInputArgs);
      if (node.outputArgs) allOutputArgs.push(...node.outputArgs);
      
      let overlayPads = '';
      if (node.inputs) {
        for (const inputObj of node.inputs) {
          allInputs.push(inputObj);
          const rawPad = `${inputCount}:v`;
          inputCount++;
          
          if (node.preFilter) {
            const prePad = `ov_prep_${filterCount++}`;
            if (filterComplex !== '') filterComplex += ';';
            filterComplex += `[${rawPad}]${node.preFilter}[${prePad}]`;
            overlayPads += `[${prePad}]`;
          } else {
            overlayPads += `[${rawPad}]`;
          }
        }
      }
      
      if (node.filter) {
        const outPad = `v${filterCount++}`;
        if (filterComplex !== '') filterComplex += ';';
        // Only append overlay pads if it's an overlay-style filter that takes multiple inputs
        // However, most simple filters (scale, trim, setpts) only take [currentPad]
        // Overlay filters take [currentPad][overlayPads]
        if (node.filter.startsWith('overlay=')) {
           filterComplex += `[${currentPad}]${overlayPads}${node.filter}[${outPad}]`;
        } else {
           filterComplex += `[${currentPad}]${node.filter}[${outPad}]`;
        }
        currentPad = outPad;
      }
    }
    
    if (filterComplex !== '') {
      filterComplex += `;[${currentPad}]copy[v]`;
    }
    
    return {
      filterComplex,
      inputs: allInputs,
      globalInputArgs: allGlobalInputArgs,
      outputArgs: allOutputArgs
    };
  }
}
