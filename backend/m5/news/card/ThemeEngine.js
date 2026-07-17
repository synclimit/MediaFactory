class ThemeEngine {
    applyTheme(themeName) {
        const themes = {
            'Dark': {
                colors: { bg: '#121212', text: '#ffffff', accent: '#3b82f6' },
                shadow: 'none', radius: '8px'
            },
            'Light': {
                colors: { bg: '#ffffff', text: '#111827', accent: '#2563eb' },
                shadow: '0 4px 6px rgba(0,0,0,0.1)', radius: '12px'
            },
            'Glass': {
                colors: { bg: 'rgba(255,255,255,0.2)', text: '#000000', accent: '#ffffff' },
                shadow: '0 8px 32px rgba(31,38,135,0.37)', radius: '16px'
            },
            'Breaking News': {
                colors: { bg: '#dc2626', text: '#ffffff', accent: '#ffffff' },
                shadow: '0 4px 6px rgba(0,0,0,0.3)', radius: '4px'
            }
        };
        
        const base = themes[themeName] || themes['Light'];
        return {
            theme: themeName,
            colors: base.colors,
            shadow: base.shadow,
            radius: base.radius,
            typography: { fontTitle: 'Inter, sans-serif', fontBody: 'Roboto, sans-serif' },
            spacing: { padding: '16px', margin: '8px' }
        };
    }
}
module.exports = ThemeEngine;