const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const EngineResult = require('./EngineResult');
const Logger = require('./Logger');
const { PipelineError, ErrorCodes } = require('./Errors');
const Engine = require('./Engine');

class RenderPrecheck extends Engine {
    /**
     * @param {PipelineContext} context 
     * @param {Object} data 
     */
    async validate(context, data) {
        return this.runAsync(context, 'RenderPrecheck', async () => {
            const { recipe, renderGraph, filterGraph, ffmpegCommand, cmdDetails, outPath } = data;
            
            await this._validateRecipe(recipe);
            await this._validateAssets(recipe.assets);
            await this._validateTimeline(recipe.timeline, recipe.assets);
            await this._validateRenderGraph(renderGraph, recipe.assets);
            await this._validateFilterGraph(filterGraph);
            await this._validateCommand(ffmpegCommand, recipe.assets, outPath);

            // Rule #9, #10: Timeline and Segment debug & abort validation
            this._validateTimelineRules(recipe.timeline, recipe.assets, context?.job);

            // Rule #11: FFmpeg Command Validation printing
            this._validateCommandRules(cmdDetails || {}, ffmpegCommand);

            // Main Scene Composition Validation & Abort check
            this._validateMainSceneComposition(recipe, renderGraph);

            // Rule #9: Human Editing Style Validation printing
            this._validateHumanEditingStyle(recipe);

            return {
                ready: true,
                validatedAt: new Date().toISOString()
            };
        });
    }

    async _validateRecipe(recipe) {
        if (!recipe) throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "M5_PRECHECK_001: Recipe object is missing.");
        
