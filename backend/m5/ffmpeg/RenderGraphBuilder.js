const crypto = require("crypto");
const EngineResult = require("../core/EngineResult");
const Logger = require("../core/Logger");
const NodeRegistry = require("../rendergraph/NodeRegistry");
const Engine = require("../core/Engine");

class RenderGraphBuilder extends Engine {
  /**
   * @param {PipelineContext} context
   * @param {Object} recipe
   * @param {Object} optimizationPlan
   */
  buildGraph(context, recipe, optimizationPlan) {
    return this.run(context, "RenderGraphBuilder", () => {
      const nodes = [];
      let executionCounter = 0;

      const createNode = (type, params = {}, inputs = [], outputs = []) => {
        const node = NodeRegistry.create(
          type,
          params,
          inputs,
          outputs,
          executionCounter++,
        );
        if (outputs.length === 0 && type !== "OutputNode") {
          node.outputs = [node.id];
        }
        nodes.push(node);
        return node;
      };

      const canvasW = recipe.output?.canvasWidth || 1080;
      const canvasH = recipe.output?.canvasHeight || 1920;

      // 1. Continuous Background Setup
      const isInterrupt = recipe.metadata?.formulaId === 'INTERRUPT';
      const isOverlay = recipe.metadata?.formulaId === 'OVERLAY';
      
      const bgAsset = (recipe.assets.background && recipe.assets.background.absolutePath) ? recipe.assets.background : recipe.assets.videoA;
      if (!bgAsset || !bgAsset.absolutePath) {
          const { PipelineError, ErrorCodes } = require('../core/Errors');
          throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "M5_GRAPH_BG: Missing Background Asset and Video A fallback.");
      }

      const bgInput = createNode("InputNode", {
          file: "background",
          path: bgAsset.absolutePath,
          assetId: bgAsset.assetId,
          duration: bgAsset.duration,
          loop: true
      });

      const bgFilter = createNode("BackgroundFilterNode", {
          width: canvasW,
          height: canvasH,
          blur: isInterrupt ? 0 : 25,
          brightness: isInterrupt ? 0 : -10,
          contrast: isInterrupt ? 1 : -5,
          saturation: isInterrupt ? 1 : 90
      }, [bgInput.id]);

      const bgSplit = createNode("SplitNode", { count: recipe.timeline.segments.length }, [bgFilter.id]);
      bgSplit.outputs = Array.from({ length: recipe.timeline.segments.length }, () => crypto.randomUUID());

      const videoSegments = [];
      const audioSegments = [];

      // 2. Process Scenes Independently
      recipe.timeline.segments.forEach((segment, idx) => {
        const isMain = segment.type === "main" || segment.segmentType === "main";
        const hasVideoA = recipe.assets.videoA && recipe.assets.videoA.absolutePath;
        const hasVideoB = recipe.assets.videoB && recipe.assets.videoB.absolutePath;

        const bgSegmentInput = bgSplit.outputs[idx];
        const bgTrim = createNode("TrimNode", {
            trimStart: segment.start,
            trimEnd: segment.end,
            duration: segment.duration
        }, [bgSegmentInput]);

        let fgOutputId;

        if (isMain && hasVideoA && hasVideoB) {
          const assetA = recipe.assets.videoA;
          const assetB = recipe.assets.videoB;

          const inputA = createNode("InputNode", { file: "videoA", path: assetA.absolutePath, assetId: assetA.assetId, duration: assetA.duration });
          const inputB = createNode("InputNode", { file: "videoB", path: assetB.absolutePath, assetId: assetB.assetId, duration: assetB.duration });

          const trimStart = segment.trimStart !== undefined ? segment.trimStart : 0;
          const trimEnd = segment.trimEnd !== undefined ? segment.trimEnd : segment.duration;

          const trimA = createNode("TrimNode", { trimStart, trimEnd, duration: segment.duration }, [inputA.id]);
          const trimB = createNode("TrimNode", { trimStart, trimEnd, duration: segment.duration }, [inputB.id]);

          const layoutType = recipe.layout?.type || "LEFT_RIGHT";
          
          let scaleW = canvasW;
          let scaleH = canvasH;
          if (layoutType === "LEFT_RIGHT") {
            scaleW = Math.round(canvasW / 2) + 30; // 60px total overlap area
            scaleH = canvasH;
          } else {
            scaleW = canvasW;
            scaleH = Math.round(canvasH / 2);
          }

          const scaleA = createNode("ScaleNode", { exactScale: true, width: scaleW, height: scaleH, transparentPadding: true }, [trimA.id]);
          const scaleB = createNode("ScaleNode", { exactScale: true, width: scaleW, height: scaleH, transparentPadding: true }, [trimB.id]);

          const compositeNode = createNode("CompositeNode", { layout: layoutType, width: canvasW, height: canvasH, transparentPadding: true }, [scaleA.id, scaleB.id]);

          let lastNode = compositeNode;
          if (segment.visualEffects && segment.visualEffects.length > 0) {
            segment.visualEffects.forEach((effect) => {
              const effectNode = createNode(effect.type, effect.params, [lastNode.id]);
              lastNode = effectNode;
            });
          }

          if (isOverlay && isMain) {
            const scaleW = Math.round(canvasW * 0.85);
            const scaleH = Math.round(canvasH * 0.85);
            const scaleNode = createNode("ScaleNode", { exactScale: true, width: scaleW, height: scaleH, transparentPadding: true }, [lastNode.id]);
            fgOutputId = scaleNode.id;
          } else {
            const normalizeNode = createNode("ScaleNode", { normalize: true, transparentPadding: true }, [lastNode.id]);
            fgOutputId = normalizeNode.id;
          }

          const audioTrimA = createNode("AudioTrimNode", { trimStart, trimEnd, duration: segment.duration }, [inputA.id]);
          const audioTrimB = createNode("AudioTrimNode", { trimStart, trimEnd, duration: segment.duration }, [inputB.id]);
          const audioMixMain = createNode("AudioMixNode", { inputs: 2, normalize: 0 }, [audioTrimA.id, audioTrimB.id]);
          audioSegments.push(audioMixMain.id);

        } else {
          const asset = recipe.assets[segment.type];
          if (!asset || !asset.absolutePath) {
            const { PipelineError, ErrorCodes } = require("../core/Errors");
            throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, `M5_GRAPH_001: Missing InputNode Asset for segment type '${segment.type}'.`);
          }
          const inputNode = createNode("InputNode", {
            file: segment.type,
            path: asset.absolutePath,
            assetId: asset.assetId,
            duration: asset.duration,
          });

          const trimStart = segment.trimStart !== undefined ? segment.trimStart : 0;
          const trimEnd = segment.trimEnd !== undefined ? segment.trimEnd : segment.duration;

          const trimNode = createNode("TrimNode", { trimStart, trimEnd, duration: segment.duration }, [inputNode.id]);

          let lastNode = trimNode;
          if (segment.visualEffects && segment.visualEffects.length > 0) {
            segment.visualEffects.forEach((effect) => {
              const effectNode = createNode(effect.type, effect.params, [lastNode.id]);
              lastNode = effectNode;
            });
          }

          if (isOverlay && isMain) {
            const scaleW = Math.round(canvasW * 0.85);
            const scaleH = Math.round(canvasH * 0.85);
            const scaleNode = createNode("ScaleNode", { exactScale: true, width: scaleW, height: scaleH, transparentPadding: true }, [lastNode.id]);
            fgOutputId = scaleNode.id;
          } else {
            const normalizeNode = createNode("ScaleNode", { normalize: true, transparentPadding: true }, [lastNode.id]);
            fgOutputId = normalizeNode.id;
          }

          const audioTrimNode = createNode("AudioTrimNode", { trimStart, trimEnd, duration: segment.duration }, [inputNode.id]);
          audioSegments.push(audioTrimNode.id);
        }
        
        let overlayX = 0;
        let overlayY = 0;
        if (isOverlay && isMain) {
            overlayX = Math.round((canvasW - (canvasW * 0.85)) / 2);
            overlayY = Math.round((canvasH - (canvasH * 0.85)) / 2);
        }
        
        const overlayNode = createNode("OverlayNode", { x: overlayX, y: overlayY }, [bgTrim.id, fgOutputId]);
        videoSegments.push(overlayNode.id);
      });

      // 3. Concat Scene Outputs
      const concatInputs = [];
      for (let idx = 0; idx < videoSegments.length; idx++) {
        concatInputs.push(videoSegments[idx]);
        concatInputs.push(audioSegments[idx]);
      }

      const concatVidId = crypto.randomUUID();
      const concatAudId = crypto.randomUUID();
      const concatNode = createNode("ConcatNode", { segments: videoSegments.length, hasAudio: true }, concatInputs, [concatVidId, concatAudId]);

      // 4. Audio Mixing (Ducking applied in FilterGraphBuilder based on AudioMixNode properties)
      let audioInputIndex = -1;
      const outputInputs = [concatNode.outputs[0]];

      if (recipe.assets && recipe.assets.audio && recipe.assets.audio.absolutePath) {
        const audioInputNode = createNode("InputNode", {
          file: "audio",
          path: recipe.assets.audio.absolutePath,
          assetId: recipe.assets.audio.assetId,
          duration: recipe.assets.audio.duration,
          isAudio: true
        });
        
        audioInputIndex = nodes.filter(n => n.type === "InputNode" && !n.metadata.isAudio).length;

        const musicVol = isInterrupt ? 0.05 : (recipe.audio?.musicVolume !== undefined ? recipe.audio.musicVolume : 0.25);

        const audioNode = createNode("AudioNode", {
          targetDuration: recipe.timeline.totalDuration || 60,
          audioDuration: recipe.assets.audio.duration || 0,
          fadeIn: true,
          fadeInDuration: 1,
          fadeOut: true,
          fadeOutDuration: 2,
          volume: musicVol,
          loop: true
        }, [audioInputNode.id]);

        // Smart ducking flag enabled
        const finalAudioMixNode = createNode("AudioMixNode", { inputs: 2, normalize: 0, ducking: true }, [concatNode.outputs[1], audioNode.id]);

        outputInputs.push(finalAudioMixNode.id);
      } else {
        outputInputs.push(concatNode.outputs[1]);
      }
      
      // === GLOBAL OVERLAYS (SUBSCRIBE / ARROW) ===
      let finalVideoOutputId = outputInputs[0];
      let hasGlobalOverlay = false;

      if (recipe.assets && recipe.assets.subscribe && recipe.assets.subscribe.absolutePath) {
        const subInputNode = createNode("InputNode", {
          file: "subscribe",
          path: recipe.assets.subscribe.absolutePath,
          assetId: recipe.assets.subscribe.assetId,
        });
        
        const subScale = createNode("ScaleNode", { 
            exactScale: true, 
            width: canvasW, 
            height: canvasH,
            innerWidth: Math.round(canvasW * 0.8),
            innerHeight: Math.round(canvasH * 0.25),
            padY: 1200,
            transparentPadding: true,
            chromakey: true
        }, [subInputNode.id]);
        
        const subOverlay = createNode("OverlayNode", { x: 0, y: 0 }, [finalVideoOutputId, subScale.id]);
        finalVideoOutputId = subOverlay.id;
        hasGlobalOverlay = true;
      }

      if (recipe.assets && recipe.assets.arrow && recipe.assets.arrow.absolutePath) {
        const arrowInputNode = createNode("InputNode", {
          file: "arrow",
          path: recipe.assets.arrow.absolutePath,
          assetId: recipe.assets.arrow.assetId,
        });
        
        const arrowScale = createNode("ScaleNode", { 
            exactScale: true, 
            width: canvasW, 
            height: canvasH,
            innerWidth: Math.round(canvasW * 0.3),
            innerHeight: Math.round(canvasH * 0.2),
            padX: 500,
            padY: 1400,
            transparentPadding: true,
            chromakey: true
        }, [arrowInputNode.id]);
        
        const arrowOverlay = createNode("OverlayNode", { x: 0, y: 0 }, [finalVideoOutputId, arrowScale.id]);
        finalVideoOutputId = arrowOverlay.id;
        hasGlobalOverlay = true;
      }

      if (isOverlay && recipe.metadata?.ctaText) {
          const fs = require('fs');
          const path = require('path');
          const os = require('os');
          
          // Write text to a temporary file for safe ffmpeg drawtext execution
          const txtPath = path.join(os.tmpdir(), `m5_cta_${context.jobId || Date.now()}.txt`);
          // Note: using replaceAll to ensure Windows line endings might help, but basic write is fine
          fs.writeFileSync(txtPath, recipe.metadata.ctaText, 'utf-8');
          // Format path for FFmpeg (needs to be carefully escaped for Windows)
          const ffmpegTxtPath = txtPath.replace(/\\/g, '/');

          const textOverlay = createNode("TextOverlayNode", {
              textfile: ffmpegTxtPath,
              text: recipe.metadata.ctaText,
              start: 0,
              duration: 9999, // Show indefinitely until video ends
              size: 50,
              color: "white"
          }, [finalVideoOutputId]);
          finalVideoOutputId = textOverlay.id;
          hasGlobalOverlay = true;
      }

      if (hasGlobalOverlay) {
          outputInputs[0] = finalVideoOutputId;
      }
      // === END GLOBAL OVERLAYS ===
      
      // 5. Uniqueization Layer (Commercial Behavior Lock)
      // Generates deterministic random edits using Job/Recipe ID
      const seedStr = `${context.jobId || 'job'}_${recipe.id || 'recipe'}`;
      let hash = crypto.createHash('sha256').update(seedStr).digest('hex');
      let seedNum = parseInt(hash.substring(0, 8), 16);
      const random = () => {
        seedNum = (seedNum * 9301 + 49297) % 233280;
        return seedNum / 233280;
      };

      const uqParams = {
         brightness: 0,
         contrast: 1,
         saturation: 1,
         gamma: 1,
         hue: 0,
         sharpen: false,
         fadeVideo: 0,
         fadeAudio: 0,
         audioVolume: 0,
         renderSeed: seedStr
      };

      // Select 2-4 effects
      const numEffects = Math.floor(random() * 3) + 2; // 2, 3, or 4
      const effectPool = ['brightness', 'contrast', 'saturation', 'gamma', 'hue', 'sharpen', 'fade', 'volume'];
      
      // Shuffle array deterministically
      for (let i = effectPool.length - 1; i > 0; i--) {
         const j = Math.floor(random() * (i + 1));
         [effectPool[i], effectPool[j]] = [effectPool[j], effectPool[i]];
      }
      
      const selectedEffects = effectPool.slice(0, numEffects);

      if (selectedEffects.includes('brightness')) {
         uqParams.brightness = (random() * 0.02) - 0.01; // -0.01 to +0.01
      }
      if (selectedEffects.includes('contrast')) {
         uqParams.contrast = (random() * 0.02) + 0.99; // 0.99 to 1.01
      }
      if (selectedEffects.includes('saturation')) {
         uqParams.saturation = (random() * 0.04) + 0.98; // 0.98 to 1.02
      }
      if (selectedEffects.includes('gamma')) {
         uqParams.gamma = (random() * 0.02) + 0.99; // 0.99 to 1.01
      }
      if (selectedEffects.includes('hue')) {
         uqParams.hue = (random() * 2) - 1; // -1 to +1
      }
      if (selectedEffects.includes('sharpen')) {
         uqParams.sharpen = random() < 0.2; // 20% chance if selected
      }
      if (selectedEffects.includes('fade')) {
         uqParams.fadeVideo = (random() * 0.1) + 0.15; // 0.15 to 0.25
         uqParams.fadeAudio = uqParams.fadeVideo;
      }
      if (selectedEffects.includes('volume')) {
         uqParams.audioVolume = (random() * 1.0) - 0.5; // -0.5 to +0.5
      }

      console.log(`\n===== UNIQUEIZATION =====`);
      console.log(`Brightness: ${uqParams.brightness.toFixed(4)}`);
      console.log(`Contrast: ${uqParams.contrast.toFixed(4)}`);
      console.log(`Saturation: ${uqParams.saturation.toFixed(4)}`);
      console.log(`Gamma: ${uqParams.gamma.toFixed(4)}`);
      console.log(`Hue: ${uqParams.hue.toFixed(4)}`);
      console.log(`Sharpen Enabled: ${uqParams.sharpen}`);
      console.log(`Fade Enabled: ${uqParams.fadeVideo > 0}`);
      console.log(`Audio Gain: ${uqParams.audioVolume.toFixed(4)} dB`);
      console.log(`Render Seed: ${seedStr}`);
      console.log(`=========================\n`);

      const uqNode = createNode("UniqueizationNode", uqParams, outputInputs, [crypto.randomUUID(), crypto.randomUUID()]);

      const outputNode = createNode("OutputNode", { format: "mp4", audioInputIndex, hasAudioFilter: true }, uqNode.outputs);

      return {
        id: crypto.randomUUID(),
        nodes: nodes,
        metadata: {
          totalNodes: nodes.length,
          optimizationPlan: optimizationPlan
        }
      };
    });
  }
}

module.exports = RenderGraphBuilder;
