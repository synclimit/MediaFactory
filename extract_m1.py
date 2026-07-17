import os

app_file = 'src/App.jsx'
with open(app_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get_block(start_idx, end_idx):
    return ''.join(lines[start_idx-1:end_idx])

# Get M1 components
m1_imports = "import React from 'react';\nimport Tooltip from '../ui/Tooltip';\n"
m1_states = get_block(110, 182)
m1_summary = get_block(491, 491)
m1_funcs1 = get_block(547, 569) # isDuplicateOutput etc
m1_funcs2 = get_block(1279, 1353) # upload and probe
m1_funcs3 = get_block(1366, 1392) # handleReset
m1_funcs4 = get_block(1084, 1183) # handleConfirmQueue

# Since we want to pass these as props, we will create M1StudioPanel which takes them
panel_jsx = """
import React from 'react';

// For phase 1, we pass everything as props to keep the App.jsx state intact
export default function M1StudioPanel(props) {
  const {
    isDevMode, m1Slots, updateM1Slot, isDuplicateOutput, isDuplicateSource, isQueuedOutput, isQueuedSource,
    m1QueueSummary, setM1QueueSummary, handleResetModeForm, m1VideoProbing, handleVideoUploadChange,
    selectedVideo, handleManualVideoPathChange, m1VideoProbeError, m1TargetSegment, setM1TargetSegment,
    m1Watermark, setM1Watermark, m1Subscribe, setM1Subscribe, pipelineHistoryEngine
  } = props;

  // Tooltip component helper
  const Tooltip = ({ text }) => (
    <div className="group relative inline-block ml-1 cursor-pointer">
      <span className="text-[9px] text-gray-500 bg-[#2d313d] hover:bg-[#3f4556] rounded-full w-3 h-3 inline-flex items-center justify-center font-bold">?</span>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 w-48 -translate-x-1/2 rounded bg-[#1e2230] border border-[#2d313d] p-2 text-[10px] text-gray-300 shadow-xl opacity-0 transition-opacity group-hover:opacity-100 leading-normal">
        {text}
        <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#1e2230] border-r border-b border-[#2d313d]"></div>
      </div>
    </div>
  );

  return (
"""

m1_jsx = get_block(1789, 2335)
m1_jsx = "    <div className=\"space-y-3\">\n" + m1_jsx.split('<div className="space-y-3">', 1)[1]

panel_jsx += m1_jsx
panel_jsx += """
  );
}
"""

with open('src/components/m1/M1StudioPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(panel_jsx)

print("M1StudioPanel.jsx created.")
