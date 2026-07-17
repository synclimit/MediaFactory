import fs from 'fs/promises';
import path from 'path';

export class LoopBuilder {
  static async build(job) {
    const finalTargetDuration = job.audioDurationSec + (job.bufferSec || 300);
    job.computedTargetDuration = finalTargetDuration; // Expose for Render Engine tracking

    const tempSegmentDuration = job.tempSegmentDuration || 1; 
    const repeats = Math.ceil(finalTargetDuration / tempSegmentDuration);

    const cacheDir = path.resolve('Workspace/Cache/M1');
    await fs.mkdir(cacheDir, { recursive: true });
    const concatTxtPath = path.join(cacheDir, 'concat.txt');

    // Generate concat.txt content
    // We assume temp_segment.mp4 is located in the same directory
    // Format: file 'temp_segment.mp4'
    let concatContent = '';
    for (let i = 0; i < repeats; i++) {
      // Must use absolute path or relative to concat.txt. Let's use absolute with forward slashes for FFmpeg safety.
      const tempPath = path.join(cacheDir, 'temp_segment.mp4').replace(/\\/g, '/');
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
