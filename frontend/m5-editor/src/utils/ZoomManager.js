class ZoomManager {
    static getFitZoom(canvasWidth = 390, canvasHeight = 844, screenWidth = 1920, screenHeight = 1080) {
        return Math.min((screenWidth - 400) / canvasWidth, (screenHeight - 100) / canvasHeight);
    }
}
export default ZoomManager;