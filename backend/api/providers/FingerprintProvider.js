const crypto = require('crypto');
const fs = require('fs');

/**
 * IFingerprintProvider interface concept:
 * async getFingerprint(filePath) => string
 */
class FingerprintProvider {
    /**
     * Calculates the SHA-256 hash of a file's contents.
     * Reads in chunks to avoid memory issues with large files.
     * @param {string} filePath 
     * @returns {Promise<string>}
     */
    static async getFingerprint(filePath) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(filePath)) {
                return reject(new Error('File not found for fingerprinting'));
            }
            
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', err => reject(err));
        });
    }
}

module.exports = { FingerprintProvider };
