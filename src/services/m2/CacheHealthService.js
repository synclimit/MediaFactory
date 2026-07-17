function getReferencedSources() {
  const referencedUris = new Set();
  const queueIds = new Set();

  const extractFromJob = (job) => {
    if (!job) return;
    if (job.queueId) {
      queueIds.add(job.queueId);
    }
    if (job.tracks && Array.isArray(job.tracks)) {
      job.tracks.forEach(track => {
        let uri = '';
        if (typeof track === 'string') uri = track;
        else if (track.uri) uri = track.uri;
        else if (track.title) uri = track.title;
        if (uri) referencedUris.add(uri);
      });
    }
  };

  const keys = ['mediafactory_m2_queue', 'mediafactory_m2_completed'];
  keys.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(extractFromJob);
        } else if (typeof parsed === 'object') {
          extractFromJob(parsed);
        }
      }
    } catch (e) {
      // Ignore
    }
  });

  return {
    referencedUris: Array.from(referencedUris),
    queueIds: Array.from(queueIds)
  };
}

export class CacheHealthService {
  async getStats() {
    const payload = getReferencedSources();
    const response = await fetch('/api/m2/cache/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to fetch cache stats');
    return response.json();
  }

  async validate() {
    const response = await fetch('/api/m2/cache/validate', { method: 'POST' });
    if (!response.ok) throw new Error('Failed to validate cache');
    return response.json();
  }

  async clear() {
    const response = await fetch('/api/m2/cache/clear', { method: 'POST' });
    if (!response.ok) throw new Error('Failed to clear cache');
    return response.json();
  }

  async removeOrphans() {
    const payload = getReferencedSources();
    const response = await fetch('/api/m2/cache/remove-orphans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to remove orphans');
    return response.json();
  }
}

export const m2CacheHealthService = new CacheHealthService();
