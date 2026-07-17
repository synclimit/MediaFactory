/**
 * Purpose: Lightweight event bus for loosely coupled manager communication.
 * Public API: on(event, callback), off(event, callback), once(event, callback), emit(event, payload)
 * Future Dependencies: None
 * Current Dependencies: None
 * Initialization Flow: Standalone instantiation or singleton.
 * Example Usage:
 *   EventBus.on('QUEUE_UPDATED', () => {});
 *   EventBus.emit('QUEUE_UPDATED', { count: 5 });
 */

class EventBusService {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) {
      return;
    }
    this.listeners.get(event).delete(callback);
  }

  once(event, callback) {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      callback(payload);
    });
    return unsubscribe;
  }

  emit(event, payload) {
    if (!this.listeners.has(event)) {
      return;
    }
    for (const callback of this.listeners.get(event)) {
      try {
        callback(payload);
      } catch {
        // Prevent one broken listener from stopping others
      }
    }
  }

  clear(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export const EventBus = new EventBusService();
