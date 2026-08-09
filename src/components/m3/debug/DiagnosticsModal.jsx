import React from 'react';
import ReactDOM from 'react-dom';
import DiagnosticsPage from '../../../pages/Diagnostics.jsx';

export default function DiagnosticsModal({ isOpen, onClose, initialTab = 'Overview', m3Props = null }) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="w-[98vw] h-[95vh] max-w-[1800px] bg-[#0A0C10] border-2 border-blue-500/50 rounded-2xl shadow-[0_0_60px_rgba(59,130,246,0.4)] flex flex-col overflow-hidden relative">
        <DiagnosticsPage onBack={onClose} initialTab={initialTab} m3Props={m3Props} />
      </div>
    </div>,
    document.body
  );
}
