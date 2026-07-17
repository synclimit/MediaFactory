const ServiceRegistry = require('../system/ServiceRegistry');

class OutputVerifier {
    constructor() {}

    async verify(filePath) {
        const storage = ServiceRegistry.resolve('StorageService');
        if (!await storage.exists(filePath)) {
            throw new Error(`Output verification failed. File not found: ${filePath}`);
        }
        
        const stat = await storage.stat(filePath);
        if (stat.size === 0) {
            throw new Error(`Output verification failed. File is 0 bytes: ${filePath}`);
        }
        
        return true;
    }
}

module.exports = OutputVerifier;
