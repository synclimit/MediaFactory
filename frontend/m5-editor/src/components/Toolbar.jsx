import React from 'react';

export default function Toolbar() {
    return (
        <div className="toolbar">
            <button>Save</button>
            <button>Undo</button>
            <button>Redo</button>
            <button>Zoom Fit</button>
            <button>Toggle Grid</button>
        </div>
    );
}