const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const fsSync = require('fs');

class StorageService {
    constructor() {}

    async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async mkdir(dirPath) {
        if (!await this.exists(dirPath)) {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    async copy(src, dest) {
        await this.mkdir(path.dirname(dest));
        await fs.cp(src, dest, { recursive: true });
    }

    async move(src, dest) {
        await this.mkdir(path.dirname(dest));
        await fs.rename(src, dest);
    }

    async rename(src, newName) {
        const dest = path.join(path.dirname(src), newName);
        await fs.rename(src, dest);
    }

    async delete(filePath) {
        if (await this.exists(filePath)) {
            const stat = await this.stat(filePath);
            if (stat.isDirectory()) {
                await fs.rm(filePath, { recursive: true, force: true });
            } else {
                await fs.unlink(filePath);
            }
        }
    }

    async read(filePath, encoding = 'utf8') {
        return await fs.readFile(filePath, encoding);
    }

    async readDir(dirPath) {
        if (!await this.exists(dirPath)) return [];
        return await fs.readdir(dirPath, { withFileTypes: true });
    }

    async write(filePath, data, encoding = 'utf8') {
        await this.mkdir(path.dirname(filePath));
        await fs.writeFile(filePath, data, encoding);
    }

    async stat(filePath) {
        return await fs.stat(filePath);
    }

    async hash(filePath, algorithm = 'sha256') {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash(algorithm);
            const stream = fsSync.createReadStream(filePath);
            stream.on('error', err => reject(err));
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
        });
    }

    watch(dirPath, options, listener) {
        return fsSync.watch(dirPath, options, listener);
    }
}

module.exports = StorageService;
