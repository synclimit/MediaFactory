import os

with open('src/components/m1/M1StudioPanel.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get_block(start, end):
    return ''.join(lines[start-1:end])

bug_panel = get_block(27, 44)
est_summary = get_block(530, 572)

panel_content = f"""import React from 'react';
import M1QueueSummaryModal from './M1QueueSummaryModal.jsx';
import M1VideoUpload from './M1VideoUpload.jsx';
import M1Parameters from './M1Parameters.jsx';
import M1SlotManager from './M1SlotManager.jsx';

export default function M1StudioPanel(props) {{
  const {{
    isDevMode, m1Slots, updateM1Slot, isDuplicateOutput, isDuplicateSource, isQueuedOutput, isQueuedSource,
    m1QueueSummary, setM1QueueSummary, handleResetModeForm, m1VideoProbing, handleVideoUploadChange,
    selectedVideo, handleManualVideoPathChange, m1VideoProbeError, m1TargetSegment, setM1TargetSegment,
    m1Watermark, setM1Watermark, m1Subscribe, setM1Subscribe, pipelineHistoryEngine
  }} = props;

  return (
    <div className="space-y-3">
{bug_panel}

      <M1QueueSummaryModal 
        m1QueueSummary={{m1QueueSummary}}
        setM1QueueSummary={{setM1QueueSummary}}
        handleResetModeForm={{handleResetModeForm}}
      />

      <div className="bg-[#12131a] p-3 rounded border border-[#21232d] space-y-3">
        <div className="text-[11px] font-bold uppercase text-gray-400 border-b border-[#21232d] pb-1">Mode 1 Parameters</div>
        
        <M1VideoUpload 
          m1VideoProbing={{m1VideoProbing}}
          handleVideoUploadChange={{handleVideoUploadChange}}
          selectedVideo={{selectedVideo}}
          handleManualVideoPathChange={{handleManualVideoPathChange}}
          m1VideoProbeError={{m1VideoProbeError}}
        />

        <M1Parameters 
          m1TargetSegment={{m1TargetSegment}}
          setM1TargetSegment={{setM1TargetSegment}}
          m1Watermark={{m1Watermark}}
          setM1Watermark={{setM1Watermark}}
          m1Subscribe={{m1Subscribe}}
          setM1Subscribe={{setM1Subscribe}}
        />
      </div>

      <M1SlotManager 
        m1Slots={{m1Slots}}
        updateM1Slot={{updateM1Slot}}
        isDuplicateOutput={{isDuplicateOutput}}
        isDuplicateSource={{isDuplicateSource}}
        isQueuedOutput={{isQueuedOutput}}
        isQueuedSource={{isQueuedSource}}
      />

{est_summary}
    </div>
  );
}}
"""

with open('src/components/m1/M1StudioPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(panel_content)

print("M1StudioPanel.jsx refactored successfully.")
