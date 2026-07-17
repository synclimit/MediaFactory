import React from 'react';
import SelectionOverlay from './SelectionOverlay';
import ZoomManager from '../utils/ZoomManager';

export default function PreviewCanvas() {
    // 390x844 Canvas
    return (
        <div className="canvas-wrapper" style={{ zoom: ZoomManager.getFitZoom() }}>
            <div className="canvas-guides safe-area" />
            <div className="canvas-board" style={{ width: 390, height: 844 }}>
                {/* Layers Rendered Here - Realtime No Refresh */}
                <SelectionOverlay />
            </div>
        </div>
    );
}