const dbEngine = require('../Database');

class PresetRepository {
    async getPresetById(presetId) {
        const db = dbEngine.getDb();
        const row = await db.get(`SELECT * FROM preset WHERE id = ?`, [presetId]);
        if (row && row.config) {
            row.config = JSON.parse(row.config);
        }
        return row;
    }

    async insertPreset(presetId, name, configObj) {
        const db = dbEngine.getDb();
        await db.run(
            `INSERT INTO preset (id, name, config) VALUES (?, ?, ?)`,
            [presetId, name, JSON.stringify(configObj)]
        );
    }
}

module.exports = PresetRepository;
