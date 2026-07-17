import React from 'react';
import EditorUI from './EditorUI';

export default function WorkspaceUI() {
    return (
        <div className="workspace-ui">
            <h1>M5 News Workspace</h1>
            <div className="project-grid">
                {/* Render 100 projects mock */}
            </div>
            <EditorUI />
        </div>
    );
}