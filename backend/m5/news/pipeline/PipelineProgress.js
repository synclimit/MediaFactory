const PipelineStatus = require('./PipelineStatus');
class PipelineProgress {
    constructor() {
        this.stages = [
            { id: 'reader', name: 'Reading Article', status: PipelineStatus.WAITING, time: 0 },
            { id: 'ai', name: 'AI Summary', status: PipelineStatus.WAITING, time: 0 },
            { id: 'visual', name: 'Visual Analysis', status: PipelineStatus.WAITING, time: 0 },
            { id: 'ranking', name: 'Image Ranking', status: PipelineStatus.WAITING, time: 0 },
            { id: 'card', name: 'Card Generation', status: PipelineStatus.WAITING, time: 0 },
            { id: 'editor', name: 'Editor Ready', status: PipelineStatus.WAITING, time: 0 }
        ];
    }
    
    update(stageId, status, timeMs = 0) {
        const stage = this.stages.find(s => s.id === stageId);
        if (stage) {
            stage.status = status;
            stage.time = timeMs;
        }
    }
    
    isComplete() {
        return this.stages.every(s => s.status === PipelineStatus.COMPLETED || s.status === PipelineStatus.SKIPPED);
    }
}
module.exports = PipelineProgress;