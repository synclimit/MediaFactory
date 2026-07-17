import React from 'react';

export default function LayerPanel() {
    return (
        <div className="layer-panel">
            <h3>Layers</h3>
            <ul>
                {/* Drag Drop, Hide, Lock, Reorder */}
                <li><span>Headline</span> <button>Lock</button> <button>Hide</button></li>
                <li><span>Image</span> <button>Lock</button> <button>Hide</button></li>
            </ul>
        </div>
    );
}