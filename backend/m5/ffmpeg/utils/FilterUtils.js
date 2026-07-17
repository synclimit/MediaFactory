class FilterUtils {
    /**
     * Helper to join filter properties safely (ignores null/undefined/empty).
     * @param {string} filterName 
     * @param {Object} props 
     */
    static build(filterName, props = {}) {
        const parts = [];
        for (const [key, value] of Object.entries(props)) {
            if (value !== null && value !== undefined && value !== '') {
                parts.push(`${key}=${value}`);
            }
        }
        if (parts.length === 0) return filterName;
        return `${filterName}=${parts.join(':')}`;
    }

    /**
     * Joins multiple filters in a chain (comma-separated).
     * @param {Array<string>} filters 
     */
    static chain(filters) {
        return filters.filter(f => f && f.length > 0).join(',');
    }
}

module.exports = FilterUtils;
