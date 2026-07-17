const dbEngine = require('../Database');

class ProjectRepository {
    async getProjectById(projectId) {
        const db = dbEngine.getDb();
        const row = await db.get(`SELECT * FROM project WHERE id = ?`, [projectId]);
        if (row && row.settings) {
            row.settings = JSON.parse(row.settings);
        }
        return row;
    }

    async insertProject(projectId, name, settingsObj) {
        const db = dbEngine.getDb();
        await db.run(
            `INSERT INTO project (id, name, settings, created_at) VALUES (?, ?, ?, ?)`,
            [projectId, name, JSON.stringify(settingsObj), new Date().toISOString()]
        );
    }
}

module.exports = ProjectRepository;
