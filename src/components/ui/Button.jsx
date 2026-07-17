import React from 'react';

export default function Button({ 
    children, 
    variant = 'primary', 
    onClick, 
    disabled,
    className = ''
}) {
    const baseStyles = "px-6 py-2 rounded-[8px] font-inter font-medium transition-all duration-250 ease-out disabled:opacity-50 flex items-center justify-center gap-2";
    
    const variants = {
        primary: "bg-[#32D8FF] hover:bg-[#61FFD1] text-[#020304] shadow-[0_0_15px_rgba(50,216,255,0.3)] hover:shadow-[0_0_25px_rgba(50,216,255,0.5)]",
        secondary: "bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] text-white border border-[rgba(255,255,255,0.08)]",
        danger: "bg-transparent hover:bg-[#FF6464] text-[#FF6464] hover:text-white border border-[#FF6464] hover:shadow-[0_0_20px_rgba(255,100,100,0.4)]"
    };

    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}
