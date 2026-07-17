import os

with open('src/components/m1/M1StudioPanel.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get_block(start, end):
    return ''.join(lines[start-1:end])

modal_content = get_block(46, 84)

file_content = f"""import React from 'react';

export default function M1QueueSummaryModal({{ m1QueueSummary, setM1QueueSummary, handleResetModeForm }}) {{
  if (!m1QueueSummary || !m1QueueSummary.isOpen) return null;

  return (
{modal_content}
  );
}}
"""

with open('src/components/m1/M1QueueSummaryModal.jsx', 'w', encoding='utf-8') as f:
    f.write(file_content)

print("M1QueueSummaryModal.jsx created.")
