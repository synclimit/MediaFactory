/**
 * MF-207: Template Repository (Sprint 1)
 * 
 * Abstraction layer between TemplateManager and the storage media.
 * Hides whether a template comes from Local, Cloud, or Marketplace storage.
 * 
 * This module purely serves as the Repository interface orchestrator.
 * It contains NO actual storage logic, marketplace implementation, or cloud sync.
 */

class TemplateRepository {
    constructor() {
        // Storage providers (e.g., LocalProvider, CloudProvider)
        // will be injected here in future sprints.
        this.providers = []; 
    }

    /**
     * Injects a new storage provider into the repository.
     * Providers are ordered. The first provider is treated as the primary 
     * workspace (typically Local Storage) for save/remove operations.
     * 
     * @param {Object} provider A storage provider instance
     */
    addProvider(provider) {
        if (!provider) throw new Error("TemplateRepository: Provider cannot be null.");
        this.providers.push(provider);
    }

    /**
     * Retrieve a specific template by ID.
     * Searches through all registered providers (fallback chain).
     * 
     * @param {string} id Template ID
     * @returns {Promise<Object|null>}
     */
    async get(id) {
        if (this.providers.length === 0) {
            console.warn(`[TemplateRepository] No providers registered. Cannot get('${id}').`);
            return null;
        }
        
        for (const provider of this.providers) {
            if (typeof provider.get === 'function') {
                const template = await provider.get(id);
                if (template) return template; // Return from the first provider that has it
            }
        }
        
        return null;
    }

    /**
     * Retrieve all available templates across all storage providers.
     * 
     * @returns {Promise<Array<Object>>}
     */
    async getAll() {
        if (this.providers.length === 0) {
            console.warn(`[TemplateRepository] No providers registered. Cannot getAll().`);
            return [];
        }

        let allTemplates = [];
        for (const provider of this.providers) {
            if (typeof provider.getAll === 'function') {
                try {
                    const templates = await provider.getAll();
                    if (Array.isArray(templates)) {
                        allTemplates = allTemplates.concat(templates);
                    }
                } catch (error) {
                    console.error("[TemplateRepository] Provider failed during getAll():", error);
                }
            }
        }
        
        // Deduplicate or merge strategies could be implemented here
        return allTemplates;
    }

    /**
     * Save a template. 
     * By default, it delegates writing to the primary (first) provider.
     * 
     * @param {Object} template The template data object
     * @returns {Promise<boolean>} True if successfully saved
     */
    async save(template) {
        if (this.providers.length === 0) {
            console.warn(`[TemplateRepository] No providers registered. Cannot save().`);
            return false;
        }
        
        const primaryProvider = this.providers[0];
        if (typeof primaryProvider.save === 'function') {
            return await primaryProvider.save(template);
        }
        return false;
    }

    /**
     * Remove a template by ID.
     * Deletes from the primary provider.
     * 
     * @param {string} id Template ID
     * @returns {Promise<boolean>}
     */
    async remove(id) {
        if (this.providers.length === 0) {
            console.warn(`[TemplateRepository] No providers registered. Cannot remove('${id}').`);
            return false;
        }
        
        const primaryProvider = this.providers[0];
        if (typeof primaryProvider.remove === 'function') {
            return await primaryProvider.remove(id);
        }
        return false;
    }

    /**
     * Check if a template exists in any registered provider.
     * 
     * @param {string} id Template ID
     * @returns {Promise<boolean>}
     */
    async exists(id) {
        if (this.providers.length === 0) return false;
        
        for (const provider of this.providers) {
            if (typeof provider.exists === 'function') {
                const exists = await provider.exists(id);
                if (exists) return true;
            }
        }
        return false;
    }

