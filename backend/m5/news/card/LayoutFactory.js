class LayoutFactory {
    determineLayout(aiDraft) {
        const cat = (aiDraft.category || '').toLowerCase();
        
        if (cat.includes('politi')) return 'Portrait';
        if (cat.includes('ekonomi') || cat.includes('bisnis')) return 'Business';
        if (cat.includes('sport') || cat.includes('bola')) return 'Sports';
        if (cat.includes('hiburan') || cat.includes('seleb')) return 'Magazine';
        if (cat.includes('tekno') || cat.includes('tech')) return 'Minimal';
        
        return 'Standard';
    }
}
module.exports = LayoutFactory;