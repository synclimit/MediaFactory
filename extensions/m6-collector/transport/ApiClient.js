/**
 * Purpose: Transport layer responsible for sending requests to Local API Gateway.
 * Public API: collect(url)
 * Dependencies: Logger
 */

import { Logger } from '../managers/Logger.js';

const API_BASE_URL = 'http://127.0.0.1:18888';
const TIMEOUT_MS = 5000;

class ApiClientService {
  constructor() {
    this.startHeartbeat();
  }

  startHeartbeat() {
    setInterval(() => {
      fetch(`${API_BASE_URL}/api/m6/ping`, { method: 'POST' }).catch(() => {});
    }, 5000);
  }

  async collect(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const payload = {
      url,
      mode: 'collect',
      timestamp: Date.now()
    };

    try {
      Logger.info(`Sending collect request for: ${url}`);
      const response = await fetch(`${API_BASE_URL}/api/m6/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MediaFactory': 'M6',
          'X-Extension-Version': '1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        Logger.warn(`API responded with status: ${response.status}`);
        return { success: false, error: `HTTP_${response.status}` };
      }

      const data = await response.json().catch(() => ({ success: true }));
      Logger.info('Collect request succeeded', data);
      return { success: true, data };
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError';
      Logger.warn(
        isTimeout ? 'Collect request timed out' : 'Collect request network error',
        err.message
      );
      return {
        success: false,
        error: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR'
      };
    }
  }
}

export const ApiClient = new ApiClientService();
