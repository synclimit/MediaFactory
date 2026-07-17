/**
 * Purpose: Detects platform and content type from a given URL.
 * Public API: detect(url)
 */

export class PlatformDetectorService {
  detect(url) {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      if (hostname.includes('tiktok.com')) {
        const isVideo = parsed.pathname.includes('/video/');
        return {
          platform: 'tiktok',
          supported: true,
          contentType: isVideo ? 'Short Video' : 'Other'
        };
      }

      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        const isShorts = parsed.pathname.startsWith('/shorts/');
        return {
          platform: 'youtube',
          supported: true,
          contentType: isShorts ? 'Short Video' : 'Other'
        };
      }

      return {
        platform: 'unknown',
        supported: false,
        contentType: 'Unknown'
      };
    } catch {
      return {
        platform: 'invalid',
        supported: false,
        contentType: 'Invalid'
      };
    }
  }
}

export const PlatformDetector = new PlatformDetectorService();
