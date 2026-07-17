const dbEngine = require('../Database');

class ManifestRepository {
    async insertManifest(manifestObj) {
        const db = dbEngine.getDb();
        await db.run(
            `INSERT INTO render_manifest (recipe_hash, render_seed, pipeline_version, output_checksum, manifest_data, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                manifestObj.recipeHash,
                manifestObj.renderSeed,
                manifestObj.pipelineVersion,
                manifestObj.outputChecksum,
                JSON.stringify(manifestObj),
                manifestObj.timestamp
            ]
        );
    }

    async getManifestByHash(recipeHash) {
        const db = dbEngine.getDb();
        const row = await db.get(`SELECT * FROM render_manifest WHERE recipe_hash = ?`, [recipeHash]);
        if (row && row.manifest_data) {
            row.manifest_data = JSON.parse(row.manifest_data);
        }
        return row;
    }
}

module.exports = ManifestRepository;
