const path = require('path');
const EngineRegistry = require('./core/EngineRegistry');
const Logger = require('./core/Logger');
const { PipelineError, ErrorCodes } = require('./core/Errors');
const PipelineContext = require('./core/PipelineContext');
const PipelineLifecycle = require('./core/PipelineLifecycle');
const RenderArtifact = require('./core/RenderArtifact');
const CapabilityRegistry = require('./registry/CapabilityRegistry');
const AppPaths = require('../system/AppPaths');

// Pre-register engines required by the pipeline
EngineRegistry.register('AssetEngine', require('./AssetEngine'));
EngineRegistry.register('LayoutEngine', require('./LayoutEngine'));
EngineRegistry.register('DurationManager', require('./DurationManager'));
EngineRegistry.register('VariationEngine', require('./VariationEngine'));
EngineRegistry.register('FormulaEngine', require('./FormulaEngine'));
EngineRegistry.register('TimelineBuilder', require('./TimelineBuilder'));
EngineRegistry.register('RecipeBuilder', require('./RecipeBuilder'));
EngineRegistry.register('RecipeValidator', require('./RecipeValidator'));
EngineRegistry.register('ManifestGenerator', require('./ManifestGenerator'));

// Pre-register repositories required by engines
EngineRegistry.register('UsageRepository', require('./data/UsageRepository'));
EngineRegistry.register('HistoryRepository', require('./data/HistoryRepository'));
EngineRegistry.register('LibraryRepository', require('./data/LibraryRepository'));
EngineRegistry.register('ManifestRepository', require('./data/ManifestRepository'));
EngineRegistry.register('PresetRepository', require('./data/PresetRepository'));
EngineRegistry.register('ProjectRepository', require('./data/ProjectRepository'));
EngineRegistry.register('QueueRepository', require('./data/QueueRepository'));
EngineRegistry.register('RenderPrecheck', require('./core/RenderPrecheck'));


