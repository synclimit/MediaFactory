import React from 'react';

export default function MenuItem({ 
    icon: Icon, 
    label, 
    selected, 
    onClick, 
    danger,
    rightElement
}) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full h-[56px] px-[20px] rounded-[18px] 
                flex items-center justify-between
                transition-all duration-250 ease-out backdrop-blur-[12px]
                ${selected 
                    ? 'bg-[linear-gradient(90deg,rgba(45,215,255,0.18)_0%,rgba(45,215,255,0.05)_100%)] border border-[rgba(45,215,255,0.20)] shadow-[0_0_20px_rgba(45,215,255,0.10),inset_2px_0_10px_rgba(45,215,255,0.05)] transform scale-[1.01]' 
                    : danger 
                        ? 'bg-transparent border border-transparent hover:shadow-[0_0_15px_rgba(255,90,90,0.15)] hover:-translate-y-[2px]'
                        : 'bg-transparent border border-transparent hover:bg-[rgba(255,255,255,0.03)] hover:-translate-y-[2px] hover:shadow-[0_0_15px_rgba(45,215,255,0.05)]'
                }
            `}
        >
            <div className="flex items-center gap-4">
                {Icon && (
                    <Icon 
                        size={20} 
                        className={`
                            transition-colors duration-250 ease-out
                            ${selected ? 'text-[#32D8FF]' : danger ? 'text-[#FF5A5A]' : 'text-[#738091] hover:text-[#32D8FF]'}
                        `}
                    />
                )}
                <span 
                    className={`
                        font-inter font-medium text-[14px] transition-colors duration-250 ease-out
                        ${selected ? 'text-white' : danger ? 'text-[#FF5A5A] hover:text-[#FF3030]' : 'text-[#B6C2D1] hover:text-white'}
                    `}
                >
                    {label}
                </span>
            </div>
            {rightElement && (
                <div className="flex items-center">
                    {rightElement}
                </div>
            )}
        </button>
    );
}
