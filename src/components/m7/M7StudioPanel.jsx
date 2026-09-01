import React, { useEffect, useRef, useCallback } from 'react';
import { getApiUrl } from '../../utils/apiUrl';

const M7StudioPanel = React.memo(function M7StudioPanel({ addNotification = () => {}, onAddToQueue = () => {} }) {
  const iframeRef = useRef(null);
  // Compute iframe URL ONCE on component mount to prevent iframe reload/flicker on every React render
  const iframeSrc = useRef(getApiUrl(`/m7-app/index.html?v=${Date.now()}`)).current;

  const sendWorkspaceBrandingToIframe = useCallback(() => {
    try {
      const curWs = localStorage.getItem('mf_active_workspace') || 'DEFAULT';
      const candidates = [curWs, 'DEFAULT', 'default', 'Test 1'];
      let logo = null, watermark = null, subscribe = null, overlay = null;

      for (const ws of candidates) {
        if (!logo) logo = localStorage.getItem(`mf_workspace_avatar_data_${ws}`) || localStorage.getItem(`mf_workspace_avatar_${ws}`);
        const bStr = localStorage.getItem(`mf_workspace_branding_${ws}`);
        if (bStr) {
          try {
            const b = JSON.parse(bStr);
            if (!logo) logo = b.logo_data || b.logo || b.avatar;
            if (!watermark) watermark = b.watermark_data || b.watermark;
            if (!subscribe) subscribe = b.subscribeAnim_data || b.subscribeAnim || b.subscribe;
            if (!overlay) overlay = b.overlay_data || b.overlay;
          } catch (e) {}
        }
      }

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (!logo && (k.startsWith('mf_workspace_avatar_data_') || k.startsWith('mf_workspace_avatar_'))) {
          logo = localStorage.getItem(k);
        }
        if (k.startsWith('mf_workspace_branding_')) {
          try {
            const b = JSON.parse(localStorage.getItem(k) || '{}');
            if (!logo) logo = b.logo_data || b.logo || b.avatar;
            if (!watermark) watermark = b.watermark_data || b.watermark;
            if (!subscribe) subscribe = b.subscribeAnim_data || b.subscribeAnim || b.subscribe;
            if (!overlay) overlay = b.overlay_data || b.overlay;
          } catch (e) {}
        }
      }

      if (window.require) {
        try {
          const fs = window.require('fs');
          const path = window.require('path');
          const possibleDirs = [
            'D:\\MediaFactory\\.mediafactory\\assets\\branding\\default',
            'D:\\MediaFactory\\.mediafactory\\assets\\branding\\' + curWs,
            path.resolve('.mediafactory/assets/branding/default')
          ];
          for (const dir of possibleDirs) {
            if (fs.existsSync(dir)) {
              const files = fs.readdirSync(dir);
              const sortFiles = (prefix) => files.filter(f => f.toLowerCase().startsWith(prefix)).sort((a, b) => {
                const aNobg = a.toLowerCase().includes('nobg');
                const bNobg = b.toLowerCase().includes('nobg');
                if (aNobg && !bNobg) return -1;
                if (!aNobg && bNobg) return 1;
                return 0;
              });
              if (!logo) {
                const lFiles = sortFiles('logo');
                if (lFiles.length > 0) logo = path.join(dir, lFiles[0]);
              }
              if (!watermark) {
                const wFiles = sortFiles('watermark');
                if (wFiles.length > 0) watermark = path.join(dir, wFiles[0]);
              }
              if (!subscribe) {
                const sFiles = sortFiles('subscribe');
                if (sFiles.length > 0) subscribe = path.join(dir, sFiles[0]);
              }
              if (!overlay) {
                const oFiles = sortFiles('overlay');
                if (oFiles.length > 0) overlay = path.join(dir, oFiles[0]);
              }
            }
          }
        } catch (e) {}
      }

      const toBase64 = (filePath) => {
        if (!filePath || typeof filePath !== 'string' || filePath.startsWith('data:') || filePath.startsWith('blob:') || filePath.startsWith('http')) {
          return filePath;
        }
        if (window.require) {
          try {
            const fs = window.require('fs');
            const path = window.require('path');
            let clean = filePath.replace(/^file:\/\/\//, '').replace(/^file:\/\//, '');
            try { clean = decodeURIComponent(clean); } catch(e) {}
            clean = clean.replace(/\//g, '\\');
            const possible = [
              clean,
              path.resolve('D:/MediaFactory', clean),
              path.resolve('D:/MediaFactory/.mediafactory', clean),
              `D:\\MediaFactory\\.mediafactory\\assets\\branding\\default\\${clean.split(/[\\/]/).pop()}`
            ];
            for (const p of possible) {
              if (fs.existsSync(p) && !fs.statSync(p).isDirectory()) {
                const buf = fs.readFileSync(p);
                const isPng = p.toLowerCase().endsWith('.png');
                const isMp4 = p.toLowerCase().endsWith('.mp4');
                const isSvg = p.toLowerCase().endsWith('.svg');
                const mime = isPng ? 'image/png' : (isMp4 ? 'video/mp4' : (isSvg ? 'image/svg+xml' : 'image/jpeg'));
                return `data:${mime};base64,${buf.toString('base64')}`;
              }
            }
          } catch (e) {}
        }
        return filePath;
      };

      logo = toBase64(logo);
      watermark = toBase64(watermark);
      subscribe = toBase64(subscribe);
      overlay = toBase64(overlay);

      const payload = { logo, watermark, subscribe, overlay };
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'M7_SET_WORKSPACE_BRANDING',
          payload
        }, '*');
      }
    } catch (err) {
      console.warn('[M7StudioPanel] sendWorkspaceBrandingToIframe error:', err);
    }
  }, []);

  // Listen for M7 Queue Add Event and branding request from within the iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'M7_ADD_TO_QUEUE') {
        if (onAddToQueue) {
          onAddToQueue(e.data.payload);
        }
      } else if (e.data && e.data.type === 'M7_REQUEST_WORKSPACE_BRANDING') {
        sendWorkspaceBrandingToIframe();
      }
    };
    window.addEventListener('message', handleMessage);

    const onBrandingUpdate = () => sendWorkspaceBrandingToIframe();
    window.addEventListener('workspace_avatar_updated', onBrandingUpdate);
    window.addEventListener('workspace_settings_updated', onBrandingUpdate);
    window.addEventListener('storage', onBrandingUpdate);

    const t1 = setTimeout(sendWorkspaceBrandingToIframe, 300);
    const t2 = setTimeout(sendWorkspaceBrandingToIframe, 1200);
    const t3 = setTimeout(sendWorkspaceBrandingToIframe, 3000);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('workspace_avatar_updated', onBrandingUpdate);
      window.removeEventListener('workspace_settings_updated', onBrandingUpdate);
      window.removeEventListener('storage', onBrandingUpdate);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onAddToQueue, sendWorkspaceBrandingToIframe]);

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
          sendWorkspaceBrandingToIframe();
        }}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
});

export default M7StudioPanel;
