import os

with open('src/components/m1/M1StudioPanel.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get_block(start, end):
    return ''.join(lines[start-1:end])

# --- M1VideoUpload.jsx ---
upload_content = get_block(89, 145)

upload_file = f"""import React from 'react';
import Tooltip from '../ui/Tooltip.jsx';

export default function M1VideoUpload({{ m1VideoProbing, handleVideoUploadChange, selectedVideo, handleManualVideoPathChange, m1VideoProbeError }}) {{
  return (
{upload_content}
  );
}}
"""
with open('src/components/m1/M1VideoUpload.jsx', 'w', encoding='utf-8') as f:
    f.write(upload_file)

# --- M1Parameters.jsx ---
params_content = get_block(147, 180)

params_file = f"""import React from 'react';
import Tooltip from '../ui/Tooltip.jsx';

export default function M1Parameters({{ m1TargetSegment, setM1TargetSegment, m1Watermark, setM1Watermark, m1Subscribe, setM1Subscribe }}) {{
  return (
{params_content}
  );
}}
"""
with open('src/components/m1/M1Parameters.jsx', 'w', encoding='utf-8') as f:
    f.write(params_file)

print("M1VideoUpload.jsx and M1Parameters.jsx created.")
