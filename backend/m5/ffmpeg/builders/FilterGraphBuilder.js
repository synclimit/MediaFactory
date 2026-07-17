const TranslatorRegistry = require("../registry/TranslatorRegistry");

class FilterGraphBuilder {
  /**
   * Translates the RenderGraph nodes into Abstract FilterGraph Nodes.
   * @param {Object} renderGraph
   */
  static build(renderGraph) {
    const filterNodes = [];

    // Traverse the DAG based on Execution Order
    const sortedNodes = [...renderGraph.nodes].sort(
      (a, b) => a.executionOrder - b.executionOrder,
    );

    const resolution = renderGraph.metadata?.optimizationPlan?.resolution || {
      width: 1080,
      height: 1920,
    };
    const fps = 30; // Could also pull from optimizationPlan if it existed there

    sortedNodes.forEach((node) => {
      let translatedFilters = [];

      switch (node.type.toUpperCase()) {
                case "BACKGROUNDFILTERNODE": {
          const bw = node.metadata.width || resolution.width;
          const bh = node.metadata.height || resolution.height;
          translatedFilters = [
            { filter: "scale", params: { w: bw, h: bh, force_original_aspect_ratio: "increase" } },
            { filter: "crop", params: { w: bw, h: bh } }
          ];
          
          if (node.metadata.blur > 0) {
              translatedFilters.push({ filter: "boxblur", params: { luma_radius: node.metadata.blur, luma_power: 5 } });
              translatedFilters.push({ filter: "colorchannelmixer", params: { rr: 0.9, gg: 0.9, bb: 0.9 } });
              translatedFilters.push({ filter: "eq", params: { saturation: 0.9 } });
          } else if (node.metadata.brightness !== undefined || node.metadata.contrast !== undefined || node.metadata.saturation !== undefined) {
              const b = node.metadata.brightness || 0;
              const c = node.metadata.contrast !== undefined ? node.metadata.contrast : 1;
              const s = node.metadata.saturation !== undefined ? node.metadata.saturation : 1;
              if (b !== 0 || c !== 1 || s !== 1) {
                  translatedFilters.push({ filter: "eq", params: { brightness: b, contrast: c, saturation: s } });
              }
          }

          translatedFilters.push({ filter: "setsar", params: { r: "1" } });
          translatedFilters.push({ filter: "fps", params: { fps: fps } });
          break;
        }
        case "SPLITNODE":
          translatedFilters = [
            { filter: "split", params: { outputs: node.metadata.count || 1 } }
          ];
          break;
        case "TRIMNODE":
          // Rule #5: trim + setpts
          translatedFilters = [
            {
              filter: "trim",
              params: {
                start:
                  node.metadata.trimStart !== undefined
                    ? node.metadata.trimStart
                    : 0,
                end:
                  node.metadata.trimEnd !== undefined
                    ? node.metadata.trimEnd
                    : node.metadata.duration || 5,
              },
            },
            { filter: "setpts", params: { expr: "PTS-STARTPTS" } },
          ];
          break;
        case "CROPNODE":
        case "ROTATENODE":
          translatedFilters = TranslatorRegistry.camera.translate(
            node.metadata,
            { w: resolution.width, h: resolution.height },
            { w: resolution.width, h: resolution.height },
            fps,
          );
          break;
        case "SCALENODE": {
          const isTransparent = node.metadata.transparentPadding;
          const padColor = isTransparent ? "black@0" : "black";
          
          if (node.metadata.exactScale) {
            const w = node.metadata.width || resolution.width;
            const h = node.metadata.height || resolution.height;
            const innerW = node.metadata.innerWidth || w;
            const innerH = node.metadata.innerHeight || h;
            translatedFilters = [];
            
            if (node.metadata.chromakey) {
                translatedFilters.push({ filter: "format", params: { pix_fmts: "rgba" } });
                translatedFilters.push({
                    filter: "chromakey",
                    params: { color: "0x00FF00", similarity: 0.2, blend: 0.1 }
                });
            }

            translatedFilters.push({
                filter: "scale",
                params: {
                  w: innerW,
                  h: innerH,
                  force_original_aspect_ratio: "decrease",
                },
            });
            
            if (node.metadata.borderRight) {
                translatedFilters.push({
                    filter: "pad",
                    params: { w: `iw+${node.metadata.borderRight}`, h: "ih", x: 0, y: 0, color: "black@0.9" }
                });
            }
            if (node.metadata.borderLeft) {
                translatedFilters.push({
                    filter: "pad",
                    params: { w: `iw+${node.metadata.borderLeft}`, h: "ih", x: node.metadata.borderLeft, y: 0, color: "black@0.9" }
                });
            }
            if (isTransparent) {
                translatedFilters.push({ filter: "format", params: { pix_fmts: "rgba" } });
            }
            translatedFilters.push({
                filter: "pad",
                params: {
                  w: w,
                  h: h,
                  x: node.metadata.padX !== undefined ? node.metadata.padX : "(ow-iw)/2",
                  y: node.metadata.padY !== undefined ? node.metadata.padY : "(oh-ih)/2",
                  color: padColor,
                },
            });
            
            if (node.metadata.rotate) {
                translatedFilters.push({
                    filter: "rotate",
                    params: { a: node.metadata.rotate, c: "black@0" }
                });
            }
            
            translatedFilters.push({ filter: "setsar", params: { r: "1" } }, { filter: "fps", params: { fps: fps } });
          } else if (node.metadata.normalize) {
            translatedFilters = [
              {
                filter: "scale",
                params: {
                  w: resolution.width,
                  h: resolution.height,
                  force_original_aspect_ratio: "decrease",
                },
              }
            ];
            if (isTransparent) {
                translatedFilters.push({ filter: "format", params: { pix_fmts: "rgba" } });
            }
            translatedFilters.push({
                filter: "pad",
                params: {
                  w: resolution.width,
                  h: resolution.height,
                  x: "(ow-iw)/2",
                  y: "(oh-ih)/2",
                  color: padColor,
                },
            });
            translatedFilters.push({ filter: "setsar", params: { r: "1" } }, { filter: "fps", params: { fps: fps } });
          } else {
            translatedFilters = TranslatorRegistry.camera.translate(
              node.metadata,
              { w: resolution.width, h: resolution.height },
              { w: resolution.width, h: resolution.height },
              fps,
            );
          }
          break;
        }
        case "COMPOSITENODE":
          if (node.metadata.layout === "LEFT_RIGHT") {
            const overlap = 60;
            const w = node.metadata.width || resolution.width;
            const h = node.metadata.height || resolution.height;
            const xOffset = Math.round(w / 2) - 30;
            
            const maskedBId = `${node.id}_maskedB`;
            filterNodes.push({
                id: maskedBId,
                type: "FeatherMask",
                inputs: [node.inputs[1]],
                outputs: [maskedBId],
                filters: [
                    { filter: "format", params: { pix_fmts: "rgba" } },
                    { filter: "geq", params: { r: "'p(X,Y)'", g: "'p(X,Y)'", b: "'p(X,Y)'", a: `'if(lt(X,${overlap}),p(X,Y)*(X/${overlap}),p(X,Y))'` } }
                ]
            });
            
            const bgId = `${node.id}_bg`;
            filterNodes.push({
                id: bgId,
                type: "BlankCanvas",
                inputs: [],
                outputs: [bgId],
                filters: [
                    { filter: "color", params: { c: "black@0", s: `${w}x${h}` } },
                    { filter: "format", params: { pix_fmts: "rgba" } }
                ]
            });
            
            const overAId = `${node.id}_overA`;
            filterNodes.push({
                id: overAId,
                type: "OverlayA",
                inputs: [bgId, node.inputs[0]],
                outputs: [overAId],
                filters: [{ filter: "overlay", params: { x: 0, y: 0, shortest: 1 } }]
            });
            
            filterNodes.push({
                id: `${node.id}_overlay`,
                type: "OverlayB",
                inputs: [overAId, maskedBId],
                outputs: node.outputs,
                filters: [{ filter: "overlay", params: { x: xOffset, y: 0, shortest: 1 } }]
            });
            
            translatedFilters = [];
          } else {
            translatedFilters = [{ filter: "vstack", params: { inputs: 2 } }];
          }
          break;
        case "AUDIOTRIMNODE":
          translatedFilters = [
            {
              filter: "atrim",
              params: {
                start:
                  node.metadata.trimStart !== undefined
                    ? node.metadata.trimStart
                    : 0,
                end:
                  node.metadata.trimEnd !== undefined
                    ? node.metadata.trimEnd
                    : node.metadata.duration || 5,
              },
            },
            { filter: "asetpts", params: { expr: "PTS-STARTPTS" } },
          ];
          break;
        case "AUDIOMIXNODE":
          if (node.metadata.ducking) {
            translatedFilters = [
              {
                filter: "amix",
                params: {
                  inputs: node.metadata.inputs || 2,
                  duration: "first",
                  dropout_transition: 2,
                  normalize: 0,
                  weights: "1 0.3" // Speech 100%, Music 30%
                },
              },
              { filter: "loudnorm", params: { I: -16, TP: -1.5, LRA: 11 } }
            ];
          } else {
            translatedFilters = [
              {
                filter: "amix",
                params: {
                  inputs: node.metadata.inputs || 2,
                  duration: "first",
                  dropout_transition: 0,
                  normalize:
                    node.metadata.normalize !== undefined
                      ? node.metadata.normalize
                      : 0,
                },
              },
            ];
          }
          break;
        case "VISUALNODE":
          translatedFilters = TranslatorRegistry.visual.translate(
            node.metadata,
          );
          break;
        case "MOTIONNODE":
          translatedFilters = TranslatorRegistry.motion.translateVideo(
            node.metadata,
          );
          break;
        case "AUDIONODE":
          translatedFilters = TranslatorRegistry.audio.translate(node.metadata);
          break;
        case "OVERLAYNODE":
          translatedFilters = TranslatorRegistry.overlay.translate(
            node.metadata,
          );
          break;
        case "CONCATNODE":
          translatedFilters = [
            {
              filter: "concat",
              params: {
                n: node.metadata.segments,
                v: 1,
                a: node.metadata.hasAudio ? 1 : 0,
              },
            },
          ];
          break;
        case "TEXTOVERLAYNODE": {
          const font = node.metadata.font || 'Arial';
          const size = node.metadata.size || 50;
          const color = node.metadata.color || 'white';
          const start = node.metadata.start !== undefined ? node.metadata.start : 10;
          const dur = node.metadata.duration !== undefined ? node.metadata.duration : 5;
          const end = start + dur;
          
          const alphaExpr = `if(lt(t,${start}),0,if(lt(t,${start+1}),t-${start},if(lt(t,${end-1}),1,if(lt(t,${end}),${end}-t,0))))`;

          const drawTextParams = {
            fontfile: `'C\\:/Windows/Fonts/arialbd.ttf'`,
            fontsize: size,
            fontcolor: color,
            x: "(w-text_w)/2",
            y: "(h-text_h)/2",
            alpha: `'${alphaExpr}'`
          };

          if (node.metadata.textfile) {
            // Must escape colons in the path for FFmpeg filter parser
            const escapedPath = node.metadata.textfile.replace(/:/g, '\\:');
            drawTextParams.textfile = `'${escapedPath}'`;
          } else {
            const text = (node.metadata.text || '').replace(/'/g, "\u2019").replace(/:/g, "\\:");
            drawTextParams.text = `'${text}'`;
          }

          translatedFilters = [
            {
              filter: "drawtext",
              params: drawTextParams
            }
          ];
          break;
        }
        case "UNIQUEIZATIONNODE":
          // Video filters
          const vFilters = [];
          if (node.metadata.brightness !== 0 || node.metadata.contrast !== 1 || node.metadata.saturation !== 1 || node.metadata.gamma !== 1) {
             vFilters.push({ filter: "eq", params: { brightness: node.metadata.brightness, contrast: node.metadata.contrast, saturation: node.metadata.saturation, gamma: node.metadata.gamma } });
          }
          if (node.metadata.hue !== 0) {
             vFilters.push({ filter: "hue", params: { h: node.metadata.hue } });
          }
          if (node.metadata.sharpen) {
             vFilters.push({ filter: "unsharp", params: { luma_msize_x: 3, luma_msize_y: 3, luma_amount: 0.3 } });
          }
          if (node.metadata.fadeVideo > 0) {
             vFilters.push({ filter: "fade", params: { type: "in", start_time: 0, d: node.metadata.fadeVideo } });
          }

          if (vFilters.length > 0) {
             filterNodes.push({ id: `${node.id}_v`, type: "VideoFilterNode", inputs: [node.inputs[0]], outputs: [node.outputs[0]], filters: vFilters });
          } else {
             filterNodes.push({ id: `${node.id}_v`, type: "VideoFilterNode", inputs: [node.inputs[0]], outputs: [node.outputs[0]], filters: [{ filter: "null", params: {} }] });
          }

          // Audio filters
          const aFilters = [];
          if (node.metadata.audioVolume !== 0) {
             aFilters.push({ filter: "volume", params: { volume: `${node.metadata.audioVolume}dB` }, isAudio: true });
          }
          if (node.metadata.fadeAudio > 0) {
             aFilters.push({ filter: "afade", params: { type: "in", start_time: 0, d: node.metadata.fadeAudio }, isAudio: true });
          }

          if (aFilters.length > 0) {
             filterNodes.push({ id: `${node.id}_a`, type: "AudioFilterNode", inputs: [node.inputs[1]], outputs: [node.outputs[1]], filters: aFilters });
          } else {
             filterNodes.push({ id: `${node.id}_a`, type: "AudioFilterNode", inputs: [node.inputs[1]], outputs: [node.outputs[1]], filters: [{ filter: "anull", params: {} }] });
          }
          
          translatedFilters = []; // Skip standard append
          break;
      }

      if (translatedFilters.length > 0) {
        // Map the input/output links from the RenderGraph to the FilterGraph
        // Assuming sequential chaining for this single node's internal filters
        filterNodes.push({
          id: node.id,
          type: node.type,
          inputs: node.inputs,
          outputs: node.outputs,
          filters: translatedFilters,
        });
      }
    });

    // The returned FilterGraph is strictly abstract. No CLI strings.
    return {
      nodes: filterNodes,
    };
  }
}

module.exports = FilterGraphBuilder;