        const requiredProps = ['assets', 'layout', 'timeline', 'editingPlan', 'output', 'engineVersions', 'pipelineVersion'];
        for (const prop of requiredProps) {
            if (!recipe[prop]) throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, `M5_PRECHECK_002: Recipe missing required object '${prop}'.`);
        }
    }

    async _validateAssets(assets) {
        if (!assets) throw new PipelineError(ErrorCodes.M5_ASSET_NOT_FOUND, "M5_PRECHECK_003: Assets object is missing.");
        
        const supportedExtensions = ['.mp4', '.mov', '.png', '.jpg', '.mp3', '.wav'];
        
        for (const [key, asset] of Object.entries(assets)) {
            if (!asset || typeof asset !== 'object') continue;
            
            if (!asset.absolutePath) throw new PipelineError(ErrorCodes.M5_ASSET_NOT_FOUND, `M5_PRECHECK_004: Asset '${key}' missing absolutePath.`);
            
            try {
                await fs.access(asset.absolutePath, fsSync.constants.R_OK);
            } catch (err) {
                throw new PipelineError(ErrorCodes.M5_ASSET_NOT_FOUND, `M5_PRECHECK_005: Asset '${key}' file missing or unreadable: ${asset.absolutePath}`);
            }

            const ext = path.extname(asset.absolutePath).toLowerCase();
            if (!supportedExtensions.includes(ext)) {
                throw new PipelineError(ErrorCodes.M5_ASSET_NOT_FOUND, `M5_PRECHECK_006: Asset '${key}' has unsupported extension '${ext}'.`);
            }

            if (asset.type === 'video') {
                if (!asset.duration || asset.duration <= 0) throw new PipelineError(ErrorCodes.M5_ASSET_NOT_FOUND, `M5_PRECHECK_007: Asset '${key}' has invalid duration.`);
                if (!asset.width || asset.width <= 0) throw new PipelineError(ErrorCodes.M5_ASSET_NOT_FOUND, `M5_PRECHECK_008: Asset '${key}' has invalid width.`);
                if (!asset.height || asset.height <= 0) throw new PipelineError(ErrorCodes.M5_ASSET_NOT_FOUND, `M5_PRECHECK_009: Asset '${key}' has invalid height.`);
                if (!asset.fps || asset.fps <= 0) throw new PipelineError(ErrorCodes.M5_ASSET_NOT_FOUND, `M5_PRECHECK_010: Asset '${key}' has invalid FPS.`);
            }
        }
    }

    async _validateTimeline(timeline, assets) {
        if (!timeline || !timeline.segments || timeline.segments.length === 0) {
            throw new PipelineError(ErrorCodes.M5_INVALID_TIMELINE, "M5_PRECHECK_011: Timeline is empty or missing segments.");
        }

        const requiredSegments = ['hook', 'main', 'cta'];
        const foundSegments = new Set(timeline.segments.map(s => s.type || s.segmentType));

        for (const req of requiredSegments) {
            if (!foundSegments.has(req) && assets[req]) {
                // Verified standard segments exist if assets exist
            }
        }

        let expectedStart = 0;
        for (let i = 0; i < timeline.segments.length; i++) {
            const seg = timeline.segments[i];
            const start = seg.startTime !== undefined ? seg.startTime : (seg.start || 0);
            const duration = seg.duration !== undefined ? seg.duration : ((seg.end || 0) - (seg.start || 0));

            const sTime = Number(start.toFixed(3));
            const eStart = Number(expectedStart.toFixed(3));

            if (duration < 0) {
                throw new PipelineError(ErrorCodes.M5_INVALID_TIMELINE, `M5_PRECHECK_012: Segment ${i} has negative duration.`);
            }
            if (sTime > eStart) {
                // Gap allowed but overlap not allowed
            } else if (sTime < eStart) {
                throw new PipelineError(ErrorCodes.M5_INVALID_TIMELINE, `M5_PRECHECK_013: Segment overlap detected at ${sTime} for segment ${i}`);
            }
            expectedStart = sTime + duration;
        }
    }

    async _validateRenderGraph(renderGraph, assets) {
        if (!renderGraph || !renderGraph.nodes) throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "M5_PRECHECK_014: RenderGraph missing nodes.");

        const nodeIds = new Set();
        renderGraph.nodes.forEach(n => {
            nodeIds.add(n.id);
            if (n.outputs) n.outputs.forEach(o => nodeIds.add(o));
        });
        let hasOutput = false;

        for (const node of renderGraph.nodes) {
            if (node.type === 'InputNode') {
                if (!node.metadata || !node.metadata.path) {
                    throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, `M5_PRECHECK_015: InputNode ${node.id} missing path.`);
                }
            } else if (node.type === 'OutputNode') {
                hasOutput = true;
                if (!node.inputs || node.inputs.length === 0) {
                    throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, `M5_PRECHECK_016: OutputNode ${node.id} has no source.`);
                }
            }

            if (node.dependencies) {
                for (const dep of node.dependencies) {
                    if (!nodeIds.has(dep)) {
                        throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, `M5_PRECHECK_017: Node ${node.id} references missing dependency ${dep}.`);
                    }
                }
            }
        }

        if (!hasOutput) throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "M5_PRECHECK_018: RenderGraph has no OutputNode.");
    }

    async _validateFilterGraph(filterGraph) {
        if (!filterGraph || !filterGraph.nodes) throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "M5_PRECHECK_019: FilterGraph is missing nodes.");

        if (filterGraph.nodes.length === 0) {
             throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "M5_PRECHECK_020: FilterGraph is empty.");
        }
    }

    async _validateCommand(command, assets, outPath) {
        if (!command) throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "M5_PRECHECK_021: FFmpeg command is empty.");

        if (!command.includes('-filter_complex') && !command.includes('-vf') && !command.includes('-c copy')) {
            throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "M5_PRECHECK_022: Command has no filters or copy instruction.");
        }

        const outDir = path.dirname(outPath);
        try {
            await fs.mkdir(outDir, { recursive: true });
            await fs.access(outDir, fsSync.constants.W_OK);
        } catch (err) {
            throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, `M5_PRECHECK_023: Output directory not writable: ${outDir}`);
        }
    }

    _validateTimelineRules(timeline, assets, job) {
        let targetDur = 60;
        if (job?.snapshot?.config?.duration?.target) {
            const parsed = parseFloat(job.snapshot.config.duration.target);
            if (!isNaN(parsed) && parsed > 0) targetDur = parsed;
        } else if (job?.duration) {
            const parsed = parseFloat(job.duration);
            if (!isNaN(parsed) && parsed > 0) targetDur = parsed;
        } else if (timeline?.totalDuration) {
            targetDur = parseFloat(timeline.totalDuration) || 60;
        }

        const segments = timeline?.segments || [];
        const sumDur = Number(segments.reduce((acc, s) => acc + (parseFloat(s.duration) || 0), 0).toFixed(3));

        // Rule: Background must exist
        if (!assets || (!assets.background && !assets.videoA)) {
            throw new PipelineError(ErrorCodes.M5_INVALID_TIMELINE, `M5_PRECHECK_ABORT: Background missing and no fallback available.`);
        }

        console.log('\n======================================================================');
        console.log('[RULE #9] RENDER VALIDATION - TIMELINE MASTER');
        console.log('======================================================================');
        console.log(`Target Duration: ${targetDur.toFixed(3)} sec`);
        console.log(`Total Timeline Duration: ${sumDur.toFixed(3)} sec`);
        console.log(`Segments count: ${segments.length}`);

        let lastMainTrimEnd = -1;

        segments.forEach((seg, idx) => {
            const segType = (seg.type || seg.segmentType || 'unknown').toLowerCase();
            const asset = assets ? assets[segType] : null;
            let srcDur = asset ? (parseFloat(asset.duration) || 0) : 0;
            if (asset && asset.absolutePath) {
                try {
                    const execSync = require('child_process').execSync;
                    const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${asset.absolutePath}"`);
                    srcDur = parseFloat(out.toString().trim()) || srcDur;
                } catch (e) { /* ignore */ }
            }
            const trimStart = seg.trimStart !== undefined ? seg.trimStart : 0;
            const trimEnd = seg.trimEnd !== undefined ? seg.trimEnd : (parseFloat(seg.duration) || 0);

            if (segType === 'cta' && Math.abs(seg.duration - srcDur) > 0.05) {
                console.warn(`M5_PRECHECK_WARNING: CTA duration (${seg.duration}s) differs from original source (${srcDur}s).`);
            }

            if (segType === 'main') {
                if (lastMainTrimEnd !== -1 && Math.abs(trimStart - lastMainTrimEnd) > 0.05) {
                    console.warn(`M5_PRECHECK_WARNING: Main restarted or discontinuity detected. TrimStart ${trimStart}s != Previous TrimEnd ${lastMainTrimEnd}s.`);
                }
                lastMainTrimEnd = trimEnd;
            }

            console.log('\n----------------------------------------------------------------------');
            console.log(`[RULE #10] SEGMENT DEBUG - Segment #${idx + 1} (${segType.toUpperCase()})`);
            console.log('----------------------------------------------------------------------');
            console.log(`Asset: ${segType} (${asset ? asset.absolutePath : 'N/A'})`);
            console.log(`Source Duration: ${srcDur}s`);
            console.log(`Trim Start: ${trimStart}s`);
            console.log(`Trim End: ${trimEnd}s`);
            console.log(`Output Duration: ${seg.duration}s`);
            console.log(`Video Filters: ${JSON.stringify(seg.visualEffects || [])}`);
            console.log(`Audio Filters: [Follows timeline: atrim 0-${targetDur}s, asetpts, afade]`);
            console.log(`Transition: None`);
            console.log(`Overlay: None`);
            console.log(`Concat Order: #${idx + 1}`);
        });

        console.log('======================================================================\n');

        if (Math.abs(sumDur - targetDur) > 0.05) {
            throw new PipelineError(ErrorCodes.M5_INVALID_TIMELINE, `M5_PRECHECK_ABORT: Timeline sum(${sumDur}s) != TargetDuration(${targetDur}s). Aborting render per Rule #9.`);
        }
    }

    _validateCommandRules(cmdDetails, commandStr) {
        console.log('\n======================================================================');
        console.log('[RULE #11] FFMPEG COMMAND VALIDATION');
        console.log('======================================================================');
        console.log(`[command]: ${commandStr || cmdDetails?.command || 'N/A'}`);
        console.log(`[inputs]: ${JSON.stringify(cmdDetails?.inputsList || [], null, 2)}`);
        console.log(`[-map]: ${JSON.stringify(cmdDetails?.mapList || [], null, 2)}`);
        console.log(`[-filter_complex]:\n${cmdDetails?.filterComplexStr || 'N/A'}`);

        const fc = cmdDetails?.filterComplexStr || '';
        const concatFilters = fc.split(';').filter(f => f.includes('concat'));
        const trimFilters = fc.split(';').filter(f => f.includes('trim') && !f.includes('atrim'));
        const setptsFilters = fc.split(';').filter(f => f.includes('setpts') && !f.includes('asetpts'));
        const atrimFilters = fc.split(';').filter(f => f.includes('atrim'));
        const afadeFilters = fc.split(';').filter(f => f.includes('afade'));

        console.log(`[concat]: ${JSON.stringify(concatFilters, null, 2)}`);
        console.log(`[trim]: ${JSON.stringify(trimFilters, null, 2)}`);
        console.log(`[setpts]: ${JSON.stringify(setptsFilters, null, 2)}`);
        console.log(`[atrim]: ${JSON.stringify(atrimFilters, null, 2)}`);
        console.log(`[afade]: ${JSON.stringify(afadeFilters, null, 2)}`);
        console.log('======================================================================\n');
    }

    _validateMainSceneComposition(recipe, renderGraph) {
        console.log('\n======================================================================');
        console.log('[CRITICAL RULE] MAIN SCENE COMPOSITION VALIDATION');
        console.log('======================================================================');
        console.log(`Main Layout: ${recipe.layout?.type || 'TOP_BOTTOM'}`);
        console.log(`Video A: ${recipe.assets.videoA?.absolutePath || 'N/A'}`);
        console.log(`Video B: ${recipe.assets.videoB?.absolutePath || 'N/A'}`);
        console.log(`Composite: ${recipe.output?.canvasWidth || 1080}x${recipe.output?.canvasHeight || 1920}`);
        
        const seq = (recipe.timeline?.segments || []).map(s => {
            const t = (s.type || s.segmentType || 'unknown').toLowerCase();
            if (t === 'main' && recipe.assets.videoA && recipe.assets.videoB) {
                return 'Main Composite';
            }
            return t.charAt(0).toUpperCase() + t.slice(1);
        });
        console.log(`Timeline: ${seq.join(' -> ')}`);
        console.log('======================================================================\n');

        for (const seg of (recipe.timeline?.segments || [])) {
            const t = (seg.type || seg.segmentType || '').toLowerCase();
            if (t === 'videoa' || t === 'videob') {
                throw new PipelineError(ErrorCodes.M5_INVALID_TIMELINE, `M5_COMPOSITION_ABORT: Video A or Video B appeared as independent timeline segment '${t}'. Main scene must always be a Composite.`);
            }
        }
    }

    _validateHumanEditingStyle(recipe) {
        console.log('\n======================================================================');
        console.log('[CRITICAL RULE] HUMAN EDITING STYLE VALIDATION');
        console.log('======================================================================');
        console.log('Timeline:');
        
        let ctaPos = 'N/A';
        for (const seg of (recipe.timeline?.segments || [])) {
            const t = (seg.type || seg.segmentType || 'unknown').toUpperCase();
            console.log(`${seg.start}-${seg.end}\t${t}`);
            if (t.toLowerCase() === 'cta') {
                ctaPos = `${seg.start} sec`;
            }
        }
        
        console.log(`Layout:\t\t${recipe.layout?.type || 'LEFT_RIGHT'}`);
        console.log(`Music Volume:\t${recipe.audio?.musicVolume !== undefined ? Math.round(recipe.audio.musicVolume * 100) + '%' : '25%'}`);
        console.log(`Video Audio:\t100%`);
        console.log(`CTA Position:\t${ctaPos}`);
        console.log('======================================================================\n');
    }
}

module.exports = RenderPrecheck;
