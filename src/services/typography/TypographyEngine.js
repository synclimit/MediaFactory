class TypographyEngine {
    static normalize(config) {
        if (!config) config = {};
        
        return {
            fontFamily: config.font || config.fontFamily || 'Inter',
            fontSize: config.fontSize !== undefined ? config.fontSize : 24,
            fontWeight: config.fontWeight || 'normal',
            fontStyle: config.fontStyle || 'normal',
            color: config.color || '#ffffff',
            lineHeight: config.lineHeight !== undefined ? config.lineHeight : 1.5,
            letterSpacing: config.letterSpacing !== undefined ? config.letterSpacing : 0,
            textAlign: config.align ? config.align.toLowerCase() : 'left',
            opacity: config.opacity !== undefined ? config.opacity : 100
        };
    }
}

export default TypographyEngine;
