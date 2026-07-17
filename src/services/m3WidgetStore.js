class M3WidgetStore {
    constructor() {
        this.widgets = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        // In a real backend, this would call an API.
        // For Vite, we can mock it with known widgets or use import.meta.glob if they were inside src/.
        // Since they are in /assets/, we will mock the available folders for now based on the spec.
        
        const availableWidgets = [
            'Subscribe', 'Like', 'Bell', 'Notification', 'LowerThird'
        ];

        for (const widgetId of availableWidgets) {
            try {
                // Fetch the metadata file dynamically
                const res = await fetch(`/assets/SocialWidgets/${widgetId}/metadata.json`);
                if (res.ok) {
                    const metadata = await res.json();
                    
                    // Attach the fully resolved URLs for convenience
                    metadata.videoUrl = `/assets/SocialWidgets/${widgetId}/${metadata.file}`;
                    if (metadata.thumbnail) {
                        metadata.thumbnailUrl = `/assets/SocialWidgets/${widgetId}/${metadata.thumbnail}`;
                    }
                    
                    this.widgets.set(metadata.id, metadata);
                } else if (widgetId !== 'Subscribe') {
                    // Mock data for the other widgets since they don't have files yet
                    this.widgets.set(widgetId.toLowerCase(), {
                        id: widgetId.toLowerCase(),
                        name: widgetId,
                        category: "Social",
                        type: "video",
                        file: `${widgetId.toLowerCase()}.webm`,
                        duration: 3.0,
                        loop: false,
                        defaultScale: 1.0,
                        defaultOpacity: 1.0,
                        anchor: "center",
                        renderer: "video",
                        alphaMode: "chroma",
                        keyColor: "#00FF00",
                        similarity: 0.22,
                        smoothness: 0.08,
                        spill: 0.15,
                        videoUrl: `/assets/SocialWidgets/${widgetId}/${widgetId.toLowerCase()}.webm`
                    });
                }
            } catch (err) {
                console.warn(`Failed to load widget metadata for ${widgetId}`, err);
            }
        }
        
        this.initialized = true;
    }

    getWidget(id) {
        return this.widgets.get(id);
    }

    getAllWidgets() {
        return Array.from(this.widgets.values());
    }
}

export const m3WidgetStore = new M3WidgetStore();
