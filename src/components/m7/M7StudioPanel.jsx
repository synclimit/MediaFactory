import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/apiUrl';

export default function M7StudioPanel({ addNotification = () => {} }) {
  const [runtimeStatus, setRuntimeStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('studio');
  const [isLaunchingM7, setIsLaunchingM7] = useState(false);
  const [isLaunchingStandalone, setIsLaunchingStandalone] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(getApiUrl('/api/m7/status'));
      if (res.data && res.data.success) {
        setRuntimeStatus(res.data);
      }
    } catch (e) {
      console.warn('[M7StudioPanel] Failed to fetch M7 status:', e.message);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunchM7 = async () => {
    setIsLaunchingM7(true);
    try {
      const res = await axios.post(getApiUrl('/api/m7/launch-m7'));
      if (res.data?.success) {
        addNotification?.('M7 Astrofox Desktop Engine launched.', 'success');
      }
    } catch (err) {
      addNotification?.(`Launch failed: ${err.message}`, 'error');
    } finally {
      setIsLaunchingM7(false);
      fetchStatus();
    }
  };

  const handleLaunchStandalone = async () => {
    setIsLaunchingStandalone(true);
    try {
      const res = await axios.post(getApiUrl('/api/m7/launch-standalone'));
      if (res.data?.success) {
        addNotification?.('Astrofox Standalone launched.', 'success');
      }
    } catch (err) {
      addNotification?.(`Launch failed: ${err.message}`, 'error');
    } finally {
      setIsLaunchingStandalone(false);
      fetchStatus();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#090b10] text-gray-200 overflow-hidden font-sans select-none">
      <iframe
        src={getApiUrl('/m7-app/index.html')}
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
}
