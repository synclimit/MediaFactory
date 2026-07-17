class PlaylistParser {
    static parseText(text) {
        if (!text || typeof text !== 'string') return [];
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map((title, i) => ({
                id: `track-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`,
                title
            }));
    }

    static parseCSV(csv) {
        if (!csv || typeof csv !== 'string') return [];
        const lines = csv.split('\n');
        return lines
            .map(line => {
                const cols = line.split(',');
                return cols[0] ? cols[0].trim().replace(/^"|"$/g, '') : '';
            })
            .filter(title => title.length > 0 && title.toLowerCase() !== 'title')
            .map((title, i) => ({
                id: `track-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`,
                title
            }));
    }

    static async parseClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            return this.parseText(text);
        } catch (err) {
            console.error('Failed to read clipboard', err);
            return [];
        }
    }

    static async parseFile(file, type) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                if (type === 'csv') {
                    resolve(this.parseCSV(content));
                } else {
                    resolve(this.parseText(content));
                }
            };
            reader.readAsText(file);
        });
    }
}

export default PlaylistParser;
