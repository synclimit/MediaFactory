class FaceProvider {
    async detectFaces(imageUrl) {
        // Mock Face Detection to avoid native dependencies blocking Sprint 3
        // In production, this integrates with face-api.js or a Python OpenCV microservice
        const hasFace = Math.random() > 0.5; 
        if (!hasFace) return [];
        
        return [{
            box: { x: 100, y: 100, width: 200, height: 200 },
            confidence: 0.95
        }];
    }
}
module.exports = FaceProvider;