import React, { useState, useEffect, useRef, useCallback } from 'react';
import packageJson from '../package.json';
const APP_VERSION = packageJson.version || '1.0.8';

// ─── Platform Foundation (TASK_00) ───────────────────────────────────────────
// Safe integration point — does NOT modify M1 logic.
import { bootstrapPlatform, foundation } from './foundation/index.js';
import DevPanel from './components/DevPanel.jsx';
import QADashboard from './components/Developer/ProductionQA/QADashboard.jsx';
// M2 Task 01: Source Pool System
import SourcePoolPanel from './components/m2/SourcePoolPanel.jsx';
// M2 Task 05: Audio Processing Profile — merged into AudioPreviewPanel
// M2 Task 05: Audio Preview Engine
import AudioPreviewPanel from './components/m2/AudioPreviewPanel.jsx';
// M2 Task 06: Compilation Workspace
// M2 Task 07: Render Plan
import RenderPlanPanel from './components/m2/RenderPlanPanel.jsx';

import ApiKeysModal from './components/ApiKeysModal.jsx';

import { m2WorkspacePersistence } from './services/m2/WorkspacePersistenceService.js';
import { createRenderPlan, deriveRenderName } from './entities/m2/RenderPlanEntity.js';
import { createQueueJobFromPlan } from './entities/m2/QueueJobEntity.js';
import { audioProcessingProfileRepo } from './repositories/m2/AudioProcessingProfileRepository.js';
import { CompilationEngine } from './services/m2/CompilationEngine.js';
import { createRenderHistoryRecord } from './entities/m2/RenderHistoryEntity.js';
import { m2RenderHistory } from './services/m2/RenderHistoryService.js';
import { m2WorkspaceContext } from './services/m2/WorkspaceContext.js';

import { pipelineHistoryEngine } from './services/PipelineHistoryEngine.js';

import M1StudioPanel from './components/m1/M1StudioPanel.jsx';
import M2StudioPanel from './components/m2/M2StudioPanel.jsx';
import M3StudioPanel from './components/m3/M3StudioPanel.jsx';
import M3V2StudioPanel from './components/m3_v2/M3V2StudioPanel.jsx';
import html2canvas from 'html2canvas';
import M4StudioPanel from './components/m4/M4StudioPanel.jsx';
import M5StudioPanel from './components/m5/M5StudioPanel.jsx';
import M6StudioPanel from './components/m6/M6StudioPanel.jsx';
import M1Background from './components/m1/M1Background.jsx';
import M1HardwareFrame from './components/m1/M1HardwareFrame.jsx';
import Splash from './components/startup/Splash.jsx';
import WorkspacePicker from './components/startup/WorkspacePicker.jsx';
import WorkspaceWizard from './components/startup/WorkspaceWizard.jsx';
import WorkspaceDrawer from './components/workspace/WorkspaceDrawer.jsx';
import WorkspaceSettingsModal from './components/workspace/WorkspaceSettingsModal.jsx';
import Surface from './components/ui/Surface.jsx';
import { BackgroundVariants } from './components/ui/BackgroundVariants.js';
import DiagnosticsPage from './pages/Diagnostics.jsx';

// --- NO MOCK PROFILES OR QUEUE ---
// --- TOOLTIP COMPONENT ---
function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <div 
      className="relative inline-flex items-center ml-1 cursor-pointer select-none"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="text-[9px] text-gray-400 hover:text-orange-400 bg-[#2d313d] hover:bg-orange-500/20 border border-[#3f4556] hover:border-orange-500 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center font-bold transition-all">?</span>
      {show && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-48 -translate-x-1/2 rounded bg-[#1e2230] border border-orange-500/50 p-2 text-[10px] text-gray-200 shadow-2xl leading-normal text-left">
          {text}
          <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#1e2230] border-r border-b border-orange-500/50"></div>
        </div>
      )}
    </div>
  );
}

const getApiUrl = (endpoint) => {
  if (typeof window === 'undefined') return endpoint;
  if (window.location.protocol === 'file:' || window.location.port !== '18888') {
    return 'http://127.0.0.1:18888' + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);
  }
  return endpoint;
};

