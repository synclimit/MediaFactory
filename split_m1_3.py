import os

with open('src/components/m1/M1StudioPanel.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get_block(start, end):
    return ''.join(lines[start-1:end])

# --- M1SlotItem.jsx ---
slot_item_content = get_block(201, 524)

slot_item_file = f"""import React from 'react';
import Tooltip from '../ui/Tooltip.jsx';

export default function M1SlotItem({{ slot, idx, updateM1Slot, isDuplicateOutput, isDuplicateSource, isQueuedOutput, isQueuedSource }}) {{
  const isQueuedOutputCheck = isQueuedOutput(slot?.outputName);
  const isQueuedSourceCheck = isQueuedSource(slot);
  const isQueued = isQueuedOutputCheck || isQueuedSourceCheck;

  const isDupOutput = !isQueuedOutputCheck && isDuplicateOutput(slot?.outputName, idx);
  const isDupSource = !isQueuedSourceCheck && isDuplicateSource(slot, idx);
  const isDup = isDupOutput || isDupSource;

  const isIncomplete = !slot?.outputName || (slot?.sourceType === 'Audio File' && !slot?.audio) || (slot?.sourceType === 'YouTube URL' && !slot?.isApproved);
  const slotStatus = isQueued ? 'Queued' : (isDup ? 'Duplicate' : (isIncomplete ? 'Incomplete' : 'Ready'));
  const slotBorderClass = isDup ? "border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.15)]" : (isQueued ? "border-blue-500/50" : "border-[#2d3247]");

  return (
    <div className={{`bg-[#0a0c10] border ${{slotBorderClass}} rounded overflow-hidden transition-all duration-300 ${{isQueued ? 'opacity-80' : ''}}`}}>
{slot_item_content}
    </div>
  );
}}
"""
with open('src/components/m1/M1SlotItem.jsx', 'w', encoding='utf-8') as f:
    f.write(slot_item_file)


# --- M1SlotManager.jsx ---
manager_file = """import React from 'react';
import M1SlotItem from './M1SlotItem.jsx';

export default function M1SlotManager({ m1Slots, updateM1Slot, isDuplicateOutput, isDuplicateSource, isQueuedOutput, isQueuedSource }) {
  return (
    <div className="bg-[#12131a] p-3 rounded border border-[#21232d] flex flex-col">
      <div className="text-[11px] font-bold uppercase text-gray-400 border-b border-[#21232d] pb-1 mb-2">Auto-Generated Audio Allocation Slots</div>
      
      <div className="max-h-96 overflow-y-auto space-y-2 pr-1 p-2 bg-[#0c0d12] rounded border border-[#2d3247]">
        {m1Slots.map((slot, idx) => (
          <M1SlotItem 
            key={idx}
            slot={slot}
            idx={idx}
            updateM1Slot={updateM1Slot}
            isDuplicateOutput={isDuplicateOutput}
            isDuplicateSource={isDuplicateSource}
            isQueuedOutput={isQueuedOutput}
            isQueuedSource={isQueuedSource}
          />
        ))}
      </div>
    </div>
  );
}
"""
with open('src/components/m1/M1SlotManager.jsx', 'w', encoding='utf-8') as f:
    f.write(manager_file)

print("M1SlotItem.jsx and M1SlotManager.jsx created.")
