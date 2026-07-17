class AIProvider {
    async analyze(prompt) {
        throw new Error("analyze() must be implemented by subclass");
    }
}
module.exports = AIProvider;