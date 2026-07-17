class GraphUtils {
    /**
     * Helper to generate unique link names for filtergraphs
     * @param {string} prefix 
     */
    static generateLinkId(prefix = 'v') {
        return `${prefix}_${Math.random().toString(36).substr(2, 6)}`;
    }
}

module.exports = GraphUtils;
