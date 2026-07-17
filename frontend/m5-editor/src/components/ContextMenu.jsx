import React from 'react';

export default function ContextMenu() {
    return (
        <div className="context-menu">
            <ul>
                <li>Duplicate</li>
                <li>Delete</li>
                <hr />
                <li>Bring Forward</li>
                <li>Send Backward</li>
                <hr />
                <li>Lock</li>
                <li>Hide</li>
            </ul>
        </div>
    );
}