import fs from 'fs/promises';
import path from 'path';
import AppPaths from '../../../../backend/system/AppPaths.js';

export class LoopBuilder {
  static async build(job) {
    const finalTargetDuration = job.computedTargetDuration || (job.audioDurationSec ? job.audioDurationSec + (typeof job.bufferSec === 'number' ? job.bufferSec : 300) : 300);
    job.computedTargetDuration = finalTargetDuration; // Expose for Render Engine tracking

    const tempSegmentDuration = job.tempSegmentDuration || 1; 
    const repeats = Math.ceil(finalTargetDuration / tempSegmentDuration);

    const jobIdClean = (job.id || 'temp').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
    const cacheBase = AppPaths ? AppPaths.getCacheBase() : path.resolve('.mediafactory_data/Cache');
    const cacheDir = path.join(cacheBase, 'm1');
    await fs.mkdir(cacheDir, { recursive: true });
    const concatTxtPath = path.join(cacheDir, `concat_${jobIdClean}.txt`).replace(/\\/g, '/');

    // Generate concat.txt content with safe escaping for FFmpeg concat demuxer
    let concatContent = '';
    const tempPath = path.join(cacheDir, `temp_segment_${jobIdClean}.mp4`).replace(/\\/g, '/');
    const escapedTempPath = tempPath.replace(/'/g, "'\\''");
    for (let i = 0; i < repeats; i++) {
      concatContent += `file '${escapedTempPath}'\n`;
    }

    await fs.writeFile(concatTxtPath, concatContent, 'utf-8');

    // Return as an input node
    return {
      globalInputArgs: [['-f', 'concat'], ['-safe', '0']],
      inputs: [{ path: concatTxtPath, args: [] }],
      outputArgs: [['-t', finalTargetDuration.toString()]]
    };
  }
}
