class RenderFrameStore {
    constructor() {
        this.frame = null;
        this.listeners = new Set();
    }

    setFrame(frame) {
        this.frame = frame;
        this.notifyListeners();
    }

    getFrame() {
        return this.frame;
    }

    subscribe(listener) {
        if (typeof listener === 'function') {
            this.listeners.add(listener);
        }
    }

    unsubscribe(listener) {
        this.listeners.delete(listener);
    }

    notifyListeners() {
        for (const listener of this.listeners) {
            try {
                listener(this.frame);
            } catch (err) {
                console.error('RenderFrameStore listener error:', err);
            }
        }
    }

    clear() {
        this.frame = null;
        this.notifyListeners();
    }
}

export const renderFrameStore = new RenderFrameStore();
