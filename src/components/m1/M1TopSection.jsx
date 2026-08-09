import React from 'react';
import M1VideoUpload from './M1VideoUpload.jsx';
import M1Parameters from './M1Parameters.jsx';

export default function M1TopSection({ 
  m1VideoProbing, 
  handleVideoUploadChange, 
  selectedVideo, 
  handleManualVideoPathChange, 
  m1VideoProbeError,
  m1TargetSegment,
  setM1TargetSegment,
  m1Watermark,
  setM1Watermark,
  m1Subscribe,
  setM1Subscribe,
  m1VideoRotation,
  handleRotateVideo,
  m1VideoTransform,
  setM1VideoTransform
}) {
  return (
    <div className="relative bg-gradient-to-br from-[#1b1d22] via-[#14151a] to-[#0d0e12] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] p-4 flex items-stretch gap-6 group shrink-0 h-auto">
      
      {/* Orange Top Mechanical Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
      
      {/* Mechanical Panel Grooves (Background Texture) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)`
      }}></div>

      {/* Hardware Corner Rivets */}
      <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(0,0,0,1)]"></div>
      <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(0,0,0,1)]"></div>
      <div className="absolute bottom-3 left-3 w-1.5 h-1.5 rounded-full bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(0,0,0,1)]"></div>
      <div className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(0,0,0,1)]"></div>

      {/* Video Preview and Metadata (Or Empty State) */}
      <M1VideoUpload 
        m1VideoProbing={m1VideoProbing}
        handleVideoUploadChange={handleVideoUploadChange}
        selectedVideo={selectedVideo}
        handleManualVideoPathChange={handleManualVideoPathChange}
        m1VideoProbeError={m1VideoProbeError}
        m1VideoRotation={m1VideoRotation}
        handleRotateVideo={handleRotateVideo}
        m1VideoTransform={m1VideoTransform}
        setM1VideoTransform={setM1VideoTransform}
      />
      
      {/* Segment Duration Selection (Only visible if video selected) */}
      {selectedVideo && (
        <M1Parameters 
          m1TargetSegment={m1TargetSegment}
          setM1TargetSegment={setM1TargetSegment}
          m1Watermark={m1Watermark}
          setM1Watermark={setM1Watermark}
          m1Subscribe={m1Subscribe}
          setM1Subscribe={setM1Subscribe}
          selectedVideo={selectedVideo}
        />
      )}
      
    </div>
  );
}
