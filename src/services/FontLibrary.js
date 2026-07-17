class FontLibrary {
    constructor() {
        this.fonts = new Set(['Inter', 'Roboto', 'Outfit', 'monospace', 'serif', 'sans-serif']);
        this.initialized = false;
        this.styleElement = null;
    }

    async initialize() {
        if (this.initialized) return;
        
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'm3-dynamic-fonts';
        document.head.appendChild(this.styleElement);

        await this.loadAvailableFonts();
        this.initialized = true;
    }

    async loadAvailableFonts() {
        try {
            const res = await fetch('/api/m3/font/list');
            if (res.ok) {
                const data = await res.json();
                let cssRules = '';
                
                data.fonts.forEach(fileName => {
                    // Extract font name without extension
                    const fontName = fileName.replace(/\.[^/.]+$/, "");
                    this.fonts.add(fontName);
                    
                    // Generate dynamic @font-face rule
                    cssRules += `
                        @font-face {
                            font-family: '${fontName}';
                            src: url('/assets/Fonts/${fileName}');
                            font-weight: normal;
                            font-style: normal;
                        }
                    `;
                });
                
                if (this.styleElement) {
                    this.styleElement.innerHTML = cssRules;
                }
            }
        } catch (err) {
            console.error('Failed to load font library:', err);
        }
    }

    getFonts() {
        return Array.from(this.fonts);
    }
}

export const fontLibrary = new FontLibrary();
