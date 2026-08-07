export class SegmentBuilder {
  static build(job) {
    let filter = `trim=start=${job.segmentStartSec}:end=${job.segmentEndSec},setpts=PTS-STARTPTS`;
    const rotation = job.rotation || job.effects?.rotation || 0;
    if (rotation === 90) {
      filter += `,transpose=1`;
    } else if (rotation === 180) {
      filter += `,transpose=1,transpose=1`;
    } else if (rotation === 270) {
      filter += `,transpose=2`;
    }
    return { filter };
  }
}
