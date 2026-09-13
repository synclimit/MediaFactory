import { getApiUrl } from './apiUrl';

/**
 * Clean string for file naming
 */
export function cleanThumbnailFilename(str) {
  if (!str) return 'youtube_thumbnail.jpg';
  const clean = str.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, ' ').trim();
  return clean.endsWith('.jpg') || clean.endsWith('.png') || clean.endsWith('.webp') 
    ? clean 
    : `${clean}.jpg`;
}

/**
 * Downloads YouTube Thumbnail in High Resolution (MaxRes / HD / SD)
 * @param {Object} options
 * @param {string} options.videoId - YouTube video ID (e.g. "dQw4w9WgXcQ")
 * @param {string} [options.thumbnailUrl] - Existing thumbnail URL
 * @param {string} [options.title] - Video or song title
 * @param {string} [options.outputName] - Output file name
 * @returns {Promise<{ success: boolean, filename: string, error?: string }>}
 */
export async function downloadYoutubeThumbnail({ videoId, thumbnailUrl, title, outputName } = {}) {
  const baseTitle = title || outputName?.replace(/\.[^/.]+$/, '') || videoId || 'youtube_thumbnail';
  const filename = cleanThumbnailFilename(`${baseTitle}_thumbnail`);

  // 1. Try Backend Download Endpoint first (resolves highest quality with server-side bypass)
  try {
    const params = new URLSearchParams();
    if (videoId) params.append('videoId', videoId);
    if (thumbnailUrl && !thumbnailUrl.includes('/api/m1/thumbnail/view/')) params.append('url', thumbnailUrl);
    if (title || outputName) params.append('title', baseTitle);
    params.append('filename', filename);

    const targetUrl = getApiUrl(`/api/m1/thumbnail/download?${params.toString()}`);
    const res = await fetch(targetUrl);

    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 500) {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
        return { success: true, filename };
      }
    }
  } catch (backendErr) {
    console.warn('[ThumbnailDownloader] Backend proxy fetch warning, trying direct browser fallback:', backendErr);
  }

  // 2. Direct Browser Fallback (CORS/Direct fetch)
  const candidateUrls = [];
  if (videoId) {
    candidateUrls.push(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);
    candidateUrls.push(`https://i.ytimg.com/vi/${videoId}/sddefault.jpg`);
    candidateUrls.push(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
  }
  if (thumbnailUrl && !candidateUrls.includes(thumbnailUrl) && !thumbnailUrl.includes('/api/m1/thumbnail/view/')) {
    candidateUrls.unshift(thumbnailUrl);
  }

  for (const imgUrl of candidateUrls) {
    try {
      const res = await fetch(imgUrl, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 2000) {
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
          return { success: true, filename };
        }
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  // 3. Last Resort: Window open / direct anchor
  if (candidateUrls.length > 0) {
    try {
      const bestUrl = candidateUrls[0];
      const a = document.createElement('a');
      a.href = bestUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { success: true, filename };
    } catch (e) {}
  }

  throw new Error('Gagal mengunduh thumbnail. Gambar tidak tersedia.');
}
