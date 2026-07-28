import fs from 'fs/promises';
import path from 'path';

export class LoopBuilder {
  static async build(job) {
    const finalTargetDuration = job.audioDurationSec || job.computedTargetDuration || 300;
    job.computedTargetDuration = finalTargetDuration; // Expose for Render Engine tracking

    const tempSegmentDuration = job.tempSegmentDuration || 1; 
    const repeats = Math.ceil(finalTargetDuration / tempSegmentDuration);

    const jobIdClean = (job.id || 'temp').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
    const cacheDir = path.resolve('Workspace/Cache/M1');
    await fs.mkdir(cacheDir, { recursive: true });
    const concatTxtPath = path.join(cacheDir, `concat_${jobIdClean}.txt`).replace(/\\/g, '/');

    // Generate concat.txt content
    let concatContent = '';
    for (let i = 0; i < repeats; i++) {
      const tempPath = path.join(cacheDir, `temp_segment_${jobIdClean}.mp4`).replace(/\\/g, '/');
      concatContent += `file '${tempPath}'\n`;
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
