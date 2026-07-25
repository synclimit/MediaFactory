import { useSyncExternalStore } from 'react';

class PlaybackStore {
    constructor() {
        this.state = {
            currentTime: 0,
            isPlaying: false
        };
        this.listeners = new Set();
    }

    subscribe = (listener) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    getSnapshot = () => {
        return this.state;
    };

    setState = (partialState) => {
        let hasChanges = false;
        for (const key in partialState) {
            if (this.state[key] !== partialState[key]) {
                hasChanges = true;
                break;
            }
        }
        
        if (hasChanges) {
            this.state = { ...this.state, ...partialState };
            this.listeners.forEach(listener => listener());
        }
    };
}

export const playbackStore = new PlaybackStore();

export function usePlaybackStore(selector = state => state) {
    const state = useSyncExternalStore(
        playbackStore.subscribe,
        playbackStore.getSnapshot
    );
    return selector(state);
}
