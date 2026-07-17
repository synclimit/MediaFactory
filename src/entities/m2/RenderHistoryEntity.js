export function createRenderHistoryRecord(job, finalStatus, engineVersion = '10G') {
  let masteringChain = '';
  if (job.masteringSettings) {
    const m = job.masteringSettings;
    const filters = [];
    filters.push(`loudnorm=I=${m.targetLufs}:TP=-1.0:LRA=11`);
    if (m.compressor) filters.push('acompressor');
    if (m.outputGain !== '0') filters.push(`volume=${m.outputGain}dB`);
    if (m.limiter) filters.push('alimiter=limit=-0.5dB');
    masteringChain = filters.join('\n');
  } else {
    masteringChain = 'c: copy';
  }

  let renderTimeSeconds = 0;
  if (job.createdAt && job.completedAt) {
    const start = new Date(job.createdAt).getTime();
    const end = new Date(job.completedAt).getTime();
    if (!isNaN(start) && !isNaN(end)) {
      renderTimeSeconds = Math.max(0, Math.floor((end - start) / 1000));
    }
  }

  return {
    renderId: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    queueId: job.queueId,
    renderName: job.renderName || 'Unknown Render',
    outputPath: job.outputPath || null,
    outputSizeMb: job.outputSizeMb || null,
    duration: job.duration || '0:00',
    trackCount: job.trackCount || 0,
    masteringProfile: job.audioProfile || (job.masteringSettings ? job.masteringSettings.name : 'Unknown'),
    masteringChain: masteringChain,
    completedAt: job.completedAt || new Date().toISOString(),
    renderTimeSeconds: renderTimeSeconds,
    status: finalStatus,
    failureReason: finalStatus === 'FAILED' ? (job.failureReason || 'Unknown Error') : null,
    renderEngineVersion: engineVersion,
  };
}
