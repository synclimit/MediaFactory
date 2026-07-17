const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs/promises');
const path = require('path');
const { DatabaseLocked } = require('./Errors');
const DiagnosticsManager = require('../system/DiagnosticsManager');

class Database {
    constructor() {
        this.dbPath = path.resolve('.mediafactory/cache/m5');
        this.dbFile = path.join(this.dbPath, 'production.db');
        this.db = null;
    }

    async init() {
        if (this.db) return this.db;

        try {
            await fs.mkdir(this.dbPath, { recursive: true });
            
            this.db = await open({
                filename: this.dbFile,
                driver: sqlite3.Database
            });

            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS library (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    path TEXT NOT NULL UNIQUE,
                    category TEXT
                );
                
                CREATE TABLE IF NOT EXISTS library_items (
                    id TEXT PRIMARY KEY,
                    library_id TEXT NOT NULL,
                    path TEXT NOT NULL UNIQUE,
                    filename TEXT NOT NULL,
                    duration REAL,
                    width INTEGER,
                    height INTEGER,
                    fps REAL,
                    hash TEXT,
                    FOREIGN KEY(library_id) REFERENCES library(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS asset_usage (
                    item_id TEXT NOT NULL,
                    cycle INTEGER DEFAULT 1,
                    used_at INTEGER,
                    PRIMARY KEY(item_id, cycle),
                    FOREIGN KEY(item_id) REFERENCES library_items(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS render_queue (
                    job_id TEXT PRIMARY KEY,
                    status TEXT,
                    snapshot TEXT,
                    created_at INTEGER
                );

                CREATE TABLE IF NOT EXISTS render_history (
                    id TEXT PRIMARY KEY,
                    job_id TEXT,
                    manifest TEXT,
                    created_at INTEGER,
                    FOREIGN KEY(job_id) REFERENCES render_queue(job_id)
                );

                CREATE TABLE IF NOT EXISTS render_manifest (
                    recipe_hash TEXT PRIMARY KEY,
                    render_seed TEXT,
                    pipeline_version TEXT,
                    output_checksum TEXT,
                    manifest_data TEXT,
                    created_at INTEGER
                );
                
                CREATE TABLE IF NOT EXISTS render_pairs (
                    id TEXT PRIMARY KEY,
                    video_a_id TEXT,
                    video_b_id TEXT,
                    created_at INTEGER
                );
            `);
            
            
            this.db = this._createProxy(this.db);
            console.log('[M5 Database] SQLite DB Initialized.');
            return this.db;
        } catch (e) {
            console.error('[M5 Database] Init Error:', e);
            throw new DatabaseLocked(e.message);
        }
    }
    
    _createProxy(dbInstance) {
        const handler = {
            get: (target, prop) => {
                const originalMethod = target[prop];
                if (typeof originalMethod === 'function' && ['run', 'get', 'all', 'exec'].includes(prop)) {
                    return async (...args) => {
                        const start = Date.now();
                        try {
                            const result = await originalMethod.apply(target, args);
                            const duration = Date.now() - start;
                            
                            // Try to guess affected rows for 'run'
                            let affected = 0;
                            if (result && result.changes !== undefined) affected = result.changes;
                            else if (Array.isArray(result)) affected = result.length;

                            DiagnosticsManager.logSQL({
                                queryId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                                query: args[0],
                                params: args.slice(1),
                                duration,
                                affected,
                                timestamp: start,
                                status: 'Success'
                            });
                            return result;
                        } catch (e) {
                            const duration = Date.now() - start;
                            DiagnosticsManager.logSQL({
                                queryId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                                query: args[0],
                                params: args.slice(1),
                                duration,
                                affected: 0,
                                timestamp: start,
                                status: 'Failed',
                                error: e.message
                            });
                            throw e;
                        }
                    };
                }
                return originalMethod;
            }
        };
        return new Proxy(dbInstance, handler);
    }
    
    getDb() {
        if (!this.db) throw new Error("Database not initialized. Call init() first.");
        return this.db;
    }
}


module.exports = new Database();
