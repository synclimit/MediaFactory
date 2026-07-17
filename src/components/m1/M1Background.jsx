import React from 'react';

export default function M1Background() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#0a0a0c]">
      
      {/* Mecha Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.35]" 
        style={{ backgroundImage: 'url(/mecha_bg.png)' }}
      ></div>

      {/* Dark gradient overlay for UI contrast and readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/80 via-[#0a0a0c]/60 to-[#0a0a0c]/90"></div>
      
      {/* Ambient Tech Glows */}
      <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-orange-600/20 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
      <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-cyan-700/20 rounded-full blur-[150px] mix-blend-screen opacity-30"></div>
      <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen opacity-40"></div>

    </div>
  );
}
