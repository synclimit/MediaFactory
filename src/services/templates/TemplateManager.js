import { configurationManager } from '../configuration/ConfigurationManager';
import { templateRepository } from './TemplateRepository';

function generateId() {
    return 'tpl_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

class TemplateManager extends EventTarget {
    constructor() {
        // Templates are now managed by TemplateRepository
    }

    /**
     * Create a new template object capturing the current workspace state.
     * Does NOT register it automatically.
     * @param {Object} input Metadata and core fields for the template
     * @returns {Object} The created template object
     */
    createTemplate(input = {}) {
        const configurationSnapshotStr = configurationManager.exportConfiguration();
        const configuration = JSON.parse(configurationSnapshotStr);

        const now = new Date().toISOString();

        const template = {
            id: generateId(),
            name: input.name || 'Untitled Template',
            description: input.description || '',
            preview: input.preview || null,
            configuration,
            objects: input.objects || [],
            metadata: {
                author: input.author || 'Unknown',
                version: input.version || '1.0.0',
                createdAt: now,
                updatedAt: now,
                tags: input.tags || [],
                category: input.category || 'General'
            }
        };

        // Merge any remaining input properties into metadata
        for (const key in input) {
            if (!['name', 'description', 'preview', 'objects', 'author', 'version', 'tags', 'category'].includes(key)) {
                template.metadata[key] = input[key];
            }
        }

        return template;
    }

    /**
     * Validate and register a template into the repository.
     * @param {Object} template 
     */
    async registerTemplate(template) {
        if (!template || !template.id) {
            throw new Error("TemplateManager: Invalid template object. Template must have an ID.");
        }
        
        // Prevent immutable ID violation
        const exists = await templateRepository.exists(template.id);
        if (exists) {
            throw new Error(`TemplateManager: Template with ID '${template.id}' already exists.`);
        }

        template.metadata = template.metadata || {};
        if (!template.metadata.createdAt) {
            template.metadata.createdAt = new Date().toISOString();
        }
        template.metadata.updatedAt = new Date().toISOString();

        await templateRepository.save(template);
        this.dispatchEvent(new CustomEvent('templateChanged', { detail: { action: 'register', template } }));
        return template;
    }

    /**
     * Retrieve a specific template by ID.
     * @param {string} id 
     * @returns {Promise<Object|null>}
     */
    async getTemplate(id) {
        return await templateRepository.get(id);
    }

    /**
     * Retrieve all available templates.
     * @returns {Promise<Array<Object>>}
     */
    async getTemplates() {
        return await templateRepository.getAll();
    }

    /**
     * Query templates using the TemplateRepository.
     * @param {Object} queryObject 
     * @returns {Promise<{items: Array<Object>, total: number, page: number, limit: number}>}
     */
    async queryTemplates(queryObject = {}) {
        return await templateRepository.query(queryObject);
    }

    /**
     * Update an existing template in the repository.
     * @param {string} id 
     * @param {Object} updates Partial updates to apply to the template
     */
    async updateTemplate(id, updates = {}) {
        const template = await this.getTemplate(id);
        if (!template) {
            throw new Error(`TemplateManager: Template with id '${id}' not found.`);
        }

        // Prevent ID modification
        if (updates.id && updates.id !== template.id) {
            throw new Error("TemplateManager: Template ID is immutable.");
        }

        // Apply core field updates
        if (updates.name !== undefined) template.name = updates.name;
        if (updates.description !== undefined) template.description = updates.description;
        if (updates.preview !== undefined) template.preview = updates.preview;
        if (updates.configuration !== undefined) template.configuration = updates.configuration;
        if (updates.objects !== undefined) template.objects = updates.objects;

        // Apply metadata updates
        if (updates.metadata) {
            template.metadata = { ...template.metadata, ...updates.metadata };
        }

        template.metadata.updatedAt = new Date().toISOString();
        
        await templateRepository.save(template);
        this.dispatchEvent(new CustomEvent('templateChanged', { detail: { action: 'update', template } }));
        return template;
    }

    /**
     * Remove a template by ID.
     * @param {string} id 
     * @returns {Promise<boolean>} True if the template was removed, false otherwise
     */
    async removeTemplate(id) {
        const result = await templateRepository.remove(id);
        if (result) {
            this.dispatchEvent(new CustomEvent('templateChanged', { detail: { action: 'remove', id } }));
        }
        return result;
    }

    /**
     * Load a template into the active workspace configuration.
     * @param {string} id 
     * @returns {Promise<boolean>} True if loaded successfully
     */
    async loadTemplate(id) {
        const template = await this.getTemplate(id);
        if (!template) {
            throw new Error(`TemplateManager: Template with id '${id}' not found.`);
        }

        // Load configuration using ConfigurationManager
        configurationManager.importConfiguration(template.configuration);
        return true;
    }
}

export const templateManager = new TemplateManager();
export default TemplateManager;
