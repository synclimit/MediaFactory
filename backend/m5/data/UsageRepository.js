const dbEngine = require('../Database');
const Logger = require('../core/Logger');
const EngineResult = require('../core/EngineResult');

class UsageRepository {
    async getNextAvailableAsset(libraryPaths, category, randomSystem) {
        if (!libraryPaths || libraryPaths.length === 0) return null;
        const db = dbEngine.getDb();
        const start = Logger.start('UsageRepository', `Fetching next asset for ${category}`);

        try {
            const chosenFolder = randomSystem.choice(libraryPaths);
            if (!chosenFolder || !chosenFolder.path) return null;

            const libRow = await db.get(`SELECT id, name FROM library WHERE path = ?`, [chosenFolder.path]);
            if (!libRow) {
                Logger.warn('UsageRepository', `Library ${chosenFolder.name} not found in database.`);
                return null;
            }

            let items = await db.all(`
                SELECT i.* FROM library_items i
                LEFT JOIN asset_usage u ON i.id = u.item_id
                WHERE i.library_id = ? AND u.used_at IS NULL
            `, [libRow.id]);

            if (items.length === 0) {
                Logger.info('UsageRepository', `All videos in ${libRow.name} consumed. Resetting cycle.`);
                await db.run(`DELETE FROM asset_usage WHERE item_id IN (SELECT id FROM library_items WHERE library_id = ?)`, [libRow.id]);
                
                items = await db.all(`SELECT * FROM library_items WHERE library_id = ?`, [libRow.id]);
                if (items.length === 0) {
                    Logger.warn('UsageRepository', `Library ${libRow.name} is completely empty.`);
                    return null;
                }
            }

            const chosenItem = randomSystem.choice(items);
            Logger.finish('UsageRepository', start, `Selected asset ${chosenItem.filename}`);
            return chosenItem;
            
        } catch (error) {
            Logger.error('UsageRepository', 'Failed to get next asset', error);
            throw error;
        }
    }

    async markUsed(itemId, cycle = 1) {
        const db = dbEngine.getDb();
        await db.run(`INSERT OR IGNORE INTO asset_usage (item_id, cycle, used_at) VALUES (?, ?, ?)`, [itemId, cycle, Date.now()]);
    }
}

module.exports = UsageRepository;
