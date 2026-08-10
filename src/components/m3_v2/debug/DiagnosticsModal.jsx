import React from 'react';
import DiagnosticsPage from '../../../pages/Diagnostics.jsx';

export default function DiagnosticsModal({ isOpen, onClose, initialTab = 'Overview', m3Props = null }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0">
      <div className="w-screen h-screen bg-[#0A0C10] border-0 rounded-none flex flex-col overflow-hidden relative">
        <DiagnosticsPage onBack={onClose} initialTab={initialTab} m3Props={m3Props} />
      </div>
    </div>
  );
}
