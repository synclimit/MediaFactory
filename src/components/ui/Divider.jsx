import React from 'react';

export default function Divider({ className = '' }) {
    return (
        <div className={`h-[1px] w-full bg-[rgba(255,255,255,0.06)] ${className}`} />
    );
}
