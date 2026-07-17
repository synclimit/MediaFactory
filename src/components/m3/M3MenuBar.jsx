import React, { useState, useRef, useEffect } from 'react';
import { projectManager } from '../../services/pipeline/project/ProjectManager';

export default function M3MenuBar({
    onNew, onOpen, onSave, onSaveAs,
    onUndo, onRedo, onCopy, onPaste, onDelete,
    onExport,
    addNotification
}) {
    const [openMenu, setOpenMenu] = useState(null);
    const [projects, setProjects] = useState([]);

    const handleMenuClick = (menu) => {
        if (openMenu === menu) setOpenMenu(null);
        else {
            if (menu === 'File') {
                setProjects(projectManager.getAllProjects());
            }
            setOpenMenu(menu);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.m3-menu-bar')) {
                setOpenMenu(null);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="m3-menu-bar flex items-center bg-[#1a1c23] border-b border-[#2d3247] px-2 h-8 text-[11px] text-gray-300 relative z-50">
            {/* File Menu */}
            <div className="relative">
                <button onClick={() => handleMenuClick('File')} className="px-3 py-1 hover:bg-[#2d3247] rounded cursor-pointer">File</button>
                {openMenu === 'File' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-[#1a1c23] border border-[#2d3247] shadow-xl rounded py-1">
                        <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { onNew(); setOpenMenu(null); }}>New Project</button>
                        <div className="group relative">
                            <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247] flex justify-between">
                                Open Recent <span>▶</span>
                            </button>
                            <div className="hidden group-hover:block absolute top-0 left-full w-48 bg-[#1a1c23] border border-[#2d3247] shadow-xl rounded py-1">
                                {projects.length === 0 ? <div className="px-4 py-1 text-gray-500">No recent projects</div> : null}
                                {projects.map(p => (
                                    <button key={p.id} className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { onOpen(p.id); setOpenMenu(null); }}>
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-px bg-[#2d3247] my-1"></div>
                        <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { onSave(); setOpenMenu(null); }}>Save <span className="float-right text-gray-500 text-[9px]">Ctrl+S</span></button>
                        <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { onSaveAs(); setOpenMenu(null); }}>Save As...</button>
                        <div className="h-px bg-[#2d3247] my-1"></div>
                        <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { 
                            projectManager.isAutoSaveEnabled = !projectManager.isAutoSaveEnabled;
                            addNotification(`Autosave ${projectManager.isAutoSaveEnabled ? 'Enabled' : 'Disabled'}`);
                            setOpenMenu(null);
                        }}>Toggle Autosave</button>
                    </div>
                )}
            </div>

            {/* Edit Menu */}
            <div className="relative">
                <button onClick={() => handleMenuClick('Edit')} className="px-3 py-1 hover:bg-[#2d3247] rounded cursor-pointer">Edit</button>
                {openMenu === 'Edit' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-[#1a1c23] border border-[#2d3247] shadow-xl rounded py-1">
                        <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { onUndo(); setOpenMenu(null); }}>Undo <span className="float-right text-gray-500 text-[9px]">Ctrl+Z</span></button>
                        <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { onRedo(); setOpenMenu(null); }}>Redo <span className="float-right text-gray-500 text-[9px]">Ctrl+Y</span></button>
                        <div className="h-px bg-[#2d3247] my-1"></div>
                        <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { onCopy(); setOpenMenu(null); }}>Copy <span className="float-right text-gray-500 text-[9px]">Ctrl+C</span></button>
                        <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { onPaste(); setOpenMenu(null); }}>Paste <span className="float-right text-gray-500 text-[9px]">Ctrl+V</span></button>
                        <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { onDelete(); setOpenMenu(null); }}>Delete <span className="float-right text-gray-500 text-[9px]">Del</span></button>
                    </div>
                )}
            </div>

            {/* Export Menu */}
            <div className="relative">
                <button onClick={() => handleMenuClick('Export')} className="px-3 py-1 hover:bg-[#2d3247] rounded cursor-pointer">Export</button>
                {openMenu === 'Export' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-[#1a1c23] border border-[#2d3247] shadow-xl rounded py-1">
                        <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { onExport('mp4'); setOpenMenu(null); }}>Export Video (MP4)</button>
                        <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { onExport('webm'); setOpenMenu(null); }}>Export Video (WEBM)</button>
                        <div className="h-px bg-[#2d3247] my-1"></div>
                        <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { onExport('png'); setOpenMenu(null); }}>Export PNG Sequence</button>
                        <button className="w-full text-left px-4 py-1 hover:bg-[#2d3247]" onClick={() => { onExport('image'); setOpenMenu(null); }}>Export Current Frame</button>
                    </div>
                )}
            </div>
            
            <div className="ml-auto flex items-center gap-4">
                <span className="text-gray-500">{projectManager.currentProject?.name || 'Untitled Project'}</span>
            </div>
        </div>
    );
}
