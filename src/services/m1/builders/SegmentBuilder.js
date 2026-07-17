export class SegmentBuilder {
  static build(job) {
    return { filter: `trim=start=${job.segmentStartSec}:end=${job.segmentEndSec},setpts=PTS-STARTPTS` };
  }
}
