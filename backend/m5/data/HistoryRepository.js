const dbEngine = require('../Database');
const Logger = require('../core/Logger');

class HistoryRepository {
    async insertRenderHistory(historyObj) {
        const db = dbEngine.getDb();
        try {
            await db.run(
                `INSERT INTO render_history (id, job_id, manifest, created_at) VALUES (?, ?, ?, ?)`,
                [historyObj.id, historyObj.job_id, JSON.stringify(historyObj.manifest), Date.now()]
            );
        } catch (error) {
            Logger.error('HistoryRepository', 'Failed to insert render history', error);
        }
    }

    async insertRenderQueue(jobId, status, snapshot) {
        const db = dbEngine.getDb();
        try {
            await db.run(
                `INSERT INTO render_queue (job_id, status, snapshot, created_at) VALUES (?, ?, ?, ?)`,
                [jobId, status, JSON.stringify(snapshot), Date.now()]
            );
        } catch (error) {
            Logger.error('HistoryRepository', 'Failed to insert render queue', error);
        }
    }

    async updateQueueStatus(jobId, status) {
        const db = dbEngine.getDb();
        try {
            await db.run(`UPDATE render_queue SET status = ? WHERE job_id = ?`, [status, jobId]);
        } catch (error) {
            Logger.error('HistoryRepository', 'Failed to update queue status', error);
        }
    }
}

module.exports = HistoryRepository;
