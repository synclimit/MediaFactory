class GridManager {
    static getSnapCoords(x, y, gridSize = 16) {
        return {
            x: Math.round(x / gridSize) * gridSize,
            y: Math.round(y / gridSize) * gridSize
        };
    }
}
export default GridManager;