import React from 'react';

export default function InspectorLivePanel({ pipelineData }) {
    return (
        <div className="inspector-panel live-inspector">
            <h3>Inspector</h3>
            <div className="inspector-group">
                <h4>Pipeline Status</h4>
                <p>Status: {pipelineData?.status}</p>
            </div>
            <div className="inspector-group">
                <h4>Data Output</h4>
                <ul>
                    <li>Raw Article Loaded</li>
                    <li>AI Draft Loaded</li>
                    <li>Visual Draft Loaded</li>
                    <li>Card State Synchronized</li>
                    <li>Editor State Locked</li>
                </ul>
            </div>
            <div className="inspector-group">
                <h4>Performance</h4>
                <p>FPS: 60 | Mem: <300MB</p>
            </div>
        </div>
    );
}