export class TelemetryCollector {
    constructor() {
        this.data = {
            cacheHit: 0,
            cacheMiss: 0,
            frameCount: 0,
            filterCount: 0
        };
    }
    
    record(key, value = 1) {
        if (this.data[key] !== undefined) {
            this.data[key] += value;
        }
    }
    
    getReport() {
        return { ...this.data };
    }
}
