import test from 'node:test';
import assert from 'node:assert/strict';

import { PlatformDetector } from '../platforms/PlatformDetector.js';
import { ValidationService } from '../managers/ValidationService.js';

test('PlatformDetector identifies TikTok short video accurately', () => {
  const result = PlatformDetector.detect('https://www.tiktok.com/@user/video/123456789');
  assert.equal(result.platform, 'tiktok');
  assert.equal(result.supported, true);
  assert.equal(result.contentType, 'Short Video');
});

test('PlatformDetector identifies TikTok non-video profile accurately', () => {
  const result = PlatformDetector.detect('https://www.tiktok.com/@user');
  assert.equal(result.platform, 'tiktok');
  assert.equal(result.supported, true);
  assert.equal(result.contentType, 'Other');
});

test('PlatformDetector identifies YouTube Shorts accurately', () => {
  const result = PlatformDetector.detect('https://www.youtube.com/shorts/abc123xyz');
  assert.equal(result.platform, 'youtube');
  assert.equal(result.supported, true);
  assert.equal(result.contentType, 'Short Video');
});

test('ValidationService validates supported short content', () => {
  const result = ValidationService.validate('https://www.youtube.com/shorts/abc123xyz');
  assert.equal(result.valid, true);
  assert.equal(result.platform, 'youtube');
});

test('ValidationService rejects unsupported platform', () => {
  const result = ValidationService.validate('https://www.example.com/video/1');
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'UNSUPPORTED_PLATFORM');
});

test('ValidationService rejects non-short content', () => {
  const result = ValidationService.validate('https://www.tiktok.com/@user');
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'NOT_SHORT_CONTENT');
});
