/**
 * Purpose: Validates whether a URL is supported and collectible.
 * Public API: validate(url)
 */

import { PlatformDetector } from '../platforms/PlatformDetector.js';

class ValidationServiceClass {
  validate(url) {
    if (!url || typeof url !== 'string') {
      return { valid: false, reason: 'INVALID_URL' };
    }

    const detection = PlatformDetector.detect(url);

    if (detection.platform === 'invalid') {
      return { valid: false, reason: 'INVALID_URL' };
    }

    if (!detection.supported) {
      return { valid: false, reason: 'UNSUPPORTED_PLATFORM' };
    }

    if (detection.contentType !== 'Short Video') {
      return { valid: false, reason: 'NOT_SHORT_CONTENT' };
    }

    return {
      valid: true,
      platform: detection.platform,
      contentType: detection.contentType
    };
  }
}

export const ValidationService = new ValidationServiceClass();
