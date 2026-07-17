const STORAGE_KEY = 'mediafactory_m2_templates';
const MAX_TEMPLATES = 100;

class TemplateManagerService {
  constructor() {
    this.storageKey = STORAGE_KEY;
  }

  listTemplates() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveTemplate(template) {
    const templates = this.listTemplates();
    if (templates.length >= MAX_TEMPLATES) {
      return 'TEMPLATE_LIMIT_REACHED';
    }
    templates.unshift(template);
    localStorage.setItem(this.storageKey, JSON.stringify(templates));
    return 'SUCCESS';
  }

  loadTemplate(id) {
    const templates = this.listTemplates();
    return templates.find(t => t.id === id) || null;
  }

  deleteTemplate(id) {
    let templates = this.listTemplates();
    templates = templates.filter(t => t.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(templates));
  }

  duplicateTemplate(id) {
    const templates = this.listTemplates();
    const source = templates.find(t => t.id === id);
    if (!source) return 'TEMPLATE_NOT_FOUND';
    
    if (templates.length >= MAX_TEMPLATES) {
      return 'TEMPLATE_LIMIT_REACHED';
    }

    let newName = `${source.name} (Copy)`;
    let copyIndex = 2;
    while (templates.some(t => t.name === newName)) {
      newName = `${source.name} (Copy ${copyIndex})`;
      copyIndex++;
    }

    const duplicate = {
      ...source,
      id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    templates.unshift(duplicate);
    localStorage.setItem(this.storageKey, JSON.stringify(templates));
    return 'SUCCESS';
  }
}

export const m2TemplateManager = new TemplateManagerService();
