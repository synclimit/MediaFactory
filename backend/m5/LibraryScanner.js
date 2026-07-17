const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const dbEngine = require('./Database');
const EngineResult = require('./core/EngineResult');
const Logger = require('./core/Logger');
const { PipelineEmitter, PipelineEvents } = require('./core/Events');

class LibraryScanner {
    
    getProbeData(filePath) {
        // Safe to use synchronous for CLI/scanner init, but typically async.
        // Mock probe implementation for the architecture refactoring
        const hash = crypto.createHash('md5').update(filePath).digest('hex');
        return {
            hash,
            duration: 10,
            width: 720,
            height: 1280,
            fps: 30
        };
    }

    async scan(libraryPath, libraryName) {
        const start = Logger.start('LibraryScanner', `Scanning ${libraryPath}`);
        
        try {
            const db = dbEngine.getDb();
            let libId = crypto.randomUUID();
            
            await db.run(`INSERT OR IGNORE INTO library (id, name, path) VALUES (?, ?, ?)`, [libId, libraryName, libraryPath]);
            const existingLib = await db.get(`SELECT id FROM library WHERE path = ?`, [libraryPath]);
            if (existingLib) {
                libId = existingLib.id;
            }

            // Clear old stale items from the database before rescanning
            // This ensures that files deleted from the disk are also removed from the library
            await db.run(`DELETE FROM library_items WHERE library_id = ?`, [libId]);

            const validExts = ['.mp4', '.mov', '.mp3', '.wav', '.jpg', '.jpeg', '.png', '.gif', '.avi', '.mkv', '.webm'];
            let addedCount = 0;

            const scanDir = async (dir) => {
                const files = await fs.readdir(dir, { withFileTypes: true });
                for (const f of files) {
                    const fullPath = path.join(dir, f.name);
                    if (f.isDirectory()) {
                        await scanDir(fullPath);
                    } else if (f.isFile()) {
                        const ext = path.extname(f.name).toLowerCase();
                        if (validExts.includes(ext)) {
                            const meta = this.getProbeData(fullPath);
                            const result = await db.run(
                                `INSERT OR IGNORE INTO library_items (id, library_id, filename, path, duration, width, height, fps) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                                [meta.hash, libId, f.name, fullPath, meta.duration, meta.width, meta.height, meta.fps]
                            );
                            if (result.changes > 0) addedCount++;
                        }
                    }
                }
            };
            
            await scanDir(libraryPath);
            
            PipelineEmitter.emit(PipelineEvents.LIBRARY_SCANNED, { libraryId: libId, added: addedCount });
            const durationMs = Logger.finish('LibraryScanner', start, `Scanned ${addedCount} new items`);
            return EngineResult.success({ libraryId: libId, added: addedCount }, { executionTimeMs: durationMs });
        } catch (error) {
            Logger.error('LibraryScanner', 'Scan failed', error);
            return EngineResult.error(error, { executionTimeMs: Date.now() - start });
        }
    }
}

module.exports = LibraryScanner;
