import { IAnalyzer } from '../interfaces/IAnalyzer.js';
import { FeatureDescriptor } from '../contracts/FeatureDescriptor.js';

export class ModuleAnalyzer extends IAnalyzer {
    constructor(featureRegistry = null) {
        super();
        this.registry = featureRegistry;
    }

    analyze(projectData) {
        const rawModules = projectData.modules || ['SubtitleEngine'];
        const resolvedMap = new Map();

        const resolveFeature = (modItem) => {
            let desc = null;
            if (typeof modItem === 'string') {
                desc = this.registry ? this.registry.get(modItem) : null;
                if (!desc) {
                    desc = new FeatureDescriptor({
                        id: modItem,
                        name: modItem,
                        category: 'dynamic'
                    });
                }
            } else if (modItem instanceof FeatureDescriptor) {
                desc = modItem;
            } else if (typeof modItem === 'object' && modItem.id) {
                desc = new FeatureDescriptor(modItem);
            }

            if (desc && !resolvedMap.has(desc.id)) {
                resolvedMap.set(desc.id, desc);
                for (const depId of desc.dependencies) {
                    if (!resolvedMap.has(depId)) {
                        resolveFeature(depId);
                    }
                }
            }
        };

        for (const item of rawModules) {
            resolveFeature(item);
        }

        return Array.from(resolvedMap.values());
    }
}
