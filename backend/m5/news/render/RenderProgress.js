class RenderProgress {
    constructor(id) {
        this.id = id;
        this.state = 'Queued'; // Queued, Preparing, Rendering, Encoding, Muxing, Completed
        this.percent = 0;
        this.timeElapsed = 0;
    }
    
    update(state, percent, time) {
        this.state = state;
        this.percent = percent;
        this.timeElapsed = time;
    }
}
module.exports = RenderProgress;