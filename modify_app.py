import os

app_file = 'src/App.jsx'
with open(app_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

import_idx = next(i for i, line in enumerate(lines) if 'import M3StudioPanel' in line)
lines.insert(import_idx, "import M1StudioPanel from './components/m1/M1StudioPanel.jsx';\n")

# Find start and end of the block
start_idx = next(i for i, line in enumerate(lines) if "{activeMode === 'Mode 1' && (" in line)
end_idx = next(i for i in range(start_idx, len(lines)) if "          )}" in lines[i] and "Mode 2" in lines[i+2])

props = """          {activeMode === 'Mode 1' && (
            <M1StudioPanel
              isDevMode={isDevMode} m1Slots={m1Slots} updateM1Slot={updateM1Slot}
              isDuplicateOutput={isDuplicateOutput} isDuplicateSource={isDuplicateSource}
              isQueuedOutput={isQueuedOutput} isQueuedSource={isQueuedSource}
              m1QueueSummary={m1QueueSummary} setM1QueueSummary={setM1QueueSummary}
              handleResetModeForm={handleResetModeForm} m1VideoProbing={m1VideoProbing}
              handleVideoUploadChange={handleVideoUploadChange} selectedVideo={selectedVideo}
              handleManualVideoPathChange={handleManualVideoPathChange}
              m1VideoProbeError={m1VideoProbeError} m1TargetSegment={m1TargetSegment}
              setM1TargetSegment={setM1TargetSegment} m1Watermark={m1Watermark}
              setM1Watermark={setM1Watermark} m1Subscribe={m1Subscribe}
              setM1Subscribe={setM1Subscribe} pipelineHistoryEngine={pipelineHistoryEngine}
            />
          )}
"""

new_lines = lines[:start_idx] + [props] + lines[end_idx+1:]

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('App.jsx modified successfully.')
