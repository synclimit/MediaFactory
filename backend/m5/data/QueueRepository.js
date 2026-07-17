const dbEngine = require('../Database');

class QueueRepository {
    async insertRenderQueue(jobId, status, snapshotData) {
        const db = dbEngine.getDb();
        await db.run(
            `INSERT INTO render_queue (job_id, status, snapshot, created_at) VALUES (?, ?, ?, ?)`,
            [jobId, status, JSON.stringify(snapshotData), Date.now()]
        );
    }

    async updateQueueStatus(jobId, status) {
        const db = dbEngine.getDb();
        await db.run(
            `UPDATE render_queue SET status = ? WHERE job_id = ?`,
            [status, jobId]
        );
    }

    async getQueueItem(jobId) {
        const db = dbEngine.getDb();
        const row = await db.get(`SELECT * FROM render_queue WHERE job_id = ?`, [jobId]);
        if (row && row.snapshot) {
            row.snapshot_data = JSON.parse(row.snapshot);
        }
        return row;
    }
}

module.exports = QueueRepository;
