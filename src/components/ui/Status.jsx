import React from 'react';

export default function Status({ active, label }) {
    return (
        <div className="flex items-center gap-2">
            <div 
                className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                style={{ color: active ? '#2ED573' : '#738091', backgroundColor: 'currentColor' }}
            />
            <span className="text-[12px] font-medium tracking-wide uppercase" style={{ color: active ? '#2ED573' : '#738091' }}>
                {label || (active ? 'Active' : 'Inactive')}
            </span>
        </div>
    );
}
