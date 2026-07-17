class PlaylistTransformEngine {
    static calculate(layoutData, playlistObject) {
        const defaultTransform = { x: 0, y: 0, scale: 1, rotation: 0, opacity: 100, visible: true };

        const baseLeft = layoutData.leftColumn || { x: 0 };
        const userLeft = playlistObject.leftTransform || {};
        
        const baseRight = layoutData.rightColumn || { x: 0 };
        const userRight = playlistObject.rightTransform || {};

        return {
            leftColumnTransform: {
                x: baseLeft.x + (userLeft.x || 0),
                y: (userLeft.y || 0),
                scale: userLeft.scale !== undefined ? userLeft.scale : defaultTransform.scale,
                rotation: userLeft.rotation || defaultTransform.rotation,
                opacity: userLeft.opacity !== undefined ? userLeft.opacity : defaultTransform.opacity,
                visible: userLeft.visible !== undefined ? userLeft.visible : defaultTransform.visible,
            },
            rightColumnTransform: {
                x: baseRight.x + (userRight.x || 0),
                y: (userRight.y || 0),
                scale: userRight.scale !== undefined ? userRight.scale : defaultTransform.scale,
                rotation: userRight.rotation || defaultTransform.rotation,
                opacity: userRight.opacity !== undefined ? userRight.opacity : defaultTransform.opacity,
                visible: userRight.visible !== undefined ? userRight.visible : defaultTransform.visible,
            }
        };
    }
}

export default PlaylistTransformEngine;
