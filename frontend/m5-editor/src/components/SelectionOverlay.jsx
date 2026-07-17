import React from 'react';

export default function SelectionOverlay() {
    // Handles Bounding Box, Resize Handle, Rotation Handle, Alignment Guide
    return (
        <div className="selection-overlay box-shadow">
            <div className="resize-handle top-left" />
            <div className="resize-handle bottom-right" />
            <div className="rotation-handle" />
            <div className="alignment-guide vertical" />
            <div className="alignment-guide horizontal" />
        </div>
    );
}