import { m2WorkspaceContext } from './WorkspaceContext.js';

class SchedulerService {
  constructor() {
    this.state = this._load();
    this.onStateChangeCallbacks = [];
    this.triggerCallback = null;
    this.logCallback = null;
    this.timer = null;
    this.isRunning = false;

    // Start timer on initialization if enabled
    if (this.state.enabled) {
      this.startTimer();
    }
  }

  getStorageKey() {
    return `${m2WorkspaceContext.getWorkspaceId()}_m2_scheduler`;
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          enabled: parsed.enabled ?? false,
          mode: parsed.mode ?? 'interval',
          intervalHours: parsed.intervalHours ?? 3,
          dailyTime: parsed.dailyTime ?? '02:00',
          nextRun: parsed.nextRun ?? null,
          lastRun: parsed.lastRun ?? null,
          lastStatus: parsed.lastStatus ?? null
        };
      }
    } catch (e) {}
    return {
      enabled: false,
      mode: 'interval',
      intervalHours: 3,
      dailyTime: '02:00',
      nextRun: null,
      lastRun: null,
      lastStatus: null
    };
  }

  _save() {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(this.state));
    this.onStateChangeCallbacks.forEach(cb => cb(this.state));
  }

  updateSettings(settings) {
    const wasEnabled = this.state.enabled;
    this.state = { ...this.state, ...settings };
    
    // Log starting and stopping
    if (settings.enabled !== undefined) {
      if (settings.enabled && !wasEnabled) {
        this.log('[M2 Scheduler] Started');
      } else if (!settings.enabled && wasEnabled) {
        this.log('[M2 Scheduler] Stopped');
      }
    }

    this.calculateNextRun();
    this._save();
    
    if (this.state.enabled) {
      this.startTimer();
    } else {
      this.stopTimer();
    }
  }

  calculateNextRun() {
    if (!this.state.enabled) {
      this.state.nextRun = null;
      return;
    }

    const now = new Date();
    if (this.state.mode === 'interval') {
      const ms = this.state.intervalHours * 60 * 60 * 1000;
      this.state.nextRun = new Date(now.getTime() + ms).toISOString();
    } else if (this.state.mode === 'daily') {
      const [h, m] = this.state.dailyTime.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      this.state.nextRun = target.toISOString();
    }
  }

  registerStateChange(cb) {
    this.onStateChangeCallbacks.push(cb);
    cb(this.state);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(c => c !== cb);
    };
  }

  registerTriggerCallback(cb) {
    this.triggerCallback = cb;
  }

  registerLogCallback(cb) {
    this.logCallback = cb;
  }

  log(msg) {
    if (this.logCallback) {
      this.logCallback(msg);
    } else {
      console.log(msg);
    }
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.tick();
    }, 10000); // Tick check every 10 seconds
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async tick() {
    if (!this.state.enabled || !this.state.nextRun) return;
    const now = new Date();
    const next = new Date(this.state.nextRun);
    if (now.getTime() >= next.getTime()) {
      await this.executeSchedulerRun();
    }
  }

  async executeSchedulerRun() {
    if (this.isRunning) {
      this.log('[M2 Scheduler] Skipped (Already Running)');
      return 'SKIPPED_ALREADY_RUNNING';
    }

    this.isRunning = true;
    this.log('[M2 Scheduler] Triggered');

    try {
      if (this.triggerCallback) {
        const result = await this.triggerCallback();
        // Expected outputs: 'SUCCESS', 'FAILED', or 'SKIPPED_QUEUE_BUSY'
        if (result === 'SKIPPED_QUEUE_BUSY') {
          this.state.lastRun = new Date().toISOString();
          this.state.lastStatus = 'SKIPPED (QUEUE BUSY)';
          this.log('[M2 Scheduler] Skipped (Queue Busy)');
        } else if (result === 'SUCCESS') {
          this.state.lastRun = new Date().toISOString();
          this.state.lastStatus = 'SUCCESS';
          this.log('[M2 Scheduler] Run Completed');
        } else {
          this.state.lastRun = new Date().toISOString();
          this.state.lastStatus = 'FAILED';
          this.log('[M2 Scheduler] Run Failed');
        }
      } else {
        this.state.lastRun = new Date().toISOString();
        this.state.lastStatus = 'SUCCESS';
        this.log('[M2 Scheduler] Run Completed');
      }
    } catch (e) {
      console.error(e);
      this.state.lastRun = new Date().toISOString();
      this.state.lastStatus = 'FAILED';
      this.log('[M2 Scheduler] Run Failed');
    } finally {
      this.isRunning = false;
      this.calculateNextRun();
      this._save();
    }
  }
}

export const m2SchedulerService = new SchedulerService();
