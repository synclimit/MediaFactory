export class AssetGeneratorService {
    static async selectFolder() {
        const res = await fetch('/api/m2/dialog/folder', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to open folder picker');
        const data = await res.json();
        return data.path;
    }

    static async selectFile() {
        const res = await fetch('/api/m2/dialog/file', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to open file picker');
        const data = await res.json();
        return data.path;
    }

    static async scanFolder(folderPath) {
        const res = await fetch('/api/m2/assets/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderPath })
        });
        
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            throw new Error('Backend route not found! The backend has not been restarted yet. Please close the app and restart it to apply the new features.');
        }

        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        return data.files;
    }

    static async startProcess(queue, options = {}) {
        const res = await fetch('/api/m2/assets/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queue, options })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        return data;
    }

    static async pollStatus() {
        const res = await fetch('/api/m2/assets/status');
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        return { queue: data.queue, isProcessing: data.isProcessing };
    }

    static async cancelProcess() {
        const res = await fetch('/api/m2/assets/cancel', { method: 'POST' });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        return data;
    }
}
