export const TypographyThemes = [
    {
        id: 'theme-classic',
        version: '1.0',
        name: 'Classic',
        description: 'Standard readable typography',
        category: 'Basic',
        typography: {
            fontFamily: 'Arial, sans-serif',
            fontSize: 24,
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: '#ffffff',
            lineHeight: 1.5,
            letterSpacing: 0,
            textAlign: 'left',
            opacity: 100
        }
    },
    {
        id: 'theme-minimal',
        version: '1.0',
        name: 'Minimal',
        description: 'Clean and tight layout',
        category: 'Modern',
        typography: {
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: 20,
            fontWeight: '300',
            fontStyle: 'normal',
            color: '#e0e0e0',
            lineHeight: 1.2,
            letterSpacing: 2,
            textAlign: 'left',
            opacity: 90
        }
    },
    {
        id: 'theme-djneon',
        version: '1.0',
        name: 'DJ Neon',
        description: 'Vibrant club style',
        category: 'Creative',
        typography: {
            fontFamily: '"Impact", sans-serif',
            fontSize: 32,
            fontWeight: 'bold',
            fontStyle: 'italic',
            color: '#00ffcc',
            lineHeight: 1.1,
            letterSpacing: 4,
            textAlign: 'left',
            opacity: 100
        }
    },
    {
        id: 'theme-modern',
        version: '1.0',
        name: 'Modern',
        description: 'Sleek geometric style',
        category: 'Modern',
        typography: {
            fontFamily: '"Trebuchet MS", sans-serif',
            fontSize: 26,
            fontWeight: '600',
            fontStyle: 'normal',
            color: '#ffffff',
            lineHeight: 1.4,
            letterSpacing: 1,
            textAlign: 'left',
            opacity: 100
        }
    },
    {
        id: 'theme-bold',
        version: '1.0',
        name: 'Bold',
        description: 'Heavy impact style',
        category: 'Basic',
        typography: {
            fontFamily: '"Arial Black", sans-serif',
            fontSize: 36,
            fontWeight: '900',
            fontStyle: 'normal',
            color: '#ffffff',
            lineHeight: 1.0,
            letterSpacing: -1,
            textAlign: 'left',
            opacity: 100
        }
    },
    {
        id: 'theme-elegant',
        version: '1.0',
        name: 'Elegant',
        description: 'Sophisticated serif',
        category: 'Creative',
        typography: {
            fontFamily: 'Georgia, serif',
            fontSize: 22,
            fontWeight: 'normal',
            fontStyle: 'italic',
            color: '#f5deb3',
            lineHeight: 1.8,
            letterSpacing: 1,
            textAlign: 'left',
            opacity: 95
        }
    }
];

export const getThemeById = (id) => TypographyThemes.find(t => t.id === id) || TypographyThemes[0];
