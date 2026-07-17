export class PlaybackBuilder {
  static build(job) {
    const playbackSpeed = job.playbackSpeed || 1.0;
    return { filter: `setpts=(1/${playbackSpeed})*PTS` };
  }
}
