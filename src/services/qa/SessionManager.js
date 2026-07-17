export class SessionManager {
    static async createSession(mode, validators) {
        const id = `QA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        
        const sessionData = {
            id,
            version: 'MF-1000B.6',
            date: new Date().toISOString(),
            mode,
            durationMs: 0,
            healthScore: 0,
            failures: 0,
            warnings: 0,
            status: 'RUNNING',
            validators: validators.map(v => ({
                engineName: v.constructor.engineName,
                category: v.constructor.category,
                status: 'WAITING'
            })),
            logs: []
        };
        
        await this.save(sessionData);
        return sessionData;
    }

    static async save(sessionData) {
        try {
            const res = await fetch('/api/v1/qa/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData)
            });
            return await res.json();
        } catch (e) {
            console.error('Failed to save session', e);
        }
    }

    static async load(id) {
        // Find it in the list (if we had a direct fetch, we'd use that, but for now we filter list)
        const all = await this.list();
        return all.find(s => s.id === id);
    }

    static async delete(id) {
        try {
            const res = await fetch(`/api/v1/qa/sessions/${id}`, { method: 'DELETE' });
            return await res.json();
        } catch (e) {
            console.error('Failed to delete session', e);
        }
    }

    static async list() {
        try {
            const res = await fetch('/api/v1/qa/sessions');
            const result = await res.json();
            if (result.success) {
                return result.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
            return [];
        } catch (e) {
            console.error('Failed to list sessions', e);
            return [];
        }
    }

    static async compare(sessionAId, sessionBId) {
        const a = await this.load(sessionAId);
        const b = await this.load(sessionBId);
        if (!a || !b) throw new Error('One or both sessions not found');
        
        return {
            sessionA: a,
            sessionB: b,
            differences: {
                healthDelta: b.healthScore - a.healthScore,
                durationDelta: b.durationMs - a.durationMs,
                failuresA: a.failures,
                failuresB: b.failures
            }
        };
    }

    static async export(id) {
        // A real export might trigger a zip download. For now just returning an object to log.
        return { exportedId: id, message: 'Export requested. NOT IMPLEMENTED zip logic.' };
    }

    static async saveEvidence(sessionId, filename, content, isBase64 = false) {
        try {
            await fetch(`/api/v1/qa/sessions/${sessionId}/evidence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, content, isBase64 })
            });
        } catch (e) {
            console.error('Failed to save evidence', e);
        }
    }

    static async verify(sessionId) {
        try {
            const res = await fetch(`/api/v1/qa/sessions/${sessionId}/verify`);
            return await res.json();
        } catch (e) {
            console.error('Failed to verify session', e);
            return { success: false, error: e.message };
        }
    }
}