    /**
     * Query templates with search, filter, sort, and pagination.
     * Searches through all providers and applies in-memory querying if providers don't support it natively.
     * 
     * @param {Object} queryObject
     * @param {string} [queryObject.search]
     * @param {Object} [queryObject.filter]
     * @param {string|Object} [queryObject.sort]
     * @param {number} [queryObject.page=1]
     * @param {number} [queryObject.limit=20]
     * @returns {Promise<{items: Array<Object>, total: number, page: number, limit: number}>}
     */
    async query(queryObject = {}) {
        const { search = '', filter = {}, sort = null, page = 1, limit = 20 } = queryObject;
        
        let allTemplates = [];
        
        if (this.providers.length === 0) {
            console.warn(`[TemplateRepository] No providers registered. Cannot query().`);
            return { items: [], total: 0, page, limit };
        }

        // Fetch from providers
        for (const provider of this.providers) {
            if (typeof provider.query === 'function') {
                try {
                    const result = await provider.query(queryObject);
                    if (result && Array.isArray(result.items)) {
                        allTemplates = allTemplates.concat(result.items);
                    } else if (Array.isArray(result)) {
                        allTemplates = allTemplates.concat(result);
                    }
                } catch (error) {
                    console.error("[TemplateRepository] Provider failed during query():", error);
                }
            } else if (typeof provider.getAll === 'function') {
                // Fallback to getAll and in-memory query
                try {
                    const templates = await provider.getAll();
                    if (Array.isArray(templates)) {
                        allTemplates = allTemplates.concat(templates);
                    }
                } catch (error) {
                    console.error("[TemplateRepository] Provider failed during getAll() fallback:", error);
                }
            }
        }

        // Apply in-memory search
        if (search) {
            const lowerSearch = search.toLowerCase();
            allTemplates = allTemplates.filter(t => {
                return (
                    (t.name && t.name.toLowerCase().includes(lowerSearch)) ||
                    (t.description && t.description.toLowerCase().includes(lowerSearch)) ||
                    (t.metadata?.tags && t.metadata.tags.some(tag => tag.toLowerCase().includes(lowerSearch))) ||
                    (t.metadata?.author && t.metadata.author.toLowerCase().includes(lowerSearch)) ||
                    (t.metadata?.category && t.metadata.category.toLowerCase().includes(lowerSearch))
                );
            });
        }

        // Apply in-memory filter
        if (filter) {
            Object.keys(filter).forEach(key => {
                const val = filter[key];
                if (val) {
                    allTemplates = allTemplates.filter(t => {
                        if (key === 'category') return t.metadata?.category === val;
                        if (key === 'author') return t.metadata?.author === val;
                        if (key === 'provider') return t.metadata?.provider === val;
                        return true;
                    });
                }
            });
        }

        // Apply in-memory sort
        if (sort) {
            allTemplates.sort((a, b) => {
                let aVal, bVal;
                let direction = 1;
                let sortField = sort;
                
                if (typeof sort === 'object') {
                    sortField = sort.field;
                    direction = sort.direction === 'desc' ? -1 : 1;
                } else if (sort.startsWith('-')) {
                    sortField = sort.substring(1);
                    direction = -1;
                }

                if (sortField === 'name') {
                    aVal = (a.name || '').toLowerCase();
                    bVal = (b.name || '').toLowerCase();
                } else if (sortField === 'createdAt') {
                    aVal = new Date(a.metadata?.createdAt || 0).getTime();
                    bVal = new Date(b.metadata?.createdAt || 0).getTime();
                } else if (sortField === 'updatedAt') {
                    aVal = new Date(a.metadata?.updatedAt || 0).getTime();
                    bVal = new Date(b.metadata?.updatedAt || 0).getTime();
                } else if (sortField === 'author') {
                    aVal = (a.metadata?.author || '').toLowerCase();
                    bVal = (b.metadata?.author || '').toLowerCase();
                } else {
                    aVal = a[sortField];
                    bVal = b[sortField];
                }

                if (aVal < bVal) return -1 * direction;
                if (aVal > bVal) return 1 * direction;
                return 0;
            });
        }

        const total = allTemplates.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const items = allTemplates.slice(startIndex, endIndex);

        return {
            items,
            total,
            page,
            limit
        };
    }
}

export const templateRepository = new TemplateRepository();
export default TemplateRepository;
