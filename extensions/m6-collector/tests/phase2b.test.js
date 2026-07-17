import test from 'node:test';
import assert from 'node:assert/strict';

import { ApiClient } from '../transport/ApiClient.js';

test('ApiClient collect handles network failure gracefully', async () => {
  // Since 127.0.0.1:18888 likely isn't running in unit test, verify failure handling
  const res = await ApiClient.collect('https://www.tiktok.com/@user/video/123');
  assert.equal(res.success, false);
  assert.equal(typeof res.error, 'string');
});
