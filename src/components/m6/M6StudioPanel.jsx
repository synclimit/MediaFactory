import React, { useState, useEffect } from 'react';
import M5CollectView from '../m5/M5CollectView.jsx';

export default function M6StudioPanel({ m5Queue = [], setM5Queue = () => {} }) {
  const [extConnected, setExtConnected] = useState(false);
  const [extLastPing, setExtLastPing] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - extLastPing > 8000) setExtConnected(false);
    }, 2000);
    return () => clearInterval(interval);
  }, [extLastPing]);

  useEffect(() => {
    let sse = null;
    let reconnectTimer = null;
    let pollTimer = null;

    // Fetch latest queue from server
    const fetchQueue = () => {
      fetch('/api/v1/m5/queue')
        .then(res => res.json())
        .then(data => { if (data && data.success) setM5Queue(data.data); })
        .catch(() => {});
    };

    // Poll every 1 second to always get real-time progress
    const startPolling = () => {
      pollTimer = setInterval(fetchQueue, 1000);
    };

    const connectSSE = () => {
      if (sse) { sse.close(); sse = null; }
      sse = new EventSource('/api/v1/m5/stream');

      sse.addEventListener('queue_update', (e) => {
        const data = JSON.parse(e.data);
        if (data.action === 'add') {
          setM5Queue(prev => [...prev, data.job]);
        } else if (data.action === 'update') {
          setM5Queue(prev => prev.map(j => j.id === data.job.id ? { ...j, ...data.job } : j));
        } else if (data.action === 'remove' || data.action === 'delete') {
          setM5Queue(prev => prev.filter(j => j.id !== data.id));
        } else if (data.action === 'clear') {
          setM5Queue([]);
        }
      });

      sse.addEventListener('extension_heartbeat', () => {
        setExtConnected(true);
        setExtLastPing(Date.now());
      });

      sse.onerror = () => {
        sse.close();
        sse = null;
        reconnectTimer = setTimeout(connectSSE, 3000);
      };
    };

    fetchQueue();
    startPolling();
    connectSSE();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pollTimer) clearInterval(pollTimer);
      if (sse) sse.close();
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col flex-1 min-h-0 bg-transparent text-[#c9d1d9] font-sans antialiased px-1 pb-0 pt-0 relative overflow-hidden">
      {/* Background Radial Glow (Subtle) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-900/10 blur-[120px] pointer-events-none rounded-full z-0"></div>

      {/* Content Area - Only Collect View */}
      <div className="h-full flex flex-col p-4 bg-[#111318] text-white">
         <M5CollectView m5Queue={m5Queue} setM5Queue={setM5Queue} extConnected={extConnected} />
      </div>
    </div>
  );
}
