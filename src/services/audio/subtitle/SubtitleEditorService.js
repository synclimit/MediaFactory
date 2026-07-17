import { subtitleRuntime } from './SubtitleRuntime';

/**
 * SubtitleEditorService
 * Handles live editing of subtitle document, tracking undo/redo history, 
 * without modifying the core runtime architecture.
 */
class SubtitleEditorService {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.isDirty = false;
        this.editMode = 'IDLE'; // IDLE, SEGMENT, TEXT, WORD
        this.selectedSegmentIndex = -1;
        this.listeners = new Set();
    }

    subscribe(listener) {
        this.listeners.add(listener);
    }

    unsubscribe(listener) {
        this.listeners.delete(listener);
    }

    notify() {
        for (const listener of this.listeners) {
            listener(this.getState());
        }
    }

    getState() {
        return {
            undoStackSize: this.undoStack.length,
            redoStackSize: this.redoStack.length,
            isDirty: this.isDirty,
            editMode: this.editMode,
            selectedSegmentIndex: this.selectedSegmentIndex
        };
    }

    _cloneDocument() {
        if (!subtitleRuntime.document) return null;
        // Deep clone the segments and words for history
        const clone = JSON.parse(JSON.stringify(subtitleRuntime.document));
        return clone;
    }

    _pushUndo() {
        const currentDoc = this._cloneDocument();
        if (currentDoc) {
            this.undoStack.push(currentDoc);
            // Cap at 50 to prevent memory leak
            if (this.undoStack.length > 50) this.undoStack.shift();
            this.redoStack = []; // clear redo on new action
            this.isDirty = true;
            this.notify();
        }
    }

    undo() {
        if (this.undoStack.length === 0) return;
        const currentDoc = this._cloneDocument();
        const prevDoc = this.undoStack.pop();
        this.redoStack.push(currentDoc);
        
        subtitleRuntime.setDocument(prevDoc);
        // Force update to refresh layout cache instantly
        subtitleRuntime.update(subtitleRuntime.diagnostics.lastTimestamp, subtitleRuntime.diagnostics.playbackSpeed);
        this.notify();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const currentDoc = this._cloneDocument();
        const nextDoc = this.redoStack.pop();
        this.undoStack.push(currentDoc);
        
        subtitleRuntime.setDocument(nextDoc);
        subtitleRuntime.update(subtitleRuntime.diagnostics.lastTimestamp, subtitleRuntime.diagnostics.playbackSpeed);
        this.notify();
    }

    selectSegment(index) {
        this.selectedSegmentIndex = index;
        this.editMode = index >= 0 ? 'SEGMENT' : 'IDLE';
        this.notify();
    }

    updateSegmentTime(index, start, end) {
        if (!subtitleRuntime.document) return;
        this._pushUndo();
        const doc = subtitleRuntime.document;
        doc.segments[index].start = start;
        doc.segments[index].end = end;
        // Shift words proportionally (simple implementation for now)
        subtitleRuntime.update(subtitleRuntime.diagnostics.lastTimestamp, subtitleRuntime.diagnostics.playbackSpeed);
        this.notify();
    }

    updateSegmentText(index, newText) {
        if (!subtitleRuntime.document) return;
        this._pushUndo();
        const doc = subtitleRuntime.document;
        doc.segments[index].text = newText;
        
        // Very rudimentary word replacement. In a real editor we'd map words intelligently.
        // For this sprint we simply replace the segment words with space-delimited words evenly timed.
        const segment = doc.segments[index];
        const newWordsList = newText.trim().split(/\s+/);
        const duration = segment.end - segment.start;
        const wordDuration = duration / newWordsList.length;
        
        segment.words = newWordsList.map((w, i) => ({
            id: `${index}-${i}`,
            word: w,
            start: segment.start + (i * wordDuration),
            end: segment.start + ((i + 1) * wordDuration),
            probability: 1.0
        }));

        subtitleRuntime.update(subtitleRuntime.diagnostics.lastTimestamp, subtitleRuntime.diagnostics.playbackSpeed);
        this.notify();
    }

    updateWord(segIndex, wordIndex, wordText, start, end) {
        if (!subtitleRuntime.document) return;
        this._pushUndo();
        const doc = subtitleRuntime.document;
        const w = doc.segments[segIndex].words[wordIndex];
        if (wordText !== undefined) w.word = wordText;
        if (start !== undefined) w.start = start;
        if (end !== undefined) w.end = end;
        
        subtitleRuntime.update(subtitleRuntime.diagnostics.lastTimestamp, subtitleRuntime.diagnostics.playbackSpeed);
        this.notify();
    }

    // Listens to global hotkeys for Undo/Redo
    handleKeyDown = (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                this.undo();
            } else if (e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        }
    }

    mount() {
        window.addEventListener('keydown', this.handleKeyDown);
    }

    unmount() {
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}

export const subtitleEditorService = new SubtitleEditorService();
