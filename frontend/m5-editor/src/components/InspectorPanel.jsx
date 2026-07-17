import React from 'react';

export default function InspectorPanel() {
    return (
        <div className="inspector-panel">
            <h3>Inspector</h3>
            {/* Card JSON, AI Draft, Visual Draft, Metadata, Performance */}
            <pre>{"{ Card JSON Data }"}</pre>
        </div>
    );
}