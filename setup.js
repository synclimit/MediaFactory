global.performance = require('perf_hooks').performance;
global.window = {};
global.indexedDB = { open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null }) };
import('./sprint_b_timeline.js');
