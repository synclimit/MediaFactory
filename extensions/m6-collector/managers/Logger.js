/**
 * Purpose: Centralized logging service that replaces direct console.log usage.
 * Public API: debug(), info(), warn(), error(), setDeveloperMode()
 * Future Dependencies: None
 * Current Dependencies: None
 * Initialization Flow: Standalone instantiation or singleton.
 * Example Usage:
 *   Logger.info('App started');
 */

class LoggerService {
  constructor() {
    this.developerMode = false;
    this.logs = [];
    this.maxLogs = 500;
  }

  setDeveloperMode(enabled) {
    this.developerMode = Boolean(enabled);
  }

  _log(level, message, ...args) {
    const entry = {
      timestamp: Date.now(),
      level,
      message,
      args
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (!this.developerMode) {
      return;
    }

    /* eslint-disable no-console */
    switch (level) {
      case 'DEBUG':
        console.debug(`[M6-DEBUG] ${message}`, ...args);
        break;
      case 'INFO':
        console.info(`[M6-INFO] ${message}`, ...args);
        break;
      case 'WARN':
        console.warn(`[M6-WARN] ${message}`, ...args);
        break;
      case 'ERROR':
        console.error(`[M6-ERROR] ${message}`, ...args);
        break;
      default:
        console.log(`[M6] ${message}`, ...args);
    }
    /* eslint-enable no-console */
  }

  debug(message, ...args) {
    this._log('DEBUG', message, ...args);
  }

  info(message, ...args) {
    this._log('INFO', message, ...args);
  }

  warn(message, ...args) {
    this._log('WARN', message, ...args);
  }

  error(message, ...args) {
    this._log('ERROR', message, ...args);
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const Logger = new LoggerService();
