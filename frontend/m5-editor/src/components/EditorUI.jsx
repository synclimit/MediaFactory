import React from 'react';
import Toolbar from './Toolbar';
import PreviewCanvas from './PreviewCanvas';
import LayerPanel from './LayerPanel';
import PropertyPanel from './PropertyPanel';
import InspectorPanel from './InspectorPanel';

export default function EditorUI() {
    return (
        <div className="editor-ui" style={{ display: 'flex', height: '100vh' }}>
            <Toolbar />
            <div className="left-panel">
                <LayerPanel />
            </div>
            <div className="center-canvas">
                <PreviewCanvas />
            </div>
            <div className="right-panel">
                <PropertyPanel />
                <InspectorPanel />
            </div>
        </div>
    );
}