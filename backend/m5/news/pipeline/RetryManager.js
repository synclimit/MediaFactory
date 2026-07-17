class RetryManager {
    shouldRetry(error, currentAttempt, maxAttempts = 3) {
        // Do not retry fatal errors
        if (error && error.fatal) return false;
        return currentAttempt < maxAttempts;
    }
}
module.exports = RetryManager;