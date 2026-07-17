import TemplateProviderInterface from './TemplateProviderInterface.js';

/**
 * MF-207B: Local Template Provider
 * 
 * First implementation of the TemplateProviderInterface.
 * Operates purely in-memory (RAM) as temporary storage.
 * It contains NO persistent storage logic (no File System, IndexedDB, or SQLite).
 */
class LocalTemplateProvider extends TemplateProviderInterface {
    constructor() {
        super();
        // In-memory key-value store mapping template ID to template object
        this.store = new Map();
    }

    /**
     * Retrieve a specific template by its unique ID.
     * @param {string} id - The unique identifier of the template.
     * @returns {Promise<Object|null>}
     */
    async get(id) {
        if (!id) return null;
        return this.store.get(id) || null;
    }

    /**
     * Retrieve all available templates from this memory provider.
     * @returns {Promise<Array<Object>>}
     */
    async getAll() {
        return Array.from(this.store.values());
    }

    /**
     * Save or update a template into the memory storage.
     * @param {Object} template - The template data object to save.
     * @returns {Promise<boolean>}
     */
    async save(template) {
        if (!template || !template.id) {
            console.warn("[LocalTemplateProvider] Attempted to save invalid template or template without ID.");
            return false;
        }
        
        // Save by ID
        this.store.set(template.id, template);
        return true;
    }

    /**
     * Delete a template from the memory storage by its unique ID.
     * @param {string} id - The unique identifier of the template.
     * @returns {Promise<boolean>}
     */
    async remove(id) {
        if (!id) return false;
        return this.store.delete(id);
    }

    /**
     * Fast-check to determine if a template exists within memory.
     * @param {string} id - The unique identifier of the template.
     * @returns {Promise<boolean>}
     */
    async exists(id) {
        if (!id) return false;
        return this.store.has(id);
    }
}

// Export singleton instance for easy dependency injection
export const localTemplateProvider = new LocalTemplateProvider();
export default LocalTemplateProvider;
