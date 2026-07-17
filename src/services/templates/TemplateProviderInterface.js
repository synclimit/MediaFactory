/**
 * MF-207A: Template Provider Interface
 * 
 * Defines the official contract for all template providers within MediaFactory.
 * Any storage mechanism (Local, Cloud, Marketplace) MUST implement this interface 
 * in order to be compatible with the TemplateRepository.
 * 
 * As JavaScript lacks native interface constructs, this class serves as an 
 * abstract base class. Methods throw 'Not Implemented' errors to strictly 
 * enforce overriding by derived classes.
 */

class TemplateProviderInterface {
    
    /**
     * Retrieve a specific template by its unique ID.
     * @param {string} id - The unique identifier of the template.
     * @returns {Promise<Object|null>} A promise resolving to the template object, or null if not found.
     */
    async get(id) {
        throw new Error(`[TemplateProviderInterface] Method 'get(id)' is not implemented.`);
    }

    /**
     * Retrieve all available templates from this provider.
     * @returns {Promise<Array<Object>>} A promise resolving to an array of template objects.
     */
    async getAll() {
        throw new Error(`[TemplateProviderInterface] Method 'getAll()' is not implemented.`);
    }

    /**
     * Save or update a template into the provider's storage.
     * @param {Object} template - The template data object to save.
     * @returns {Promise<boolean>} A promise resolving to true if successfully saved, false otherwise.
     */
    async save(template) {
        throw new Error(`[TemplateProviderInterface] Method 'save(template)' is not implemented.`);
    }

    /**
     * Delete a template from the provider's storage by its unique ID.
     * @param {string} id - The unique identifier of the template.
     * @returns {Promise<boolean>} A promise resolving to true if successfully removed, false otherwise.
     */
    async remove(id) {
        throw new Error(`[TemplateProviderInterface] Method 'remove(id)' is not implemented.`);
    }

    /**
     * Fast-check to determine if a template exists within this provider without fully loading it.
     * @param {string} id - The unique identifier of the template.
     * @returns {Promise<boolean>} A promise resolving to true if the template exists, false otherwise.
     */
    async exists(id) {
        throw new Error(`[TemplateProviderInterface] Method 'exists(id)' is not implemented.`);
    }
}

export default TemplateProviderInterface;
