import React, { useEffect, useRef } from 'react';
import { getApiUrl } from '../../utils/apiUrl';

const M7StudioPanel = React.memo(function M7StudioPanel({ addNotification = () => {}, onAddToQueue = () => {} }) {
  const iframeRef = useRef(null);
  // Compute iframe URL ONCE on component mount to prevent iframe reload/flicker on every React render
  const iframeSrc = useRef(getApiUrl(`/m7-app/index.html?v=${Date.now()}`)).current;

  // Listen for M7 Queue Add Event from within the iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'M7_ADD_TO_QUEUE') {
        if (onAddToQueue) {
          onAddToQueue(e.data.payload);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAddToQueue]);

  return (
    <div className="w-full h-full flex flex-col bg-[#090b10] text-gray-200 overflow-hidden font-sans select-none">
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title="Astrofox M7 Runtime"
        className="w-full h-full border-0"
        onLoad={(e) => {
          try {
            if (window.require && e.target.contentWindow) {
              e.target.contentWindow.require = window.require;
            }
          } catch (err) {}
        }}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
});

export default M7StudioPanel;
