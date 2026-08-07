import React from 'react';
import './m1-theme.css';
import M1QueueSummaryModal from './M1QueueSummaryModal.jsx';
import M1VideoUpload from './M1VideoUpload.jsx';
import M1Parameters from './M1Parameters.jsx';
import M1TopSection from './M1TopSection.jsx';
import M1SlotManager from './M1SlotManager.jsx';

export default function M1StudioPanel(props) {
  const {
    isDevMode, m1Slots, updateM1Slot, isDuplicateOutput, isDuplicateSource, isQueuedOutput, isQueuedSource,
    m1QueueSummary, setM1QueueSummary, handleResetModeForm, m1VideoProbing, handleVideoUploadChange,
    selectedVideo, handleManualVideoPathChange, m1VideoProbeError, m1TargetSegment, setM1TargetSegment,
    m1Watermark, setM1Watermark, m1Subscribe, setM1Subscribe, pipelineHistoryEngine, setActiveMode, handleAddToQueue,
    m1VideoRotation, handleRotateVideo
  } = props;

  return (
    <div className="h-full flex flex-col gap-4 relative w-full flex-1 min-h-0">
      
      {/* BUG INVESTIGATION PANEL */}
      {isDevMode && (
        <div className="bg-[#1a0f14]/80 backdrop-blur-md p-3 rounded-lg border border-red-500/50 space-y-1 text-[11px] text-red-300 font-mono shadow-[0_0_15px_rgba(239,68,68,0.15)] mb-4 w-full">
          <div className="font-bold text-red-400 mb-2 border-b border-red-500/30 pb-1">
            BUG INVESTIGATION PANEL / RUNTIME VERIFICATION
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>Active Slots: {m1Slots.length}</div>
            <div>Target Segment: {m1TargetSegment} min</div>
          </div>
        </div>
      )}

      <M1QueueSummaryModal 
        m1QueueSummary={m1QueueSummary}
        setM1QueueSummary={setM1QueueSummary}
        handleResetModeForm={handleResetModeForm}
      />

      {selectedVideo ? (
        <div className="flex flex-col gap-3 relative z-10 h-full flex-1 min-h-0">
          {/* TOP ROW: Unified Top Section */}
          <M1TopSection 
            m1VideoProbing={m1VideoProbing}
            handleVideoUploadChange={handleVideoUploadChange}
            selectedVideo={selectedVideo}
            handleManualVideoPathChange={handleManualVideoPathChange}
            m1VideoProbeError={m1VideoProbeError}
            m1TargetSegment={m1TargetSegment}
            setM1TargetSegment={setM1TargetSegment}
            m1Watermark={m1Watermark}
            setM1Watermark={setM1Watermark}
            m1Subscribe={m1Subscribe}
            setM1Subscribe={setM1Subscribe}
            m1VideoRotation={m1VideoRotation}
            handleRotateVideo={handleRotateVideo}
          />

          {/* BOTTOM ROW: Slot Manager */}
          <M1SlotManager 
            m1Slots={m1Slots}
            updateM1Slot={updateM1Slot}
            isDuplicateOutput={isDuplicateOutput}
            isDuplicateSource={isDuplicateSource}
            isQueuedOutput={isQueuedOutput}
            isQueuedSource={isQueuedSource}
            m1Watermark={m1Watermark}
            setM1Watermark={setM1Watermark}
            m1Subscribe={m1Subscribe}
            setM1Subscribe={setM1Subscribe}
            setActiveMode={setActiveMode}
            handleAddToQueue={handleAddToQueue}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center relative z-10">
          <M1VideoUpload 
            m1VideoProbing={m1VideoProbing}
            handleVideoUploadChange={handleVideoUploadChange}
            selectedVideo={selectedVideo}
            handleManualVideoPathChange={handleManualVideoPathChange}
            m1VideoProbeError={m1VideoProbeError}
            m1VideoRotation={m1VideoRotation}
            handleRotateVideo={handleRotateVideo}
          />
        </div>
      )}
    </div>
  );
}
