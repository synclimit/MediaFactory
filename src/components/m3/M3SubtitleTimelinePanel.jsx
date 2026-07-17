import React, { useState, useEffect, useRef } from 'react';
import { subtitleRuntime } from '../../services/audio/subtitle/SubtitleRuntime';
import { subtitleEditorService } from '../../services/audio/subtitle/SubtitleEditorService';
import { renderFrameStore } from '../../services/pipeline/runtime/RenderFrameStore';

export default function M3SubtitleTimelinePanel({ 
    m3CurrentTimeSec, setM3CurrentTimeSec, 
    m3TotalDurationSec 
}) {
    const [document, setDocument] = useState(null);
    const [editorState, setEditorState] = useState(subtitleEditorService.getState());
    const [zoom, setZoom] = useState(1);
    const trackAreaRef = useRef(null);
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
    
    // For segment editing
    const [editingSegmentIndex, setEditingSegmentIndex] = useState(-1);
    const [editingText, setEditingText] = useState('');

    useEffect(() => {
        // We'll poll the runtime document when it updates, since subtitleRuntime itself doesn't emit.
        // Actually, we can subscribe to renderFrameStore to get a tick, or SubtitleEditorService.
        const handleFrame = (frame) => {
            // Read document from runtime
            setDocument(subtitleRuntime.document);
        };
        renderFrameStore.subscribe(handleFrame);
        
        const handleEditorUpdate = (state) => {
            setEditorState(state);
            setDocument(subtitleRuntime.document);
        };
        subtitleEditorService.subscribe(handleEditorUpdate);
        subtitleEditorService.mount();

        return () => {
            renderFrameStore.unsubscribe(handleFrame);
            subtitleEditorService.unsubscribe(handleEditorUpdate);
            subtitleEditorService.unmount();
        };
    }, []);

    const basePixelsPerSec = 50;
    const pixelsPerSec = basePixelsPerSec * zoom;
    const totalTimelineWidth = Math.max((m3TotalDurationSec || 60) * pixelsPerSec, 800);

    const handlePointerDownPlayhead = (e) => {
        setIsDraggingPlayhead(true);
        updatePlayheadFromEvent(e);
    };

    const handlePointerMove = (e) => {
        if (isDraggingPlayhead) updatePlayheadFromEvent(e);
    };

    const handlePointerUp = () => {
        setIsDraggingPlayhead(false);
    };

    useEffect(() => {
        if (isDraggingPlayhead) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        }
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDraggingPlayhead]);

    const updatePlayheadFromEvent = (e) => {
        if (!trackAreaRef.current) return;
        const rect = trackAreaRef.current.getBoundingClientRect();
        const scrollLeft = trackAreaRef.current.scrollLeft;
        const x = Math.max(0, e.clientX - rect.left + scrollLeft);
        let time = x / pixelsPerSec;
        time = Math.max(0, Math.min(time, m3TotalDurationSec || 60));
        setM3CurrentTimeSec(time);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    // Segment Dragging Logic
    const [dragState, setDragState] = useState(null); // { type: 'move'|'start'|'end', index, startX, initialStart, initialEnd }

    const handleSegmentPointerDown = (e, index, type) => {
        e.stopPropagation();
        const seg = document.segments[index];
        setDragState({
            type,
            index,
            startX: e.clientX,
            initialStart: seg.start,
            initialEnd: seg.end
        });
        subtitleEditorService.selectSegment(index);
    };

    useEffect(() => {
        if (!dragState) return;

        const handleSegMove = (e) => {
            const dx = e.clientX - dragState.startX;
            const dt = dx / pixelsPerSec;
            
            let newStart = dragState.initialStart;
            let newEnd = dragState.initialEnd;
            
            if (dragState.type === 'move') {
                newStart += dt;
                newEnd += dt;
            } else if (dragState.type === 'start') {
                newStart = Math.min(newStart + dt, newEnd - 0.1);
            } else if (dragState.type === 'end') {
                newEnd = Math.max(newEnd + dt, newStart + 0.1);
            }

            // Live update visual only (or push to service? Service pushes undo, so we shouldn't push every frame)
            // To prevent spamming undo stack, we only apply to runtime document directly during drag, 
            // and push undo on drop. Actually, SubtitleRuntime expects precise updates.
            // Let's just update document directly for live preview, but NOT push undo yet.
            const seg = subtitleRuntime.document.segments[dragState.index];
            seg.start = newStart;
            seg.end = newEnd;
            
            // Re-render
            setDocument({...subtitleRuntime.document});
            subtitleRuntime.update(subtitleRuntime.diagnostics.lastTimestamp, subtitleRuntime.diagnostics.playbackSpeed);
        };

        const handleSegUp = (e) => {
            const seg = subtitleRuntime.document.segments[dragState.index];
            subtitleEditorService.updateSegmentTime(dragState.index, seg.start, seg.end);
            setDragState(null);
        };

        window.addEventListener('pointermove', handleSegMove);
        window.addEventListener('pointerup', handleSegUp);
        return () => {
            window.removeEventListener('pointermove', handleSegMove);
            window.removeEventListener('pointerup', handleSegUp);
        };
    }, [dragState, pixelsPerSec]);

    const handleDoubleClick = (e, index) => {
        e.stopPropagation();
        setEditingSegmentIndex(index);
        setEditingText(document.segments[index].text);
    };

    const commitTextEdit = () => {
        if (editingSegmentIndex !== -1) {
            subtitleEditorService.updateSegmentText(editingSegmentIndex, editingText);
            setEditingSegmentIndex(-1);
        }
    };

    if (!document) return null;

    return (
        <div className="flex flex-col h-40 bg-[#141824] border-t border-[#2d3247] shrink-0 text-white select-none">
            <div className="flex items-center justify-between px-4 py-1 border-b border-[#2d3247] bg-[#1a1e2d]">
                <div className="flex items-center gap-4 text-xs font-bold text-orange-400">
                    SUBTITLE TIMELINE 
                    <span className="text-[10px] font-normal text-gray-500">
                        (Ctrl+Z Undo, Ctrl+Y Redo)
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[10px]">Style:</span>
                        <select 
                            value={subtitleRuntime.getState().style}
                            onChange={(e) => {
                                subtitleEditorService._pushUndo();
                                subtitleRuntime.getState().style = e.target.value;
                                subtitleRuntime.update(subtitleRuntime.diagnostics.lastTimestamp, subtitleRuntime.diagnostics.playbackSpeed);
                                subtitleEditorService.notify(); // force rerender
                            }}
                            className="bg-[#2d3247] text-white text-[10px] px-1 py-0.5 rounded outline-none"
                        >
                            <option value="Classic">Classic</option>
                            <option value="Fade">Fade</option>
                            <option value="Slide">Slide</option>
                            <option value="Slide + Fade">Slide + Fade</option>
                            <option value="Highlight Current Line">Highlight Current Line</option>
                            <option value="Rolling Lyrics">Rolling Lyrics</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[10px]">Zoom:</span>
                        <input 
                            type="range" min="0.2" max="3" step="0.1" 
                            value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="w-24 h-1 bg-[#2d3247] rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-32 border-r border-[#2d3247] bg-[#1a1e2d] shrink-0 p-2 text-xs text-gray-400 font-bold">
                    Subtitles Layer
                </div>

                <div ref={trackAreaRef} className="flex-1 overflow-auto relative custom-scrollbar bg-[#0a0d14]">
                    <div style={{ width: `${totalTimelineWidth}px`, minHeight: '100%' }} className="relative">
                        
                        <div className="sticky top-0 h-4 bg-[#1e2230] border-b border-[#2d3247] z-20 cursor-text" onPointerDown={handlePointerDownPlayhead}>
                            {/* Simple ticks */}
                        </div>

                        {/* Playhead */}
                        <div className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-30 pointer-events-none" style={{ left: `${m3CurrentTimeSec * pixelsPerSec}px` }}>
                            <div className="absolute top-0 -left-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-red-500"></div>
                        </div>

                        {/* Subtitle Segments */}
                        <div className="absolute top-6 bottom-0 left-0 right-0 h-8">
                            {document.segments && document.segments.map((seg, i) => {
                                const left = seg.start * pixelsPerSec;
                                const width = (seg.end - seg.start) * pixelsPerSec;
                                const isSelected = editorState.selectedSegmentIndex === i;
                                const isEditing = editingSegmentIndex === i;

                                return (
                                    <div 
                                        key={i}
                                        className={`absolute top-0 h-full rounded border flex items-center px-1 overflow-hidden ${isSelected ? 'bg-orange-600/50 border-orange-500' : 'bg-orange-900/30 border-orange-900/50 hover:bg-orange-800/40'}`}
                                        style={{ left: `${left}px`, width: `${width}px` }}
                                        onPointerDown={(e) => handleSegmentPointerDown(e, i, 'move')}
                                        onDoubleClick={(e) => handleDoubleClick(e, i)}
                                    >
                                        <div 
                                            className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize bg-black/20 hover:bg-white/30"
                                            onPointerDown={(e) => handleSegmentPointerDown(e, i, 'start')}
                                        />
                                        
                                        {isEditing ? (
                                            <input 
                                                autoFocus
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                onBlur={commitTextEdit}
                                                onKeyDown={(e) => { if(e.key === 'Enter') commitTextEdit(); }}
                                                className="w-full text-[10px] bg-transparent text-white outline-none border-b border-orange-300"
                                            />
                                        ) : (
                                            <span className="text-[10px] text-white whitespace-nowrap pointer-events-none">{seg.text}</span>
                                        )}

                                        <div 
                                            className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize bg-black/20 hover:bg-white/30"
                                            onPointerDown={(e) => handleSegmentPointerDown(e, i, 'end')}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
