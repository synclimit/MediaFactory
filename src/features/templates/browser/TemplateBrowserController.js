import { templateManager } from '../../../services/templates/TemplateManager';

class TemplateBrowserController extends EventTarget {
    constructor() {
        super();
        this.state = {
            templates: [],
            total: 0,
            selectedTemplate: null,
            search: '',
            filter: {},
            sort: '-createdAt',
            loading: false,
            page: 1,
            limit: 20
        };

        templateManager.addEventListener('templateChanged', this.handleTemplateChanged.bind(this));
    }

    getState() {
        return { ...this.state };
    }

    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.dispatchEvent(new CustomEvent('stateChanged', { detail: this.getState() }));
    }

    handleTemplateChanged() {
        this.refresh();
    }

    async refresh() {
        this.setState({ loading: true });
        try {
            const query = {
                search: this.state.search,
                filter: this.state.filter,
                sort: this.state.sort,
                page: this.state.page,
                limit: this.state.limit
            };
            const result = await templateManager.queryTemplates(query);
            this.setState({ 
                templates: result.items, 
                total: result.total,
                loading: false 
            });
        } catch (error) {
            console.error('[TemplateBrowserController] Refresh failed:', error);
            this.setState({ loading: false });
        }
    }

    setSearch(search) {
        this.setState({ search, page: 1 });
        this.refresh();
    }

    setFilter(filter) {
        this.setState({ filter, page: 1 });
        this.refresh();
    }

    setSort(sort) {
        this.setState({ sort, page: 1 });
        this.refresh();
    }

    setPage(page) {
        this.setState({ page });
        this.refresh();
    }

    setLimit(limit) {
        this.setState({ limit, page: 1 });
        this.refresh();
    }

    selectTemplate(template) {
        this.setState({ selectedTemplate: template });
    }

    clearSelection() {
        this.setState({ selectedTemplate: null });
    }

    async applySelected() {
        if (!this.state.selectedTemplate) return false;
        try {
            await templateManager.loadTemplate(this.state.selectedTemplate.id);
            return true;
        } catch (error) {
            console.error('[TemplateBrowserController] Apply failed:', error);
            return false;
        }
    }

    async deleteSelected() {
        if (!this.state.selectedTemplate) return false;
        try {
            const success = await templateManager.removeTemplate(this.state.selectedTemplate.id);
            if (success) {
                this.clearSelection();
            }
            return success;
        } catch (error) {
            console.error('[TemplateBrowserController] Delete failed:', error);
            return false;
        }
    }
}

export const templateBrowserController = new TemplateBrowserController();
export default TemplateBrowserController;
