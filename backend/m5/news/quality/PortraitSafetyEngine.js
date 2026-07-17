const FaceProvider = require('./FaceProvider');

class PortraitSafetyEngine {
    constructor() {
        this.faceProvider = new FaceProvider();
    }
    
    async checkSafety(image) {
        if (!image || !image.url) return { safe: true, faces: [], safeArea: null };
        
        const faces = await this.faceProvider.detectFaces(image.url);
        
        if (faces.length === 0) {
            return { safe: true, faces: [], safeArea: null };
        }
        
        // Calculate Safe Area encompassing all faces
        let minX = 99999, minY = 99999, maxX = 0, maxY = 0;
        faces.forEach(f => {
            if (f.box.x < minX) minX = f.box.x;
            if (f.box.y < minY) minY = f.box.y;
            if (f.box.x + f.box.width > maxX) maxX = f.box.x + f.box.width;
            if (f.box.y + f.box.height > maxY) maxY = f.box.y + f.box.height;
        });
        
        const padding = 50; // padding around faces
        const safeArea = {
            x: Math.max(0, minX - padding),
            y: Math.max(0, minY - padding),
            width: (maxX - minX) + (padding * 2),
            height: (maxY - minY) + (padding * 2)
        };
        
        return {
            safe: false, 
            faces,
            safeArea
        };
    }
}
module.exports = PortraitSafetyEngine;