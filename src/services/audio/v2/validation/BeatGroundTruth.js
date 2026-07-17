export class BeatGroundTruth {
    constructor(data = {}) {
        this.bpm = data.bpm || 120;
        this.beatTimestamps = data.beatTimestamps || [];
        this.downbeats = data.downbeats || [];
        this.bars = data.bars || [];
        this.kickMarkers = data.kickMarkers || [];
        this.snareMarkers = data.snareMarkers || [];
    }

    load(data) {
        this.bpm = data.bpm || 120;
        this.beatTimestamps = data.beatTimestamps || [];
        this.downbeats = data.downbeats || [];
        this.bars = data.bars || [];
        this.kickMarkers = data.kickMarkers || [];
        this.snareMarkers = data.snareMarkers || [];
    }

    save() {
        return {
            bpm: this.bpm,
            beatTimestamps: [...this.beatTimestamps],
            downbeats: [...this.downbeats],
            bars: [...this.bars],
            kickMarkers: [...this.kickMarkers],
            snareMarkers: [...this.snareMarkers]
        };
    }

    static fromJSON(jsonStr) {
        const data = JSON.parse(jsonStr);
        return new BeatGroundTruth(data);
    }
}