class RenderPipeline {
    static async execute(job, config) {
        const globalStart = Date.now();
        Logger.info('RenderPipeline', `Starting Job: ${job.id}`);
        
        let context;
        try {
            // Initialize Pipeline Context
            context = new PipelineContext(job, config, {
                logger: Logger,
                capabilities: CapabilityRegistry,
                diagnostics: { 
                    emit: (event, data) => Logger.info('Diagnostics', `[${event}]`, data) 
                }
            });

            PipelineLifecycle.emit(context, PipelineLifecycle.Events.PIPELINE_STARTED);

            if (job.formula === 'News Creator (M5)' || job.snapshot?.manifest) {
                return await RenderPipeline.executeNewsCreator(job, config, context, globalStart);
            }

            // Resolve Engines
            const AE = EngineRegistry.resolve('AssetEngine');
            const LE = EngineRegistry.resolve('LayoutEngine');
            const DM = EngineRegistry.resolve('DurationManager');
            const VE = EngineRegistry.resolve('VariationEngine');
            const FE = EngineRegistry.resolve('FormulaEngine');
            const TB = EngineRegistry.resolve('TimelineBuilder');
            const RB = EngineRegistry.resolve('RecipeBuilder');
            const RV = EngineRegistry.resolve('RecipeValidator');
            const RP = require('./RenderPlanner');
            const GV = require('./GraphValidator');
            const RGB = require('./ffmpeg/RenderGraphBuilder');
            const FB = require('./ffmpeg/FFmpegBuilder');
            const RF = require('./RenderFingerprint');
            const MG = EngineRegistry.resolve('ManifestGenerator');
            
            // Engines instantiation (some are mock classes so we just do new)
            const renderPlanner = new RP();
            const renderGraphBuilder = new RGB();
            const graphValidator = new GV();
            const ffmpegBuilder = new FB();

            // 1. AssetEngine
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'AssetEngine' });
            const assetRes = await AE.selectAssets(context, job);
            if (!assetRes.success) throw assetRes.errors[0];
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'AssetEngine' });

            // 2. FormulaEngine (Story Definition)
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'FormulaEngine' });
            const formulaRes = FE.buildStory(context, job);
            if (!formulaRes.success) throw formulaRes.errors[0];
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'FormulaEngine' });

            // 3. LayoutEngine
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'LayoutEngine' });
            const layoutRes = LE.buildLayout(context, assetRes.data);
            if (!layoutRes.success) throw layoutRes.errors[0];
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'LayoutEngine' });

            // 4. DurationManager
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'DurationManager' });
            const durationRes = DM.calculate(context, assetRes.data, layoutRes.data);
            if (!durationRes.success) throw durationRes.errors[0];
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'DurationManager' });

            // 5. VariationEngine (Editing Plan)
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'VariationEngine' });
            const variationRes = VE.buildEditingPlan(context, formulaRes.data, durationRes.data);
            if (!variationRes.success) throw variationRes.errors[0];
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'VariationEngine' });

            // 6. TimelineBuilder
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'TimelineBuilder' });
            const timelineRes = TB.buildTimeline(
                context, formulaRes.data, variationRes.data, layoutRes.data, durationRes.data
            );
            if (!timelineRes.success) throw timelineRes.errors[0];
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'TimelineBuilder' });

            // 7. RecipeBuilder
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'RecipeBuilder' });
            const recipeRes = RB.buildRecipe(
                context, assetRes.data, formulaRes.data, variationRes.data, layoutRes.data, timelineRes.data, durationRes.data
            );
            if (!recipeRes.success) throw recipeRes.errors[0];
            const recipe = recipeRes.data;
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'RecipeBuilder' });

            // 8. RecipeValidator
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'RecipeValidator' });
            const validRes = RV.validate(context, recipe);
            if (!validRes.success) throw validRes.errors[0];
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'RecipeValidator' });

            // 9. RenderPlanner
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'RenderPlanner' });
            const planRes = renderPlanner.plan(context, recipe);
            if (!planRes.success) throw planRes.errors[0];
            const optimizationPlan = planRes.data;
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'RenderPlanner' });

            // 10. RenderGraphBuilder
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'RenderGraphBuilder' });
            const graphRes = renderGraphBuilder.buildGraph(context, recipe, optimizationPlan);
            if (!graphRes.success) throw graphRes.errors[0];
            const renderGraph = graphRes.data;
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'RenderGraphBuilder' });

            // 11. GraphValidator
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'GraphValidator' });
            const gValidRes = graphValidator.validate(renderGraph);
            if (!gValidRes.success) throw gValidRes.errors[0];
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'GraphValidator' });

            // 12. FFmpegBuilder
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'FFmpegBuilder' });
            const ffmpegRes = ffmpegBuilder.buildCommand(context, renderGraph);
            if (!ffmpegRes.success) throw ffmpegRes.errors[0];
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'FFmpegBuilder', details: ffmpegRes.data.command });

            // 12.5 RenderPrecheck (Strict Validation before execution)
            const Prechecker = EngineRegistry.resolve('RenderPrecheck');
            const precheckData = {
                recipe,
                renderGraph,
                filterGraph: ffmpegRes.data.filterGraph,
                ffmpegCommand: ffmpegRes.data.command,
                cmdDetails: ffmpegRes.data.cmdDetails,
                args: ffmpegRes.data.args,
                outPath: job.snapshot?.outPath || path.resolve(config.output.outputDir, job.outputNamePrefix ? `${job.outputNamePrefix.trim()}.mp4` : `output_${job.id}.mp4`)
            };
            const precheckRes = await Prechecker.validate(context, precheckData);
            if (!precheckRes.success) {
                throw precheckRes.errors[0]; // Precheck handles specific error codes
            }
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'RenderPrecheck' });

            // 13. Rendering (Mocked execution)
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'Renderer' });
            const Renderer = require('./Renderer');
            const renderer = new Renderer();
            const outPath = job.snapshot?.outPath || path.resolve(config.output.outputDir, job.outputNamePrefix ? `${job.outputNamePrefix.trim()}.mp4` : `output_${job.id}.mp4`);
            const rendererRes = await renderer.render(job, ffmpegRes.data, outPath, recipe, renderGraph);
            if (!rendererRes.success) {
                throw rendererRes.errors[0];
            }
            PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'Renderer' });

            // 14. RenderFingerprint & Manifest
            const fingerprint = RF.generate(recipe, renderGraph, optimizationPlan.preferredEncoder, renderGraph.metadata.optimizationPlan.resolution || context.config.output.targetResolution, 'FFmpeg-1.0', context.pipelineVersion);
            const manifestRes = MG.generate(recipe, outPath); // Mocked ManifestGenerator signature

            // Final: Create Render Artifact
            const statistics = {
                totalExecutionTimeMs: Date.now() - globalStart,
                totalNodes: renderGraph.metadata.totalNodes
            };

            const renderArtifact = new RenderArtifact(
                recipe,
                optimizationPlan,
                renderGraph,
                ffmpegRes.data.filterGraph,
                ffmpegRes.data.command,
                manifestRes.data,
                context.config.output,
                [], // history
                statistics,
                { warnings: [] }
            );

            PipelineLifecycle.emit(context, PipelineLifecycle.Events.PIPELINE_COMPLETED, { artifactId: renderArtifact.id });
            Logger.info('RenderPipeline', `Pipeline Complete. Artifact: ${renderArtifact.id}`);
            
            return {
                success: true,
                artifact: renderArtifact
            };

        } catch (error) {
            Logger.error('RenderPipeline', `FATAL ERROR: ${error.message}`);
            if (context) {
                PipelineLifecycle.emit(context, PipelineLifecycle.Events.PIPELINE_FAILED, { error: error.message });
            }
            return {
                success: false,
                errors: [error]
            };
        }
    }

    static async executeNewsCreator(job, config, context, globalStart) {
        const fsSync = require('fs');
        const fs = require('fs/promises');
        const os = require('os');
        const Renderer = require('./Renderer');
        const RenderArtifact = require('./core/RenderArtifact');

        Logger.info('RenderPipeline', `Executing News Creator Pipeline for Job ${job.id}`);
        PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'NewsCreatorEngine' });

        const outDir = config?.output?.outputDir || path.resolve('Output', 'M5');
        await fs.mkdir(outDir, { recursive: true });
        const outName = job.snapshot?.outPath ? path.basename(job.snapshot.outPath) : `News_${job.id}.mp4`;
        const outPath = path.resolve(outDir, outName);

        const manifest = job.snapshot?.manifest || {};
        let durSec = 15;
        const durStr = String(manifest.duration || job.duration || '15s');
        let parsedDur = parseInt(durStr, 10);
        if (durStr.includes('m')) parsedDur *= 60;
        else if (durStr.includes('h')) parsedDur *= 3600;
        if (!isNaN(parsedDur) && parsedDur > 0) durSec = parsedDur;

        // 1. Resolve Background Media (Video/Image to be blurred & muted)
        let bgInputPath = path.resolve(__dirname, '../../test_bg.mp4');
        if (!fsSync.existsSync(bgInputPath)) {
            bgInputPath = path.resolve(__dirname, '../../dummy.mp4');
        }
        if (manifest.bgFolder) {
            try {
                const files = fsSync.readdirSync(manifest.bgFolder);
                const media = files.filter(f => /\.(mp4|mov|avi|mkv|jpg|jpeg|png)$/i.test(f));
                if (media.length > 0) {
                    bgInputPath = path.join(manifest.bgFolder, media[0]);
                }
            } catch(e) {}
        }

        const isImageBg = /\.(jpg|jpeg|png|webp)$/i.test(bgInputPath);

        let fgImagePath = null;
        let rawManifestImage = manifest.image;
        if (rawManifestImage && rawManifestImage.startsWith('/@fs/')) {
            rawManifestImage = rawManifestImage.replace(/^\/@fs\//, '');
        }

        if (rawManifestImage) {
            if (/^https?:\/\//i.test(rawManifestImage)) {
                try {
                    const imgRes = await fetch(rawManifestImage);
                    if (imgRes.ok) {
                        const buffer = Buffer.from(await imgRes.arrayBuffer());
                        const tmpImgPath = path.resolve(os.tmpdir(), `news_fg_${Date.now()}.jpg`);
                        fsSync.writeFileSync(tmpImgPath, buffer);
                        fgImagePath = tmpImgPath;
                    }
                } catch(e) {
                    Logger.warn('RenderPipeline', `Failed to download fg image ${rawManifestImage}: ${e.message}`);
                }
            } else if (fsSync.existsSync(rawManifestImage)) {
                fgImagePath = rawManifestImage;
            } else {
                const absCandidate = path.resolve(__dirname, '../../', rawManifestImage.replace(/^\//, ''));
                if (fsSync.existsSync(absCandidate)) {
                    fgImagePath = absCandidate;
                }
            }
        }

        // 3. Resolve Audio (Only audio source; background video is muted)
        let audioInputPath = null;
        if (manifest.audioFolder) {
            try {
                const files = fsSync.readdirSync(manifest.audioFolder);
                const audios = files.filter(f => /\.(mp3|wav|aac|m4a)$/i.test(f));
                if (audios.length > 0) {
                    audioInputPath = path.join(manifest.audioFolder, audios[0]);
                }
            } catch(e) {}
        }
        if (!audioInputPath) {
            audioInputPath = null;
        }

        // Detect full audio duration so render never cuts off early ("sepotong-potong")
        if (audioInputPath) {
            try {
                const { execSync } = require('child_process');
                const ffprobeBin = AppPaths.getFFprobePath();
                const probeOut = execSync(`"${ffprobeBin}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioInputPath}"`, { encoding: 'utf8' });
                const parsedAudDur = parseFloat(probeOut.trim());
                if (!isNaN(parsedAudDur) && parsedAudDur > 0) {
                    const isAuto = !durStr || durStr.toLowerCase().includes('auto') || durStr.toLowerCase().includes('full');
                    if (isAuto || parsedAudDur > durSec) {
                        durSec = Math.ceil(parsedAudDur + 0.5); // Add 0.5s padding so end of speech is never clipped
                        Logger.info('RenderPipeline', `Adjusted render duration to full audio length: ${durSec}s (audio is ${parsedAudDur.toFixed(2)}s)`);
                    }
                }
            } catch(e) {
                Logger.warn('RenderPipeline', `ffprobe audio duration failed: ${e.message}`);
            }
        }
        if (!durSec || durSec < 5) durSec = 15;

        // Text wrapping & escaping helpers
        const wrapText = (text, maxChars) => {
            if (!text) return [];
            const words = String(text).split(/\s+/);
            const lines = [];
            let cur = '';
            for (const w of words) {
                if ((cur + ' ' + w).trim().length <= maxChars) {
                    cur = (cur + ' ' + w).trim();
                } else {
                    if (cur) lines.push(cur);
                    cur = w;
                }
            }
            if (cur) lines.push(cur);
            return lines;
        };

        const escapeText = (str) => {
            if (!str) return '';
            return String(str)
                .replace(/\\/g, '\\\\')
                .replace(/:/g, '\\:')
                .replace(/'/g, '\u2019')
                .replace(/%/g, '\\%');
        };

        const uiConfig = manifest.config || {};
        const layout = uiConfig.layout || {};
        const theme = uiConfig.theme || {};
        const headlineCfg = uiConfig.headline || {};
        const summaryCfg = uiConfig.summary || {};

        const scale = 2.66667; // UI is 405px wide, output is 1080px wide.

        // Font Mapping Logic
        const getFontOpt = (fontName, weight, italic) => {
            let baseFont = 'arial.ttf';
            const fLower = (fontName || '').toLowerCase();
            if (fLower.includes('merriweather') || fLower.includes('playfair') || fLower.includes('georgia')) {
                baseFont = 'georgia.ttf';
            } else if (fLower.includes('roboto') || fLower.includes('segoe') || fLower.includes('open')) {
                baseFont = 'segoeui.ttf';
            } else if (fLower.includes('times')) {
                baseFont = 'times.ttf';
            }

            let styleOpt = '';
            if (weight === 'bold' && italic) styleOpt = 'z';
            else if (weight === 'bold') styleOpt = 'bd';
            else if (italic) styleOpt = 'i';

            let targetFont = baseFont.replace('.ttf', `${styleOpt}.ttf`);
            if (fsSync.existsSync(`C:/Windows/Fonts/${targetFont}`)) {
                return `:fontfile='C\\:/Windows/Fonts/${targetFont}'`;
            } else if (fsSync.existsSync(`C:/Windows/Fonts/${baseFont}`)) {
                return `:fontfile='C\\:/Windows/Fonts/${baseFont}'`;
            }
            return fsSync.existsSync('C:/Windows/Fonts/arial.ttf') ? `:fontfile='C\\:/Windows/Fonts/arial.ttf'` : '';
        };

        const hlFontOpt = getFontOpt(headlineCfg.font, headlineCfg.weight, headlineCfg.italic);
        const sumFontOpt = getFontOpt(summaryCfg.font, summaryCfg.weight, summaryCfg.italic);

        // 4. Build 9:16 (1080x1920) Filtergraph
        const filters = [];
        filters.push(`[0:v]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:1,scale=1080:1920:flags=bilinear,setsar=1[bg]`);

        let currentVideoPad = '[bg]';
        
        // Composite foreground image with cinematic Ken Burns slow zoom
        if (fgImagePath) {
            const baseW = Math.round(1080 * 0.85); // 918
            const imgScale = (layout.imageScale || 100) / 100;
            const targetW = Math.round(baseW * imgScale);
            filters.push(`[1:v]scale=w='${targetW}*(1+0.08*t/${durSec})':h=-1:eval=frame,setsar=1[fg]`);
            
            const posX = layout.imagePosX !== undefined ? `81+(918-w)*${layout.imagePosX/100}` : '(1080-w)/2';
            const posY = layout.imagePosY !== undefined ? `(1920-h)*${layout.imagePosY/100}` : '(1920-h)/2';
            
            filters.push(`${currentVideoPad}split=2[bg_clean][bg_for_overlay]`);
            filters.push(`[bg_for_overlay][fg]overlay=x=${posX}:y=${posY}:eval=frame[bg_spilled]`);
            filters.push(`[bg_spilled]crop=918:1920:81:0[bg_cropped]`);
            filters.push(`[bg_clean][bg_cropped]overlay=x=81:y=0[bg_fg]`);
            
            currentVideoPad = '[bg_fg]';
        }

        // Text & Box Configurations
        const actualBoxScale = (layout.boxScale || 100) / 100;
        
        const hlSize = Math.round((headlineCfg.size || 24) * scale * actualBoxScale);
        const hlColor = (headlineCfg.color || '#ffffff').replace('#', '0x');
        const sumSize = Math.round((summaryCfg.size || 13) * scale * actualBoxScale);
        const sumColor = (summaryCfg.color || '#d1d5db').replace('#', '0x');
        const cBg = (theme.colorBackground || '#000000').replace('#', '0x');
        const cPri = (theme.colorPrimary || '#f97316').replace('#', '0x');
        const cTheme = theme.cardTheme || 'Solid Box';
        
        const baseBoxW = Math.round(1080 * 0.85); // 85% container
        const boxWidth = Math.round(baseBoxW * ((layout.boxWidth || 100) / 100) * actualBoxScale);
        
        // Padding and Margin calculations (UI uses p-5 which is 20px, and mb-10 which is 40px)
        const uiPadding = 20 * scale * actualBoxScale;
        const uiMarginBottom = 40 * scale;
        
        // Text width estimation for wrapping
        const maxHlChars = Math.max(15, Math.floor((boxWidth - (uiPadding*2)) / (hlSize * 0.45)));
        const maxSumChars = Math.max(20, Math.floor((boxWidth - (uiPadding*2)) / (sumSize * 0.45)));
        const headlineLines = wrapText(manifest.headline || 'Breaking News', maxHlChars);
        const summaryLines = wrapText(manifest.summary || '', maxSumChars).slice(0, 10);
        
        const hlLineHeight = Math.round(hlSize * 1.2);
        const sumLineHeight = Math.round(sumSize * 1.4);
        
        // Box Height: paddingTop + (headline lines) + gap(12px in UI * scale) + (summary lines) + paddingBottom
        const contentGap = 12 * scale * actualBoxScale;
        let requiredContentHeight = uiPadding + (headlineLines.length * hlLineHeight) + contentGap + (summaryLines.length * sumLineHeight) + uiPadding;
        
        let boxHeight = layout.boxHeight ? Math.round(layout.boxHeight * scale * actualBoxScale) : requiredContentHeight;
        
        // Translation calculation from UI boxPos
        const uiBoxX = (layout.boxPos?.x || manifest.boxPos?.x || 0) * scale;
        const uiBoxY = (layout.boxPos?.y || manifest.boxPos?.y || 0) * scale;
        
        // Base boxX centers the 85% box. 
        let boxX = Math.round((1080 - boxWidth) / 2) + uiBoxX;
        // Base boxY places it at the bottom with margin-bottom
        let boxY = Math.round(1920 - boxHeight - uiMarginBottom) + uiBoxY;

        if (cTheme === 'Gradient Overlay' || cTheme === 'Slanted Bottom') {
            boxY = 1920 - boxHeight + uiBoxY; // Stick to bottom by default
        }

        // Draw Box Background
        const accentWidth = Math.round(6 * scale * actualBoxScale);
        const borderWidth = Math.round(2 * scale * actualBoxScale);

        if (cTheme === 'Gradient Overlay') {
            filters.push(`${currentVideoPad}drawbox=x=0:y=${boxY - 100}:w=1080:h=${boxHeight + 100}:color=${cBg}@0.85:t=fill[card1]`);
            currentVideoPad = '[card1]';
        } else if (cTheme === 'Accent Left' || cTheme === 'Minimal Quote') {
            const baseOpacity = cTheme === 'Minimal Quote' ? '0.0' : '0.9';
            filters.push(`${currentVideoPad}drawbox=x=${boxX}:y=${boxY}:w=${boxWidth}:h=${boxHeight}:color=${cBg}@${baseOpacity}:t=fill[card1]`);
            filters.push(`[card1]drawbox=x=${boxX}:y=${boxY}:w=${accentWidth}:h=${boxHeight}:color=${cPri}@0.95:t=fill[card2]`);
            currentVideoPad = '[card2]';
        } else if (cTheme === 'Bordered Box') {
            filters.push(`${currentVideoPad}drawbox=x=${boxX}:y=${boxY}:w=${boxWidth}:h=${boxHeight}:color=${cBg}@0.85:t=fill[card1]`);
            filters.push(`[card1]drawbox=x=${boxX}:y=${boxY}:w=${boxWidth}:h=${boxHeight}:color=${cPri}@0.9:t=${borderWidth}[card2]`);
            currentVideoPad = '[card2]';
        } else if (cTheme === 'Pill Shape') {
            const R = Math.round(boxHeight / 2);
            const geqExpr = `r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lt(X,${R}),if(lt(hypot(X-${R},Y-${R}),${R}),alpha(X,Y),0),if(gt(X,W-${R}),if(lt(hypot(X-(W-${R}),Y-${R}),${R}),alpha(X,Y),0),alpha(X,Y)))'`;
            filters.push(`color=c=${cBg}@0.9:s=${boxWidth}x${boxHeight},format=rgba,geq=${geqExpr}[pill_box]`);
            filters.push(`${currentVideoPad}[pill_box]overlay=x=${boxX}:y=${boxY}[card1]`);
            currentVideoPad = '[card1]';
        } else if (cTheme === 'Slanted Bottom') {
            const geqExpr = `r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(gt(Y, 0.15*H - X*(0.15*H/W)), alpha(X,Y), 0)'`;
            filters.push(`color=c=${cBg}@0.9:s=${boxWidth}x${boxHeight},format=rgba,geq=${geqExpr}[slanted_box]`);
            filters.push(`${currentVideoPad}[slanted_box]overlay=x=${boxX}:y=${boxY}[card1]`);
            currentVideoPad = '[card1]';
        } else {
            const opacity = cTheme === 'Glass Box' ? '0.5' : '0.9';
            filters.push(`${currentVideoPad}drawbox=x=${boxX}:y=${boxY}:w=${boxWidth}:h=${boxHeight}:color=${cBg}@${opacity}:t=fill[card1]`);
            currentVideoPad = '[card1]';
        }

        // Draw Texts
        let textBaseX = boxX + uiPadding;
        let textAvailWidth = boxWidth - (uiPadding * 2);
        
        if (cTheme === 'Accent Left' || cTheme === 'Minimal Quote') {
            textBaseX += accentWidth * 2;
            textAvailWidth -= accentWidth * 2;
        }

        const getAlignX = (align) => {
            if (align === 'center') return `${textBaseX}+(${textAvailWidth}-tw)/2`;
            if (align === 'right') return `${textBaseX}+${textAvailWidth}-tw`;
            return `${textBaseX}`; // left
        };

        const getAlphaOpt = (anim) => {
            if (anim && anim !== 'None') return `:alpha='min(t/0.8, 1)'`;
            return '';
        };

        const getAnimX = (anim, alignX) => {
            if (anim === 'Fade In Left') return `${alignX}-40*max(0,1-(t/0.8))`;
            if (anim === 'Fade In Right') return `${alignX}+40*max(0,1-(t/0.8))`;
            return alignX;
        };

        const getAnimY = (anim, startY) => {
            if (anim === 'Fade In Up') return `${startY}+40*max(0,1-(t/0.8))`;
            if (anim === 'Fade In Down') return `${startY}-40*max(0,1-(t/0.8))`;
            return startY;
        };

        let curY = boxY + uiPadding;

        for (let i = 0; i < headlineLines.length; i++) {
            const line = escapeText(headlineLines[i]);
            const nextPad = `[h_${i}]`;
            const alignX = getAlignX(headlineCfg.align);
            const animX = getAnimX(headlineCfg.anim, alignX);
            const animY = getAnimY(headlineCfg.anim, curY);
            const alphaOpt = getAlphaOpt(headlineCfg.anim);
            filters.push(`${currentVideoPad}drawtext=text='${line}'${hlFontOpt}:fontsize=${hlSize}:fontcolor=${hlColor}:x=${animX}:y=${animY}${alphaOpt}${nextPad}`);
            currentVideoPad = nextPad;
            curY += hlLineHeight;
        }

        curY += contentGap;
        for (let i = 0; i < summaryLines.length; i++) {
            const line = escapeText(summaryLines[i]);
            const nextPad = `[s_${i}]`;
            const alignX = getAlignX(summaryCfg.align);
            const animX = getAnimX(summaryCfg.anim, alignX);
            const animY = getAnimY(summaryCfg.anim, curY);
            const alphaOpt = getAlphaOpt(summaryCfg.anim);
            filters.push(`${currentVideoPad}drawtext=text='${line}'${sumFontOpt}:fontsize=${sumSize}:fontcolor=${sumColor}:x=${animX}:y=${animY}${alphaOpt}${nextPad}`);
            currentVideoPad = nextPad;
            curY += sumLineHeight;
        }

        // 5. Build FFmpeg Arguments
        const args = [];
        if (isImageBg) {
            args.push('-loop', '1', '-t', String(durSec), '-i', bgInputPath);
        } else {
            args.push('-stream_loop', '-1', '-t', String(durSec), '-i', bgInputPath);
        }

        let audioIdx = null;
        if (fgImagePath) {
            args.push('-loop', '1', '-t', String(durSec), '-i', fgImagePath);
        }
        if (audioInputPath) {
            audioIdx = fgImagePath ? 2 : 1;
            args.push('-t', String(durSec), '-i', audioInputPath);
        } else {
            // Check if bgInputPath has audio
            try {
                const { execSync } = require('child_process');
                const ffprobeBin = AppPaths.getFFprobePath();
                const probeAudio = execSync(`"${ffprobeBin}" -v error -select_streams a -show_entries stream=codec_type -of default=noprint_wrappers=1:nokey=1 "${bgInputPath}"`, { encoding: 'utf8' });
                if (probeAudio.trim() === 'audio') {
                    audioIdx = 0; // Use background audio
                } else {
                    // No audio found anywhere, add anullsrc to prevent failure if audio is expected
                    args.push('-f', 'lavfi', '-t', String(durSec), '-i', 'anullsrc=r=44100:cl=stereo');
                    audioIdx = fgImagePath ? 2 : 1;
                }
            } catch(e) {
                args.push('-f', 'lavfi', '-t', String(durSec), '-i', 'anullsrc=r=44100:cl=stereo');
                audioIdx = fgImagePath ? 2 : 1;
            }
        }

        args.push('-filter_complex', filters.join(';'));
        args.push('-map', currentVideoPad);
        if (audioIdx !== null) {
            args.push('-map', `${audioIdx}:a`);
        }
        args.push('-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p');
        if (audioIdx !== null) {
            args.push('-c:a', 'aac', '-b:a', '128k', '-shortest');
        }

        PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'NewsCreatorEngine' });

        PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_STARTED, { stage: 'Renderer' });
        const renderer = new Renderer();
        const rendererRes = await renderer.render(job, args, outPath);
        if (!rendererRes.success) {
            throw rendererRes.errors?.[0] || new Error('Renderer failed');
        }
        PipelineLifecycle.emit(context, PipelineLifecycle.Events.STAGE_FINISHED, { stage: 'Renderer' });

        const statistics = {
            totalExecutionTimeMs: Date.now() - globalStart,
            totalNodes: 5
        };

        const renderArtifact = new RenderArtifact(
            { type: 'NewsCreatorRecipe', manifest },
            { type: 'NewsCreatorPlan', duration: durSec },
            { metadata: { totalNodes: 5 } },
            filters.join(';'),
            args.join(' '),
            { outPath },
            config?.output || {},
            [],
            statistics,
            { warnings: [] }
        );

        PipelineLifecycle.emit(context, PipelineLifecycle.Events.PIPELINE_COMPLETED, { artifactId: renderArtifact.id });
        Logger.info('RenderPipeline', `News Creator Pipeline Complete. Output: ${outPath}`);

        return {
            success: true,
            artifact: renderArtifact
        };
    }
}

module.exports = RenderPipeline;
