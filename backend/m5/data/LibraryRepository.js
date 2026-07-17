const dbEngine = require('../Database');

class LibraryRepository {
    async getLibraryByPath(path) {
        const db = dbEngine.getDb();
        return await db.get(`SELECT * FROM library WHERE path = ?`, [path]);
    }

    async insertLibrary(id, name, path) {
        const db = dbEngine.getDb();
        await db.run(`INSERT INTO library (id, name, path) VALUES (?, ?, ?)`, [id, name, path]);
    }

    async getLibraryItemByPath(path) {
        const db = dbEngine.getDb();
        return await db.get(`SELECT id FROM library_items WHERE path = ?`, [path]);
    }

    async insertLibraryItem(item) {
        const db = dbEngine.getDb();
        await db.run(
            `INSERT INTO library_items (id, library_id, filename, path, duration, width, height, fps) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [item.id, item.libraryId, item.filename, item.path, item.duration, item.width, item.height, item.fps]
        );
    }
}

module.exports = LibraryRepository;
