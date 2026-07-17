import test from 'node:test';
import assert from 'node:assert/strict';

import { Logger } from '../managers/Logger.js';
import { EventBus } from '../managers/EventBus.js';
import { StorageManager } from '../managers/StorageManager.js';
import { VersionManager } from '../managers/VersionManager.js';
import { ConfigurationManager } from '../managers/ConfigurationManager.js';

test('Logger Manager functionality', () => {
  Logger.clearLogs();
  Logger.setDeveloperMode(true);
  Logger.info('Test Info Message', { a: 1 });
  const logs = Logger.getLogs();
  assert.equal(logs.length, 1);
  assert.equal(logs[0].level, 'INFO');
  assert.equal(logs[0].message, 'Test Info Message');
});

test('EventBus functionality', () => {
  let received = null;
  const unsubscribe = EventBus.on('TEST_EVENT', (data) => {
    received = data;
  });

  EventBus.emit('TEST_EVENT', { value: 42 });
  assert.deepEqual(received, { value: 42 });

  unsubscribe();
  received = null;
  EventBus.emit('TEST_EVENT', { value: 99 });
  assert.equal(received, null);
});

test('StorageManager functionality (memory fallback mock)', async () => {
  await StorageManager.save('queue', 'testItem', { id: 1 });
  const val = await StorageManager.load('queue', 'testItem');
  assert.deepEqual(val, { id: 1 });

  await StorageManager.remove('queue', 'testItem');
  const removed = await StorageManager.load('queue', 'testItem', null);
  assert.equal(removed, null);
});

test('VersionManager functionality', async () => {
  const info = await VersionManager.checkVersion('1.0.0');
  assert.equal(info.currentVersion, '1.0.0');
  assert.equal(info.migrationRequired, true);

  await VersionManager.finishMigration();
  const infoAfter = await VersionManager.checkVersion('1.0.0');
  assert.equal(infoAfter.migrationRequired, false);
});

test('ConfigurationManager functionality', async () => {
  const config = await ConfigurationManager.load();
  assert.equal(config.toastEnabled, true);

  await ConfigurationManager.set('soundEnabled', true);
  assert.equal(ConfigurationManager.get('soundEnabled'), true);
});
