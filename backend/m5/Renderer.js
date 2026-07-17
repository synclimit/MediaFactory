const { spawn, execSync } = require('child_process');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const EngineResult = require('./core/EngineResult');
const Logger = require('./core/Logger');
const { PipelineEmitter, PipelineEvents } = require('./core/Events');

class Renderer {
    /**
     * @param {Object} job 
     * @param {string} ffmpegCmd 
     * @param {string} outPath 
     */
    async render(job, ffmpegCmd, outPath, recipe = null, renderGraph = null) {
        const start = Logger.start('Renderer', `Executing Job ${job.id}`);
        
        try {
            await fs.mkdir(path.dirname(outPath), { recursive: true });

            let args;
            if (ffmpegCmd && Array.isArray(ffmpegCmd.args)) {
                args = ['ffmpeg', ...ffmpegCmd.args];
            } else if (Array.isArray(ffmpegCmd)) {
                args = ffmpegCmd[0] === 'ffmpeg' ? [...ffmpegCmd] : ['ffmpeg', ...ffmpegCmd];
            } else if (typeof ffmpegCmd === 'string') {
                args = ffmpegCmd.match(/(?:[^\s"]+|"[^"]*")+/g).map(s => s.replace(/^"|"$/g, ''));
            } else {
                throw new Error('Invalid ffmpegCmd passed to Renderer');
            }
            args.splice(1, 0, '-progress', 'pipe:1'); // Inject progress reporting (no -nostats, it can break output)
            args.push('-y', outPath); // Append output path with overwrite flag
            
            if (recipe && renderGraph) {
                const ctaSeg = recipe.timeline?.segments?.find(s => s.type?.toLowerCase() === 'cta' || s.segmentType?.toLowerCase() === 'cta');
                const ctaAsset = recipe.assets?.cta;
                const bgAsset = recipe.assets?.background;
                const scenes = renderGraph.nodes.filter(n => n.type === 'CompositeNode' || (n.type === 'TrimNode' && (n.metadata?.assetId === 'cta' || n.metadata?.file === 'cta')));
                const overlays = renderGraph.nodes.filter(n => n.type === 'OverlayNode');
                const concats = renderGraph.nodes.filter(n => n.type === 'ConcatNode');

                console.log('\n=========================');
                console.log('RUNTIME VALIDATION');
                console.log('=========================');
                console.log(`CTA Source Duration: ${ctaAsset?.duration || 'N/A'}`);
                console.log(`CTA Timeline Duration: ${ctaSeg?.duration || 'N/A'}`);
                console.log(`CTA Trim Start: ${ctaSeg?.trimStart !== undefined ? ctaSeg.trimStart : 'N/A'}`);
                console.log(`CTA Trim End: ${ctaSeg?.trimEnd !== undefined ? ctaSeg.trimEnd : 'N/A'}`);
                console.log(`Background Enabled: ${!!bgAsset}`);
                console.log(`Background Source: ${bgAsset?.absolutePath || 'N/A'}`);
                console.log(`Background Loop: ${!!(bgAsset?.loop || renderGraph.nodes.find(n => n.type === 'InputNode' && n.metadata?.file === 'background')?.metadata?.loop)}`);
                console.log(`Scene Count: ${recipe.timeline?.segments?.length || 0}`);
                console.log(`Overlay Count: ${overlays.length}`);
                console.log(`Concat Count: ${concats.length}`);
                
                console.log('\n=========================');
                console.log('RUNTIME PATH VERIFICATION');
                console.log('=========================');
                ['background', 'videoA', 'videoB', 'cta'].forEach(key => {
                    console.log(`${key.toUpperCase()}\n${recipe.assets?.[key]?.absolutePath || 'N/A'}\n`);
                });
            }

            console.log('\n=========================');
            console.log('REAL FFMPEG COMMAND');
            console.log('=========================\n');
            console.log(args.join(' '));
            console.log('\n=========================\n');
            
            PipelineEmitter.emit(PipelineEvents.RENDER_STARTED, { jobId: job.id, outPath });

            const renderStartTime = Date.now();

            return new Promise((resolve, reject) => {
                const ffProc = spawn(args[0], args.slice(1));
                
                // Strategy 1: Parse actual total duration from FFmpeg stderr (most accurate)
                // This captures ALL input streams and finds the longest
                let totalDurationSec = 0;
                
                // Strategy 2 (fallback): Use job's target duration from config
                let targetSeconds = 60;
                const durStr = job.snapshot?.manifest?.duration || job.duration || '60s';
                const parsedDur = parseInt(durStr, 10);
                if (!isNaN(parsedDur) && parsedDur > 0) {
                    targetSeconds = parsedDur;
                }
                
                let errLog = '';
                let lastProgress = 0;
                
                // Parse stderr to get actual render duration
                // FFmpeg prints "Duration: HH:MM:SS.ms" for each output stream
                ffProc.stderr.on('data', (data) => {
                    const text = data.toString();
                    errLog += text;
                    
                    // Find all Duration entries, take the LARGEST one (the output duration)
                    const durMatches = [...text.matchAll(/Duration:\s+(\d+):(\d+):(\d+\.?\d*)/g)];
                    for (const match of durMatches) {
                        const h = parseInt(match[1], 10);
                        const m = parseInt(match[2], 10);
                        const s = parseFloat(match[3]);
                        const durSec = h * 3600 + m * 60 + s;
                        if (durSec > totalDurationSec && durSec < 7200) { // cap at 2 hours to avoid bogus values
                            totalDurationSec = durSec;
                        }
                    }

                    // Fallback progress parsing from stderr "time=HH:MM:SS.ms"
                    const timeMatches = [...text.matchAll(/time=(\d+):(\d+):(\d+\.?\d*)/g)];
                    if (timeMatches.length > 0) {
                        const match = timeMatches[timeMatches.length - 1]; // get latest in chunk
                        const h = parseInt(match[1], 10);
                        const m = parseInt(match[2], 10);
                        const s = parseFloat(match[3]);
                        const currentSec = h * 3600 + m * 60 + s;
                        
                        // Prioritize target duration since input streams might be much longer (e.g. 1 hour video trimmed to 30s)
                        const denominator = targetSeconds > 0 ? targetSeconds : Math.max(totalDurationSec, 15);
                        let progress = Math.floor((currentSec / denominator) * 100);
                        if (progress > 99) progress = 99;
                        if (progress < 0) progress = 0;
                        
                        if (progress !== lastProgress) {
                            lastProgress = progress;
                            console.log(`[Renderer] ${job.id} → ${currentSec.toFixed(1)}s / ${denominator.toFixed(1)}s = ${progress}%`);
                            PipelineEmitter.emit(PipelineEvents.RENDER_PROGRESS, { jobId: job.id, progress });
                        }
                    }
                });

                // Parse stdout progress events
                ffProc.stdout.on('data', (data) => {
                    const text = data.toString();

                    // Try parsing out_time directly (HH:MM:SS.ffffff format) - most reliable
                    const outTimeMatch = text.match(/out_time=(\d+):(\d+):(\d+\.?\d*)/);
                    if (outTimeMatch) {
                        const h = parseInt(outTimeMatch[1], 10);
                        const m = parseInt(outTimeMatch[2], 10);
                        const s = parseFloat(outTimeMatch[3]);
                        const currentSec = h * 3600 + m * 60 + s;
                        
                        // Prioritize target duration
                        const denominator = targetSeconds > 0 ? targetSeconds : Math.max(totalDurationSec, 15);
                        
                        if (denominator > 0) {
                            let progress = Math.floor((currentSec / denominator) * 100);
                            if (progress > 99) progress = 99;
                            if (progress < 0) progress = 0;
                            
                            // Only emit if progress changed (avoid flooding SSE)
                            if (progress !== lastProgress) {
                                lastProgress = progress;
                                console.log(`[Renderer] ${job.id} → ${currentSec.toFixed(1)}s / ${denominator.toFixed(1)}s = ${progress}%`);
                                PipelineEmitter.emit(PipelineEvents.RENDER_PROGRESS, { jobId: job.id, progress });
                            }
                        }
                    }
                });

                ffProc.on('close', (code) => {
                    const renderDurationSec = (Date.now() - renderStartTime) / 1000;
                    
                    console.log('\n=========================');
                    console.log('FFMPEG STDERR');
                    console.log('=========================\n');
                    console.log(errLog);
                    console.log('\n=========================\n');
                    
                    if (code === 0) {
                        try {
                            const probe = execSync(`ffprobe -v quiet -print_format json -show_format -show_streams "${outPath}"`);
                            const probeData = JSON.parse(probe.toString());
                            const format = probeData.format || {};
                            const videoStream = probeData.streams?.find(s => s.codec_type === 'video') || {};
                            const audioStream = probeData.streams?.find(s => s.codec_type === 'audio') || {};

                            console.log('\n=========================');
                            console.log('OUTPUT FILE VERIFICATION');
                            console.log('=========================');
                            console.log(`Duration: ${format.duration || 'N/A'}`);
                            console.log(`Resolution: ${videoStream.width || 'N/A'}x${videoStream.height || 'N/A'}`);
                            console.log(`FPS: ${eval(videoStream.r_frame_rate || '0')}`);
                            console.log(`Video Codec: ${videoStream.codec_name || 'N/A'}`);
                            console.log(`Audio Codec: ${audioStream.codec_name || 'N/A'}`);
                            console.log('=========================\n');
                        } catch (e) {
                            console.error('Failed to probe output file:', e.message);
                        }

                        PipelineEmitter.emit(PipelineEvents.RENDER_FINISHED, { jobId: job.id, renderDurationSec });
                        const { executionTimeMs, memoryDeltaKb } = Logger.finish('Renderer', start, 'Render completed successfully');
                        
                        resolve(EngineResult.success({
                            outPath,
                            renderDurationSec
                        }, { executionTimeMs, memoryDeltaKb }));
                    } else {
                        PipelineEmitter.emit(PipelineEvents.RENDER_FAILED, { jobId: job.id, code });
                        console.error(`[Renderer] FFmpeg FAILED (code ${code}):\n${errLog}`);
                        const error = new Error(`FFmpeg exit code ${code}\nLog: ${errLog.substring(0, 1000)}`);
                        error.code = 'M5_FFMPEG_ERROR';
                        Logger.error('Renderer', 'Render failed', error);
                        
                        const { executionTimeMs, memoryDeltaKb } = Logger.finish('Renderer', start, 'Render failed');
                        resolve(EngineResult.error(error, { executionTimeMs, memoryDeltaKb }));
                    }
                });

                ffProc.on('error', (err) => {
                    PipelineEmitter.emit(PipelineEvents.RENDER_FAILED, { jobId: job.id, err: err.message });
                    err.code = 'M5_FFMPEG_ERROR';
                    Logger.error('Renderer', 'Spawn Error', err);
                    
                    const { executionTimeMs, memoryDeltaKb } = Logger.finish('Renderer', start, 'Spawn Error');
                    resolve(EngineResult.error(err, { executionTimeMs, memoryDeltaKb }));
                });
            });
        } catch (error) {
            Logger.error('Renderer', 'Setup failed', error);
            const { executionTimeMs, memoryDeltaKb } = Logger.finish('Renderer', start, 'Setup failed');
            return EngineResult.error(error, { executionTimeMs, memoryDeltaKb });
        }
    }
}

module.exports = Renderer;
