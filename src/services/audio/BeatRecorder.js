export class BeatRecorder {
    constructor() {
        this._recording = false;
        this._session = null;
        this._unsubBeat = null;
        this._engine = null;
    }

    attachToEngine(beatEngine) {
        this._engine = beatEngine;
    }

    start() {
        if (!this._engine) return;
        this._recording = true;
        this._session = {
            id:         `session-${Date.now()}`,
            startedAt:  Date.now(),
            duration:   0,
            frameCount: 0,
            bpmSamples: [],
            events:     [],
            bookmarks:  [],
            annotations: [],
            config: {
                cooldownMs:  300,
                threshold:   0.15,
                emaShortAlpha: 0.6,
                emaLongAlpha:  0.03,
            },
        };

        this._unsubBeat = this._engine.onBeat((ev) => {
            if (this._recording && this._session) {
                // deep copy the event
                this._session.events.push({ ...ev });
            }
        });
    }

    stop() {
        this._recording = false;
        if (this._unsubBeat) {
            this._unsubBeat();
            this._unsubBeat = null;
        }
        if (this._session) {
            this._session.duration = Date.now() - this._session.startedAt;
        }
        return this._session;
    }

    isRecording() {
        return this._recording;
    }

    replay(session) {
        console.warn("BeatRecorder.replay not fully implemented");
    }

    replayFrom(session, timeSec) {
        console.warn("BeatRecorder.replayFrom not fully implemented");
    }

    stopReplay() {}

    startCompare(session) {}
    stopCompare() {}
    getDivergences() { return []; }

    exportJSON(session) {
        return JSON.stringify(session);
    }

    exportBinary(session) {
        return new ArrayBuffer(0); // stub
    }

    importJSON(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.error("BeatRecorder.importJSON failed", e);
            return null;
        }
    }

    importBinary(arrayBuffer) {
        return null;
    }

    addBookmark(label) {
        if (this._session) {
            this._session.bookmarks.push({ time: Date.now() - this._session.startedAt, label });
        }
    }

    getBookmarks() {
        return this._session ? this._session.bookmarks : [];
    }

    seekToBookmark(label) {}

    annotate(beatIndex, note) {
        if (this._session) {
            this._session.annotations.push({ beatIndex, note });
        }
    }

    getAnnotations() {
        return this._session ? this._session.annotations : [];
    }
}

export const beatRecorder = new BeatRecorder();
