class MobileViewportEngine {
    calculateFit(image, portraitSafeInfo) {
        const viewport = { width: 390, height: 844 };
        const viewportRatio = viewport.width / viewport.height;
        
        if (!image) return { fitMode: 'cover', fallbackMode: 'none', viewport };
        
        const imgRatio = image.width / (image.height || 1);
        
        if (!portraitSafeInfo.safe && portraitSafeInfo.faces.length > 0) {
            // Smart Crop Engine Pipeline
            const safeArea = portraitSafeInfo.safeArea;
            
            // Can the safe area fit within the 9:16 crop box?
            // If the safe area width is wider than what the 9:16 crop can encompass, we must fallback.
            const maxCropWidthForHeight = image.height * viewportRatio;
            
            if (safeArea.width > maxCropWidthForHeight) {
                // Cannot smart-crop without cutting face or extending beyond image bounds
                return { fitMode: 'contain-blur', fallbackMode: 'contain-blur', viewport };
            }
            
            // Otherwise, we can use Smart Crop!
            return { fitMode: 'smart-crop', fallbackMode: 'contain-blur', viewport };
        }
        
        // No faces -> Safe to cover
        if (imgRatio > 1.8) {
            // Extremely wide panorama
            return { fitMode: 'contain-blur', fallbackMode: 'contain', viewport };
        }
        
        return { fitMode: 'cover', fallbackMode: 'none', viewport };
    }
}
module.exports = MobileViewportEngine;