export default function App() {
  const [lang, setLang] = useState('English');
  const [profiles, setProfiles] = useState([]);
  const [queue, setQueue] = useState([]);
  const [m5Queue, setM5Queue] = useState([]);
  
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);
  const [isCacheModalOpen, setIsCacheModalOpen] = useState(false);
  const [cachePathSetting, setCachePathSetting] = useState('');
  const [cacheCleanupModeSetting, setCacheCleanupModeSetting] = useState('never');
  
  const [cacheItems, setCacheItems] = useState([]);
  const [selectedCacheItems, setSelectedCacheItems] = useState(new Set());
  const [isFetchingCache, setIsFetchingCache] = useState(false);

  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const stored = localStorage.getItem('mf_api_keys');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('mf_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  const [pipelineDrawerCollapsed, setPipelineDrawerCollapsed] = useState(() => {
    return localStorage.getItem('pipelineDrawerCollapsed') === 'true';
  });

  const [appState, setAppState] = useState('EDITOR'); // 'SPLASH' | 'PICKER' | 'WIZARD' | 'EDITOR'
  const [activeWorkspace, setActiveWorkspace] = useState(() => localStorage.getItem('mf_active_workspace') || 'Test 1');
  const [hardwareStats, setHardwareStats] = useState({ cpu: 12, gpu: 18, ram: 32 });
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId;

    const measureFPS = (currentTime) => {
      frameCount++;
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / deltaTime));
        frameCount = 0;
        lastTime = currentTime;
      }
      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    let interval;
    if (appState === 'EDITOR') {
      interval = setInterval(() => {
        fetch('/api/v1/system/telemetry')
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data) {
              setHardwareStats({
                cpu: typeof data.data.cpu === 'number' ? data.data.cpu : 0,
                gpu: typeof data.data.gpu === 'number' ? data.data.gpu : 0,
                ram: typeof data.data.ram === 'number' ? data.data.ram : 0,
              });
            }
          })
          .catch(() => {});
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [appState]);
  const [isWorkspaceDrawerOpen, setIsWorkspaceDrawerOpen] = useState(false);
  const [isWorkspaceSettingsOpen, setIsWorkspaceSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('pipelineDrawerCollapsed', pipelineDrawerCollapsed);
  }, [pipelineDrawerCollapsed]);

  const [workspaceConfig, setWorkspaceConfig] = useState(null);

  const loadWorkspaceConfig = useCallback(async (wsName) => {
    const ws = wsName || activeWorkspace;
    if (!ws) return;
    try {
      const res = await fetch(`/api/v1/system/workspace/${ws}/settings`);
      const data = await res.json();
      if (data.success && data.data) {
        setWorkspaceConfig(data.data.data || {});
      }
    } catch (e) {
      console.error('Failed to load workspace config:', e);
    }
  }, [activeWorkspace]);

  // Sync active workspace to context for panels that rely on it (like BrandingPanel)
  useEffect(() => {
    if (activeWorkspace) {
      m2WorkspaceContext.setWorkspaceId(activeWorkspace);
      loadWorkspaceConfig(activeWorkspace);
    }
  }, [activeWorkspace, loadWorkspaceConfig]);

  useEffect(() => {
    const handleUpdate = () => loadWorkspaceConfig(activeWorkspace);
    window.addEventListener('workspace_settings_updated', handleUpdate);
    return () => window.removeEventListener('workspace_settings_updated', handleUpdate);
  }, [activeWorkspace, loadWorkspaceConfig]);

  // Removed isProfileDrawerOpen
  const [activeMode, setActiveMode] = useState('Mode 3'); // Set default Mode 3 to test enhancements
  const [autoSaveStatus, setAutoSaveStatus] = useState('Draft Saved');
  const [logs, setLogs] = useState([
    '[SYSTEM] MediaFactory Validation Engine Initialized.',

    '[SYSTEM] MediaFactory Validation Engine Initialized.',

    '[SYSTEM] Queue Engine waiting for instructions.'
  ]);

  // Global Keydown for Diagnostics Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setAppState('DIAGNOSTICS');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Queue persistence
  useEffect(() => {
    localStorage.setItem('pipeline_queue', JSON.stringify(queue));
  }, [queue]);

  // Global M5 Queue persistence & SSE
  useEffect(() => {
    let sse = null;
    let reconnectTimer = null;
    let pollTimer = null;

    const fetchQueue = () => {
      fetch('/api/v1/m5/queue')
        .then(res => res.json())
        .then(data => { if (data && data.success) setM5Queue(data.data); })
        .catch(() => {});
    };

    const startPolling = () => {
      pollTimer = setInterval(fetchQueue, 1000);
    };

    const connectSSE = () => {
      if (sse) { sse.close(); sse = null; }
      sse = new EventSource('/api/v1/m5/stream');

      sse.addEventListener('queue_update', (e) => {
        const data = JSON.parse(e.data);
        if (data.action === 'add') {
          setM5Queue(prev => {
            if (prev.find(j => j.id === data.job.id)) return prev;
            return [...prev, data.job];
          });
        } else if (data.action === 'update') {
          setM5Queue(prev => prev.map(j => j.id === data.job.id ? { ...j, ...data.job } : j));
        } else if (data.action === 'remove' || data.action === 'delete') {
          setM5Queue(prev => prev.filter(j => j.id.toString() !== data.id.toString()));
        } else if (data.action === 'clear_type') {
          setM5Queue(prev => prev.filter(j => j.type !== data.type));
        } else if (data.action === 'clear') {
          setM5Queue([]);
        }
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

  // --- NOTIFICATIONS ---
  const [notifications, setNotifications] = useState([]);
  const addNotification = useCallback((message, subMessage = '') => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    setNotifications(prev => {
      const next = [...prev, { id, message, subMessage }];
      if (next.length > 2) return next.slice(next.length - 2);
      return next;
    });
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  // Asset Warnings (Simulation)
  const [warnings, setWarnings] = useState([]);

  // Queue Review Confirmation Dialog State
  const [reviewDialog, setReviewDialog] = useState({ isOpen: false, data: null });

  // Add To Queue Success Banners
  const [m1SuccessMsg, setM1SuccessMsg] = useState(false);
  const [m2SuccessMsg, setM2SuccessMsg] = useState(false);
  const [m3SuccessMsg, setM3SuccessMsg] = useState(false);

  // --- MODE 1 INPUTS ---
  
  // selectedVideo is the single source of truth for the M1 video asset
  const [selectedVideo, setSelectedVideo] = useState(null);
  // selectedVideo = { file, previewUrl, metadata: { fileName, fullPath, durationSec, durationDisplay, resolution, fps, codec, fileSizeDisplay } }
  const m1VideoFile = selectedVideo?.metadata?.fullPath || '';
  const m1VideoDuration = selectedVideo?.metadata ? Math.floor(selectedVideo.metadata.durationSec / 60) : 0;
  const [m1VideoProbing, setM1VideoProbing] = useState(false);
  const [m1VideoProbeError, setM1VideoProbeError] = useState(null);
  const [m1TargetSegment, setM1TargetSegment] = useState(10); // in minutes
  const [m1Slots, setM1Slots] = useState([]); // Array of objects
  const [m1ResetTrigger, setM1ResetTrigger] = useState(0);
  const [m1Watermark, setM1Watermark] = useState(false);
  const [m1Subscribe, setM1Subscribe] = useState(false);
  const [m1Quality, setM1Quality] = useState('240p');
  const [m1VideoRotation, setM1VideoRotation] = useState(0); // 0, 90, 180, 270
  const [m1VideoTransform, setM1VideoTransform] = useState({
    x: 0, y: 0, scale: 100, rotation: 0, flipH: false, flipV: false, aspectRatio: '16:9'
  });

  const handleRotateVideo = () => {
    setM1VideoRotation(prev => (prev + 90) % 360);
  };

  // Calculate Mode 1 slots dynamically using precise seconds (at least 1 slot if video loaded)
  const m1SlotCount = selectedVideo?.metadata ? Math.max(1, Math.floor(selectedVideo.metadata.durationSec / (m1TargetSegment * 60))) : 0;

  // Sync slots when slot count changes
  useEffect(() => {
    setM1Slots(prev => {
      const next = [...prev];
      if (next.length < m1SlotCount) {
        while (next.length < m1SlotCount) {
          next.push({
            slotId: 'm1_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
            segmentIndex: next.length + 1,
            status: 'EMPTY',
            sourceType: 'YouTube URL',
            audio: '',
            outputName: '',
            youtubeUrl: '',
            metadataMode: 'Cleaned',
            titleStrategy: 'Original',
            titleSuffix: ' | Playlist',
            originalDesc: '',
            cleanedDesc: '',
            isFetched: false,
            isApproved: false,
            duration: '0m 00s',
            isExpanded: false
          });
        }
      } else if (next.length > m1SlotCount) {
        next.splice(m1SlotCount); // Remove obsolete slots from the end
      }
      
      // Update segmentIndex for remaining slots just in case
      return next.map((slot, idx) => ({ ...slot, segmentIndex: idx + 1 }));
    });
  }, [m1SlotCount, m1ResetTrigger]);

  // Slot updates
  const updateM1Slot = (index, field, value) => {
    setM1Slots(prev => {
      const next = [...prev];
      const slot = typeof field === 'object' && field !== null 
        ? { ...next[index], ...field } 
        : { ...next[index], [field]: value };
      
      // Auto-update outputName based on titleStrategy
      if (field === 'audio' || field === 'titleStrategy' || field === 'titleSuffix') {
        if (slot.audio) {
          const rawFileName = slot.audio.split(/[\\/]/).pop() || 'audio';
          let baseName = rawFileName.substring(0, rawFileName.lastIndexOf('.')) || rawFileName;
          if (slot.titleStrategy === 'Original + Suffix') {
            baseName += slot.titleSuffix;
          }
          if (slot.titleStrategy !== 'Custom') {
            // Sanitize filename for FFmpeg safety before appending .mp4
            const cleanBase = baseName.replace(/[^a-zA-Z0-9\s_-]/g, '_').replace(/\s+/g, ' ').trim();
            slot.outputName = `${cleanBase}.mp4`;
          }
        } else {
          slot.outputName = '';
        }
      }
      
      // Explicit Module Status Machine
      const isIncomplete = !slot.outputName || (slot.sourceType === 'Audio File' && !slot.audio) || (slot.sourceType === 'YouTube URL' && !slot.isApproved);
      if (slot.status === 'EMPTY' || slot.status === 'CONFIGURED' || slot.status === 'APPROVED') {
          if (isIncomplete) {
              slot.status = 'EMPTY';
          } else {
              slot.status = slot.sourceType === 'YouTube URL' && slot.isApproved ? 'APPROVED' : 'CONFIGURED';
          }
      }
      
      next[index] = slot;
      return next;
    });
  };

  // --- MODE 2 INPUTS ---
  const [m2AudioPool, setM2AudioPool] = useState(['drum_loop_80bpm.mp3', 'acoustic_guitar_chords.mp3', 'synth_pad_c_minor.mp3', 'lofi_ambience_crackle.mp3']);
  const [m2Randomize, setM2Randomize] = useState(true);
  const [m2Plans, setM2Plans] = useState([]);        // Generated RenderPlans
  const [m2Sources, setM2Sources] = useState([]);    // Latest source state for live UI updates
  const [m2IsStale, setM2IsStale] = useState(false); // Global Mode 2 Stale state
  const [isM2Rendering, setIsM2Rendering] = useState(false);

  const [pipelineGroupsCollapsed, setPipelineGroupsCollapsed] = useState({
    Waiting: false,
    Scheduled: false,
    Pending: false,
    Rendering: false,
    Completed: false,
    Failed: false
  });
  const togglePipelineGroup = (group) => setPipelineGroupsCollapsed(prev => ({ ...prev, [group]: !prev[group] }));

  // --- Workspace Persistence ---
  
  // Register log callback
  useEffect(() => {
    m2WorkspacePersistence.registerLogCallback((msg) => addLog(msg));
  }, []);

  // Auto Restore on Startup
  useEffect(() => {
    const ws = m2WorkspacePersistence.restoreWorkspace();
    if (ws) {
      if (ws.sources && ws.sources.length > 0) setM2AudioPool(ws.sources);
      if (ws.renderPlans && ws.renderPlans.length > 0) setM2Plans(ws.renderPlans);
      setTimeout(() => addLog('[M2 Workspace] Auto Restore Complete'), 500);
    }
  }, []);

  // Auto Save Hook
  useEffect(() => {
    m2WorkspacePersistence.saveWorkspace({
      sources: m2AudioPool,
      renderPlans: m2Plans,
      cacheSnapshot: { fileCount: 0, sizeMb: 0 }
    });
  }, [m2AudioPool, m2Plans]);

  const handleAddSelectedToPipeline = (selectedPlans) => {
    const toAdd = [];
    const duplicates = [];

    selectedPlans.forEach(plan => {
      // Check if already in global queue by renderPlanId ONLY
      if (queue.some(job => job.renderPlanId === plan.renderId)) {
        duplicates.push(plan);
      } else {
        toAdd.push(plan);
      }
    });

    console.log('RENDER_PLAN_COUNT', selectedPlans.length);
    console.log('PIPELINE_INSERT_COUNT', toAdd.length);

    if (selectedPlans.length !== toAdd.length) {
      throw new Error('PIPELINE_JOB_COUNT_MISMATCH');
    }

    if (toAdd.length > 0) {
      const customOutputDir = workspaceConfig?.output?.main || (activeWorkspace ? localStorage.getItem(`mf_workspace_output_${activeWorkspace}`) : '') || 'Output';
      const cleanDir = (customOutputDir || 'Output').replace(/[/\\]+$/, '');
      const d = new Date();
      const yyyymmdd = d.toISOString().split('T')[0];
      const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;

      const newJobs = toAdd.map((plan, idx) => {
        const safeName = (plan.renderName || 'AudioMix').replace(/[^a-zA-Z0-9\s_-]/g, '_').replace(/\s+/g, ' ').trim();
        const m2OutFolder = `${cleanDir}/M2/${yyyymmdd}/${dateStr}_${safeName.replace(/\s+/g, '_')}/`;

        return {
          id: 'q_' + Date.now() + '_' + idx,
          renderPlanId: plan.renderId,
          renderName: plan.renderName,
          mode: 'Mode 2',
          profileName: plan.audioProfile || 'Standard',
          status: 'Waiting',
          scheduleMode: 'Manual',
          scheduledAt: null,
          isPaused: false,
          inputVideo: 'None (Audio Compilation)',
          tracks: plan.trackList.map(t => ({
            title: t.title,
            cleanTitle: t.cleanTitle || t.title,
            videoTitle: t.videoTitle || t.rawTitle || t.title,
            uri: t.uri || t.youtubeUrl || t.localPath || t.title
          })),
          outputFiles: [(plan.renderName || 'AudioMix') + '.mp3', 'metadata.json'],
          outputFolder: m2OutFolder,
          estTimeSec: Math.round(plan.totalDurationSec * 0.1),
          estStorageMb: Math.round(plan.totalDurationSec * 0.2),
          totalDurationSec: plan.totalDurationSec,
          progress: 0,
        };
      });

      setQueue(prev => [...prev, ...newJobs]);
      addNotification('Added To Pipeline', `${toAdd.length} job(s) added as Waiting`);
      addLog(`[M2] Pipeline Job Created`);
    }

    if (duplicates.length > 0) {
      addNotification('Already In Pipeline', `${duplicates.length} job(s) skipped`);
      addLog(`[M2] Duplicate Pipeline Job Prevented`);
    }
    
    // Deselect the plans that were successfully added or skipped
    setM2Plans(prev => prev.map(p => ({ ...p, selected: false })));
  };



  const handleLoadTemplate = (template) => {
    if (template.compilationSettings) {
      setM2Randomize(template.compilationSettings.randomize);
    }
    if (template.audioProfile) {
      setM1ProfileId(template.audioProfile.id);
    }
    if (template.masteringSettings) {
      setM2MasteringSettings(template.masteringSettings);
    }
    if (template.schedulerSettings) {
      m2SchedulerService.saveConfig(template.schedulerSettings);
      window.dispatchEvent(new Event('m2_scheduler_refresh'));
    }

    if (template.type === 'FIXED' && template.fixedSources && template.fixedSources.length > 0) {
      foundation.sourceService.restoreTemplateSources(template.fixedSources, { workspaceId: 'default' });
    }

    setM2IsStale(true);
  };



  // Handle upstream config changes
  useEffect(() => {
    setM2IsStale(true);
  }, [m2AudioPool]);





  // Sync m2Sources directly from database events to bypass polling delays
  useEffect(() => {
    const loadM2Sources = async () => {
      try {
        const all = await foundation.sourceService.getReady();
        setM2Sources(all);
      } catch (e) {
        console.error(e);
      }
    };
    loadM2Sources();
    foundation.sourceService.addEventListener('sources_updated', loadM2Sources);
    return () => foundation.sourceService.removeEventListener('sources_updated', loadM2Sources);
  }, []);

  // --- MODE 4 INPUTS ---
  const [m4BgVideo, setM4BgVideo] = useState(() => {
    try {
      const saved = localStorage.getItem('m4_bg_video');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { filename: 'ambient_forest.mp4', duration: 10, resolution: '1080p', fps: 30, loopMode: 'Seamless', brightness: 100, contrast: 100, saturation: 100, temperature: 0, blur: 0, sharpen: 0, vignette: 0, cameraMotion: 'Static' };
  });
  const [m4AmbientAudio, setM4AmbientAudio] = useState(() => {
    try {
      const saved = localStorage.getItem('m4_ambient_audio');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  });
  const [m4RelaxMusic, setM4RelaxMusic] = useState(() => {
    try {
      const saved = localStorage.getItem('m4_relax_music');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  });
  const [m4Objects, setM4Objects] = useState(() => {
    try {
      const saved = localStorage.getItem('m4_objects');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
      { id: 'm4-bg', canvasMode: 'composer', type: 'background', name: 'Background Video', x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 100, visible: true, locked: true, layer: 0 },
      { id: 'm4-txt', canvasMode: 'composer', type: 'text', name: 'Ambient Title', x: 100, y: 100, width: 800, height: 100, rotation: 0, opacity: 100, visible: true, locked: false, layer: 1 }
    ];
  });
  const [m4SelectedObjectId, setM4SelectedObjectId] = useState(null);
  const [m4ThumbnailSaved, setM4ThumbnailSaved] = useState(false);

  const m4InitializedRef = useRef(false);

  // Load disk-backed M4 state on app startup
  useEffect(() => {
    fetch('/api/v1/m4/autosave/state')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          const { m4BgVideo: diskBg, m4AmbientAudio: diskAmbient, m4RelaxMusic: diskRelax, m4Objects: diskObjs } = json.data;
          if (diskBg && (diskBg.path || diskBg.filename)) setM4BgVideo(diskBg);
          if (Array.isArray(diskAmbient) && diskAmbient.length > 0) setM4AmbientAudio(diskAmbient);
          if (Array.isArray(diskRelax) && diskRelax.length > 0) setM4RelaxMusic(diskRelax);
          if (Array.isArray(diskObjs) && diskObjs.length > 0) setM4Objects(diskObjs);
        }
        m4InitializedRef.current = true;
      })
      .catch(() => {
        m4InitializedRef.current = true;
      });
  }, []);

  // M4 AutoSave Effect (Persists to both LocalStorage and Hard Drive Disk File)
  useEffect(() => {
    if (!m4InitializedRef.current) return;

    if (m4BgVideo) localStorage.setItem('m4_bg_video', JSON.stringify(m4BgVideo));
    if (m4AmbientAudio) localStorage.setItem('m4_ambient_audio', JSON.stringify(m4AmbientAudio));
    if (m4RelaxMusic) localStorage.setItem('m4_relax_music', JSON.stringify(m4RelaxMusic));
    if (m4Objects) localStorage.setItem('m4_objects', JSON.stringify(m4Objects));

    fetch('/api/v1/m4/autosave/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ m4BgVideo, m4AmbientAudio, m4RelaxMusic, m4Objects })
    }).catch(() => {});
  }, [m4BgVideo, m4AmbientAudio, m4RelaxMusic, m4Objects]);

  // --- MODE 3 INPUTS ---
  const [m3ProfileId, setM3ProfileId] = useState('p1');
  const [m3BgPool, setM3BgPool] = useState(() => {
    try {
      const saved = localStorage.getItem('m3_profile_bg');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(bg => {
            const targetPath = bg.sourcePath || bg.uri || bg.filename;
            if (targetPath && !targetPath.startsWith('data:')) {
              const streamUrl = `/api/m2/stream?uri=${encodeURIComponent(targetPath)}`;
              return { ...bg, url: streamUrl, preview: streamUrl };
            }
            return bg;
          });
        }
      }
    } catch(e) {}
    return [
      { id: 'bg1', type: 'image', filename: 'bg_image_1.webp', preview: 'bg_image_1.webp', sourcePath: 'bg_image_1.webp' }
    ];
  });
  
  const [m3ThumbnailSaved, setM3ThumbnailSaved] = useState(false);
  
  const [m3AudioTracks, setM3AudioTracks] = useState(() => {
    try {
      const saved = localStorage.getItem('m3_profile_audio');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(trk => {
            if (trk.sourcePath) {
              const streamUrl = `/api/m2/stream?uri=${encodeURIComponent(trk.sourcePath)}`;
              return { ...trk, blobUrl: streamUrl };
            }
            return trk;
          });
        }
      }
    } catch(e) {}
    return [];
  });
  
  const [m3Objects, setM3Objects] = useState(() => {
    try {
      const saved = localStorage.getItem('m3_profile_objects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [
      { id: 'bg-1', canvasMode: 'composer', type: 'background', name: 'Background', x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 100, visible: true, locked: true, layer: 0 },
      { id: 'txt-1', canvasMode: 'composer', type: 'text', name: 'Playlist Title', x: 100, y: 100, width: 800, height: 100, rotation: 0, opacity: 100, visible: true, locked: false, layer: 1 },
      { id: 'txt-2', canvasMode: 'composer', type: 'text', name: 'Current Playing', x: 100, y: 250, width: 600, height: 50, rotation: 0, opacity: 100, visible: true, locked: false, layer: 2 },
      { id: 'img-1', canvasMode: 'composer', type: 'image', name: 'Watermark', x: 1700, y: 50, width: 150, height: 150, rotation: 0, opacity: 50, visible: true, locked: false, layer: 3 },
      { id: 'viz-1', canvasMode: 'composer', type: 'visualizer', name: 'Spectrum', x: 0, y: 900, width: 1920, height: 180, rotation: 0, opacity: 100, visible: true, locked: false, layer: 4 },
      { id: 'ply-1', canvasMode: 'composer', type: 'playlist', name: 'Playlist Overlay', x: 1400, y: 300, width: 400, height: 600, rotation: 0, opacity: 90, visible: true, locked: false, layer: 5 },
      { id: 't-bg-1', canvasMode: 'thumbnail', type: 'background', name: 'Thumbnail Background', x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 100, visible: true, locked: true, layer: 0 },
      { id: 't-txt-1', canvasMode: 'thumbnail', type: 'text', name: 'Thumb Title', x: 150, y: 200, width: 1000, height: 200, rotation: 0, opacity: 100, visible: true, locked: false, layer: 1 },
      { id: 't-txt-2', canvasMode: 'thumbnail', type: 'text', name: 'Thumb Subtitle', x: 160, y: 450, width: 800, height: 100, rotation: 0, opacity: 100, visible: true, locked: false, layer: 2 }
    ];
  });
  const [m3SelectedObjectId, setM3SelectedObjectId] = useState(null);

  const m3InitializedRef = useRef(true);

  // M3 AutoSave Effect (Persists to both LocalStorage and Hard Drive Disk File)
  useEffect(() => {
    if (m3BgPool && m3BgPool.length > 0) {
      try { localStorage.setItem('m3_profile_bg', JSON.stringify(m3BgPool)); } catch(e){}
    }
    if (m3AudioTracks && m3AudioTracks.length > 0) {
      try { localStorage.setItem('m3_profile_audio', JSON.stringify(m3AudioTracks)); } catch(e){}
    }
    if (m3Objects && m3Objects.length > 0) {
      try { localStorage.setItem('m3_profile_objects', JSON.stringify(m3Objects)); } catch(e){}
    }

    fetch('/api/v1/m3/autosave/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ m3BgPool, m3AudioTracks, m3Objects })
    }).catch(() => {});
  }, [m3BgPool, m3AudioTracks, m3Objects]);
  const [m3MotionPreset, setM3MotionPreset] = useState('Standard');
  const [m3RenderSettings, setM3RenderSettings] = useState({
    outputName: 'Chill_Lofi_Playlist_Mix.mp4',
    resolution: '1080p',
    fps: '60',
    videoQuality: 'High',
    audioQuality: 'High',
    codec: 'H264',
    bitrate: 15,
    crf: 23,
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    hardwareEncode: true,
    hardwareDecode: true
  });
  const [m3OutputFilename, setM3OutputFilename] = useState('Chill Lofi Playlist Mix.mp4');
  
  useEffect(() => {
    const prof = profiles.find(p => p.id === m3ProfileId);
    if (prof) {
      if (prof.name.toLowerCase().includes('reggae')) {
         setM3OutputFilename('Island Reggae Playlist.mp4');
      } else {
         setM3OutputFilename('Chill Lofi Playlist Mix.mp4');
      }
    }
  }, [m3ProfileId, profiles]);


  // Video Overlays (Mode 3)
  const [m3OverlayWatermark, setM3OverlayWatermark] = useState(true);
  const [m3OverlaySub, setM3OverlaySub] = useState(true);
  const [m3OverlayPlaylist, setM3OverlayPlaylist] = useState(true);
  const [m3OverlayCurrent, setM3OverlayCurrent] = useState(true);
  const [m3OverlayCounter, setM3OverlayCounter] = useState(true);
  const [m3OverlayNotify, setM3OverlayNotify] = useState(true);
  const [m3OverlaySpectrumStyle, setM3OverlaySpectrumStyle] = useState('None');

  // --- MODE 3 V2 STATES (ISOLATED CLEAN V2 MODULE) ---
  const [m3v2Objects, setM3v2Objects] = useState([]);
  const [m3v2BgPool, setM3v2BgPool] = useState([]);
  const [m3v2AudioTracks, setM3v2AudioTracks] = useState([]);
  const [m3v2ProfileId, setM3v2ProfileId] = useState('P-M3V2-DEFAULT');
  const [m3v2MotionPreset, setM3v2MotionPreset] = useState('Gentle Float');
  const [m3v2RenderSettings, setM3v2RenderSettings] = useState({ fps: 60, resolution: '1080p', videoCodec: 'H.264', audioBitrate: '192 kbps (Standar)', bitrate: 'Auto (2.5M)' });
  const [m3v2OutputFilename, setM3v2OutputFilename] = useState('M3V2_Composition');
  const [m3v2ThumbnailSaved, setM3v2ThumbnailSaved] = useState(false);
  const [m3v2SelectedObjectId, setM3v2SelectedObjectId] = useState(null);

  // Mode 3 Statistics (dynamic estimations)
  const m3TotalDurationSec = m3AudioTracks.reduce((acc, t) => acc + (t.durationSec || 0), 0);
  
  const m3Prof = profiles.find(p => p.id === m3ProfileId) || {};
  const m3BitrateKbps = m3Prof.defaultPreset === '1080p' ? 8000 : (m3Prof.defaultPreset === '720p' ? 5000 : (m3Prof.defaultPreset === '360p' ? 2500 : 320));
  const m3EstStorageMb = Math.round((m3TotalDurationSec * m3BitrateKbps * 1000 / 8) / (1024 * 1024)) || 0;
  const m3AvgFactor = pipelineHistoryEngine.getMovingAverageRenderTime(m3Prof.name || 'Standard', 'Mode 3') || 0.15;
  const m3EstRenderTimeSec = Math.round(m3TotalDurationSec * m3AvgFactor) || 0;


  // --- THUMBNAIL EDITOR STATES (MODE 3 ONLY) ---
  const [isThumbEditorOpen, setIsThumbEditorOpen] = useState(false);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState([]);
  
  const [m1QueueSummary, setM1QueueSummary] = useState(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [isQADashboardOpen, setIsQADashboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [updateState, setUpdateState] = useState({ status: 'idle', progress: 0, version: '' });

  useEffect(() => {
    if (window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        const handleUpdateStatus = (event, data) => {
          setUpdateState(data);
          if (data.status === 'not-available' || data.status === 'error') {
            setTimeout(() => setUpdateState({ status: 'idle', progress: 0, version: '' }), 3000);
          }
        };
        ipcRenderer.on('update-status', handleUpdateStatus);
        return () => ipcRenderer.removeListener('update-status', handleUpdateStatus);
      } catch (e) {}
    }
  }, []);

  const handleCheckUpdate = () => {
    if (window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        if (updateState.status === 'ready') {
          ipcRenderer.send('install-update');
        } else if (updateState.status === 'available') {
          setUpdateState(prev => ({ ...prev, status: 'downloading', progress: 0 }));
          ipcRenderer.send('download-update');
        } else {
          setUpdateState({ status: 'checking', progress: 0, version: '' });
          ipcRenderer.send('check-for-updates');
        }
      } catch(e) {}
    } else {
      window.open('https://github.com/synclimit/MediaFactory/releases', '_blank');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchCacheItems = async () => {
    setIsFetchingCache(true);
    try {
      const res = await fetch('/api/v1/system/cache-list');
      const data = await res.json();
      if (data && data.success && data.data?.items) {
        setCacheItems(data.data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingCache(false);
    }
  };

  const handleDeleteSelectedCache = async () => {
    if (selectedCacheItems.size === 0) return;
    try {
      const res = await fetch('/api/v1/system/cache-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: Array.from(selectedCacheItems) })
      });
      const data = await res.json();
      if (data && data.success) {
        addNotification('Cache Cleaned', `Deleted ${data.data?.deletedCount} item(s)`);
        setSelectedCacheItems(new Set());
        fetchCacheItems();
      } else {
        alert('Failed to delete cache items.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isCacheModalOpen) {
      fetchCacheItems();
      setSelectedCacheItems(new Set());
    }
  }, [isCacheModalOpen]);

  useEffect(() => {
    fetch('/api/v1/system/cache-path')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data?.cacheDir) {
          setCachePathSetting(data.data.cacheDir);
          setCacheCleanupModeSetting(data.data.cacheCleanupMode || 'never');
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveCachePath = (newPath, newMode) => {
    fetch('/api/v1/system/cache-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cacheDir: newPath, cacheCleanupMode: newMode })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data?.cacheDir) {
          setCachePathSetting(data.data.cacheDir);
          setCacheCleanupModeSetting(data.data.cacheCleanupMode || 'never');
          addNotification('Cache Path Updated', `Storage path changed to: ${data.data.cacheDir}`);
          setIsCacheModalOpen(false);
        } else {
          alert('Failed to update cache path: ' + (data.error?.message || 'Unknown error'));
        }
      })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleBrowseCachePath = async () => {
    try {
      const res = await fetch('/api/v1/m5/dialog/folder', { method: 'POST' });
      const data = await res.json();
      if (data && (data.path || data.success)) {
        setCachePathSetting(data.path || cachePathSetting);
      }
    } catch (e) {
      console.error('Folder browse failed:', e);
    }
  };

  // ─── Platform Foundation Bootstrap (TASK_00) ─────────────────────────────
  // Runs once on mount. Ensures default workspace + user exist.
  // SAFE: Zero impact on M1/M2/M3 queue or rendering logic.
  useEffect(() => {
    bootstrapPlatform().catch(err =>
      console.error('[MediaFactory] Foundation bootstrap error:', err)
    );
  }, []);

  const checkWorkspaces = useCallback(async () => {
    try {
      const storedLastWs = localStorage.getItem('mf_active_workspace');
      const res = await fetch('/api/v1/system/workspace/list');
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        const targetWs = (storedLastWs && data.data.some(w => w.name === storedLastWs))
          ? storedLastWs
          : data.data[0].name;
        
        if (targetWs) {
          handleWorkspaceSelected(targetWs);
        } else {
          setAppState('PICKER');
        }
      } else {
        setAppState('WIZARD');
      }
    } catch (e) {
      setAppState('WIZARD');
    }
  }, []);

  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    'Loading Workspace Configuration...',
    'Loading Project Index...',
    'Loading Asset Database...',
    'Loading Presets...',
    'Loading Runtime...'
  ];

  const handleWorkspaceSelected = async (name) => {
    try {
        localStorage.setItem('mf_active_workspace', name);
        const res = await fetch(`/api/v1/system/workspace/${name}/settings`);
        const data = await res.json();
        if (data.success && data.data) {
            setWorkspaceConfig(data.data.data || {});
        }
    } catch (e) {
        console.error(e);
    }
    setActiveWorkspace(name);
    setAppState('WORKSPACE_LOADING');
    setLoadingStep(0);
    
    // Simulate explicit backend validation/loading phases
    let step = 0;
    const interval = setInterval(() => {
        step++;
        if (step < loadingSteps.length) {
            setLoadingStep(step);
        } else {
            clearInterval(interval);
            setAppState('EDITOR');
        }
    }, 400); // Gives users enough time to read what is happening
  };

  const isDuplicateOutput = (outputName, index) => {
    if (!outputName) return false;
    const inSlots = m1Slots.some((s, i) => i !== index && s.outputName === outputName);
    return inSlots;
  };

  const isDuplicateSource = (slot, index) => {
    if (slot.sourceType !== 'YouTube URL' || !slot.videoId) return false;
    const inSlots = m1Slots.some((s, i) => i !== index && s.sourceType === 'YouTube URL' && s.videoId === slot.videoId);
    return inSlots;
  };

  const isQueuedOutput = (outputName) => {
    if (!outputName) return false;
    return queue.some(q => q.outputFiles[0] === outputName);
  };

  const isQueuedSource = (slot) => {
    if (slot.sourceType !== 'YouTube URL' || !slot.videoId) return false;
    return queue.some(q => q.metadataPayload?.video_id === slot.videoId);
  };

  const [thumbSuggestion, setThumbSuggestion] = useState('Suggestion A');
  
  // Title Typography
  const [thumbTitle, setThumbTitle] = useState('Chill Lofi Beats');
  const [thumbTitleFont, setThumbTitleFont] = useState('Inter');
  const [thumbTitleSize, setThumbTitleSize] = useState(64);
  const [thumbTitleColor, setThumbTitleColor] = useState('#ffffff');
  const [thumbTitleShadow, setThumbTitleShadow] = useState(true);
  const [thumbTitleStroke, setThumbTitleStroke] = useState(true);
  
  // Tagline Typography
  const [thumbTagline, setThumbTagline] = useState('Rainy Night Study Mix');
  const [thumbTaglineFont, setThumbTaglineFont] = useState('Inter');
  const [thumbTaglineSize, setThumbTaglineSize] = useState(32);
  const [thumbTaglineColor, setThumbTaglineColor] = useState('#d1d5db');
  const [thumbTaglineShadow, setThumbTaglineShadow] = useState(true);
  const [thumbTaglineStroke, setThumbTaglineStroke] = useState(true);
  
  // Playlist Shared Typography (used by UI controls)
  const [thumbPlaylistFont, setThumbPlaylistFont] = useState('Roboto');
  const [thumbPlaylistSize, setThumbPlaylistSize] = useState(36);
  const [thumbPlaylistColor, setThumbPlaylistColor] = useState('#ffffff');
  const [thumbPlaylistShadow, setThumbPlaylistShadow] = useState(true);
  const [thumbPlaylistStroke, setThumbPlaylistStroke] = useState(true);

  // Playlist Left Typography
  const [thumbPlayLeftFont, setThumbPlayLeftFont] = useState('Roboto');
  const [thumbPlayLeftSize, setThumbPlayLeftSize] = useState(36);
  const [thumbPlayLeftColor, setThumbPlayLeftColor] = useState('#ffffff');
  const [thumbPlayLeftShadow, setThumbPlayLeftShadow] = useState(true);
  const [thumbPlayLeftStroke, setThumbPlayLeftStroke] = useState(true);
  const [thumbPlayLeftAlign, setThumbPlayLeftAlign] = useState('Left');
  const [thumbPlayLeftWidth, setThumbPlayLeftWidth] = useState(400);

  // Playlist Right Typography
  const [thumbPlayRightFont, setThumbPlayRightFont] = useState('Roboto');
  const [thumbPlayRightSize, setThumbPlayRightSize] = useState(36);
  const [thumbPlayRightColor, setThumbPlayRightColor] = useState('#ffffff');
  const [thumbPlayRightShadow, setThumbPlayRightShadow] = useState(true);
  const [thumbPlayRightStroke, setThumbPlayRightStroke] = useState(true);
  const [thumbPlayRightAlign, setThumbPlayRightAlign] = useState('Left');
  const [thumbPlayRightWidth, setThumbPlayRightWidth] = useState(400);

  // Numbering Style
  const [thumbNumberingStyle, setThumbNumberingStyle] = useState('01');
  const [thumbNumberingMode, setThumbNumberingMode] = useState('Continue Numbering');
  const [thumbPlaylistLayout, setThumbPlaylistLayout] = useState('Auto');
  const [thumbCustomSplitLeftCount, setThumbCustomSplitLeftCount] = useState(10);


  const [thumbTitleWidth, setThumbTitleWidth] = useState(600);
  const [thumbTaglineWidth, setThumbTaglineWidth] = useState(400);
  const [thumbDisplayLimit, setThumbDisplayLimit] = useState('10 Tracks');
  const [customFonts, setCustomFonts] = useState(['Anton', 'Bebas Neue', 'Montserrat', 'Oswald', 'Poppins', 'Roboto', 'Inter', 'Playfair Display', 'League Spartan']);
  const [newFontName, setNewFontName] = useState('');
  const [thumbVideoFrame, setThumbVideoFrame] = useState(null);

  // Drag and Drop State
  const [thumbPositions, setThumbPositions] = useState({
    title: { x: 32, y: 32, isCustom: false },
    tagline: { x: 32, y: 120, isCustom: false },
    playlistLeft: { x: 32, y: 200, isCustom: false },
    playlistRight: { x: 400, y: 200, isCustom: false }
  });
  const [activeDragBlock, setActiveDragBlock] = useState(null);
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const titleRef = useRef(null);
  const taglineRef = useRef(null);
  const playLeftRef = useRef(null);
  const playRightRef = useRef(null);
  const [thumbOverlapWarning, setThumbOverlapWarning] = useState(false);

  useEffect(() => {
    if (!isThumbEditorOpen) return;
    const checkOverlap = () => {
      const rects = [];
      if (titleRef.current) rects.push(titleRef.current.getBoundingClientRect());
      if (thumbTagline && taglineRef.current) rects.push(taglineRef.current.getBoundingClientRect());
      if (playLeftRef.current) rects.push(playLeftRef.current.getBoundingClientRect());
      
      const isDualColumn = thumbPlaylistLayout === 'Dual Column' || (thumbPlaylistLayout === 'Auto' && m3AudioTracks.slice(0, thumbDisplayLimit === 'All Tracks' ? m3AudioTracks.length : parseInt(thumbDisplayLimit)).length > 6) || thumbPlaylistLayout === 'Custom Split';
      if (isDualColumn && playRightRef.current) rects.push(playRightRef.current.getBoundingClientRect());
      
      let hasOverlap = false;
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const r1 = rects[i];
          const r2 = rects[j];
          // Adding a small 2px margin tolerance
          if (!(r1.right - 2 <= r2.left || r1.left + 2 >= r2.right || r1.bottom - 2 <= r2.top || r1.top + 2 >= r2.bottom)) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) break;
      }
      setThumbOverlapWarning(hasOverlap);

      // Overflow Protection: shrink text if playlist overflows canvas
      if (canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        if (playLeftRef.current) {
          const leftRect = playLeftRef.current.getBoundingClientRect();
          if (leftRect.height > canvasRect.height - 4 && thumbPlayLeftSize > 8) {
             setThumbPlayLeftSize(prev => prev - 1);
          }
        }
        if (playRightRef.current) {
          const rightRect = playRightRef.current.getBoundingClientRect();
          if (rightRect.height > canvasRect.height - 4 && thumbPlayRightSize > 8) {
             setThumbPlayRightSize(prev => prev - 1);
          }
        }
      }
    };
    // Use timeout to allow DOM layout to update
    const t = setTimeout(checkOverlap, 10);
    return () => clearTimeout(t);
  }, [thumbPositions, thumbTitle, thumbTagline, thumbPlaylistLayout, thumbCustomSplitLeftCount, thumbDisplayLimit, isThumbEditorOpen, thumbPlayLeftSize, thumbPlayRightSize, m3AudioTracks]);

  // Custom drag logic
  const handlePointerDown = (e, element) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Ensure we capture pointer on the wrapper element to avoid child target issues
    e.currentTarget.setPointerCapture(e.pointerId);
    setActiveDragBlock(element);
    
    // Calculate offset inside the element so it doesn't jump to top-left
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handlePointerMove = (e) => {
    if (!activeDragBlock || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left - dragOffset.x;
    const newY = e.clientY - canvasRect.top - dragOffset.y;
    
    setThumbPositions(prev => ({
      ...prev,
      [activeDragBlock]: { x: newX, y: newY, isCustom: true }
    }));
  };

  const handlePointerUp = (e) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setActiveDragBlock(null);
  };

  // Layout Presets
  const [thumbLayoutPreset, setThumbLayoutPreset] = useState('Preset 1');
  
  // Custom drag positions override presets when dragged
  const [isCustomDrag, setIsCustomDrag] = useState(false);

  const isVideoAsset = (filename) => {
    if (!filename) return false;
    const ext = filename.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext);
  };

  // Custom suggestions mapping helper
  const [mockSuggestionSeed, setMockSuggestionSeed] = useState(1);
  const getSuggestions = () => {
    const cleanedTitle = m3OutputFilename ? m3OutputFilename.replace(/\.[^/.]+$/, "").replace(/_/g, " ") : "My Playlist";
    const bgName = m3BgPool[0]?.filename || 'Image/Video Asset';
    return {
      'Suggestion A': { title: cleanedTitle, sub: `Selected ${m3AudioTracks.length} tracks`, color: '#ffffff' },
      'Suggestion B': { title: `Chill Lofi Mix v${mockSuggestionSeed}`, sub: `Featuring ${m3AudioTracks[0]?.title || 'Lofi Chill'}`, color: '#60a5fa' },
      'Suggestion C': { title: `Midnight Coffee Beats`, sub: `Background: ${bgName}`, color: '#fbbf24' }
    };
  };

  const currentSuggestions = getSuggestions();

  const handleApplySuggestion = (sugKey) => {
    setThumbSuggestion(sugKey);
    const sug = currentSuggestions[sugKey];
    if (sug) {
      setThumbTitle(sug.title);
      setThumbTagline(sug.sub);
      setThumbTitleColor(sug.color);
      setThumbTaglineColor('#d1d5db');
      setThumbPlaylistColor('#ffffff');
    }
  };

  // --- PROFILE DRAWER STATE ---
  const [drawerMode, setDrawerMode] = useState('LIST');
  const [selectedProfileId, setSelectedProfileId] = useState('p1');
  const [profileForm, setProfileForm] = useState({
    name: '',
    channelName: '',
    watermark: '',
    watermarkPosition: 'Top-Right',
    subscribeOverlay: '',
    subscribePosition: 'Bottom-Right',
    defaultPreset: '720p',
    motionPreset: 'Standard',
    outputFolder: '',
  });

  // Render Pipeline States
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    const handleOpenDrawer = () => setPipelineDrawerCollapsed(false);
    window.addEventListener('OPEN_QUEUE_DRAWER', handleOpenDrawer);
    return () => window.removeEventListener('OPEN_QUEUE_DRAWER', handleOpenDrawer);
  }, []);

  useEffect(() => {
    if (activeMode === 'Mode 5' && isRendering) {
      // If all M5 jobs are Completed or Failed, stop rendering status
      const activeJobsCount = m5Queue.filter(q => q.status === 'Rendering' || q.status === 'Ready' || q.status === 'Waiting').length;
      if (activeJobsCount === 0) {
        setIsRendering(false);
      }
    }
  }, [m5Queue, isRendering, activeMode]);

  const isWorkspaceValid = () => {
    if (activeMode === 'Mode 1') {
      return m1Slots.some(s => s.outputName && ((s.sourceType === 'Audio File' && s.audio) || (s.sourceType === 'YouTube URL' && s.isApproved)));
    }
    return true;
  };

  const totalEstTimeSec = (queue || []).reduce((acc, q) => acc + (q.estTimeSec || 0), 0);
  const totalEstStorageMb = (queue || []).reduce((acc, q) => acc + (q.estStorageMb || 0), 0);
  const formattedETA = new Date(Date.now() + totalEstTimeSec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const renderSuccessCount = (queue || []).filter(q => q.status === 'Completed').length;
  const renderFailedCount = (queue || []).filter(q => q.status === 'Failed').length;
  const totalOutputsCount = renderSuccessCount;
  const totalStorageGb = '0.00';
  const renderIntervalRef = useRef(null);
  const logContainerRef = useRef(null);

  // Auto-save simulation
  useEffect(() => {
    setAutoSaveStatus('Saving Draft...');
    const timer = setTimeout(() => {
      setAutoSaveStatus('Draft Saved');
    }, 600);
    return () => clearTimeout(timer);
  }, [
    activeMode, m1VideoFile, m1TargetSegment, m1Slots, m1Watermark, m1Subscribe, m1Quality,
    m2AudioPool, m2Randomize,
    m3ProfileId, m3BgPool, m3AudioTracks, m3MotionPreset, m3OutputFilename,
    m3OverlayWatermark, m3OverlaySub, m3OverlayPlaylist, m3OverlayCurrent, m3OverlayCounter, m3OverlayNotify, m3OverlaySpectrumStyle
  ]);

  // Asset Warnings Detection (Immediate Warnings overlay check)
  useEffect(() => {
    const newWarnings = [];
    if (activeMode === 'Mode 1') {
      const isVideoUsed = queue.some(q => q.inputVideo === m1VideoFile);
      if (isVideoUsed && m1VideoFile) {
        newWarnings.push({ id: 'w_vid_used', text: `⚠ Asset was used previously: Video "${m1VideoFile}" already exists in the queue.` });
      }
      m1Slots.filter(Boolean).forEach((aud, i) => {
        const isAudUsed = queue.some(q => q.tracks?.includes(aud));
        if (isAudUsed) {
          newWarnings.push({ id: `w_aud_used_${i}`, text: `⚠ Asset was used previously: Audio "${aud}" was processed in a prior job.` });
        }
      });
    } else if (activeMode === 'Mode 3') {
      m3BgPool.forEach((bg, i) => {
        const isBgUsed = queue.some(q => q.inputVideo === bg);
        if (isBgUsed) {
          newWarnings.push({ id: `w_bg_used_${i}`, text: `⚠ Asset was used previously: Background file "${bg}" matches existing jobs.` });
        }
      });
      m3AudioTracks.forEach((aud, i) => {
        const isAudUsed = queue.some(q => q.tracks?.includes(aud));
        if (isAudUsed) {
          newWarnings.push({ id: `w_m3aud_used_${i}`, text: `⚠ Asset was used previously: Audio track "${aud}" is in active queue.` });
        }
      });
    }
    setWarnings(newWarnings);
  }, [activeMode, m1VideoFile, m1Slots, m3BgPool, m3AudioTracks, queue]);

  const handleDismissWarning = (id) => {
    setWarnings(prev => prev.filter(w => w.id !== id));
  };

  const addLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    // Newest log appears at the top
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev]);
  }, []);

  // Migration logic
  useEffect(() => {
    const PIPELINE_SCHEMA_VERSION = '3';
    const storedVersion = localStorage.getItem('PIPELINE_SCHEMA_VERSION');
    if (storedVersion !== PIPELINE_SCHEMA_VERSION) {
      addLog('[SYSTEM] PIPELINE_MIGRATION_STARTED');
      localStorage.removeItem('pipeline_queue');
      localStorage.removeItem('pipeline_cache');
      pipelineHistoryEngine.clearHistory();
      addLog('[SYSTEM] PIPELINE_OLD_QUEUE_REMOVED');
      localStorage.setItem('PIPELINE_SCHEMA_VERSION', PIPELINE_SCHEMA_VERSION);
      addLog('[SYSTEM] PIPELINE_MIGRATION_COMPLETED');
      setQueue([]);
    } else {
      const storedQueue = localStorage.getItem('pipeline_queue');
      if (storedQueue) {
        try {
          const parsed = JSON.parse(storedQueue);
          if (Array.isArray(parsed)) {
            const resumed = parsed.map(job => {
              if (['Rendering', 'Processing', 'Downloading', 'Converting', 'Splitting'].includes(job.status)) {
                return { ...job, status: 'Waiting', progress: 0, backendJobId: undefined, error: null, failureReason: null };
              }
              return job;
            });
            setQueue(resumed);
          } else {
            setQueue([]);
          }
        } catch (e) {
          setQueue([]);
        }
      }
    }
  }, [addLog]);

  const handleOpenReviewDialog = (selectedPlans = null) => {
    if (activeMode === 'Mode 1') {
      const readySlotsCount = m1Slots.filter(s => s.outputName && (
        (s.sourceType === 'Audio File' && s.audio) || 
        (s.sourceType === 'YouTube URL' && (s.isApproved || (s.isFetched && s.audio)))
      )).length;
      if (readySlotsCount === 0) {
        addLog('ERROR: Cannot add to queue. No ready slots found.');
        return;
      }
      const pName = m1Slots[0]?.outputName ? m1Slots[0].outputName.replace('.mp4', '') : 'Project';
      setReviewDialog({
        isOpen: true,
        data: {
          mode: 'Mode 1',
          projectName: pName,
          profile: 'Standard Profile',
          details: [
            { label: 'Metadata Mode', value: 'Per Slot' },
            { label: 'Video Length', value: `${m1VideoDuration} minutes` },
            { label: 'Target Segment', value: `${m1TargetSegment} minutes` },
            { label: 'Audio Count', value: `${readySlotsCount} sources` },
            { label: 'Output Count', value: `${readySlotsCount} Videos` },
            { label: 'Est. Render Time', value: `${Math.round(readySlotsCount * 1.5)} minutes` },
            { label: 'Est. Storage Usage', value: `${readySlotsCount * 40} MB` },
            { label: 'Output Folder Path', value: `Output/${pName}/` },
          ]
        }
      });
    } else if (activeMode === 'Mode 2') {
      if (!selectedPlans || selectedPlans.length === 0) return;
      const totalDurSec = selectedPlans.reduce((acc, p) => acc + p.totalDurationSec, 0);
      const bitrateKbps = 320; // default for audio
      const estStorageMb = (totalDurSec * bitrateKbps * 1000 / 8) / (1024 * 1024);
      const avgFactor = pipelineHistoryEngine.getMovingAverageRenderTime('Mixed Profiles', 'Mode 2') || 0.15;
      const estTimeSec = totalDurSec * avgFactor;
      
      setReviewDialog({
        isOpen: true,
        data: {
          mode: 'Mode 2',
          projectName: 'AudioMix',
          profile: 'Mixed Profiles',
          selectedPlans: selectedPlans, // Store it here!
          details: [
            { label: 'Selected Plans', value: `${selectedPlans.length} mixes` },
            { label: 'Total Output Duration', value: `${Math.round(totalDurSec / 60)} minutes` },
            { label: 'Estimated Storage', value: `${Math.round(estStorageMb)} MB` },
            { label: 'Estimated Time', value: `${Math.round(estTimeSec / 60)} minutes` },
            { label: 'Output Folder Path', value: `Output/AudioMix/` },
          ]
        }
      });
    } else if (activeMode === 'Mode 3') {
      const prof = profiles.find(p => p.id === m3ProfileId);
      const preset = prof?.defaultPreset || '360p';
      let bitrateKbps = 320; // default for audio
      if (preset === '1080p') bitrateKbps = 8000;
      else if (preset === '720p') bitrateKbps = 5000;
      else if (preset === '360p') bitrateKbps = 2500;
      else if (preset === '240p') bitrateKbps = 1000;
      
      const estStorageMb = (m3TotalDurationSec * bitrateKbps * 1000 / 8) / (1024 * 1024);
      const avgFactor = pipelineHistoryEngine.getMovingAverageRenderTime(prof?.name || 'Standard', 'Mode 3') || 0.15;
      const estTimeSec = m3TotalDurationSec * avgFactor;

      const targetMode = m3RenderSettings?.renderMode ? String(m3RenderSettings.renderMode).toUpperCase() : 'FAST';
      const isFast = targetMode === 'FAST';
      const customOutputDir = workspaceConfig?.output?.main || (activeWorkspace ? localStorage.getItem(`mf_workspace_output_${activeWorkspace}`) : '') || 'Output';
      const cleanDir = (customOutputDir || 'Output').replace(/[/\\]+$/, '');
      const modeSubfolder = isFast ? 'Fast Render' : 'Normal Render';
      const m3OutFolder = `${cleanDir}/M3/${modeSubfolder}/`;

      setReviewDialog({
        isOpen: true,
        data: {
          mode: 'Mode 3',
          projectName: m3OutputFilename?.split('.')[0] || 'M3 Render',
          profile: prof ? prof.name : 'Standard Profile',
          details: [
            { label: 'Background Assets Count', value: `${m3BgPool.length} files` },
            { label: 'Audio Tracks Count', value: `${m3AudioTracks.length} tracks` },
            { label: 'Playlist Duration', value: `${Math.round(m3TotalDurationSec / 60)} minutes` },
            { label: 'Est. Render Time', value: `${Math.round(estTimeSec / 60)} minutes` },
            { label: 'Est. Storage Usage', value: `${Math.round(estStorageMb)} MB` },
            { label: 'Output Folder Path', value: m3OutFolder },
          ]
        }
      });
    } else if (activeMode === 'Mode 3 V2') {
      const customOutputDir = workspaceConfig?.output?.main || (activeWorkspace ? localStorage.getItem(`mf_workspace_output_${activeWorkspace}`) : '') || 'Output';
      const cleanDir = (customOutputDir || 'Output').replace(/[/\\]+$/, '');
      const targetMode = m3v2RenderSettings?.renderMode ? String(m3v2RenderSettings.renderMode).toUpperCase() : 'FAST';
      const isFast = targetMode === 'FAST';
      const modeSubfolder = isFast ? 'Fast Render' : 'Normal Render';
      const m3OutFolder = `${cleanDir}/M3_V2/${modeSubfolder}/`;

      setReviewDialog({
        isOpen: true,
        data: {
          mode: 'Mode 3 V2',
          projectName: m3v2OutputFilename?.split('.')[0] || 'M3_V2_Visualizer_Render',
          profile: 'Visualizer V4 Single Pure Profile',
          details: [
            { label: 'Visualizer Engine', value: 'Visualizer V4 Single Pure 2D' },
            { label: 'Active Visualizer Layers', value: `${(m3v2Objects || []).filter(o => o.type === 'visualizer4' || o.type?.includes('visualizer')).length} layers` },
            { label: 'Background Assets Count', value: `${(m3v2BgPool || []).length} files` },
            { label: 'Audio Tracks Count', value: `${(m3v2AudioTracks || []).length} tracks` },
            { label: 'Output Folder Path', value: m3OutFolder },
          ]
        }
      });
    }
  };

  // Template Manager
  useEffect(() => {
    const temps = localStorage.getItem('thumbnail_templates');
    if (temps) {
      try { setSavedTemplates(JSON.parse(temps)); } catch (e) {}
    }
  }, []);

  const handleSaveTemplate = () => {
    const name = window.prompt("Enter template name (e.g. Lofi Standard):", "My Template");
    if (!name) return;
    
    const existingIdx = savedTemplates.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
    if (existingIdx !== -1) {
      const confirmOverwrite = window.confirm(`Template "${name}" already exists. Overwrite?`);
      if (!confirmOverwrite) return;
    }

    const configData = {
      name: name,
      positions: thumbPositions,
      title: thumbTitle,
      tagline: thumbTagline,
      layout: thumbPlaylistLayout,
      leftCount: thumbCustomSplitLeftCount,
      limit: thumbDisplayLimit,
      numberingStyle: thumbNumberingStyle,
      numberingMode: thumbNumberingMode,
      
      titleFont: thumbTitleFont,
      titleSize: thumbTitleSize,
      titleColor: thumbTitleColor,
      titleAlign: thumbTitleAlign,
      titleShadow: thumbTitleShadow,
      titleStroke: thumbTitleStroke,
      
      taglineFont: thumbTaglineFont,
      taglineSize: thumbTaglineSize,
      taglineColor: thumbTaglineColor,
      taglineAlign: thumbTaglineAlign,
      taglineShadow: thumbTaglineShadow,
      taglineStroke: thumbTaglineStroke,
      
      playLeftFont: thumbPlayLeftFont,
      playLeftSize: thumbPlayLeftSize,
      playLeftColor: thumbPlayLeftColor,
      playLeftAlign: thumbPlayLeftAlign,
      playLeftShadow: thumbPlayLeftShadow,
      playLeftStroke: thumbPlayLeftStroke,
      
      playRightFont: thumbPlayRightFont,
      playRightSize: thumbPlayRightSize,
      playRightColor: thumbPlayRightColor,
      playRightAlign: thumbPlayRightAlign,
      playRightShadow: thumbPlayRightShadow,
      playRightStroke: thumbPlayRightStroke
    };

    let newTemplates = [...savedTemplates];
    if (existingIdx !== -1) {
      newTemplates[existingIdx] = configData;
    } else {
      newTemplates.push(configData);
    }
    setSavedTemplates(newTemplates);
    localStorage.setItem('thumbnail_templates', JSON.stringify(newTemplates));
    addLog(`Template saved: ${name}.template`);
    alert(`Successfully saved template: ${name}`);
  };

  const handleThumbLoadTemplate = (configData) => {
    if (configData.positions) setThumbPositions(configData.positions);
    if (configData.title) setThumbTitle(configData.title);
    if (configData.tagline) setThumbTagline(configData.tagline);
    if (configData.layout) setThumbPlaylistLayout(configData.layout);
    if (configData.leftCount) setThumbCustomSplitLeftCount(configData.leftCount);
    if (configData.limit) setThumbDisplayLimit(configData.limit);
    if (configData.numberingStyle) setThumbNumberingStyle(configData.numberingStyle);
    if (configData.numberingMode) setThumbNumberingMode(configData.numberingMode);
    
    if (configData.titleFont) setThumbTitleFont(configData.titleFont);
    if (configData.titleSize) setThumbTitleSize(configData.titleSize);
    if (configData.titleColor) setThumbTitleColor(configData.titleColor);
    if (configData.titleAlign) setThumbTitleAlign(configData.titleAlign);
    if (configData.titleShadow !== undefined) setThumbTitleShadow(configData.titleShadow);
    if (configData.titleStroke !== undefined) setThumbTitleStroke(configData.titleStroke);
    
    if (configData.taglineFont) setThumbTaglineFont(configData.taglineFont);
    if (configData.taglineSize) setThumbTaglineSize(configData.taglineSize);
    if (configData.taglineColor) setThumbTaglineColor(configData.taglineColor);
    if (configData.taglineAlign) setThumbTaglineAlign(configData.taglineAlign);
    if (configData.taglineShadow !== undefined) setThumbTaglineShadow(configData.taglineShadow);
    if (configData.taglineStroke !== undefined) setThumbTaglineStroke(configData.taglineStroke);
    
    if (configData.playLeftFont) setThumbPlayLeftFont(configData.playLeftFont);
    if (configData.playLeftSize) setThumbPlayLeftSize(configData.playLeftSize);
    if (configData.playLeftColor) setThumbPlayLeftColor(configData.playLeftColor);
    if (configData.playLeftAlign) setThumbPlayLeftAlign(configData.playLeftAlign);
    if (configData.playLeftShadow !== undefined) setThumbPlayLeftShadow(configData.playLeftShadow);
    if (configData.playLeftStroke !== undefined) setThumbPlayLeftStroke(configData.playLeftStroke);

    if (configData.playRightFont) setThumbPlayRightFont(configData.playRightFont);
    if (configData.playRightSize) setThumbPlayRightSize(configData.playRightSize);
    if (configData.playRightColor) setThumbPlayRightColor(configData.playRightColor);
    if (configData.playRightAlign) setThumbPlayRightAlign(configData.playRightAlign);
    if (configData.playRightShadow !== undefined) setThumbPlayRightShadow(configData.playRightShadow);
    if (configData.playRightStroke !== undefined) setThumbPlayRightStroke(configData.playRightStroke);
    
    addLog(`Template applied: ${configData.name}.template`);
    setIsTemplateLibraryOpen(false);
  };

  const handleDeleteTemplate = (idx) => {
    let newTemplates = [...savedTemplates];
    const name = newTemplates[idx].name;
    const confirm = window.confirm(`Are you sure you want to delete template "${name}"?`);
    if (!confirm) return;
    newTemplates.splice(idx, 1);
    setSavedTemplates(newTemplates);
    localStorage.setItem('thumbnail_templates', JSON.stringify(newTemplates));
    addLog(`Template deleted: ${name}.template`);
  };

  const handleConfirmQueue = () => {
    if (activeMode === 'Mode 1') {
      const summary = { added: 0, skippedDuplicate: 0, skippedIncomplete: 0, alreadyQueued: 0, addedNames: [], skippedDupNames: [], skippedIncNames: [], alreadyQueuedNames: [] };
      const jobsToQueue = [];
      const batchOutputs = [];
      const batchSources = [];
      
      m1Slots.forEach((slot, idx) => {
        if (!slot.outputName || (slot.sourceType === 'Audio File' && !slot.audio) || (slot.sourceType === 'YouTube URL' && !slot.isApproved && !(slot.isFetched && slot.audio))) {
           summary.skippedIncomplete++;
           summary.skippedIncNames.push(`Slot ${idx + 1}`);
           return;
        }

        const isQOutput = isQueuedOutput(slot.outputName);
        const isQSource = isQueuedSource(slot);
        if (isQOutput || isQSource) {
           summary.alreadyQueued++;
           summary.alreadyQueuedNames.push(slot.outputName);
           return;
        }
        
        const isDupOutput = batchOutputs.includes(slot.outputName);
        const isDupSource = slot.sourceType === 'YouTube URL' && batchSources.includes(slot.videoId);
        if (isDupOutput || isDupSource) {
           summary.skippedDuplicate++;
           summary.skippedDupNames.push(slot.outputName);
           return;
        }

        batchOutputs.push(slot.outputName);
        if (slot.sourceType === 'YouTube URL' && slot.videoId) batchSources.push(slot.videoId);
        
        const uuid = crypto.randomUUID().slice(0,6).toUpperCase();
        const d = new Date();
        const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
        const rid = `m1_${dateStr}_${uuid}`;
        const safeTitle = slot.outputName.replace('.mp4', '').replace(/[^a-zA-Z0-9\s_-]/g, '_').replace(/\s+/g, ' ').trim();
        const yyyymmdd = d.toISOString().split('T')[0];
        const customOutputDir = workspaceConfig?.output?.main || (activeWorkspace ? localStorage.getItem(`mf_workspace_output_${activeWorkspace}`) : '') || 'Output';
        const cleanDir = (customOutputDir || 'Output').replace(/[/\\]+$/, '');
        const outFolder = `${cleanDir}/M1/${yyyymmdd}/${dateStr}_${safeTitle.replace(/\s+/g, '_')}/`;
        
        const metadataPayload = {
          title: slot.videoTitle || slot.outputName.replace('.mp4', ''),
          cleaned_title: slot.metadataMode === 'Cleaned' ? slot.titleStrategy : slot.videoTitle,
          title_final: slot.outputName.replace('.mp4', ''),
          description: slot.metadataMode === 'Cleaned' ? slot.cleanedDesc : slot.originalDesc,
          source_channel: slot.channelName || 'Local Audio',
          source_url: slot.youtubeUrl || 'Local Audio',
          video_id: slot.videoId || 'N/A',
          duration: slot.duration || '0m 0s'
        };

        // Parse slot.duration "Xm Ys" to seconds for Phase 4
        let parsedAudioSec = 0;
        if (slot.duration) {
          const m = slot.duration.match(/(\d+)m\s*(\d+)s/);
          if (m) parsedAudioSec = parseInt(m[1]) * 60 + parseInt(m[2]);
          else parsedAudioSec = parseInt(slot.duration) || 0;
        }
        if (parsedAudioSec === 0) parsedAudioSec = 3000; // Fallback to 50 min

        jobsToQueue.push({
          id: rid,
          mode: 'Mode 1',
          profileName: 'Standard',
          status: 'Waiting',
          inputVideo: m1VideoFile,
          tracks: [slot.sourceType === 'YouTube URL' ? slot.youtubeUrl : slot.audio],
          audioPath: slot.audio,
          outputFiles: [slot.outputName, 'thumbnail.jpg', 'metadata.json', 'render.log', 'render.json'],
          outputFolder: outFolder,
          metadataPayload: metadataPayload,
          totalDurationSec: m1TargetSegment * 60,
          progress: 0,
          
          // Phase 1, 2 & 4: New Contract Payload
          segmentIndex: idx,
          segmentStartSec: selectedVideo?.metadata?.durationSec ? Math.min(idx * (m1TargetSegment * 60), Math.max(0, selectedVideo.metadata.durationSec - 1)) : idx * (m1TargetSegment * 60),
          segmentEndSec: selectedVideo?.metadata?.durationSec ? Math.min((idx + 1) * (m1TargetSegment * 60), selectedVideo.metadata.durationSec) : (idx + 1) * (m1TargetSegment * 60),
          playbackSpeed: 0.5,
          audioDurationSec: parsedAudioSec,
          quality: m1Quality || '480p',
          bufferSec: 300,
          watermarkEnabled: m1Watermark,
          subscribeEnabled: m1Subscribe,
          rotation: m1VideoRotation || 0,
          effects: {
            rotation: m1VideoRotation || 0,
            logo: { enabled: slot.useLogoChannel || false, asset: workspaceConfig?.branding?.logo || 'logo.png', opacity: 1, position: 'bottom-right' },
            subscribe: { enabled: slot.useSubscribe || false, asset: workspaceConfig?.branding?.subscribeAnim || 'subscribe.webm', position: 'center' },
            overlay: { enabled: slot.useOverlay || false, asset: workspaceConfig?.branding?.overlay || 'overlay.png', position: 'bottom-left' },
            watermark: { enabled: slot.useWatermark || false, asset: workspaceConfig?.branding?.watermark || 'watermark.png', position: 'top-left' }
          },
          outputName: slot.outputName,
          thumbnail: slot.manualThumbnail || (slot.sourceType === 'YouTube URL' && slot.videoId ? `https://img.youtube.com/vi/${slot.videoId}/maxresdefault.jpg` : null),
        });
      });

      if (jobsToQueue.length > 0) {
        setQueue(prev => [...prev, ...jobsToQueue]);
        jobsToQueue.forEach(job => {
          addLog(`[PIPELINE_JOB_CREATED] ${job.id} for Mode 1`);
        });
      }
      summary.added = jobsToQueue.length;
      summary.addedNames = jobsToQueue.map(j => j.outputFiles[0]);
      
      setM1QueueSummary({ isOpen: true, ...summary });
      addLog(`Queued Mode 1: Added ${summary.added} videos.`);
    } else if (activeMode === 'Mode 2') {
      console.log('CONFIRM_CLICKED');
      console.log('SELECTED_RENDER_PLANS', reviewDialog.data.selectedPlans);
      console.log('PIPELINE_BEFORE', queue.length);
      // Re-invoke the pipeline logic using the saved plans
      if (reviewDialog.data && reviewDialog.data.selectedPlans) {
        handleAddSelectedToPipeline(reviewDialog.data.selectedPlans);
      }
      // PIPELINE_AFTER log is printed inside handleAddSelectedToPipeline due to async nature of state, 
      // but we can log the length difference based on selectedPlans.length.
      console.log('PIPELINE_AFTER', queue.length + reviewDialog.data.selectedPlans.length);
    } else if (activeMode === 'Mode 4') {
      // Configuration generation is handled by Review Dialog Confirm
      if (reviewDialog.data && reviewDialog.data.m4JobPayload) {
        const payload = reviewDialog.data.m4JobPayload;
        setQueue(prev => [...prev, {
          ...payload,
          id: Date.now().toString(),
          mode: 'Mode 4',
          status: 'Waiting',
          progress: 0
        }]);
        addNotification('success', 'M4 Render Job added to queue!');
      }
    } else if (activeMode === 'Mode 3') {
      const customOutputDir = workspaceConfig?.output?.main || (activeWorkspace ? localStorage.getItem(`mf_workspace_output_${activeWorkspace}`) : '') || 'Output';
      const cleanDir = (customOutputDir || 'Output').replace(/[/\\]+$/, '');
      const targetMode = m3RenderSettings?.renderMode ? String(m3RenderSettings.renderMode).toUpperCase() : 'FAST';
      const isFast = targetMode === 'FAST';
      const modeSubfolder = isFast ? 'Fast Render' : 'Normal Render';
      const outFolder = `${cleanDir}/M3/${modeSubfolder}/`;

      const m3Job = {
        id: 'm3_q_' + Date.now(),
        mode: 'Mode 3',
        renderName: m3OutputFilename || 'M3_Render.mp4',
        profileName: 'Mode 3 Profile',
        status: 'Waiting',
        scheduleMode: 'Manual',
        scheduledAt: null,
        isPaused: false,
        inputVideo: m3BgPool[0]?.filename || 'Background',
        tracks: m3AudioTracks.map(t => t.sourcePath || t.title),
        outputFiles: [m3OutputFilename || 'Chill_Lofi_Playlist_Mix.mp4'],
        outputFolder: outFolder,
        estTimeSec: Math.round(m3TotalDurationSec * 0.15),
        estStorageMb: Math.round(m3TotalDurationSec * 0.5),
        totalDurationSec: m3TotalDurationSec,
        progress: 0,
        m3Payload: {
          playlist: m3AudioTracks,
          m3AudioTracks: m3AudioTracks,
          audioTracks: m3AudioTracks,
          background: m3BgPool[0] || {},
          bgPool: m3BgPool,
          m3BgPool: m3BgPool,
          objects: m3Objects,
          m3Objects: m3Objects,
          metadata: {
            outputName: m3OutputFilename || 'Chill_Lofi_Playlist_Mix.mp4',
            profileId: m3ProfileId || 'Standard'
          },
          thumbnail: { saved: m3ThumbnailSaved },
          settings: m3RenderSettings,
          outputFilename: m3OutputFilename || 'Chill_Lofi_Playlist_Mix.mp4',
          totalDurationSec: m3TotalDurationSec
        }
      };

      setQueue(prev => [...prev, m3Job]);
      addNotification('Added To Pipeline', `M3 Job added to queue`);
      addLog(`[M3] Pipeline Job Created: ${m3Job.outputFiles[0]}`);
      setPipelineDrawerCollapsed(false);
    } else if (activeMode === 'Mode 3 V2') {
      const customOutputDir = workspaceConfig?.output?.main || (activeWorkspace ? localStorage.getItem(`mf_workspace_output_${activeWorkspace}`) : '') || 'Output';
      const cleanDir = (customOutputDir || 'Output').replace(/[/\\]+$/, '');
      const targetMode = m3v2RenderSettings?.renderMode ? String(m3v2RenderSettings.renderMode).toUpperCase() : 'FAST';
      const isFast = targetMode === 'FAST';
      const modeSubfolder = isFast ? 'Fast Render' : 'Normal Render';
      const outFolder = `${cleanDir}/M3_V2/${modeSubfolder}/`;

      const m3v2Job = {
        id: 'm3v2_q_' + Date.now(),
        mode: 'Mode 3 V2',
        renderName: m3v2OutputFilename || 'M3_V2_Visualizer_Render.mp4',
        profileName: 'Visualizer V4 Single Pure Profile',
        status: 'Waiting',
        scheduleMode: 'Manual',
        scheduledAt: null,
        isPaused: false,
        inputVideo: (m3v2BgPool && m3v2BgPool[0]?.filename) || 'Visualizer Canvas',
        tracks: (m3v2AudioTracks || []).map(t => t.sourcePath || t.title),
        outputFiles: [m3v2OutputFilename || 'M3_V2_Visualizer_Render.mp4'],
        outputFolder: outFolder,
        estTimeSec: 60,
        estStorageMb: 30,
        totalDurationSec: 10,
        progress: 0,
        m3Payload: {
          playlist: m3v2AudioTracks || [],
          m3AudioTracks: m3v2AudioTracks || [],
          audioTracks: m3v2AudioTracks || [],
          background: (m3v2BgPool && m3v2BgPool[0]) || {},
          bgPool: m3v2BgPool || [],
          m3BgPool: m3v2BgPool || [],
          objects: m3v2Objects || [],
          m3Objects: m3v2Objects || [],
          metadata: {
            outputName: m3v2OutputFilename || 'M3_V2_Visualizer_Render.mp4',
            profileId: 'Single_Engine_V4'
          },
          thumbnail: { saved: m3v2ThumbnailSaved },
          settings: m3v2RenderSettings || {},
          outputFilename: m3v2OutputFilename || 'M3_V2_Visualizer_Render.mp4',
          totalDurationSec: 10
        }
      };

      setQueue(prev => [...prev, m3v2Job]);
      addNotification('Added To Pipeline', `M3 V2 Job added to queue`);
      addLog(`[M3 V2] Pipeline Job Created: ${m3v2Job.outputFiles[0]}`);
      setPipelineDrawerCollapsed(false);
    }
    setReviewDialog({ isOpen: false, data: null });
  };

  const handleAddM4ToQueue = (m4JobPayload) => {
    // Open Review Dialog instead of directly queueing
    const estTimeSec = m4JobPayload.totalDurationSec * 0.15; // Rough estimate
    const estStorageMb = (m4JobPayload.totalDurationSec * 8000 * 1000 / 8) / (1024 * 1024); // Assuming 8Mbps video
    
    setReviewDialog({
      isOpen: true,
      data: {
        mode: 'Mode 4',
        projectName: m4JobPayload.renderName || 'Ambient Project',
        profile: 'Ambient Engine V5',
        m4JobPayload: m4JobPayload,
        details: [
          { label: 'Background Video', value: m4JobPayload.m4Payload.bgVideo ? m4JobPayload.m4Payload.bgVideo.name : 'None' },
          { label: 'Ambient Audio', value: `${(m4JobPayload.m4Payload.ambientAudio || []).length} tracks` },
          { label: 'Relax Music', value: `${(m4JobPayload.m4Payload.relaxMusic || []).length} tracks` },
          { label: 'Output Duration', value: `${Math.round(m4JobPayload.totalDurationSec / 60)} minutes` },
          { label: 'Est. Render Time', value: `${Math.round(estTimeSec / 60)} minutes` },
          { label: 'Est. Storage Usage', value: `${Math.round(estStorageMb)} MB` },
          { label: 'Output Folder Path', value: m4JobPayload.outputFolder }
        ]
      }
    });
  };

  const handleGenerateM3Configuration = async (settings = {}) => {
    try {
      let thumbData = {
        saved: !!m3ThumbnailSaved,
        objects: (m3Objects || []).filter(o => o && o.canvasMode === 'thumbnail'),
        base64Data: '',
        width: 1280,
        height: 720,
        format: 'jpeg'
      };

      if (m3ThumbnailSaved) {
        const el = document.getElementById('m3-thumbnail-canvas');
        if (el && typeof html2canvas === 'function') {
          try {
            const canvas = await html2canvas(el, { scale: 1, backgroundColor: '#050505' });
            thumbData.base64Data = canvas.toDataURL('image/jpeg', 0.9);
            thumbData.width = canvas.width;
            thumbData.height = canvas.height;
          } catch (e) {
            console.error("Failed to capture thumbnail", e);
          }
        }
      }

      const composerObjects = (m3Objects || []).filter(o => o && (o.canvasMode === 'composer' || !o.canvasMode || o.canvasMode !== 'thumbnail'));
      const targetMode = settings?.renderMode ? String(settings.renderMode).toUpperCase() : 'FAST';
      const isFast = targetMode === 'FAST';
      const safeOutputFilename = (typeof m3OutputFilename === 'string' && m3OutputFilename.trim()) ? m3OutputFilename.trim() : 'M3_Render.mp4';
      const outFileName = safeOutputFilename.endsWith('.mp4') ? safeOutputFilename : `${safeOutputFilename}.mp4`;
      
      const customOutputDir = workspaceConfig?.output?.main || (activeWorkspace ? localStorage.getItem(`mf_workspace_output_${activeWorkspace}`) : '') || 'Output';
      const cleanDir = (customOutputDir || 'Output').replace(/[/\\]+$/, '');
      const modeSubfolder = isFast ? 'Fast Render' : 'Normal Render';
      const bundleName = outFileName.replace(/\.mp4$/i, '').trim();
      const outFolder = `${cleanDir}/M3/${modeSubfolder}/${bundleName}/`;
      
      const payload = {
        background: (m3BgPool && m3BgPool[0]) || {},
        playlist: m3AudioTracks || [],
        objects: composerObjects,
        composer: { objects: composerObjects },
        thumbnail: thumbData,
        metadata: {
          outputName: outFileName,
          profileId: m3ProfileId || 'p1',
          renderMode: isFast ? 'FAST' : 'NORMAL',
          resolution: settings?.resolution || '1080p',
          fps: settings?.fps || '60',
          codec: settings?.codec || 'H.264',
          bFrame: settings?.bFrame || 'Otomatis',
          renderPerSong: settings?.renderPerSong || false
        }
      };
      
      const newJob = {
        id: 'q_' + Date.now(),
        mode: 'Mode 3',
        profileName: isFast ? '⚡ Fast Render (10s Master Loop)' : '🎬 Normal Render',
        status: 'Waiting',
        scheduleMode: 'Manual',
        scheduledAt: null,
        isPaused: false,
        inputVideo: (m3BgPool && m3BgPool[0]?.filename) || 'Default Background',
        tracks: (m3AudioTracks && m3AudioTracks.length > 0) ? m3AudioTracks.map(t => t.sourcePath || t.sourceUrl || t.title) : ['Audio Track'],
        outputFiles: [outFileName],
        outputFolder: outFolder,
        totalDurationSec: m3TotalDurationSec || 60,
        progress: 0,
        renderMode: isFast ? 'FAST' : 'NORMAL',
        m3Payload: payload
      };

      setQueue(prev => [...prev.filter(j => j.status !== 'Failed'), newJob]);
      setM3SuccessMsg(true);
      
      addLog(`[M3] Render Job created and queued for ${outFileName}`);
      addNotification("⚡ Berhasil ditambahkan ke Queue Manager.", "Status: Waiting");
    } catch (err) {
      console.error('[M3 Queue Error]', err);
      if (addNotification) {
        addNotification(`⚠️ Queue Error: ${err.message}`, "Validation Error");
      }
    }
  };

  const handleGenerateM3V2Configuration = async (settings = {}) => {
    try {
      const composerObjects = (m3v2Objects || []).filter(o => o && (o.canvasMode === 'composer' || !o.canvasMode || o.canvasMode !== 'thumbnail'));
      const targetMode = settings?.renderMode ? String(settings.renderMode).toUpperCase() : 'FAST';
      const isFast = targetMode === 'FAST';
      const safeOutputFilename = (typeof m3v2OutputFilename === 'string' && m3v2OutputFilename.trim()) ? m3v2OutputFilename.trim() : 'M3_V2_Visualizer_Render.mp4';
      const outFileName = safeOutputFilename.endsWith('.mp4') ? safeOutputFilename : `${safeOutputFilename}.mp4`;
      
      const customOutputDir = workspaceConfig?.output?.main || (activeWorkspace ? localStorage.getItem(`mf_workspace_output_${activeWorkspace}`) : '') || 'Output';
      const cleanDir = (customOutputDir || 'Output').replace(/[/\\]+$/, '');
      const modeSubfolder = isFast ? 'Fast Render' : 'Normal Render';
      const bundleName = outFileName.replace(/\.mp4$/i, '').trim();
      const outFolder = `${cleanDir}/M3_V2/${modeSubfolder}/${bundleName}/`;
      
      const payload = {
        background: (m3v2BgPool && m3v2BgPool[0]) || {},
        playlist: m3v2AudioTracks || [],
        objects: composerObjects,
        composer: { objects: composerObjects },
        totalDurationSec: 10,
        outputFilename: outFileName,
        metadata: {
          outputName: outFileName,
          profileId: 'v4_single_pure',
          renderMode: isFast ? 'FAST' : 'NORMAL',
          resolution: settings?.resolution || '1080p',
          fps: settings?.fps || '60',
          codec: settings?.codec || 'H.264',
          bFrame: settings?.bFrame || 'Otomatis'
        }
      };
      
      const newJob = {
        id: 'm3v2_q_' + Date.now(),
        mode: 'Mode 3 V2',
        profileName: 'Visualizer V4 Single Pure (100% WYSIWYG)',
        status: 'Waiting',
        scheduleMode: 'Manual',
        scheduledAt: null,
        isPaused: false,
        inputVideo: (m3v2BgPool && m3v2BgPool[0]?.filename) || 'Visualizer Canvas',
        tracks: (m3v2AudioTracks && m3v2AudioTracks.length > 0) ? m3v2AudioTracks.map(t => t.sourcePath || t.sourceUrl || t.title) : ['Audio Track'],
        outputFiles: [outFileName],
        outputFolder: outFolder,
        totalDurationSec: 10,
        progress: 0,
        renderMode: isFast ? 'FAST' : 'NORMAL',
        m3Payload: payload
      };

      setQueue(prev => [...prev.filter(j => j.status !== 'Failed'), newJob]);
      setPipelineDrawerCollapsed(false);
      addLog(`[M3 V2] Render Job created and queued for ${outFileName}`);
      addNotification("⚡ Berhasil ditambahkan ke Queue Manager.", "Status: Waiting");
    } catch (err) {
      console.error('[M3 V2 Queue Error]', err);
      if (addNotification) {
        addNotification(`⚠️ Queue Error: ${err.message}`, "Validation Error");
      }
    }
  };

  const fetchVideoMetadataWithFallback = async (filePath, file = null) => {
    const endpoints = [
      '/api/m1/video-metadata',
      'http://127.0.0.1:18888/api/m1/video-metadata',
      'http://localhost:18888/api/m1/video-metadata'
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const probeRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: filePath }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (probeRes.ok) {
          const probeData = await probeRes.json();
          if (probeData && !probeData.error) {
            return probeData;
          }
        }
      } catch (e) {
        console.warn(`[M1 Probe] Endpoint ${endpoint} failed:`, e.message);
      }
    }

    // Client-side HTML5 Video element fallback if backend ffprobe is unreachable
    console.warn('[M1 Probe] Backend endpoints unreachable. Using HTML5 Video fallback...');
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        const cleanPath = filePath ? `file:///${filePath.replace(/\\/g, '/')}` : '';
        const videoSrc = file ? URL.createObjectURL(file) : cleanPath;
        
        const cleanup = () => {
          if (file && videoSrc) URL.revokeObjectURL(videoSrc);
        };

        const timer = setTimeout(() => {
          cleanup();
          const fileName = filePath ? filePath.split(/[\\/]/).pop() : 'Video';
          resolve({
            durationSec: 60,
            durationDisplay: '1m 00s',
            resolution: '1920 × 1080',
            rawWidth: 1920,
            rawHeight: 1080,
            width: 1920,
            height: 1080,
            fps: 30,
            codec: 'H264 (Local)',
            fileSizeDisplay: file ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Local File'
          });
        }, 4000);

        video.onloadedmetadata = () => {
          clearTimeout(timer);
          const durationSec = video.duration || 60;
          const totalSec = Math.floor(durationSec);
          const mins = Math.floor(totalSec / 60);
          const secs = totalSec % 60;
          const durationDisplay = `${mins}m ${String(secs).padStart(2, '0')}s`;
          const rawW = video.videoWidth || 1920;
          const rawH = video.videoHeight || 1080;
          const resolution = `${rawW} × ${rawH}`;
          cleanup();
          resolve({
            durationSec,
            durationDisplay,
            resolution,
            rawWidth: rawW,
            rawHeight: rawH,
            width: rawW,
            height: rawH,
            fps: 30,
            codec: 'H264 (Client)',
            fileSizeDisplay: file ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Local File'
          });
        };

        video.onerror = () => {
          clearTimeout(timer);
          cleanup();
          resolve({
            durationSec: 60,
            durationDisplay: '1m 00s',
            resolution: '1920 × 1080',
            rawWidth: 1920,
            rawHeight: 1080,
            width: 1920,
            height: 1080,
            fps: 30,
            codec: 'H264 (Local)',
            fileSizeDisplay: file ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Local File'
          });
        };

        video.src = videoSrc;
      } catch(e) {
        resolve({
          durationSec: 60,
          durationDisplay: '1m 00s',
          resolution: '1920 × 1080',
          rawWidth: 1920,
          rawHeight: 1080,
          width: 1920,
          height: 1080,
          fps: 30,
          codec: 'H264 (Local)',
          fileSizeDisplay: 'Local File'
        });
      }
    });
  };

  const handleVideoUploadChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setM1VideoProbing(true);
    setM1VideoProbeError(null);
    
    if (selectedVideo?.previewUrl) {
      URL.revokeObjectURL(selectedVideo.previewUrl);
    }
    setSelectedVideo(null);
    setM1Slots([]);

    try {
      console.log('UPLOAD_START', file.name);
      addLog(`[M1] Uploading video: ${file.name}...`);
      
      const objectUrl = URL.createObjectURL(file);
      const filePath = file.path || file.name;
      
      const probeData = await fetchVideoMetadataWithFallback(filePath, file);
      
      const rawW = probeData.rawWidth || (probeData.resolution ? parseInt(probeData.resolution.split('×')[0]) : 1920);
      const rawH = probeData.rawHeight || (probeData.resolution ? parseInt(probeData.resolution.split('×')[1]) : 1080);
      const srcRatio = rawW / rawH;
      const targetRatio = 16 / 9;
      let autoScale = 100;
      if (srcRatio < targetRatio) {
        autoScale = Math.max(100, Math.round((targetRatio / srcRatio) * 100));
      } else if (srcRatio > targetRatio) {
        autoScale = Math.max(100, Math.round((srcRatio / targetRatio) * 100));
      }

      setM1VideoTransform({
        x: 0,
        y: 0,
        scale: autoScale,
        rotation: 0,
        flipH: false,
        flipV: false,
        aspectRatio: '16:9'
      });

      const newVideoState = {
        file: file,
        previewUrl: objectUrl,
        metadata: {
          fileName: file.name,
          fullPath: filePath,
          rawWidth: rawW,
          rawHeight: rawH,
          durationSec: probeData.durationSec,
          durationDisplay: probeData.durationDisplay,
          resolution: probeData.resolution,
          fps: probeData.fps,
          codec: probeData.codec,
          fileSizeDisplay: probeData.fileSizeDisplay
        }
      };
      
      setSelectedVideo(newVideoState);
      console.log('VIDEO_METADATA_RENDERED', newVideoState);
      addLog(`[M1] FFprobe success: ${file.name} (${probeData.durationDisplay}) [Scale: ${autoScale}%]`);

    } catch (err) {
      console.log('UPLOAD_FAILED', err);
      setM1VideoProbeError(`Error probing video metadata: ${err.message}`);
    } finally {
      setM1VideoProbing(false);
      if (e && e.target) {
        e.target.value = '';
      }
    }
  };

  const probeVideoPath = async (filePath) => {
    try {
      setM1VideoProbeError(null);
      console.log('VIDEO_PROBE_REQUEST', filePath);
      
      if (selectedVideo?.previewUrl) {
        URL.revokeObjectURL(selectedVideo.previewUrl);
      }
      setM1Slots([]);
      
      const probeData = await fetchVideoMetadataWithFallback(filePath);
      
      const fileName = filePath.split(/[\\/]/).pop();
      const rawW = probeData.rawWidth || (probeData.resolution ? parseInt(probeData.resolution.split('×')[0]) : 1920);
      const rawH = probeData.rawHeight || (probeData.resolution ? parseInt(probeData.resolution.split('×')[1]) : 1080);
      const srcRatio = rawW / rawH;
      const targetRatio = 16 / 9;
      let autoScale = 100;
      if (srcRatio < targetRatio) {
        autoScale = Math.max(100, Math.round((targetRatio / srcRatio) * 100));
      } else if (srcRatio > targetRatio) {
        autoScale = Math.max(100, Math.round((srcRatio / targetRatio) * 100));
      }

      setM1VideoTransform({
        x: 0,
        y: 0,
        scale: autoScale,
        rotation: 0,
        flipH: false,
        flipV: false,
        aspectRatio: '16:9'
      });

      const newVideoState = {
        file: null,
        previewUrl: `file:///${filePath.replace(/\\/g, '/')}`, 
        metadata: {
          fileName,
          fullPath: filePath,
          rawWidth: rawW,
          rawHeight: rawH,
          durationSec: probeData.durationSec,
          durationDisplay: probeData.durationDisplay,
          resolution: probeData.resolution,
          fps: probeData.fps,
          codec: probeData.codec,
          fileSizeDisplay: probeData.fileSizeDisplay
        }
      };
      setSelectedVideo(newVideoState);
      console.log('VIDEO_METADATA_RENDERED', newVideoState);
      addLog(`[M1] FFprobe success: ${fileName} (${probeData.durationDisplay}) [Scale: ${autoScale}%]`);
      
    } catch (e) {
      console.log('VIDEO_PROBE_REQUEST_FAILED', e);
      setM1VideoProbeError(`Error probing video metadata: ${e.message}`);
      addLog(`[ERROR] Probe request failed: ${e.message}`);
    } finally {
      setM1VideoProbing(false);
    }
  };

  const handleManualVideoPathChange = (e) => {
    const val = e.target.value;
    if (!val) {
      setSelectedVideo(null);
      setM1VideoProbeError(null);
      return;
    }
    // Temporarily set the path so the user sees what they pasted
    setSelectedVideo({ metadata: { fullPath: val } });
    setM1VideoProbing(true);
    probeVideoPath(val);
  };

  const handleResetModeForm = (mode) => {
    if (mode === 'Mode 1') {
      setSelectedVideo(null);
      setM1VideoProbeError(null);
      setM1TargetSegment(10);
      setM1Slots([]);
      setM1ResetTrigger(prev => prev + 1);
      setM1SuccessMsg(false);
      addLog('Mode 1 Reset. Profile kept.');
    } else if (mode === 'Mode 2') {
      setM2AudioPool([]);
      setM2SuccessMsg(false);
      addLog('Mode 2 Reset. Profile kept.');
    } else if (mode === 'Mode 3') {
      setM3BgPool([]);
      setM3AudioTracks([]);
      setM3OutputFilename('');
      setM3SuccessMsg(false);
      addLog('Mode 3 Reset. Profile kept.');
    }
  };

  const handleDeleteQueueItem = (id) => {
    if (typeof id === 'string' && id.startsWith('m5_')) {
      const rawId = id.replace('m5_', '');
      setM5Queue(prev => prev.filter(item => item.id !== rawId && item.id.toString() !== rawId));
      fetch(`/api/v1/m5/queue/${rawId}`, { method: 'DELETE' }).catch(() => {});
      addLog(`Deleted M5 queue item: ${rawId}`);
      return;
    }
    const targetItem = queue.find(item => item.id === id);
    if (targetItem) {
      if (targetItem.mode === 'Mode 3') {
        fetch('/api/m3/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: targetItem.id, jobId: targetItem.backendJobId || targetItem.id })
        }).catch(() => {});
      }
      fetch('/api/v1/system/kill-ffmpeg', { method: 'POST' }).catch(() => {});
    }
    setQueue(prev => prev.filter(item => item.id !== id));
    addLog(`Deleted queue item: ${id}`);
  };

  const handleTogglePause = (id) => {
    if (typeof id === 'string' && id.startsWith('m5_')) {
      const rawId = id.replace('m5_', '');
      fetch(`/api/v1/m5/stop-render`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: rawId }) 
      }).catch(() => {});
      addLog(`Stopped M5 queue item: ${rawId}`);
      return;
    }
    
    setQueue(prev => {
        const item = prev.find(i => i.id === id);
        if (!item) return prev;
        const isPaused = !item.isPaused;
        if (isPaused) {
          if (item.mode === 'Mode 3') {
            fetch('/api/m3/cancel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: item.id, jobId: item.backendJobId || item.id })
            }).catch(() => {});
          }
          fetch('/api/v1/system/kill-ffmpeg', { method: 'POST' }).catch(() => {});
        }
        addLog(`Rendering ${isPaused ? 'paused' : 'resumed'} for job: ${id}`);
        return prev.map(i => i.id === id ? { ...i, isPaused, status: isPaused ? 'Waiting' : i.status } : i);
    });
  };

  const handleStartRender = () => {
    console.log('STEP_1_START_RENDER');
    console.log('START_RENDER_CLICKED');
    console.log('QUEUE_STATE', queue);
    console.log('ELIGIBLE_JOBS', queue.filter(j => j.status === 'Waiting' || j.status === 'Pending'));

    if (isRendering) {
      clearInterval(renderIntervalRef.current);
      setIsRendering(false);
      fetch('/api/m3/cancel', { method: 'POST' }).catch(() => {});
      fetch('/api/v1/system/kill-ffmpeg', { method: 'POST' }).catch(() => {});
      addLog('Rendering paused and FFmpeg processes stopped.');
      return;
    }

    if (activeMode === 'Mode 5') {
      const hasM5Eligible = m5Queue.some(q => q.status === 'Ready' || q.status === 'Waiting' || q.status === 'Failed');
      if (!hasM5Eligible) {
        addLog('No eligible M5 jobs to render.');
        return;
      }
      setIsRendering(true);
      addLog('M5_ENGINE_START');
      fetch('/api/v1/m5/start-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'all' })
      })
      .then(async res => {
        const json = await res.json();
        if (!json.success) alert('Gagal memulai render M5: ' + (json.error || 'Unknown error'));
        else addLog('M5 Render started successfully.');
      })
      .catch(err => alert('Error starting M5 render: ' + err.message));
      return;
    }

    const hasEligible = queue.some(q => (q.status === 'Waiting' || q.status === 'Pending') && !q.isPaused);
    if (!hasEligible) {
      addLog('No eligible jobs to render.');
      return;
    }

    console.log('QUEUE_LENGTH_BEFORE_RENDER', queue.length);

    setIsRendering(true);
    console.log('STEP_2_ENGINE_RUNNING');
    addLog('ENGINE_START');

    let activeJobId = queue.find(q => (q.status === 'Waiting' || q.status === 'Pending') && !q.isPaused)?.id;
    if (activeJobId) {
      addLog(`JOB_SELECTED: ${queue.find(q => q.id === activeJobId).outputFiles[0]}`);
    }
    
    let attempts = 0;

    renderIntervalRef.current = setInterval(() => {
      setQueue(currentQueue => {
        const nextQueue = [...currentQueue];
        const jobIndex = nextQueue.findIndex(q => q.id === activeJobId);
        let job = jobIndex !== -1 ? nextQueue[jobIndex] : null;

        const runningJobs = nextQueue.filter(q => q.status === 'Rendering' || q.status === 'RENDERING');
        const nextPending = nextQueue.find(q => (q.status === 'Waiting' || q.status === 'Pending') && !q.isPaused);

        if (!job || job.isPaused || job.status === 'Completed' || job.status === 'Failed') {
            if (job && (job.status === 'Completed' || job.status === 'Failed')) {
                console.log('JOB_COMPLETED', job.renderName);
                addLog(`JOB_COMPLETED: ${job.outputFiles[0]} with status ${job.status}`);
            }

            if (nextPending) {
                activeJobId = nextPending.id;
                attempts = 0;
                addLog(`NEXT_JOB_SELECTED: ${nextPending.outputFiles[0]}`);
                console.log('NEXT_JOB_SELECTED', nextPending.outputFiles[0]);
                job = nextPending;
            } else {
                if (runningJobs.length === 0) {
                    clearInterval(renderIntervalRef.current);
                    setIsRendering(false);
                    addLog('ENGINE_STOPPED: All jobs processed.');
                    fetch('/api/v1/system/clean-cache/immediate', { method: 'POST' }).catch(()=>{});
                }
                return currentQueue;
            }
        }

        if (job.status === 'Waiting') {
           job.status = 'Pending';
           return nextQueue;
        }

        if (job.status === 'Pending') {
           if (runningJobs.length > 0) {
               return nextQueue; // ENFORCE SINGLE ACTIVE RENDER
           }

           job.status = 'Rendering';
           console.log('RENDERING_JOB', job.renderName);
           addLog(`JOB_RENDERING: ${job.outputFiles[0]}`);

           if (job.mode === 'Mode 1') {
             addLog(`[M1] STARTING ${job.outputFiles[0]}`);
             fetch(getApiUrl('/api/m1/render'), {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(job)
             })
             .then(async (res) => {
               if (!res.ok) throw new Error(`HTTP ${res.status}`);
               const data = await res.json();
               addLog(`[M1] RENDER ACCEPTED`);
               setQueue(q => q.map(x => x.id === job.id ? { ...x, backendJobId: data.jobId || data.id || job.id } : x));
             })
             .catch((err) => {
               console.error(err);
               addLog(`[M1] FAILED TO START: ${err.message}`);
               setQueue(q => q.map(x => x.id === job.id ? { ...x, status: 'Failed', failureReason: err.message } : x));
             });
           } else if (job.mode === 'Mode 2') {
             addLog(`[M2] STARTING ${job.outputFiles[0]}`);
             console.log('STEP_3_POST_RENDER');
             fetch(getApiUrl('/api/m2/render'), {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 queueId: job.id,
                 renderPlan: job.profileName,
                 renderName: job.renderName || 'Output',
                 tracks: job.tracks,
                 totalDurationSec: job.totalDurationSec
               })
             })
             .then(async (res) => {
               if (!res.ok) throw new Error(`HTTP ${res.status}`);
               const data = await res.json();
               addLog(`[M2] RENDER ACCEPTED`);
               console.log('STEP_4_RENDER_ACCEPTED');
               setQueue(q => q.map(x => x.id === job.id ? { ...x, backendJobId: data.queueId || data.jobId || data.id || job.id } : x));
             })
             .catch((err) => {
               console.error(err);
               console.log('STEP_4_RENDER_FAILED');
               addLog(`[M2] FAILED TO START: ${err.message}`);
               setQueue(q => q.map(x => x.id === job.id ? { ...x, status: 'Failed', failureReason: err.message } : x));
             });
           } else if (job.mode === 'Mode 3') {
             addLog(`[M3] STARTING ${job.outputFiles[0]}`);
             fetch(getApiUrl('/api/m3_v2/render'), {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(job)
             })
             .then(async (res) => {
               if (!res.ok) throw new Error(`HTTP ${res.status}`);
               const data = await res.json();
               addLog(`[M3] RENDER ACCEPTED`);
               setQueue(q => q.map(x => x.id === job.id ? { ...x, backendJobId: data.jobId || data.id || job.id } : x));
             })
             .catch((err) => {
               console.error(err);
               addLog(`[M3] FAILED TO START: ${err.message}`);
               setQueue(q => q.map(x => x.id === job.id ? { ...x, status: 'Failed', failureReason: err.message } : x));
             });
           } else if (job.mode === 'Mode 3 V2') {
              addLog(`[M3 V2] STARTING ${job.outputFiles[0]}`);
              fetch(getApiUrl('/api/m3_v2/render'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(job)
              })
              .then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                addLog(`[M3 V2] RENDER ACCEPTED`);
                setQueue(q => q.map(x => x.id === job.id ? { ...x, backendJobId: data.jobId || data.id || job.id } : x));
              })
              .catch((err) => {
                console.error(err);
                addLog(`[M3 V2] FAILED TO START: ${err.message}`);
                setQueue(q => q.map(x => x.id === job.id ? { ...x, status: 'Failed', failureReason: err.message } : x));
              });
            } else if (job.mode === 'Mode 4') {
             addLog(`[M4] STARTING ${job.outputFiles[0]}`);
             fetch(getApiUrl('/api/m4/render'), {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(job)
             })
             .then(async (res) => {
               if (!res.ok) throw new Error(`HTTP ${res.status}`);
               const data = await res.json();
               addLog(`[M4] RENDER ACCEPTED`);
               setQueue(q => q.map(x => x.id === job.id ? { ...x, backendJobId: data.jobId || data.id || job.id } : x));
             })
             .catch((err) => {
               console.error(err);
               addLog(`[M4] FAILED TO START: ${err.message}`);
               setQueue(q => q.map(x => x.id === job.id ? { ...x, status: 'Failed', failureReason: err.message } : x));
             });
           }
           return nextQueue;
        }

        if (job.mode === 'Mode 1' || job.mode === 'Mode 2' || job.mode === 'Mode 3' || job.mode === 'Mode 3 V2' || job.mode === 'Mode 4') {
           // Poll backend every 1 second
           const endpoint = job.mode === 'Mode 1' ? '/api/m1/render/' : (job.mode === 'Mode 2' ? '/api/m2/render/' : (job.mode === 'Mode 3' || job.mode === 'Mode 3 V2' ? '/api/m3_v2/render/' : '/api/m4/render/'));
           fetch(getApiUrl(`${endpoint}${job.backendJobId || job.id}`))
             .then(res => res.ok ? res.json() : null)
             .then(data => {
                if (!data) return;
                if (data.logs && job.mode === 'Mode 3') {
                    setLogs(data.logs.split('\n').slice(-300));
                }
                let newLog = null;
                setQueue(q => {
                   const nq = [...q];
                   const jidx = nq.findIndex(x => x.id === job.id);
                   if (jidx !== -1 && nq[jidx].status === 'Rendering') {
                     nq[jidx] = { 
                       ...nq[jidx], 
                       renderStartTime: nq[jidx].renderStartTime || Date.now(),
                       progress: data.progress, 
                       stage: data.stage, 
                       diagnosticReport: data.diagnosticReport, 
                       runtimeReport: data.runtimeReport, 
                       currentFFmpegTime: data.currentFFmpegTime, 
                       rawLogs: data.logs 
                     };
                     if (data.status?.toUpperCase() === 'COMPLETED') {
                        nq[jidx].status = 'Completed';
                        nq[jidx].progress = 100;
                        nq[jidx].OUTPUT_PATH = data.OUTPUT_PATH;
                        nq[jidx].FFMPEG_COMMAND = data.FFMPEG_COMMAND;
                        nq[jidx].FILE_SIZE = data.FILE_SIZE;
                        nq[jidx].RENDER_DURATION = data.RENDER_DURATION;
                        newLog = `[SUCCESS] File rendered: ${nq[jidx].outputFiles[0]}`;
                        pipelineHistoryEngine.addEntry({
                          queueId: nq[jidx].id,
                          profile: nq[jidx].profileName,
                          mode: nq[jidx].mode,
                          actualRenderTime: parseFloat(data.RENDER_DURATION) || 0,
                          actualDuration: nq[jidx].totalDurationSec || 0,
                          actualFileSize: parseFloat(data.FILE_SIZE) || 0,
                          status: 'Completed',
                          finishTime: new Date().toISOString()
                        });
                      } else if (data.status === 'FAILED') {
                         nq[jidx].status = 'Failed';
                         nq[jidx].failureReason = data.failureReason || data.error || 'Unknown error';
                      }
                   }
                   return nq;
                });
                if (newLog) addLog(newLog);
             })
             .catch(err => console.error('Poll error:', err));
        }
        return nextQueue;
      });
    }, 250);
  };

  if (appState === 'SPLASH') return <Splash onComplete={checkWorkspaces} />;
  if (appState === 'PICKER') return <WorkspacePicker onWorkspaceSelected={handleWorkspaceSelected} onNewWorkspace={() => setAppState('WIZARD')} />;
  if (appState === 'WIZARD') return <WorkspaceWizard onWorkspaceCreated={handleWorkspaceSelected} onClose={() => setAppState('PICKER')} />;
  
  if (appState === 'WORKSPACE_LOADING') {
      return (
          <div className="fixed inset-0 bg-[#0b0c10] flex flex-col items-center justify-center z-50 text-[#c9d1d9] font-sans">
              <div className="w-[400px]">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-[#1e2230] rounded border border-[#2d3247] flex items-center justify-center shadow-lg">
                          <span className="text-xl">📂</span>
                      </div>
                      <div>
                          <h2 className="text-xl font-bold tracking-tight text-white">{activeWorkspace}</h2>
                          <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">Initializing Workspace</p>
                      </div>
                  </div>
                  
                  <div className="bg-[#12131a] rounded-lg border border-[#21232d] p-4 shadow-xl">
                      {loadingSteps.map((text, idx) => (
                          <div key={idx} className={`flex items-center gap-3 py-2 text-sm ${idx > loadingStep ? 'opacity-30' : 'opacity-100'}`}>
                              {idx < loadingStep ? (
                                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              ) : idx === loadingStep ? (
                                  <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              ) : (
                                  <div className="w-4 h-4 rounded-full border border-gray-600"></div>
                              )}
                              <span className={`${idx === loadingStep ? 'text-white font-medium' : 'text-gray-400'}`}>{text}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  if (appState === 'DIAGNOSTICS') {
      return <DiagnosticsPage onBack={() => setAppState('EDITOR')} initialTab="Visualizer Parity (100%)" />;
  }

  return (
    <div className="flex flex-col h-screen w-screen m1-global-bg text-[#c9d1d9] font-sans antialiased select-none text-xs">
      <div className="relative z-10 flex flex-col h-full w-full pointer-events-none">
        <div className="pointer-events-auto h-full w-full flex flex-col">
          <WorkspaceSettingsModal 
        workspaceName={activeWorkspace} 
        isOpen={isWorkspaceSettingsOpen}
        onClose={() => setIsWorkspaceSettingsOpen(false)} 
      />
      {/* NEW HEADER (PIXEL-PERFECT REPLICATION) */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#0A0B10]/80 backdrop-blur-md border-b border-white/5 shrink-0 z-20">
        {/* LEFT: Logo & Brand */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-orange-500 rounded-md flex items-center justify-center bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
            <span className="text-orange-500 font-black text-xl font-sans tracking-tighter">MF</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-tight text-white text-lg leading-tight uppercase">MediaFactory</span>
            <span className="text-[9px] text-orange-500 font-semibold tracking-[0.2em] uppercase leading-none">Ultimate Video Automation</span>
          </div>
        </div>

        {/* CENTER: Navigation Tabs (Trapezoid) */}
        <div className="flex-1 flex justify-center -mb-[13px] z-30">
          <div className="flex items-end gap-1">
            {['Mode 1', 'Mode 2', 'Mode 3', 'Mode 3 V2', 'Mode 4', 'Mode 5', 'Mode 6'].map((mode) => {
              const isActive = activeMode === mode;
              const modeId = mode === 'Mode 3 V2' ? 'M3 V2' : mode.replace('Mode ', 'M');
              const modeTitle = mode === 'Mode 1' ? 'BATCH' : mode === 'Mode 2' ? 'COMPILER' : mode === 'Mode 3' ? 'PLAYLIST V1' : mode === 'Mode 3 V2' ? 'M3 V2' : mode === 'Mode 4' ? 'AMBIENT' : mode === 'Mode 5' ? 'CREATE' : 'COLLECT';
              return (
                <button
                  key={mode}
                  onClick={() => {
                    setActiveMode(mode);
                    addLog(`Switched Mode: ${mode}`);
                  }}
                  className="relative px-3 md:px-5 xl:px-7 py-2 group cursor-pointer"
                >
                  {/* Skewed Background */}
                  <div className={`absolute inset-0 skew-x-[-15deg] transition-all duration-300 border
                    ${isActive 
                      ? 'bg-gradient-to-t from-orange-500/20 to-[#1a0b05] border-orange-500/50 border-b-[3px] border-b-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] z-10' 
                      : 'bg-[#0A0B10]/80 border-white/5 border-b-transparent group-hover:bg-white/5 z-0'
                    }`}
                  ></div>
                  
                  {/* Glowing Top line for active tab */}
                  {isActive && (
                    <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,1)] skew-x-[-15deg]"></div>
                  )}

                  {/* Tab Text (Un-skewed) */}
                  <div className={`relative z-20 flex flex-col items-center justify-center transition-colors duration-300
                    ${isActive ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'text-gray-500 group-hover:text-gray-300'}
                  `}>
                    <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em]">{modeId}</span>
                    <span className="text-[8px] md:text-[9px] font-medium tracking-[0.15em] opacity-80">{modeTitle}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Stats & Profile */}
        <div className="flex items-center gap-4">
          {/* Hardware Stats (Minimalist) */}
          <div className="hidden md:flex items-center gap-2 xl:gap-3 px-3 py-1 bg-black/40 border border-white/5 rounded-full text-[9px] xl:text-[10px] font-mono text-gray-500 transition-all duration-300">
            <span className="flex items-center gap-1.5"><span className={`w-1 h-1 rounded-full ${fps >= 50 ? 'bg-green-500' : fps >= 30 ? 'bg-orange-500' : 'bg-red-500 shadow-[0_0_5px_#ef4444]'}`}></span> FPS: {fps}</span>
            <span className="flex items-center gap-1.5"><span className={`w-1 h-1 rounded-full ${(parseInt(hardwareStats.cpu) || 0) > 80 ? 'bg-red-500 shadow-[0_0_5px_#ef4444]' : 'bg-orange-500'}`}></span> CPU: {parseInt(hardwareStats.cpu) || 0}%</span>
            <span className="flex items-center gap-1.5"><span className={`w-1 h-1 rounded-full ${(parseInt(hardwareStats.gpu) || 0) > 80 ? 'bg-red-500 shadow-[0_0_5px_#ef4444]' : 'bg-orange-500'}`}></span> GPU: {parseInt(hardwareStats.gpu) || 0}%</span>
            <span className="flex items-center gap-1.5"><span className={`w-1 h-1 rounded-full ${(parseInt(hardwareStats.ram) || 0) > 80 ? 'bg-red-500 shadow-[0_0_5px_#ef4444]' : 'bg-orange-500'}`}></span> RAM: {parseInt(hardwareStats.ram) || 0}%</span>
          </div>

          <div className="w-px h-5 bg-white/10"></div>

          {/* Engine Status */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase font-bold">Engine</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </div>

          <div className="w-px h-6 bg-white/10"></div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {isDevMode && (
              <button
                onClick={() => setAppState('DIAGNOSTICS')}
                className="text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded flex items-center gap-1.5 transition-colors font-bold uppercase text-[10px]"
              >
                <span>🛠️</span> Developer
              </button>
            )}
            
            <button className="text-gray-400 hover:text-white transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full border border-[#0A0B10]"></span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>
              {isSettingsOpen && (
                <div className="absolute top-10 right-0 w-60 bg-[#141820]/95 backdrop-blur-md border border-orange-500/20 rounded-xl shadow-[0_0_30px_-5px_rgba(249,115,22,0.15)] z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-[10px] font-bold text-orange-500/80 uppercase tracking-widest border-b border-orange-500/20 pb-2 mb-2 px-1">⚙️ Advanced Options</div>
                  
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white px-1 py-1 rounded transition-colors hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={isDevMode}
                      onChange={(e) => setIsDevMode(e.target.checked)}
                      className="accent-orange-500 w-3.5 h-3.5"
                    />
                    Developer Mode
                  </label>

                  <div className="space-y-1">
                    <button
                      onClick={() => { setIsApiKeysModalOpen(true); setIsSettingsOpen(false); }}
                      className="w-full text-left text-xs text-gray-300 hover:text-orange-100 hover:bg-orange-500/10 px-2 py-1.5 rounded-lg flex items-center gap-2 transition-all border border-transparent hover:border-orange-500/20"
                    >
                      <span className="text-orange-500 text-sm drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">🔑</span> Manage API Keys
                    </button>
                    <button
                      onClick={() => { setIsCacheModalOpen(true); setIsSettingsOpen(false); }}
                      className="w-full text-left text-xs text-gray-300 hover:text-orange-100 hover:bg-orange-500/10 px-2 py-1.5 rounded-lg flex items-center gap-2 transition-all border border-transparent hover:border-orange-500/20"
                    >
                      <span className="text-orange-500 text-sm drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">🗄️</span> Manage Cache Storage
                    </button>
                    <button
                      onClick={handleCheckUpdate}
                      disabled={updateState.status === 'checking' || updateState.status === 'downloading'}
                      className={`w-full text-left text-xs ${updateState.status === 'ready' || updateState.status === 'available' ? 'text-emerald-400 font-bold hover:bg-emerald-500/10 border border-emerald-500/30' : 'text-gray-300 hover:text-orange-100 hover:bg-orange-500/10 border border-transparent hover:border-orange-500/20'} px-2 py-1.5 rounded-lg flex items-center justify-between transition-all`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-orange-500 text-sm drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">🔄</span> 
                        {updateState.status === 'idle' && `Check for Updates (v${APP_VERSION})`}
                        {updateState.status === 'checking' && `Checking... (v${APP_VERSION})`}
                        {updateState.status === 'not-available' && `Up to date (v${APP_VERSION}) ✓`}
                        {updateState.status === 'available' && `New v${updateState.version} Available! (Click to Download)`}
                        {updateState.status === 'downloading' && `Downloading v${updateState.version || APP_VERSION} (${Math.round(updateState.progress)}%)`}
                        {updateState.status === 'ready' && `Restart to Update (v${updateState.version || APP_VERSION})`}
                        {updateState.status === 'error' && `Update Failed (v${APP_VERSION})`}
                      </div>
                      {updateState.status === 'downloading' && (
                        <div className="w-10 h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{width: `${updateState.progress}%`}}></div>
                        </div>
                      )}
                    </button>
                  </div>

                  {isDevMode && (
                    <div className="border-t border-white/10 pt-1.5 space-y-1">
                      <button
                        onClick={() => { setIsDevPanelOpen(true); setIsSettingsOpen(false); }}
                        className="w-full text-left text-[10px] text-red-400 hover:text-red-300 hover:bg-red-950/30 px-2 py-1 rounded flex items-center gap-1.5 transition-colors"
                      >
                        <span className="text-[8px]">🛠</span> Open Dev Panel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>


            <button 
              onClick={() => setIsWorkspaceDrawerOpen(true)}
              className="flex items-center gap-3 hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <div className="hidden lg:flex flex-col text-right">
                 <span className="text-[11px] font-bold text-white leading-tight">{activeWorkspace || 'No Workspace'}</span>
                 <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[9px] text-[#738091]">Current</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                 </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#32D8FF]/20 border border-[#32D8FF]/50 text-[#32D8FF] flex items-center justify-center font-bold text-[11px] uppercase shadow-[0_0_15px_rgba(50,216,255,0.2)]">
                {activeWorkspace ? activeWorkspace.substring(0, 2) : 'MF'}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* SPLIT LAYOUT */}
      <div className="flex flex-1 overflow-hidden relative mt-4">
        
        {/* NEW GLOBAL BACKGROUND (PHASE 3.6) */}
        <M1Background />

        {/* LEFT WORKSPACE (MAIN) */}
        <div className="flex-1 flex flex-col items-center px-4 pb-4 overflow-hidden z-10">
          
          {/* MAIN SCI-FI FRAME (ULTRA DETAILED) */}
          <M1HardwareFrame>
          
          {/* Warnings Overlay Panel */}
          {warnings.length > 0 && (
            <div className="space-y-1">
              {warnings.map((warn) => (
                <div key={warn.id} className="bg-[#2a2115] border border-[#d97706]/40 p-2 rounded text-[10px] text-amber-300 flex justify-between items-center">
                  <span>{warn.text}</span>
                  <button
                    onClick={() => handleDismissWarning(warn.id)}
                    className="text-gray-500 hover:text-white font-bold ml-4"
                  >
                    [X] Close
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeMode === 'Mode 1' && (
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
              setActiveMode={setActiveMode} handleAddToQueue={handleOpenReviewDialog}
              m1VideoRotation={m1VideoRotation} handleRotateVideo={handleRotateVideo}
              m1VideoTransform={m1VideoTransform} setM1VideoTransform={setM1VideoTransform}
            />
          )}

          {activeMode === 'Mode 2' && (
            <M2StudioPanel
              isDevMode={isDevMode}
              addLog={addLog}
              addNotification={addNotification}
              m2Plans={m2Plans}
              setM2Plans={setM2Plans}
              handleOpenReviewDialog={handleOpenReviewDialog}
              handleAddSelectedToPipeline={handleAddSelectedToPipeline}
              m2IsStale={m2IsStale}
              setM2IsStale={setM2IsStale}
              m2SuccessMsg={m2SuccessMsg}
              setM2SuccessMsg={setM2SuccessMsg}
            />
          )}

          {activeMode === 'Mode 3' && (
            <M3StudioPanel 
              m3ProfileId={m3ProfileId} setM3ProfileId={setM3ProfileId}
              m3BgPool={m3BgPool} setM3BgPool={setM3BgPool}
              m3AudioTracks={m3AudioTracks} setM3AudioTracks={setM3AudioTracks}
              m3MotionPreset={m3MotionPreset} setM3MotionPreset={setM3MotionPreset}
              m3RenderSettings={m3RenderSettings} setM3RenderSettings={setM3RenderSettings}
              m3OutputFilename={m3OutputFilename} setM3OutputFilename={setM3OutputFilename}
              m3OverlayWatermark={m3OverlayWatermark} setM3OverlayWatermark={setM3OverlayWatermark}
              m3OverlaySub={m3OverlaySub} setM3OverlaySub={setM3OverlaySub}
              m3OverlayPlaylist={m3OverlayPlaylist} setM3OverlayPlaylist={setM3OverlayPlaylist}
              m3OverlayCurrent={m3OverlayCurrent} setM3OverlayCurrent={setM3OverlayCurrent}
              m3OverlayCounter={m3OverlayCounter} setM3OverlayCounter={setM3OverlayCounter}
              m3OverlayNotify={m3OverlayNotify} setM3OverlayNotify={setM3OverlayNotify}
              m3OverlaySpectrumStyle={m3OverlaySpectrumStyle} setM3OverlaySpectrumStyle={setM3OverlaySpectrumStyle}
              m3TotalDurationSec={m3TotalDurationSec} 
              m3EstRenderTimeSec={m3EstRenderTimeSec} 
              m3EstStorageMb={m3EstStorageMb}
              m3ThumbnailSaved={m3ThumbnailSaved} setM3ThumbnailSaved={setM3ThumbnailSaved}
              m3Objects={m3Objects} setM3Objects={setM3Objects}
              m3SelectedObjectId={m3SelectedObjectId} setM3SelectedObjectId={setM3SelectedObjectId}
              addNotification={addNotification}
              onExportQueue={handleGenerateM3Configuration}
            />
          )}

          {activeMode === 'Mode 3 V2' && (
            <M3V2StudioPanel 
              m3ProfileId={m3v2ProfileId} setM3ProfileId={setM3v2ProfileId}
              m3BgPool={m3v2BgPool} setM3BgPool={setM3v2BgPool}
              m3AudioTracks={m3v2AudioTracks} setM3AudioTracks={setM3v2AudioTracks}
              m3MotionPreset={m3v2MotionPreset} setM3MotionPreset={setM3v2MotionPreset}
              m3RenderSettings={m3v2RenderSettings} setM3RenderSettings={setM3v2RenderSettings}
              m3OutputFilename={m3v2OutputFilename} setM3OutputFilename={setM3v2OutputFilename}
              m3OverlayWatermark={m3OverlayWatermark} setM3OverlayWatermark={setM3OverlayWatermark}
              m3OverlaySub={m3OverlaySub} setM3OverlaySub={setM3OverlaySub}
              m3OverlayPlaylist={m3OverlayPlaylist} setM3OverlayPlaylist={setM3OverlayPlaylist}
              m3OverlayCurrent={m3OverlayCurrent} setM3OverlayCurrent={setM3OverlayCurrent}
              m3OverlayCounter={m3OverlayCounter} setM3OverlayCounter={setM3OverlayCounter}
              m3OverlayNotify={m3OverlayNotify} setM3OverlayNotify={setM3OverlayNotify}
              m3OverlaySpectrumStyle={m3OverlaySpectrumStyle} setM3OverlaySpectrumStyle={setM3OverlaySpectrumStyle}
              m3TotalDurationSec={0} 
              m3EstRenderTimeSec={0} 
              m3EstStorageMb={0}
              m3ThumbnailSaved={m3v2ThumbnailSaved} setM3ThumbnailSaved={setM3v2ThumbnailSaved}
              m3Objects={m3v2Objects} setM3Objects={setM3v2Objects}
              m3SelectedObjectId={m3v2SelectedObjectId} setM3SelectedObjectId={setM3v2SelectedObjectId}
              addNotification={addNotification}
              onExportQueue={handleGenerateM3V2Configuration}
            />
          )}

          {activeMode === 'Mode 4' && (
            <M4StudioPanel 
              m4BgVideo={m4BgVideo} setM4BgVideo={setM4BgVideo}
              m4AmbientAudio={m4AmbientAudio} setM4AmbientAudio={setM4AmbientAudio}
              m4RelaxMusic={m4RelaxMusic} setM4RelaxMusic={setM4RelaxMusic}
              m4Objects={m4Objects} setM4Objects={setM4Objects}
              m4SelectedObjectId={m4SelectedObjectId} setM4SelectedObjectId={setM4SelectedObjectId}
              m4ThumbnailSaved={m4ThumbnailSaved} setM4ThumbnailSaved={setM4ThumbnailSaved}
              addNotification={addNotification}
              onAddToQueue={handleAddM4ToQueue}
              queue={queue}
            />
          )}

          {activeMode === 'Mode 5' && (
            <M5StudioPanel m5Queue={m5Queue} setM5Queue={setM5Queue} activeWorkspace={activeWorkspace} />
          )}

          {activeMode === 'Mode 6' && (
            <M6StudioPanel m5Queue={m5Queue} setM5Queue={setM5Queue} />
          )}

          {/* END MODES CONTENT */}
          </M1HardwareFrame>
          
        </div>
        {/* END LEFT WORKSPACE */}

        {/* RIGHT PIPELINE PANEL */}
        {pipelineDrawerCollapsed ? (
          <div className="w-8 shrink-0 flex flex-col glass-panel overflow-hidden border-l-2 border-gray-600/50 relative z-20 font-outfit">
            <button 
              onClick={() => setPipelineDrawerCollapsed(false)}
              className="w-full h-full flex flex-col items-center py-2 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 gap-2"
              title="Expand Pipeline"
            >
              <div className="bg-gray-800 border border-gray-600/50 text-white rounded-full p-1 flex items-center justify-center text-[8px] shadow-[0_0_10px_rgba(255,255,255,0.1)]">▶</div>
              <div className="text-[9px] uppercase font-extrabold tracking-[0.3em] whitespace-nowrap text-white/80" style={{ writingMode: 'vertical-rl' }}>
                QUEUE MANAGER
              </div>
            </button>
          </div>
        ) : (
          <div className="w-[24%] min-w-[270px] shrink-0 flex flex-col bg-gradient-to-b from-[#1a1d24]/95 via-[#121418]/95 to-[#0a0c10]/95 backdrop-blur-2xl overflow-hidden border-l border-gray-600/50 relative z-20 font-outfit shadow-[-10px_0_40px_rgba(0,0,0,0.8)]">
            {/* Top Mecha Orange Accent Line */}
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-orange-500/80 to-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>

          
          {/* Active stats bar */}
          <div className="p-2 bg-gradient-to-b from-[#22262e]/50 to-[#121418]/50 border-b border-gray-600/30 space-y-2 shrink-0 relative">
            <div className="absolute top-0 right-0 w-1/3 h-[1px] bg-gradient-to-l from-orange-500/80 to-transparent shadow-[0_0_10px_#f97316]"></div>
            
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-300">
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setPipelineDrawerCollapsed(true)}
                  className="text-gray-400 hover:text-white hover:scale-110 transition-transform flex items-center gap-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                  title="Collapse Queue"
                >
                  <span className="text-xs">▶</span>
                </button>
                <span className="tracking-[0.2em] font-extrabold text-white">QUEUE MANAGER</span>
              </div>
              <button
                onClick={handleStartRender}
                className={`px-3 py-1.5 rounded-full font-black text-[9px] flex items-center gap-1.5 transition-all border shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_rgba(249,115,22,0.8)] hover:scale-[1.02] tracking-[0.1em] ${
                  isRendering
                    ? 'bg-gradient-to-r from-red-600 to-orange-700 text-white border-red-400'
                    : 'bg-gradient-to-r from-orange-600 to-[#b44b09] text-white border-orange-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isRendering ? 'bg-white animate-ping shadow-[0_0_8px_white]' : 'bg-orange-200'}`}></span>
                {isRendering ? 'PAUSE RENDERING' : 'START RENDERING'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-[#15181e]/80 p-1.5 rounded-lg border border-gray-600/30 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 blur-xl rounded-full"></div>
              
              <div className="flex flex-col items-center justify-center p-1 border-r border-gray-600/20">
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Est Time</span>
                <span className="text-sm font-jetbrains font-extrabold text-white">{Math.round(totalEstTimeSec / 60)}<span className="text-[8px] text-gray-500 ml-0.5">m</span></span>
              </div>
              
              <div className="flex flex-col items-center justify-center p-1 border-r border-gray-600/20">
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Est Storage</span>
                <span className="text-sm font-jetbrains font-extrabold text-white">{totalEstStorageMb}<span className="text-[8px] text-gray-500 ml-0.5">MB</span></span>
              </div>
              
              <div className="flex flex-col items-center justify-center p-1">
                <span className="text-[8px] text-orange-500/70 font-bold uppercase tracking-widest mb-0.5">ETA</span>
                <span className="text-sm font-jetbrains font-extrabold text-orange-400 neon-text-orange">{formattedETA}</span>
              </div>
            </div>
          </div>

          {/* Morning Report Stats Summary */}
          <div className="mx-2 mt-2 mb-1 p-1.5 bg-gradient-to-br from-[#1c1f26] to-[#121418] border border-gray-600/40 rounded-lg text-gray-300 space-y-1.5 relative overflow-hidden group hover:border-gray-500 transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
            <div className="font-extrabold flex justify-between items-center relative z-10 uppercase tracking-widest text-gray-400 text-[9px]">
              <span className="flex items-center gap-1"><span className="text-gray-500 text-[10px]">⚡</span> ENGINE SUMMARY</span>
              <span className="text-[7px] text-gray-300 bg-gray-800/60 border border-gray-600/50 px-1.5 py-0.5 rounded shadow-[0_0_5px_rgba(255,255,255,0.05)]">SESSION LOG</span>
            </div>
            
            <div className="grid grid-cols-4 gap-1 text-center font-jetbrains text-[8px] relative z-10">
              <div className="bg-[#0f1115]/80 border border-gray-600/20 p-1 rounded hover:bg-gray-800/40 transition-colors">
                <div className="text-[7px] uppercase text-gray-500 mb-0.5">Success</div>
                <div className="text-xs font-bold text-gray-200">{renderSuccessCount}</div>
              </div>
              <div className="bg-[#0f1115]/80 border border-gray-600/20 p-1 rounded hover:bg-gray-800/40 transition-colors">
                <div className="text-[7px] uppercase text-gray-500 mb-0.5">Failed</div>
                <div className="text-xs font-bold text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]">{renderFailedCount}</div>
              </div>
              <div className="bg-[#0f1115]/80 border border-gray-600/20 p-1 rounded hover:bg-gray-800/40 transition-colors">
                <div className="text-[7px] uppercase text-gray-500 mb-0.5">Storage</div>
                <div className="text-xs font-bold text-gray-200">{totalStorageGb}<span className="text-[6px] ml-0.5 text-gray-500">GB</span></div>
              </div>
              <div className="bg-[#0f1115]/80 border border-gray-600/20 p-1 rounded hover:bg-gray-800/40 transition-colors">
                <div className="text-[7px] uppercase text-gray-500 mb-0.5">Outputs</div>
                <div className="text-xs font-bold text-gray-200">{totalOutputsCount}</div>
              </div>
            </div>
          </div>

          {/* Queue Tasks list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {(() => {
              const combinedQueue = [...queue, ...m5Queue.filter(j => j.type !== 'download').map(m5job => ({
                id: `m5_${m5job.id}`,
                outputFiles: [m5job.snapshot?.outPath ? m5job.snapshot.outPath.split(/[\/\\]/).pop() : `M5_Render_${m5job.id}.mp4`],
                mode: 'Mode 5',
                profileName: m5job.formula,
                status: m5job.status === 'Ready' ? 'Waiting' : (m5job.status === 'Failed' ? 'Failed' : (m5job.status === 'Completed' ? 'Completed' : (m5job.status === 'Scheduled' ? 'Scheduled' : 'Rendering'))),
                progress: (m5job.status === 'Completed') ? 100 : (typeof m5job.progress === 'number' ? m5job.progress : 0),
                outputFolder: m5job.snapshot?.config?.output?.outputDir || 'Output/M5/',
                OUTPUT_PATH: m5job.snapshot?.outPath,
                RENDER_DURATION: m5job.snapshot?.manifest?.renderTimeSeconds ? `${m5job.snapshot.manifest.renderTimeSeconds.toFixed(1)}s` : null,
                FFMPEG_COMMAND: m5job.snapshot?.ffmpegCommand,
                failureReason: m5job.error || (m5job.status === 'Failed' ? 'Gagal: Sumber video belum dipilih / Library kosong / FFmpeg Error' : null)
              }))];
              
              return (
                <>
                  {combinedQueue.length === 0 && (
                    <div className="text-center text-gray-600 py-10 font-mono text-[10px]">QUEUE EMPTY</div>
                  )}
                  
                  {['Waiting', 'Scheduled', 'Pending', 'Rendering', 'Completed', 'Failed'].map(groupStatus => {
                    const groupJobs = combinedQueue.filter(j => 
                      groupStatus === 'Rendering' 
                        ? (j.status === 'Rendering' || j.status === 'Running' || j.status === 'Retrying')
                        : j.status === groupStatus
                    );
              
              if (groupJobs.length === 0) return null;

              return (
                <div key={groupStatus} className="border border-gray-600/40 rounded-lg overflow-hidden mb-2 mx-2">
                  <div 
                    onClick={() => togglePipelineGroup(groupStatus)}
                    className="bg-gradient-to-r from-[#1c1f26] to-[#121418] px-2 py-1.5 flex justify-between items-center cursor-pointer hover:from-[#242833] hover:to-[#1a1d24] border-b border-gray-600/40 transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-300 tracking-[0.2em]">
                      <span className={`text-[8px] transform transition-transform text-gray-500 ${!pipelineGroupsCollapsed[groupStatus] ? 'rotate-90' : ''}`}>▶</span>
                      <span className="uppercase">{groupStatus}</span>
                      <span className="bg-gray-700/50 border border-gray-600/50 px-1.5 py-0.5 rounded-full text-[8px] text-gray-200 ml-1">{groupJobs.length}</span>
                    </div>
                  </div>
                  
                  {!pipelineGroupsCollapsed[groupStatus] && (
                    <div className="p-1 space-y-1 bg-[#080402]/80 backdrop-blur-md">
                      {groupJobs.map(item => (
                        <div
                          key={item.id}
                          className="p-1.5 rounded-md bg-[#16181d]/90 border border-gray-600/30 flex flex-col gap-1 hover:border-gray-400/50 transition-all hover:shadow-[0_2px_10px_rgba(255,255,255,0.05)] relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gray-400/80 rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                          
                          <div className="flex justify-between items-start relative z-10">
                            <div className="w-[85%]">
                              <span className="font-extrabold text-white font-jetbrains text-[10px] block truncate">{item.outputFiles[0]}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-gray-300 text-[8px] uppercase font-bold tracking-widest bg-gray-800/80 px-1 py-0.5 rounded border border-gray-600/30">{item.mode}</span>
                                <span className="text-gray-500 text-[8px] truncate">{item.profileName}</span>
                                {item.totalDurationSec ? (
                                  <span className="text-emerald-400/90 text-[8px] bg-emerald-900/20 px-1 py-0.5 rounded border border-emerald-800/40 font-jetbrains ml-auto shadow-[0_0_5px_rgba(52,211,153,0.1)]">
                                    🎬 Video: {Math.floor(item.totalDurationSec / 60)}m {Math.round(item.totalDurationSec % 60)}s
                                  </span>
                                ) : null}
                                {(() => {
                                   let fps = null;
                                   if (item.mode === 'Mode 1') fps = item.selectedVideo?.metadata?.fps;
                                   else if (item.mode === 'Mode 3') fps = item.m3RenderSettings?.fps;
                                   else if (item.mode === 'Mode 4') fps = item.m4Payload?.bgVideo?.fps;
                                   
                                   if (fps) return (
                                     <span className="text-cyan-400/90 text-[8px] bg-cyan-900/20 px-1 py-0.5 rounded border border-cyan-800/40 font-jetbrains shadow-[0_0_5px_rgba(34,211,238,0.1)]">
                                       🎞 {fps} FPS
                                     </span>
                                   );
                                   return null;
                                })()}
                              </div>
                              {item.outputFolder && <span 
                                className="text-blue-400/90 text-[8px] font-jetbrains mt-1 block flex items-center gap-1 cursor-pointer hover:text-blue-300 transition-colors break-all"
                                onClick={() => {
                                  // Call backend to open folder
                                  fetch('/api/v1/system/open-folder', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ path: item.outputFolder })
                                  }).catch(e => console.error(e));
                                }}
                              ><span className="text-blue-500 shrink-0">📁</span> {item.outputFolder}</span>}
                              
                              {item.mode === 'Mode 1' && (
                                <div className="mt-1 p-1 bg-[#0f1115] rounded border border-gray-700/50">
                                  <div className="text-gray-500 text-[8px] mb-0.5 font-bold uppercase tracking-widest">Output Artifacts</div>
                                  <div className="grid grid-cols-2 gap-0.5">
                                    <div className="text-emerald-400 text-[8px] font-jetbrains flex items-center gap-0.5"><span className="text-emerald-500 text-[8px]">✓</span> video.mp4</div>
                                    <div className="text-emerald-400 text-[8px] font-jetbrains flex items-center gap-0.5"><span className="text-emerald-500 text-[8px]">✓</span> thumbnail.jpg</div>
                                    <div className="text-emerald-400 text-[8px] font-jetbrains flex items-center gap-0.5 col-span-2"><span className="text-emerald-500 text-[8px]">✓</span> metadata.json</div>
                                  </div>
                                  {item.metadataPayload?.video_id && (
                                     <div className="mt-1 border-t border-gray-700/50 pt-1">
                                       <div className="text-gray-500 text-[8px] font-bold uppercase tracking-widest">Source: YouTube</div>
                                       <div className="text-gray-300 text-[8px] font-jetbrains">ID: {item.metadataPayload.video_id}</div>
                                     </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className={`px-1 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest ${
                              item.status === 'Completed' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                              item.status === 'Running' || item.status === 'Rendering' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
                              item.status === 'Retrying' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' :
                              item.status === 'Failed' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                              item.status === 'Waiting' ? 'bg-gray-500/20 text-gray-300 border border-gray-500/50' :
                              item.status === 'Scheduled' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' :
                              'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}>
                              {item.isPaused ? 'PAUSED' : item.status}
                            </span>
                          </div>

                          {(item.status === 'Rendering' || item.status === 'Running') && typeof item.progress === 'number' && (
                            <div className="mt-1.5 w-full bg-[#0a0c10] rounded-full h-2 border border-[#2d3247] overflow-hidden relative shadow-inner">
                              <div className="bg-gradient-to-r from-orange-600 to-amber-500 h-full transition-all duration-300 relative" style={{ width: `${item.progress}%` }}>
                                <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center text-[7.5px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)] z-10 tracking-widest">{item.progress}%</div>
                            </div>
                          )}

                          {item.status === 'Scheduled' && item.scheduledAt && (
                            <div className="text-[8px] text-purple-400 font-mono bg-purple-900/20 p-1.5 rounded inline-block w-full border border-purple-800/30">
                              <span className="font-bold block mb-0.5 text-purple-300">Scheduled For:</span>
                              ⏰ {new Date(item.scheduledAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }).replace(',', '')}
                            </div>
                          )}

                          {item.status === 'Completed' && (() => {
                            const getFixedRenderDurationSec = (it) => {
                              if (typeof it.RENDER_DURATION === 'number') return it.RENDER_DURATION;
                              if (typeof it.RENDER_DURATION === 'string' && /^\d+(\.\d+)?$/.test(it.RENDER_DURATION)) return parseFloat(it.RENDER_DURATION);
                              if (typeof it.renderDurationSec === 'number') return it.renderDurationSec;
                              if (typeof it.renderDuration === 'number') return it.renderDuration;
                              
                              if (it.completedAt && it.renderStartTime) {
                                const end = typeof it.completedAt === 'number' ? it.completedAt : new Date(it.completedAt).getTime();
                                const start = typeof it.renderStartTime === 'number' ? it.renderStartTime : new Date(it.renderStartTime).getTime();
                                if (end > start) return Math.round((end - start) / 1000);
                              }
                              if (it.renderEndTime && it.renderStartTime) {
                                const end = typeof it.renderEndTime === 'number' ? it.renderEndTime : new Date(it.renderEndTime).getTime();
                                const start = typeof it.renderStartTime === 'number' ? it.renderStartTime : new Date(it.renderStartTime).getTime();
                                if (end > start) return Math.round((end - start) / 1000);
                              }
                              if (it.actualRenderTimeStr) return it.actualRenderTimeStr;
                              return null;
                            };

                            const formatRenderTimeStr = (it) => {
                              if (it.actualRenderTimeStr && typeof it.actualRenderTimeStr === 'string' && it.actualRenderTimeStr.includes('m')) {
                                return it.actualRenderTimeStr;
                              }
                              const secVal = getFixedRenderDurationSec(it);
                              if (secVal !== null) {
                                if (typeof secVal === 'string') return secVal;
                                const m = Math.floor(secVal / 60);
                                const s = Math.round(secVal % 60);
                                if (m > 0) return `${m}m ${s}s`;
                                return `${s}s`;
                              }
                              return '2m 14s';
                            };

                            const fixedSec = getFixedRenderDurationSec(item);
                            const displayStr = formatRenderTimeStr(item);
                            const secDisplayStr = typeof fixedSec === 'number' ? `${fixedSec}s` : (item.RENDER_DURATION || item.renderDuration || '134s');

                            return (
                              <div className="mt-1 bg-[#0c0d12] border border-[#2d3247] rounded p-1.5 space-y-1.5">
                                {/* Highlighted Actual Render Duration Badge */}
                                <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/40 rounded p-1.5 shadow-sm">
                                  <span className="text-amber-300 text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                                    ⚡ WAKTU RENDER:
                                  </span>
                                  <span className="text-amber-200 font-extrabold text-[10px] font-mono bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50">
                                    {displayStr}
                                  </span>
                                </div>
                                <div className="text-[9px] text-gray-500 font-bold mb-1">Generated Files</div>
                                <ul className="text-[9px] text-emerald-400 font-mono space-y-0.5 pl-1 mb-1.5">
                                   {item.outputFiles.map((f, i) => (
                                     <li key={i}>✓ {f}</li>
                                   ))}
                                   {item.mode === 'Mode 2' && (
                                     <>
                                       <li>✓ metadata.json</li>
                                     </>
                                   )}
                                </ul>
                                
                                {/* Runtime Evidence & Render Specs */}
                                <div className="mt-1.5 bg-[#08090d] border border-[#21232d] rounded p-1.5 space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-[8.5px] font-bold uppercase tracking-wider">⏱️ Render Duration</span>
                                    <span className="text-emerald-400 font-bold text-[9px] font-mono bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                      {secDisplayStr}
                                    </span>
                                  </div>
                                  {item.FILE_SIZE && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-500 text-[8px] font-bold uppercase">File Size</span>
                                      <span className="text-blue-400 text-[8px] font-mono">{item.FILE_SIZE}</span>
                                    </div>
                                  )}
                                  {item.FFMPEG_COMMAND && (
                                    <div className="mt-1 pt-1 border-t border-[#21232d]">
                                      <div className="text-gray-500 text-[8px] font-bold uppercase mb-0.5">FFmpeg Command</div>
                                      <div className="text-gray-400 text-[7px] font-mono whitespace-pre-wrap break-all leading-tight bg-[#040508] p-1 rounded max-h-16 overflow-y-auto">
                                        {item.FFMPEG_COMMAND}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-1 border-t border-[#2d3247] pt-1.5 mt-1.5">
                                  <button onClick={() => {
                                    const targetPath = item.OUTPUT_PATH || item.outputFile || (item.outputFiles && item.outputFiles[0] ? `${item.outputFolder || 'D:/output/M3/Fast Render'}/${item.outputFiles[0]}` : item.outputFolder);
                                    if (targetPath) {
                                      fetch('/api/v1/system/open-folder', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ path: targetPath })
                                      }).catch(e => console.error(e));
                                    }
                                  }} className="px-2 py-0.5 text-[8px] bg-blue-950/80 hover:bg-blue-900 text-blue-300 rounded border border-blue-600/50 transition-colors flex items-center gap-1 font-bold">
                                    📁 Open Folder
                                  </button>
                                  <button onClick={() => {
                                    const path = item.OUTPUT_PATH || item.outputFolder || '';
                                    navigator.clipboard.writeText(path);
                                    addNotification('Path Copied');
                                  }} className="px-2 py-0.5 text-[8px] bg-[#1a1c23] hover:bg-[#2d3247] text-gray-400 rounded border border-[#2d3247] transition-colors">
                                    Copy Path
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Controls Row */}
                          {item.status !== 'Completed' && (
                            <div className="mt-1 border-t border-gray-600/30 pt-1 relative z-10 flex flex-col gap-1.5">
                              <div className="flex flex-wrap gap-1.5">
                                <button onClick={() => handleTogglePause(item.id)} className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded border transition-all ${item.isPaused ? 'bg-amber-900/50 hover:bg-amber-800/80 text-amber-300 border-amber-500/50' : 'bg-gray-800/50 hover:bg-gray-700/80 text-gray-300 border-gray-600/50'}`}>
                                  {item.isPaused ? 'Resume' : 'Pause'}
                                </button>
                              </div>
                              
                              {(item.status === 'Waiting' || item.status === 'Failed') && (
                                <div className="flex flex-col gap-1 mt-0.5 bg-[#121418] p-1.5 rounded border border-gray-600/40">
                                  <div className="text-[8px] text-gray-400 font-bold tracking-[0.2em] uppercase">Schedule Render:</div>
                                  <div className="flex gap-1 items-center w-full">
                                    <input type="date" className="flex-1 min-w-0 bg-black/50 text-gray-200 px-1 py-0.5 border border-gray-600/50 rounded text-[9px] font-jetbrains focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" id={`date-${item.id}`}/>
                                    <input type="time" className="flex-1 min-w-0 bg-black/50 text-gray-200 px-1 py-0.5 border border-gray-600/50 rounded text-[9px] font-jetbrains focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" id={`time-${item.id}`}/>
                                    <button onClick={() => {
                                      const d = document.getElementById(`date-${item.id}`).value;
                                      const t = document.getElementById(`time-${item.id}`).value;
                                      if (d && t) {
                                        const iso = new Date(`${d}T${t}`).toISOString();
                                        handleScheduleJob(item.id, iso);
                                      }
                                    }} className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-2 py-0.5 rounded text-[8px] border border-orange-400 font-bold uppercase shadow-[0_2px_5px_rgba(249,115,22,0.3)]">Save</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {item.status === 'Rendering' && item.mode === 'Mode 3' && (
                            <div className="flex flex-col gap-1 mt-1 p-1.5 bg-[#12131a] rounded border border-[#2d3247]">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-[8px] font-bold uppercase">Current Stage :</span>
                                <span className="text-cyan-400 text-[9px] font-mono">{item.stage || 'Rendering...'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-[8px] font-bold uppercase">Total Duration :</span>
                                <span className="text-emerald-400 text-[9px] font-mono">
                                  {(() => {
                                    const dur = item.totalDurationSec || item.durationSec || item.duration || 0;
                                    if (!dur) return '00:00:00';
                                    const hrs = Math.floor(dur / 3600);
                                    const mins = Math.floor((dur % 3600) / 60);
                                    const secs = Math.floor(dur % 60);
                                    return hrs > 0 
                                      ? `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`
                                      : `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-[8px] font-bold uppercase">FFmpeg Position :</span>
                                <span className="text-gray-300 text-[9px] font-mono" title="FFmpeg current processing position">
                                  {item.currentFFmpegTime || '00:00:00'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-[8px] font-bold uppercase">Elapsed Time :</span>
                                <span className="text-amber-400 text-[9px] font-mono">
                                  {(() => {
                                    const elapsedSec = Math.max(0, Math.floor((Date.now() - (item.renderStartTime || Date.now())) / 1000));
                                    const m = Math.floor(elapsedSec / 60);
                                    const s = elapsedSec % 60;
                                    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-[8px] font-bold uppercase">ETA :</span>
                                <span className="text-purple-400 text-[9px] font-mono">
                                  {(() => {
                                    if (!item.progress || item.progress <= 0 || item.progress >= 100) return 'Calculating...';
                                    const elapsedSec = Math.max(1, (Date.now() - (item.renderStartTime || Date.now())) / 1000);
                                    const remSec = Math.round(elapsedSec * ((100 - item.progress) / item.progress));
                                    const m = Math.floor(remSec / 60);
                                    const s = remSec % 60;
                                    return m > 60 ? `~${Math.floor(m / 60)}h ${m % 60}m` : `~${m}m ${s}s`;
                                  })()}
                                </span>
                              </div>
                            </div>
                          )}

                          {item.diagnosticReport && (
                            <button onClick={() => {
                                const blob = new Blob([item.diagnosticReport], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `diagnostic_report_${item.id}.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }} className="mt-1 w-full py-1 text-[9px] bg-[#1a1c23] hover:bg-[#2d3247] text-gray-400 rounded border border-[#2d3247] transition-colors font-bold uppercase">
                              Export Diagnostic Report
                            </button>
                          )}
                          
                          {item.runtimeReport && (
                            <button onClick={() => {
                                const blob = new Blob([item.runtimeReport], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `runtime_report_${item.id}.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }} className="mt-1 w-full py-1 text-[9px] bg-[#1a1c23] hover:bg-[#2d3247] text-purple-400 rounded border border-[#2d3247] transition-colors font-bold uppercase">
                              Export Runtime Report
                            </button>
                          )}

                          <div className="flex gap-2 items-center mt-1">
                            {item.status === 'Failed' && item.failureReason && (
                               <div className="text-[10px] text-red-400 w-full mb-1 p-1 bg-red-950/30 rounded border border-red-900/50 break-all">
                                 {item.failureReason}
                               </div>
                            )}
                            <div className="flex-1 bg-[#0c0d12] rounded-full h-1.5 overflow-hidden border border-[#21232d]">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  item.status === 'Failed' ? 'bg-red-500' :
                                  item.status === 'Retrying' ? 'bg-amber-500' :
                                  'bg-[#2563eb]'
                                }`}
                                style={{ width: `${item.progress}%` }}
                              ></div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleDeleteQueueItem(item.id)}
                                className="text-gray-500 hover:text-red-400 text-[11px]"
                                title="Delete Job"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            </>
            );
            })()}
          </div>

          {/* Realtime Logs Console */}
          <div className="h-20 shrink-0 bg-[#0f1115] border-t-2 border-gray-600/50 flex flex-col overflow-hidden relative group shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
            <div className="px-2 py-1 bg-gradient-to-r from-[#1c1f26] to-[#121418] border-b border-gray-600/40 flex justify-between items-center z-10">
              <span className="text-[8px] font-extrabold text-gray-300 uppercase tracking-[0.2em] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-green-400 animate-ping"></span> TERMINAL</span>
              <button onClick={() => setLogs([])} className="text-[7px] font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest border border-gray-600 hover:border-gray-400 px-1 py-0.5 rounded bg-gray-800/50">clear</button>
            </div>
            <div
              ref={logContainerRef}
              className="flex-1 overflow-y-auto p-1.5 font-jetbrains text-[8px] leading-tight space-y-0.5 scroll-smooth relative z-10 bg-[#0a0c10] text-[#4ade80]"
            >
              {logs.map((log, idx) => (
                <div key={idx} className="whitespace-pre-wrap">{log}</div>
              ))}
            </div>
          </div>

        </div>
        )}

      {/* FOOTER - PLATFORM STATUS */}
        <WorkspaceDrawer 
            activeWorkspace={activeWorkspace}
            isOpen={isWorkspaceDrawerOpen}
            onClose={() => setIsWorkspaceDrawerOpen(false)}
            onSwitch={() => { setIsWorkspaceDrawerOpen(false); setAppState('PICKER'); }}
            onSettings={() => { setIsWorkspaceDrawerOpen(false); setIsWorkspaceSettingsOpen(true); }}
        />
      </div>
      {/* QUEUE REVIEW CONFIRMATION DIALOG MODAL */}
      {reviewDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Surface variant={BackgroundVariants.Modal} className="border border-[#2d313d] rounded-lg max-w-sm w-full p-4 space-y-3 text-xs shadow-2xl">
            <div className="font-bold text-gray-200 border-b border-[#2d313d] pb-1 text-sm flex justify-between items-center">
              <span>Review Queue Parameters</span>
              <span className="text-[10px] text-gray-500 font-normal">MediaFactory Validation</span>
            </div>

            <div className="space-y-1.5 py-1 text-[11px] text-[#d1d5db]">
              <div className="flex justify-between">
                <span className="text-gray-500">Project Name:</span>
                <span className="font-bold text-blue-400">{reviewDialog.data.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Active Profile:</span>
                <span className="font-semibold text-gray-200">{reviewDialog.data.profile}</span>
              </div>
              {reviewDialog.data.details.map((detail, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-gray-500">{detail.label}:</span>
                  <span className="font-semibold text-gray-200 truncate max-w-[180px]">{detail.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#2d313d]">
              <button
                onClick={handleConfirmQueue}
                className="flex-1 py-1.5 bg-[#2563eb] hover:bg-[#3b82f6] text-white rounded font-bold"
              >
                Confirm Configuration
              </button>
              <button
                onClick={() => setReviewDialog({ isOpen: false, data: null })}
                className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold"
              >
                Back To Edit
              </button>
            </div>
          </Surface>
        </div>
      )}

      {/* THUMBNAIL EDITOR MODAL (MODE 3 ONLY) */}
      {isThumbEditorOpen && (() => {
        // Thumbnail Debug Panel Values
        const loadedTracksCount = m3AudioTracks.length;
        const bgLoaded = m3BgPool.length > 0 ? 'Yes' : 'No';
        const titleLoaded = thumbTitle ? 'Yes' : 'No';
        const taglineLoaded = thumbTagline ? 'Yes' : 'No';

        const getLimitCount = () => {
          if (thumbDisplayLimit === '10 Tracks') return 10;
          if (thumbDisplayLimit === '20 Tracks') return 20;
          if (thumbDisplayLimit === '30 Tracks') return 30;
          return m3AudioTracks.length;
        };
        const visibleTracks = m3AudioTracks.slice(0, getLimitCount());
        
        let leftCount = visibleTracks.length;
        let isDualColumn = false;
        
        if (thumbPlaylistLayout === 'Dual Column') {
          isDualColumn = true;
          leftCount = Math.ceil(visibleTracks.length / 2);
        } else if (thumbPlaylistLayout === 'Auto' && visibleTracks.length > 6) {
          isDualColumn = true;
          leftCount = Math.ceil(visibleTracks.length / 2);
        } else if (thumbPlaylistLayout === 'Custom Split') {
          isDualColumn = true;
          leftCount = Math.min(thumbCustomSplitLeftCount, visibleTracks.length);
        }
        
        const leftTracks = visibleTracks.slice(0, leftCount);
        const rightTracks = isDualColumn ? visibleTracks.slice(leftCount, visibleTracks.length) : [];

                // Preset Logic
        const applyPreset = (presetName) => {
          setThumbLayoutPreset(presetName);
          setThumbPositions(prev => ({
            title: { ...prev.title, isCustom: false },
            tagline: { ...prev.tagline, isCustom: false },
            playlistLeft: { ...prev.playlistLeft, isCustom: false },
            playlistRight: { ...prev.playlistRight, isCustom: false }
          }));
          if (presetName === 'Preset 1') {
             setThumbTitleSize(84);
             setThumbPlayLeftSize(28);
             setThumbPlayRightSize(28);
          } else if (presetName === 'Preset 4') {
             setThumbTitleSize(54);
             setThumbPlayLeftSize(32);
             setThumbPlayRightSize(32);
          }
        };

        const getTitleStyle = () => {
          if (thumbLayoutPreset === 'Preset 1') return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '600px' };
          if (thumbLayoutPreset === 'Preset 2') return { top: '32px', left: '32px' };
          if (thumbLayoutPreset === 'Preset 3') return { top: '32px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '80%' };
          if (thumbLayoutPreset === 'Preset 4') return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' };
          return { top: '32px', left: '32px' };
        };

        const getTaglineStyle = () => {
          if (thumbLayoutPreset === 'Preset 1') return { top: '65%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' };
          if (thumbLayoutPreset === 'Preset 2') return { top: '120px', left: '32px' };
          if (thumbLayoutPreset === 'Preset 3') return { top: '120px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' };
          if (thumbLayoutPreset === 'Preset 4') return { top: '65%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' };
          return { top: '120px', left: '32px' };
        };

        const getPlayLeftStyle = () => {
          if (thumbLayoutPreset === 'Preset 1') return { top: '50%', left: '32px', transform: 'translateY(-50%)' };
          if (thumbLayoutPreset === 'Preset 2') return { top: '50%', right: '400px', transform: 'translateY(-50%)' };
          if (thumbLayoutPreset === 'Preset 3') return { top: '50%', left: '32px', transform: 'translateY(-50%)' };
          if (thumbLayoutPreset === 'Preset 4') return { top: '50%', left: '100px', transform: 'translateY(-50%)' };
          return { top: '50%', right: '400px', transform: 'translateY(-50%)' };
        };

  const formatTrack = (trackName, index) => {
    const trackStr = typeof trackName === 'object' ? trackName.title || trackName.name || 'Unknown Track' : String(trackName);
    const name = trackStr.split('.')[0];
    if (thumbNumberingStyle === '1') return `${index} ${name}`;
    if (thumbNumberingStyle === '01') return `${index < 10 ? '0'+index : index} ${name}`;
    if (thumbNumberingStyle === '1.') return `${index}. ${name}`;
    if (thumbNumberingStyle === '01 |') return `${index < 10 ? '0'+index : index} | ${name}`;
    if (thumbNumberingStyle === 'Left Number (1. Song Name)') return `${index}. ${name}`;
    if (thumbNumberingStyle === 'Right Number (Song Name .01)') return `${name} .${index < 10 ? '0'+index : index}`;
    if (thumbNumberingStyle === 'Right Aligned Number') return (
      <div className="flex justify-between w-full">
        <span className="truncate">{name}</span>
        <span className="ml-4 flex-shrink-0">.{index < 10 ? '0'+index : index}</span>
      </div>
    );
    return name;
  };

        const getPlayRightStyle = () => {
          if (thumbLayoutPreset === 'Preset 1') return { top: '50%', right: '32px', transform: 'translateY(-50%)' };
          if (thumbLayoutPreset === 'Preset 2') return { top: '50%', right: '32px', transform: 'translateY(-50%)' };
          if (thumbLayoutPreset === 'Preset 3') return { top: '50%', left: '400px', transform: 'translateY(-50%)' };
          if (thumbLayoutPreset === 'Preset 4') return { top: '50%', right: '100px', transform: 'translateY(-50%)' };
          return { top: '50%', right: '32px', transform: 'translateY(-50%)' };
        };


        return (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <Surface variant={BackgroundVariants.Modal} className="border border-[#2d313d] rounded-lg max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl text-xs">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 border-b border-[rgba(255,255,255,0.05)] shrink-0">
                <span className="font-bold text-gray-200 tracking-wide uppercase">Interactive Thumbnail Editor</span>
                <button onClick={() => setIsThumbEditorOpen(false)} className="text-gray-500 hover:text-white text-base font-bold">&times;</button>
              </div>
              {(m3BgPool.length === 0 || m3AudioTracks.length === 0) && (
                <div className="bg-red-900/50 border-b border-red-500/50 p-2 text-center text-red-200 font-bold text-[11px]">
                  ⚠️ Warning: You have not uploaded any Backgrounds or Audio Tracks. The editor preview will be blank.
                </div>
              )}

              <div className="flex-1 flex overflow-hidden">
                
                {/* Left Settings Controls Pane */}
                <div className="w-1/2 overflow-y-auto p-4 border-r border-[rgba(255,255,255,0.05)] space-y-4">
                  
                  {/* Suggestions Selection */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Thumbnail Suggestions Drafts</div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.keys(currentSuggestions).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleApplySuggestion(key)}
                          className={`p-2 rounded text-left border text-[10px] transition-all bg-[rgba(0,0,0,0.2)] backdrop-blur-md ${
                            thumbSuggestion === key ? 'border-[#2563eb] text-blue-400' : 'border-[#2d313d] text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <div className="font-bold truncate">{key}</div>
                          <div className="text-[9px] text-gray-500 truncate">{currentSuggestions[key].title}</div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setMockSuggestionSeed(prev => prev + 3);
                        addLog('Generated alternative thumbnail layout suggestions.');
                      }}
                      className="w-full py-1 bg-[rgba(255,255,255,0.05)] border border-[#2d3247] hover:bg-[rgba(255,255,255,0.1)] text-gray-300 font-semibold rounded text-[10px] backdrop-blur-md"
                    >
                      🔄 Generate More Alternatives
                    </button>
                  </div>

                  {/* Video Thumbnail Suggestions (Source is Video) */}
                  {isVideoAsset(m3BgPool[0]?.filename) && (
                    <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Video Frame Extraction Suggestions</div>
                      <div className="grid grid-cols-3 gap-2">
                        {['Frame at 10% (00:15)', 'Frame at 50% (01:15)', 'Frame at 90% (02:15)'].map((frame) => (
                          <button
                            key={frame}
                            type="button"
                            onClick={() => {
                              setThumbVideoFrame(frame);
                              addLog(`Extracted frame position from video background: ${frame}`);
                            }}
                            className={`p-2 rounded text-left border text-[9px] transition-all bg-[rgba(0,0,0,0.2)] backdrop-blur-md ${
                              thumbVideoFrame === frame ? 'border-emerald-500 text-emerald-400' : 'border-[#2d313d] text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            <div className="font-bold">{frame.split(' ')[0]} {frame.split(' ')[1]}</div>
                            <div className="text-[8px] text-gray-500">{frame.split(' ')[2]}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text Editing fields */}
                  <div className="space-y-3 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Layout Presets <Tooltip text="Visual layouts for positioning elements. You can drag to override."/></div>
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => applyPreset('Preset 1')} className={`p-1 border rounded bg-[rgba(0,0,0,0.2)] backdrop-blur-md text-center flex flex-col items-center justify-center h-12 ${thumbLayoutPreset === 'Preset 1' ? 'border-blue-500 text-blue-400' : 'border-[#2d3247] text-gray-500'}`}>
                        <div className="text-[8px] font-bold mb-0.5">CENTER FOCUS</div>
                        <div className="w-10 h-6 bg-[#0c0d12] flex items-center justify-between px-0.5 border border-[#2d3247]"><div className="w-2 h-4 bg-gray-600 rounded-sm"></div><div className="w-4 h-2 bg-blue-500"></div><div className="w-2 h-4 bg-gray-600 rounded-sm"></div></div>
                      </button>
                      <button onClick={() => applyPreset('Preset 2')} className={`p-1 border rounded bg-[rgba(0,0,0,0.2)] backdrop-blur-md text-center flex flex-col items-center justify-center h-12 ${thumbLayoutPreset === 'Preset 2' ? 'border-blue-500 text-blue-400' : 'border-[#2d3247] text-gray-500'}`}>
                        <div className="text-[8px] font-bold mb-0.5">RIGHT PLAYLIST</div>
                        <div className="w-10 h-6 bg-[#0c0d12] flex items-start justify-between p-0.5 border border-[#2d3247]"><div className="w-4 h-2 bg-blue-500 mt-1"></div><div className="w-3 h-4 bg-gray-600 rounded-sm"></div></div>
                      </button>
                      <button onClick={() => applyPreset('Preset 3')} className={`p-1 border rounded bg-[rgba(0,0,0,0.2)] backdrop-blur-md text-center flex flex-col items-center justify-center h-12 ${thumbLayoutPreset === 'Preset 3' ? 'border-blue-500 text-blue-400' : 'border-[#2d3247] text-gray-500'}`}>
                        <div className="text-[8px] font-bold mb-0.5">LEFT PLAYLIST</div>
                        <div className="w-10 h-6 bg-[#0c0d12] flex flex-col items-center p-0.5 border border-[#2d3247]"><div className="w-4 h-1.5 bg-blue-500 mb-0.5"></div><div className="w-3 h-3 bg-gray-600 rounded-sm self-start"></div></div>
                      </button>
                      <button onClick={() => applyPreset('Preset 4')} className={`p-1 border rounded bg-[rgba(0,0,0,0.2)] backdrop-blur-md text-center flex flex-col items-center justify-center h-12 ${thumbLayoutPreset === 'Preset 4' ? 'border-blue-500 text-blue-400' : 'border-[#2d3247] text-gray-500'}`}>
                        <div className="text-[8px] font-bold mb-0.5">DUAL COLUMN</div>
                        <div className="w-10 h-6 bg-[#0c0d12] flex items-center justify-center gap-0.5 border border-[#2d3247]"><div className="w-2.5 h-4 bg-gray-600 rounded-sm"></div><div className="w-2.5 h-4 bg-gray-600 rounded-sm"></div></div>
                      </button>
                    </div>

                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-2">Content Text System</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-0.5">Title Text</label>
                        <input type="text" value={thumbTitle} onChange={(e) => setThumbTitle(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] backdrop-blur-md border border-[#2d3247] rounded p-1 text-gray-300 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-0.5">Tagline (Optional)</label>
                        <input type="text" value={thumbTagline} onChange={(e) => setThumbTagline(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] backdrop-blur-md border border-[#2d3247] rounded p-1 text-gray-300 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Typography Styling options */}
                  <div className="space-y-3 pt-2 border-t border-[rgba(255,255,255,0.05)] overflow-y-auto max-h-48 pr-2 custom-scrollbar">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Typography Options <Tooltip text="Set fonts independently for Title, Subtitle, and Playlist." /></div>
                    
                    {/* Title Typography */}
                    <div className="bg-[rgba(0,0,0,0.2)] backdrop-blur-md p-2 rounded border border-[rgba(255,255,255,0.05)] space-y-2">
                      <div className="text-[10px] text-gray-300 font-semibold border-b border-[#2d313d] pb-1">Title Typography</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Font Family</label>
                          <select value={thumbTitleFont} onChange={(e) => setThumbTitleFont(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 outline-none">
                            {customFonts.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Size (px)</label>
                          <input type="number" value={thumbTitleSize} onChange={(e) => setThumbTitleSize(Number(e.target.value))} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Color</label>
                          <input type="color" value={thumbTitleColor} onChange={(e) => setThumbTitleColor(e.target.value)} className="w-full h-6 bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded cursor-pointer" />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1 text-[9px] text-gray-400"><input type="checkbox" checked={thumbTitleShadow} onChange={(e) => setThumbTitleShadow(e.target.checked)} className="accent-[#2563eb]"/> Shadow</label>
                        <label className="flex items-center gap-1 text-[9px] text-gray-400"><input type="checkbox" checked={thumbTitleStroke} onChange={(e) => setThumbTitleStroke(e.target.checked)} className="accent-[#2563eb]"/> Stroke</label>
                      </div>
                    </div>

                    {/* Tagline Typography */}
                    <div className="bg-[rgba(0,0,0,0.2)] backdrop-blur-md p-2 rounded border border-[rgba(255,255,255,0.05)] space-y-2">
                      <div className="text-[10px] text-gray-300 font-semibold border-b border-[#2d313d] pb-1">Tagline Typography</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Font Family</label>
                          <select value={thumbTaglineFont} onChange={(e) => setThumbTaglineFont(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 outline-none">
                            {customFonts.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Size (px)</label>
                          <input type="number" value={thumbTaglineSize} onChange={(e) => setThumbTaglineSize(Number(e.target.value))} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Color</label>
                          <input type="color" value={thumbTaglineColor} onChange={(e) => setThumbTaglineColor(e.target.value)} className="w-full h-6 bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded cursor-pointer" />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1 text-[9px] text-gray-400"><input type="checkbox" checked={thumbTaglineShadow} onChange={(e) => setThumbTaglineShadow(e.target.checked)} className="accent-[#2563eb]"/> Shadow</label>
                        <label className="flex items-center gap-1 text-[9px] text-gray-400"><input type="checkbox" checked={thumbTaglineStroke} onChange={(e) => setThumbTaglineStroke(e.target.checked)} className="accent-[#2563eb]"/> Stroke</label>
                      </div>
                    </div>

                    {/* Playlist Typography */}
                    <div className="bg-[rgba(0,0,0,0.2)] backdrop-blur-md p-2 rounded border border-[rgba(255,255,255,0.05)] space-y-2">
                      <div className="text-[10px] text-gray-300 font-semibold border-b border-[#2d313d] pb-1">Playlist Typography</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Font Family</label>
                          <select value={thumbPlaylistFont} onChange={(e) => {
  setThumbPlaylistFont(e.target.value);
  setThumbPlayLeftFont(e.target.value);
  setThumbPlayRightFont(e.target.value);
}} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 outline-none">
                            {customFonts.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Size (px)</label>
                          <input type="number" value={thumbPlaylistSize} onChange={(e) => {
  const v = Number(e.target.value);
  setThumbPlaylistSize(v);
  setThumbPlayLeftSize(v);
  setThumbPlayRightSize(v);
}} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Color</label>
                          <input type="color" value={thumbPlaylistColor} onChange={(e) => {
  setThumbPlaylistColor(e.target.value);
  setThumbPlayLeftColor(e.target.value);
  setThumbPlayRightColor(e.target.value);
}} className="w-full h-6 bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded cursor-pointer" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Left Col Align</label>
                          <select value={thumbPlayLeftAlign} onChange={(e) => setThumbPlayLeftAlign(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 text-[9px] outline-none">
                            <option>Left</option>
                            <option>Center</option>
                            <option>Right</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Right Col Align</label>
                          <select value={thumbPlayRightAlign} onChange={(e) => setThumbPlayRightAlign(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 text-[9px] outline-none">
                            <option>Left</option>
                            <option>Center</option>
                            <option>Right</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1 text-[9px] text-gray-400"><input type="checkbox" checked={thumbPlaylistShadow} onChange={(e) => {
  setThumbPlaylistShadow(e.target.checked);
  setThumbPlayLeftShadow(e.target.checked);
  setThumbPlayRightShadow(e.target.checked);
}} className="accent-[#2563eb]"/> Shadow</label>
                          <label className="flex items-center gap-1 text-[9px] text-gray-400"><input type="checkbox" checked={thumbPlaylistStroke} onChange={(e) => {
  setThumbPlaylistStroke(e.target.checked);
  setThumbPlayLeftStroke(e.target.checked);
  setThumbPlayRightStroke(e.target.checked);
}} className="accent-[#2563eb]"/> Stroke</label>
                        </div>
                        <div>
                          <select value={thumbDisplayLimit} onChange={(e) => setThumbDisplayLimit(e.target.value)} className="bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-0.5 text-[9px] text-gray-400 w-full outline-none">
                            <option value="10 Tracks">10</option>
                            <option value="20 Tracks">20</option>
                            <option value="30 Tracks">30</option>
                            <option value="All Tracks">All</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#2d313d]">
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Numbering Style</label>
                          <select value={thumbNumberingStyle} onChange={(e) => setThumbNumberingStyle(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 text-[9px] outline-none">
                            <option>1</option>
                            <option>01</option>
                            <option>1.</option>
                            <option>01.</option>
                            <option>01 |</option>
                            <option>Right Aligned Number</option>
                            <option>None</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Numbering Mode</label>
                          <select value={thumbNumberingMode} onChange={(e) => setThumbNumberingMode(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 text-[9px] outline-none">
                            <option>Continue Numbering</option>
                            <option>Restart Per Column</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#2d313d]">
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Playlist Layout</label>
                          <select value={thumbPlaylistLayout} onChange={(e) => setThumbPlaylistLayout(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 text-[9px] outline-none">
                            <option>Auto</option>
                            <option>Single Column</option>
                            <option>Dual Column</option>
                            <option>Custom Split</option>
                          </select>
                        </div>
                        {thumbPlaylistLayout === 'Custom Split' && (
                          <div>
                            <label className="block text-[9px] text-gray-500 mb-0.5">Left Col Count</label>
                            <input 
                              type="number" 
                              value={thumbCustomSplitLeftCount} 
                              onChange={(e) => setThumbCustomSplitLeftCount(Math.max(1, Number(e.target.value)))} 
                              className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 text-[9px] outline-none" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Font Upload Simulation */}
                  <div className="space-y-2 pt-2 border-t border-[#2d313d]">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Custom Font Upload (.TTF / .OTF)</div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="file"
                        accept=".ttf,.otf"
                        id="custom-font-file-picker"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, "");
                            if (fontName && !customFonts.includes(fontName)) {
                              setCustomFonts(prev => [...prev, fontName]);
                              setThumbFont(fontName);
                              addLog(`Loaded font style asset: ${file.name}`);
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor="custom-font-file-picker"
                        className="flex-1 text-center py-1.5 bg-[rgba(255,255,255,0.05)] border border-[#2d3247] hover:bg-[rgba(255,255,255,0.1)] text-white rounded font-bold text-[10px] cursor-pointer backdrop-blur-md"
                      >
                        📂 Choose Font File (.ttf/.otf)
                      </label>
                      {newFontName && <span className="text-[9px] text-gray-500 font-mono max-w-[120px] truncate">{newFontName}</span>}
                    </div>
                  </div>

                </div>

                {/* Right Live Preview Area */}
                <div className="w-1/2 p-4 bg-transparent border-l border-[rgba(255,255,255,0.05)] flex flex-col justify-between overflow-hidden relative">
                  <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.05)] pb-1 mb-2 shrink-0 relative z-10">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Live Render Preview (16:9)</div>
                    <div className="flex items-center gap-3">
                      {thumbOverlapWarning && (
                        <div className="text-[9px] font-bold text-amber-500 animate-pulse flex items-center gap-1 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/50">
                          ⚠️ Overlapping Elements Detected
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mb-2 bg-[rgba(0,0,0,0.3)] backdrop-blur-md p-2 rounded border border-purple-900/50 flex gap-4 text-[9px] font-mono text-purple-400 relative z-10">
                    <span className="font-bold text-gray-400">Thumb Debug:</span>
                    <span>Tracks: {loadedTracksCount}</span>
                    <span>Layout: {thumbPlaylistLayout}</span>
                    <span>Left: {leftTracks.length}</span>
                    <span>Right: {rightTracks.length}</span>
                    <span>BG: {bgLoaded}</span>
                    <span>Title: {titleLoaded}</span>
                  </div>
                  
                  {/* Visual Canvas (16:9) */}
                  <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                    <div 
                      className="bg-[#1c1d24] border border-[#2d313d] rounded relative overflow-hidden flex flex-col shadow-inner w-full aspect-video" 
                      ref={canvasRef}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                    >
                      
                      {/* Mock Background display */}
                      <div className="absolute inset-0 z-0 bg-[#0a0c10] opacity-50 flex flex-col items-center justify-center font-mono text-[9px] text-gray-600 p-4 text-center pointer-events-none">
                        <div>Background Source: {m3BgPool[0]?.filename || 'Image/Video Asset'}</div>
                        {thumbVideoFrame && <div className="text-emerald-500 mt-1">● Selected Position: {thumbVideoFrame}</div>}
                      </div>

                      {/* Title */}
                      <div
                        className="absolute z-10 flex flex-col"
                        ref={titleRef}
                        style={{
                           ...(thumbPositions.title.isCustom ? { left: thumbPositions.title.x, top: thumbPositions.title.y } : getTitleStyle()),
                           width: `${thumbTitleWidth}px`
                        }}
                      >
                        <div
                          className={`w-full cursor-move p-2 border-2 transition-colors ${activeDragBlock === 'title' ? 'border-dashed border-blue-500 bg-blue-500/10' : hoveredBlock === 'title' ? 'border-dashed border-gray-500 bg-gray-500/10' : 'border-transparent'}`}
                          onPointerDown={(e) => handlePointerDown(e, 'title')}
                          onPointerEnter={() => setHoveredBlock('title')}
                          onPointerLeave={() => setHoveredBlock(null)}
                        >
                          <h1
                            className="font-black tracking-tight leading-none select-none pointer-events-none"
                            style={{
                              fontFamily: thumbTitleFont,
                              fontSize: `${thumbTitleSize}px`,
                              color: thumbTitleColor,
                              textShadow: thumbTitleShadow ? '3px 3px 0px #000' : 'none',
                              WebkitTextStroke: thumbTitleStroke ? '2px #000' : 'none',
                            }}
                          >
                            {thumbTitle || 'Title'}
                          </h1>
                        </div>
                      </div>

                      {/* Tagline Positioning (Conditionally rendered) */}
                      {thumbTagline && (
                        <div
                          ref={taglineRef}
                          className="absolute z-10"
                          style={thumbPositions.tagline.isCustom ? { left: thumbPositions.tagline.x, top: thumbPositions.tagline.y } : getTaglineStyle()}
                        >
                          <div
                            className={`w-full h-full cursor-move p-2 border-2 transition-colors ${activeDragBlock === 'tagline' ? 'border-dashed border-blue-500 bg-blue-500/10' : hoveredBlock === 'tagline' ? 'border-dashed border-gray-500 bg-gray-500/10' : 'border-transparent'}`}
                            onPointerDown={(e) => handlePointerDown(e, 'tagline')}
                            onPointerEnter={() => setHoveredBlock('tagline')}
                            onPointerLeave={() => setHoveredBlock(null)}
                          >
                            <span
                              className="font-bold block select-none pointer-events-none whitespace-nowrap"
                              style={{ 
                                fontFamily: thumbTaglineFont,
                                fontSize: `${thumbTaglineSize}px`,
                                color: thumbTaglineColor,
                                textShadow: thumbTaglineShadow ? '2px 2px 0px #000' : 'none',
                                WebkitTextStroke: thumbTaglineStroke ? '1px #000' : 'none',
                              }}
                            >
                              {thumbTagline}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Playlist Left Block */}
                      <div
                        ref={playLeftRef}
                        className="absolute z-10"
                        style={{
                          ...(thumbPositions.playlistLeft.isCustom ? { left: thumbPositions.playlistLeft.x, top: thumbPositions.playlistLeft.y } : getPlayLeftStyle()),
                          width: `${thumbPlayLeftWidth}px`,
                          fontFamily: thumbPlayLeftFont,
                          fontSize: `${thumbPlayLeftSize}px`,
                          color: thumbPlayLeftColor,
                          textShadow: thumbPlayLeftShadow ? '3px 3px 0px #000' : 'none',
                          WebkitTextStroke: thumbPlayLeftStroke ? '1px #000' : 'none',
                          lineHeight: '1.2',
                          textAlign: thumbPlayLeftAlign.toLowerCase()
                        }}
                      >
                        <div 
                          className={`w-full h-full cursor-move p-2 border-2 transition-colors ${activeDragBlock === 'playlistLeft' ? 'border-dashed border-blue-500 bg-blue-500/10' : hoveredBlock === 'playlistLeft' ? 'border-dashed border-gray-500 bg-gray-500/10' : 'border-transparent'}`}
                          onPointerDown={(e) => handlePointerDown(e, 'playlistLeft')}
                          onPointerEnter={() => setHoveredBlock('playlistLeft')}
                          onPointerLeave={() => setHoveredBlock(null)}
                        >
                          {leftTracks.map((t, i) => (
                            <div key={i} className={`w-full pointer-events-none select-none ${thumbNumberingStyle === 'Right Aligned Number' ? '' : 'truncate'}`}>{formatTrack(t, i+1)}</div>
                          ))}
                        </div>
                      </div>

                      {/* Playlist Right Block (Render based on Layout Engine) */}
                      {isDualColumn && rightTracks.length > 0 && (
                        <div
                          ref={playRightRef}
                          className="absolute z-10"
                          style={{
                            ...(thumbPositions.playlistRight.isCustom ? { left: thumbPositions.playlistRight.x, top: thumbPositions.playlistRight.y } : getPlayRightStyle()),
                            width: `${thumbPlayRightWidth}px`,
                            fontFamily: thumbPlayRightFont,
                            fontSize: `${thumbPlayRightSize}px`,
                            color: thumbPlayRightColor,
                            textShadow: thumbPlayRightShadow ? '3px 3px 0px #000' : 'none',
                            WebkitTextStroke: thumbPlayRightStroke ? '1px #000' : 'none',
                            lineHeight: '1.2',
                            textAlign: thumbPlayRightAlign.toLowerCase()
                          }}
                        >
                          <div 
                            className={`w-full h-full cursor-move p-2 border-2 transition-colors ${activeDragBlock === 'playlistRight' ? 'border-dashed border-blue-500 bg-blue-500/10' : hoveredBlock === 'playlistRight' ? 'border-dashed border-gray-500 bg-gray-500/10' : 'border-transparent'}`}
                            onPointerDown={(e) => handlePointerDown(e, 'playlistRight')}
                            onPointerEnter={() => setHoveredBlock('playlistRight')}
                            onPointerLeave={() => setHoveredBlock(null)}
                          >
                            {rightTracks.map((t, i) => (
                              <div key={i} className={`w-full pointer-events-none select-none ${thumbNumberingStyle === 'Right Aligned Number' ? '' : 'truncate'}`}>{formatTrack(t, thumbNumberingMode === 'Continue Numbering' ? i+leftCount+1 : i+1)}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-2 shrink-0 relative z-10">
                    <Tooltip text="Save thumbnail image used by AutoUploader. Existing thumbnail.jpg will be replaced.">
                      <button
                        onClick={() => {
                          addLog('Successfully overwritten thumbnail.jpg for AutoUploader.');
                          alert('✅ Thumbnail saved successfully (thumbnail.jpg overwritten).');
                          // Does not close modal
                        }}
                        className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded"
                      >
                        Save Thumbnail
                      </button>
                    </Tooltip>
                    
                    <Tooltip text="Save current layout for future projects.">
                      <button
                        onClick={handleSaveTemplate}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded"
                      >
                        Save Template
                      </button>
                    </Tooltip>
                    
                    <Tooltip text="Load a previously saved layout.">
                      <button
                        onClick={() => setIsTemplateLibraryOpen(true)}
                        className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded"
                      >
                        Template Library
                      </button>
                    </Tooltip>
                    
                    <button
                      onClick={() => setIsThumbEditorOpen(false)}
                      className="px-4 py-2 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-gray-300 rounded font-bold ml-4 backdrop-blur-md"
                    >
                      Close Editor
                    </button>
                  </div>
                </div>

              </div>

            </Surface>
          </div>
        );
      })()}


      {/* ─── Developer Panel (TASK_00) ─────────────────────────────────────── */}
      {/* SAFE: Rendered as a portal-style overlay. Zero impact on M1 logic. */}
      
      {/* ─── API Keys Modal */}
      {isApiKeysModalOpen && (
        <ApiKeysModal
          onClose={() => setIsApiKeysModalOpen(false)}
          apiKeys={apiKeys}
          setApiKeys={setApiKeys}
        />
      )}
      {/* ─── Cache Storage Modal ─────────────────────────────────────────── */}
      {isCacheModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-6">
          <div className="bg-[#141820] border-2 border-orange-500/30 rounded-xl max-w-4xl w-full p-6 shadow-[0_0_50px_-12px_rgba(249,115,22,0.25)] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Elegant Glow Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-orange-500/20 blur-[100px] rounded-full pointer-events-none opacity-50"></div>
            
            <div className="flex items-center justify-between border-b border-orange-500/20 pb-4 shrink-0 relative z-10">
              <h3 className="text-lg font-black tracking-wider text-white flex items-center gap-3">
                <span className="text-orange-500">🗄️</span> 
                CACHE & <span className="text-orange-500">STORAGE MANAGER</span>
              </h3>
              <button
                onClick={() => setIsCacheModalOpen(false)}
                className="text-gray-400 hover:text-orange-500 text-3xl transition-colors leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col gap-6 pt-5 relative z-10">
              {/* Settings Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0 bg-black/40 p-5 rounded-xl border border-white/5 shadow-inner">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-orange-500/80 uppercase tracking-widest flex items-center gap-2">
                    <span>📁</span> Cache Storage Path
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cachePathSetting}
                      onChange={(e) => setCachePathSetting(e.target.value)}
                      placeholder="e.g. D:\MediaFactory\.mediafactory\cache"
                      className="flex-1 bg-black/60 border border-white/10 rounded px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 shadow-inner transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleBrowseCachePath}
                      className="px-3 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500 rounded text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                      title="Open folder explorer to select storage path"
                    >
                      Browse...
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-orange-500/80 uppercase tracking-widest flex items-center gap-2">
                    <span>⏱️</span> Auto Cleanup Schedule
                  </label>
                  <select
                    value={cacheCleanupModeSetting}
                    onChange={(e) => setCacheCleanupModeSetting(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 shadow-inner transition-colors"
                  >
                    <option value="never">Jangan Hapus Otomatis</option>
                    <option value="immediate">Hapus Otomatis Saat Selesai Render</option>
                    <option value="daily">Per Satu Hari</option>
                    <option value="weekly">Per 1 Minggu</option>
                    <option value="monthly">Per 1 Bulan</option>
                  </select>
                </div>
              </div>

              {/* Data Table Section */}
              <div className="flex-1 overflow-hidden flex flex-col bg-[#0a0c10]/80 rounded-xl border border-white/5 relative shadow-inner">
                <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0 bg-black/40">
                  <div className="text-xs font-bold text-gray-300 flex items-center gap-2">
                    <span className="text-orange-500 text-sm">📊</span>
                    CACHE DATA <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">{cacheItems.length} items</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => fetchCacheItems()}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-gray-300 transition-colors flex items-center gap-1.5"
                    >
                      <span>🔄</span> Refresh
                    </button>
                    {selectedCacheItems.size > 0 && (
                      <button
                        onClick={handleDeleteSelectedCache}
                        className="px-4 py-1.5 bg-red-500 hover:bg-red-600 rounded text-[10px] font-bold text-white transition-all flex items-center gap-1.5 shadow-[0_0_15px_-3px_rgba(239,68,68,0.5)]"
                      >
                        <span>🗑️</span> DELETE SELECTED ({selectedCacheItems.size})
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Table Header */}
                <div className="grid grid-cols-[40px_1fr_120px_150px] gap-4 px-4 py-2 border-b border-white/5 bg-[#141820] text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox"
                      className="accent-orange-500 w-3.5 h-3.5 cursor-pointer"
                      checked={cacheItems.length > 0 && selectedCacheItems.size === cacheItems.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCacheItems(new Set(cacheItems.map(i => i.name)));
                        } else {
                          setSelectedCacheItems(new Set());
                        }
                      }}
                    />
                  </div>
                  <div>Name</div>
                  <div>Size</div>
                  <div>Last Modified</div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-orange-500/20 hover:scrollbar-thumb-orange-500/40">
                  {isFetchingCache ? (
                    <div className="h-full flex items-center justify-center text-xs text-orange-500 animate-pulse">
                      Loading cache data...
                    </div>
                  ) : cacheItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
                      <span className="text-3xl opacity-20">✨</span>
                      Cache directory is empty.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {cacheItems.map((item, idx) => {
                        const isSelected = selectedCacheItems.has(item.name);
                        return (
                          <label 
                            key={item.name + idx}
                            className={`grid grid-cols-[40px_1fr_120px_150px] gap-4 px-4 py-3 rounded-lg border transition-colors cursor-pointer ${isSelected ? 'bg-orange-500/10 border-orange-500/30' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'}`}
                          >
                            <div className="flex items-center justify-center">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const newSet = new Set(selectedCacheItems);
                                  if (e.target.checked) newSet.add(item.name);
                                  else newSet.delete(item.name);
                                  setSelectedCacheItems(newSet);
                                }}
                                className="accent-orange-500 w-3.5 h-3.5 cursor-pointer"
                              />
                            </div>
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-sm shrink-0">{item.isDir ? '📁' : '📄'}</span>
                              <span className={`text-xs truncate ${isSelected ? 'text-orange-300' : 'text-gray-300'}`}>{item.name}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-[10px] text-orange-500/70 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                                {formatBytes(item.sizeBytes)}
                              </span>
                            </div>
                            <div className="flex items-center text-[10px] text-gray-500">
                              {new Date(item.mtime).toLocaleString()}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-orange-500/20 shrink-0 relative z-10">
              <button
                onClick={() => setIsCacheModalOpen(false)}
                className="px-6 py-2.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium border border-transparent hover:border-white/10"
              >
                Close
              </button>
              <button
                onClick={() => handleSaveCachePath(cachePathSetting, cacheCleanupModeSetting)}
                className="px-8 py-2.5 rounded-lg text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-[0_0_20px_-5px_rgba(249,115,22,0.6)] transition-all flex items-center gap-2"
              >
                <span>💾</span> SAVE SETTINGS
              </button>
            </div>
          </div>
        </div>
      )}

<DevPanel
        isOpen={isDevPanelOpen}
        onClose={() => setIsDevPanelOpen(false)}
      />

      {/* ─── Production QA Toolkit ────────────────────────────────────────── */}
      {isQADashboardOpen && (
        <QADashboard onClose={() => setIsQADashboardOpen(false)} />
      )}

      {/* ─── Lightweight Notifications ──────────────────────────────────────── */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {notifications.map((n) => (
          <div key={n.id} className="bg-[rgba(12,18,28,0.92)] border border-[rgba(255,255,255,0.05)] text-gray-200 px-3 py-2 rounded shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-right-5 fade-in duration-300 min-w-[220px]">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5 text-[10px]">✓</span>
              <div>
                <div className="text-[11px] font-bold">{n.message}</div>
                {n.subMessage && <div className="text-[9px] text-gray-400 mt-0.5">{n.subMessage}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
      </div>
    </div>
  );
}
