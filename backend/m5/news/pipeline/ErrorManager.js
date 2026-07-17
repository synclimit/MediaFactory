class ErrorManager {
    handle(error, stageId) {
        return {
            stage: stageId,
            message: error.message || 'Unknown Error',
            timestamp: Date.now(),
            fatal: error.fatal || false
        };
    }
}
module.exports = ErrorManager;