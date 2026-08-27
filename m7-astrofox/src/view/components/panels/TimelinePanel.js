import React, { useState, useEffect, useRef, useCallback } from 'react';
import { player, events } from 'view/global';
import styles from './TimelinePanel.less';

export default function TimelinePanel() {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [zoom, setZoom] = useState(1.0);
  const [snap, setSnap] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [isTimelineFullWidth, setIsTimelineFullWidth] = useState(false);

  // Dynamic Tracks Order - populated strictly from active workspace elements
  const [tracksOrder, setTracksOrder] = useState([]);
  const [visibility, setVisibility] = useState({});
  const [locked, setLocked] = useState({});

  // Dynamic Draggable & Trimmable Clip Segments for each track
  const [trackClips, setTrackClips] = useState({});
  const [dragInfo, setDragInfo] = useState(null); // { trackKey, clipId, start, end, dur }

  const trackDefsMapRef = useRef({});
  const trackAreaRef = useRef(null);
  const isPlayheadDraggingRef = useRef(false);
  const activeDragRef = useRef(null);

  const formatTimelineTime = (secs) => {
    const s = Math.max(0, secs || 0);
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(ms).padStart(2, '0')}`;
  };

  const updateStateFromWorkspace = useCallback(() => {
    try {
      const stateObj = (typeof window.m7GetTracksState === 'function')
        ? window.m7GetTracksState()
        : {
            playlistTracks: window.playlistTracks || [],
            activeVisualizers: window.activeVisualizers || [],
            activeBackgrounds: window.activeBackgrounds || [],
            activeParticles: window.activeParticles || [],
            activeParticle2s: window.activeParticle2s || [],
            activeBrandingObjects: window.activeBrandingObjects || [],
            activeEffects: window.activeEffects || [],
            activeOverlayObjects: window.activeOverlayObjects || [],
            activeTextObjects: window.activeTextObjects || []
          };

      const plTracks = stateObj.playlistTracks || window.playlistTracks || [];
      const bgTracks = stateObj.activeBackgrounds || window.activeBackgrounds || [];
      const vizTracks = stateObj.activeVisualizers || window.activeVisualizers || [];
      const partTracks = stateObj.activeParticles || window.activeParticles || [];
      const p2Tracks = stateObj.activeParticle2s || window.activeParticle2s || [];
      const brandTracks = stateObj.activeBrandingObjects || window.activeBrandingObjects || [];
      const fxTracks = stateObj.activeEffects || window.activeEffects || [];
      const overlayTracks = stateObj.activeOverlayObjects || window.activeOverlayObjects || [];
      const textTracks = stateObj.activeTextObjects || window.activeTextObjects || [];

      const curTrackIdx = (window.activeSelectedTrackIndex !== undefined && window.activeSelectedTrackIndex >= 0)
        ? window.activeSelectedTrackIndex
        : 0;

      const dur = plTracks[curTrackIdx]?.duration || (player?.getDuration ? player.getDuration() : 60) || 60;
      const validDur = Math.max(1, dur);
      setDuration(validDur);

      if (!isPlayheadDraggingRef.current && player) {
        const cur = player.getCurrentTime ? player.getCurrentTime() : 0;
        setCurrentTime(cur);
      }

      // Check Intro & Outro
      const introObj = p2Tracks.find(p => p && p.type === 'Intro') || brandTracks.find(b => b && b.type === 'Intro');
      const outroObj = p2Tracks.find(p => p && p.type === 'Outro') || brandTracks.find(b => b && b.type === 'Outro');

      let introD = 5;
      let count = 1;
      if (introObj) {
        count = Math.max(1, parseInt(introObj.paragraphCount) || 1);
        const pDur = Math.max(1, parseFloat(introObj.paragraphDuration) || 5);
        introD = (introObj.introStyle === 'Paragraph (Text)') ? (count * pDur) : (parseFloat(introObj.introDuration) || 5);
      }
      const outroD = parseFloat(outroObj?.introDuration) || 5;

      // BUILD DYNAMIC TRACK DEFINITIONS FROM REAL WORKSPACE OBJECTS
      const activeTrackDefs = [];

      // 1. Intro Track
      if (introObj && introObj.visible !== false) {
        activeTrackDefs.push({
          key: 'intro',
          id: introObj.id || 'intro',
          category: 'particle2',
          title: 'Intro',
          icon: '🎬',
          themeClass: styles.clipIntro,
          defaultStart: 0,
          defaultEnd: introD,
          label: `🎬 Intro (${count} Slide • ${introD}s)`
        });
      }

      // 2. Outro Track
      if (outroObj && outroObj.visible !== false) {
        activeTrackDefs.push({
          key: 'outro',
          id: outroObj.id || 'outro',
          category: 'particle2',
          title: 'Outro',
          icon: '🎬',
          themeClass: styles.clipOutro,
          defaultStart: Math.max(0, validDur - outroD),
          defaultEnd: validDur,
          label: `🎬 Outro (${outroD}s)`
        });
      }

      // 3. Visual FX (Post-processing & action effects: e.g. Guncang kamera, Zoom hentak)
      fxTracks.forEach((eff, idx) => {
        if (!eff) return;
        const key = `vfx_${eff.id || idx}`;
        activeTrackDefs.push({
          key,
          id: eff.id || String(idx),
          itemIndex: idx,
          category: 'fx',
          title: eff.name || 'Visual FX',
          icon: '⚡',
          themeClass: styles.clipVfx,
          defaultStart: 0,
          defaultEnd: validDur,
          label: `⚡ ${eff.name || 'Visual FX'}`
        });
      });

      // 4. Text Objects & Typography
      textTracks.forEach((txt, idx) => {
        if (!txt) return;
        const key = `text_${txt.id || idx}`;
        const txtName = txt.name || txt.text || `Text ${idx + 1}`;
        activeTrackDefs.push({
          key,
          id: txt.id || String(idx),
          itemIndex: idx,
          category: 'text',
          title: txtName,
          icon: '✍️',
          themeClass: styles.clipText,
          defaultStart: 0,
          defaultEnd: validDur,
          label: `✍️ ${txt.text || txtName}`
        });
      });

      // 5. Overlays
      overlayTracks.forEach((ov, idx) => {
        if (!ov) return;
        const key = `overlay_${ov.id || idx}`;
        activeTrackDefs.push({
          key,
          id: ov.id || String(idx),
          itemIndex: idx,
          category: 'overlay',
          title: ov.name || ov.type || 'Overlay',
          icon: '🎭',
          themeClass: styles.clipOverlay,
          defaultStart: 0,
          defaultEnd: validDur,
          label: `🎭 ${ov.name || ov.type || 'Overlay'}`
        });
      });

      // 6. Spectrum Visualizers
      vizTracks.forEach((viz, idx) => {
        if (!viz) return;
        const key = `viz_${viz.id || idx}`;
        const vizStart = (introObj && introObj.visible !== false) ? introD : 0;
        const vizName = viz.name || viz.preset || 'Spectrum EQ';
        activeTrackDefs.push({
          key,
          id: viz.id || String(idx),
          itemIndex: idx,
          category: 'visualizer',
          title: vizName,
          icon: '📊',
          themeClass: styles.clipViz,
          defaultStart: vizStart,
          defaultEnd: validDur,
          label: `📊 ${vizName}`
        });
      });

      // 7. 3D Particles
      partTracks.forEach((part, idx) => {
        if (!part) return;
        const key = `part_${part.id || idx}`;
        const pStart = (introObj && introObj.visible !== false) ? introD : 0;
        const pName = part.name || '3D Particles';
        activeTrackDefs.push({
          key,
          id: part.id || String(idx),
          itemIndex: idx,
          category: 'particle',
          title: pName,
          icon: '✨',
          themeClass: styles.clipParticle,
          defaultStart: pStart,
          defaultEnd: validDur,
          label: `✨ ${pName}`
        });
      });

      // 8. Particle 2 (Non-intro/outro)
      p2Tracks.filter(p => p && p.type !== 'Intro' && p.type !== 'Outro').forEach((p2, idx) => {
        const realIdx = p2Tracks.indexOf(p2);
        const itemIdx = (realIdx !== -1 ? realIdx : idx);
        const key = `p2_${p2.id || itemIdx}`;
        const icon = p2.type === 'Watermark' ? '💧' : (p2.type === 'Logo' ? '🛡️' : (p2.type === 'Subscribe' || p2.type === 'Subscribe Animation' ? '🔔' : '💫'));
        activeTrackDefs.push({
          key,
          id: p2.id || String(itemIdx),
          itemIndex: itemIdx,
          category: 'particle2',
          title: p2.name || 'Particle 2',
          icon,
          themeClass: styles.clipParticle2,
          defaultStart: 0,
          defaultEnd: validDur,
          label: `${icon} ${p2.name || 'Particle 2'}`
        });
      });

      // 9. Background
      if (bgTracks.length > 0 && bgTracks[0]) {
        const bgObj = bgTracks[window.activeSelectedBgIndex !== undefined ? window.activeSelectedBgIndex : 0] || bgTracks[0];
        activeTrackDefs.push({
          key: 'bg',
          id: bgObj.id || 'bg',
          category: 'background',
          title: bgObj.name || 'Background',
          icon: '🖼️',
          themeClass: styles.clipBg,
          defaultStart: 0,
          defaultEnd: validDur,
          label: `🖼️ ${bgObj.name || 'Video Background'}`
        });
      }

      // 10. Audio Track
      if (plTracks.length > 0) {
        const songObj = plTracks[curTrackIdx] || plTracks[0];
        activeTrackDefs.push({
          key: 'audio',
          id: songObj.id || 'audio',
          category: 'playlist',
          title: songObj.name || 'Audio Track',
          icon: '🎵',
          themeClass: styles.clipAudio,
          defaultStart: 0,
          defaultEnd: validDur,
          label: `🎵 ${songObj.name || 'Audio Track'}`
        });
      }

      // Store in ref map for fast lookup during row rendering
      const defsMap = {};
      activeTrackDefs.forEach(d => { defsMap[d.key] = d; });
      trackDefsMapRef.current = defsMap;

      const activeKeys = activeTrackDefs.map(d => d.key);

      // Reconcile tracksOrder dynamically:
      // 1. Keep tracks already in tracksOrder that are still active
      // 2. Add newly discovered active tracks
      // 3. Drop any tracks that have been deleted
      setTracksOrder(prevOrder => {
        const preserved = prevOrder.filter(k => activeKeys.includes(k));
        const newlyAdded = activeKeys.filter(k => !preserved.includes(k));
        const nextOrder = [...preserved, ...newlyAdded];

        if (prevOrder.length === nextOrder.length && prevOrder.every((k, i) => k === nextOrder[i])) {
          return prevOrder;
        }
        return nextOrder;
      });

      // Synchronize trackClips for each active track
      setTrackClips(prev => {
        const next = { ...prev };
        let modified = false;

        // Clean up clips for deleted tracks
        Object.keys(next).forEach(k => {
          if (!activeKeys.includes(k)) {
            delete next[k];
            modified = true;
          }
        });

        // Initialize or maintain clips for active tracks
        activeTrackDefs.forEach(def => {
          if (!next[def.key] || next[def.key].length === 0) {
            next[def.key] = [
              {
                id: `${def.key}_clip_0`,
                start: def.defaultStart ?? 0,
                end: def.defaultEnd ?? validDur,
                label: def.label
              }
            ];
            modified = true;
          } else if (next[def.key].length === 1 && !next[def.key][0].userRenamed) {
            if (next[def.key][0].label !== def.label) {
              next[def.key][0] = { ...next[def.key][0], label: def.label };
              modified = true;
            }
          }
        });

        return modified ? next : prev;
      });

      // Initialize visibility and lock defaults for new keys
      setVisibility(prev => {
        let changed = false;
        const next = { ...prev };
        activeKeys.forEach(k => {
          if (next[k] === undefined) {
            next[k] = true;
            changed = true;
          }
        });
        return changed ? next : prev;
      });

      setLocked(prev => {
        let changed = false;
        const next = { ...prev };
        activeKeys.forEach(k => {
          if (next[k] === undefined) {
            next[k] = false;
            changed = true;
          }
        });
        return changed ? next : prev;
      });

      // Ensure selectedTrack points to an active track
      setSelectedTrack(prev => {
        if (prev && activeKeys.includes(prev)) return prev;
        return activeKeys.length > 0 ? activeKeys[0] : null;
      });

    } catch(err) {
      console.warn('[M7 Timeline] Error updating state:', err);
    }
  }, []);

  useEffect(() => {
    updateStateFromWorkspace();

    const onTick = () => {
      if (!isPlayheadDraggingRef.current && player) {
        const cur = player.getCurrentTime ? player.getCurrentTime() : 0;
        setCurrentTime(cur);

        // Real-time CapCut Layer Visibility based on clip segments
        if (tracksOrder.length > 0 && typeof window.m7ToggleTrackVisibility === 'function') {
          tracksOrder.forEach(tKey => {
            const clips = trackClips[tKey] || [];
            if (clips.length > 0 && visibility[tKey] !== false) {
              const isInside = clips.some(c => cur >= c.start && cur <= c.end);
              window.m7ToggleTrackVisibility(tKey, isInside);
            }
          });
        }
      }
    };

    if (player) {
      player.on('tick', onTick);
      player.on('play', updateStateFromWorkspace);
      player.on('pause', updateStateFromWorkspace);
      player.on('stop', updateStateFromWorkspace);
      player.on('audio-load', updateStateFromWorkspace);
      player.on('playback-change', updateStateFromWorkspace);
    }

    // Instant workspace changes notification
    window.addEventListener('m7-workspace-change', updateStateFromWorkspace);

    // Fallback interval polling for external mutations
    const intervalId = setInterval(updateStateFromWorkspace, 300);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('m7-workspace-change', updateStateFromWorkspace);
      if (player) {
        player.off('tick', onTick);
        player.off('play', updateStateFromWorkspace);
        player.off('pause', updateStateFromWorkspace);
        player.off('stop', updateStateFromWorkspace);
        player.off('audio-load', updateStateFromWorkspace);
        player.off('playback-change', updateStateFromWorkspace);
      }
    };
  }, [updateStateFromWorkspace, tracksOrder, trackClips, visibility]);

  // Handle Full Width Timeline toggle
  const toggleTimelineWidth = () => {
    const nextVal = !isTimelineFullWidth;
    setIsTimelineFullWidth(nextVal);
    document.body.classList.toggle('timeline-full-width', nextVal);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  // Handle Expanded Height Timeline toggle
  const toggleTimelineHeight = () => {
    const nextVal = !isTimelineExpanded;
    setIsTimelineExpanded(nextVal);
    document.body.classList.toggle('timeline-expanded-height', nextVal);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  // Seek and update WYSIWYG frame immediately
  const handleSeek = (clientX) => {
    if (!trackAreaRef.current) return;
    const rect = trackAreaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    let targetRatio = x / rect.width;
    let targetTime = targetRatio * duration;

    if (snap) {
      targetTime = Math.round(targetTime);
      targetRatio = targetTime / duration;
    }

    targetRatio = Math.max(0, Math.min(1, targetRatio));
    targetTime = Math.max(0, Math.min(duration, targetTime));

    setCurrentTime(targetTime);

    if (player && player.seek) {
      player.seek(targetRatio);
    }

    if (events && events.emit) {
      events.emit('tick');
      events.emit('render');
    }
  };

  const handlePlayheadPointerDown = (e) => {
    e.preventDefault();
    isPlayheadDraggingRef.current = true;
    handleSeek(e.clientX);

    const onPointerMove = (ev) => {
      if (isPlayheadDraggingRef.current) {
        handleSeek(ev.clientX);
      }
    };

    const onPointerUp = (ev) => {
      if (isPlayheadDraggingRef.current) {
        handleSeek(ev.clientX);
        isPlayheadDraggingRef.current = false;
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // CAPCUT CLIP DRAG & TRIM HANDLERS
  const startClipDrag = (e, trackKey, clip, mode) => {
    e.stopPropagation();
    e.preventDefault();
    if (locked[trackKey]) return;

    setSelectedTrack(trackKey);
    setSelectedClipId(clip.id);

    const startX = e.clientX;
    const origStart = clip.start;
    const origEnd = clip.end;
    const origLen = origEnd - origStart;

    activeDragRef.current = {
      trackKey,
      clipId: clip.id,
      mode,
      startX,
      origStart,
      origEnd,
      origLen
    };

    setDragInfo({
      trackKey,
      clipId: clip.id,
      start: origStart,
      end: origEnd,
      dur: origLen
    });

    const onPointerMove = (ev) => {
      if (!activeDragRef.current || !trackAreaRef.current) return;
      const rect = trackAreaRef.current.getBoundingClientRect();
      const deltaPx = ev.clientX - startX;
      let deltaSec = (deltaPx / rect.width) * duration;

      if (snap) {
        deltaSec = Math.round(deltaSec * 2) / 2; // snap to 0.5s grid
      }

      setTrackClips(prev => {
        const clips = [...(prev[trackKey] || [])];
        const idx = clips.findIndex(c => c.id === clip.id);
        if (idx === -1) return prev;

        const target = { ...clips[idx] };

        if (mode === 'move') {
          let newStart = origStart + deltaSec;
          newStart = Math.max(0, Math.min(duration - origLen, newStart));
          target.start = newStart;
          target.end = newStart + origLen;
        } else if (mode === 'trim-left') {
          let newStart = origStart + deltaSec;
          newStart = Math.max(0, Math.min(origEnd - 0.5, newStart));
          target.start = newStart;
        } else if (mode === 'trim-right') {
          let newEnd = origEnd + deltaSec;
          newEnd = Math.max(origStart + 0.5, Math.min(duration, newEnd));
          target.end = newEnd;
        }

        clips[idx] = target;

        setDragInfo({
          trackKey,
          clipId: clip.id,
          start: target.start,
          end: target.end,
          dur: target.end - target.start
        });

        return { ...prev, [trackKey]: clips };
      });
    };

    const onPointerUp = () => {
      activeDragRef.current = null;
      setDragInfo(null);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (events && events.emit) {
        events.emit('render');
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Toggle Eye Visibility for a track
  const toggleVisibility = (trackKey, e) => {
    e.stopPropagation();
    const newVis = !visibility[trackKey];
    setVisibility(prev => ({ ...prev, [trackKey]: newVis }));

    if (typeof window.m7ToggleTrackVisibility === 'function') {
      window.m7ToggleTrackVisibility(trackKey, newVis);
    }
    setTimeout(updateStateFromWorkspace, 50);
  };

  // Toggle Lock for a track
  const toggleLock = (trackKey, e) => {
    e.stopPropagation();
    const isNowLocked = !locked[trackKey];
    setLocked(prev => ({ ...prev, [trackKey]: isNowLocked }));
    if (isNowLocked) {
      window.m7IsGizmoSelected = false;
      if (typeof window.m7UpdateGizmo === 'function') window.m7UpdateGizmo();
    }
  };

  // Reorder Tracks Up / Down
  const moveTrack = (index, direction, e) => {
    e.stopPropagation();
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= tracksOrder.length) return;

    const newOrder = [...tracksOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[newIndex];
    newOrder[newIndex] = temp;
    setTracksOrder(newOrder);
  };

  // CapCut Split Clip at Current Playhead
  const handleSplitClip = () => {
    if (!selectedTrack) return;
    const splitTime = currentTime;
    setTrackClips(prev => {
      const clips = [...(prev[selectedTrack] || [])];
      const targetIdx = clips.findIndex(c => splitTime > c.start + 0.5 && splitTime < c.end - 0.5);

      if (targetIdx !== -1) {
        const target = clips[targetIdx];
        const baseName = target.label.replace(/\s*\(Part \d+\)/g, '');
        const clip1 = {
          ...target,
          id: `${target.id}_p1_${Date.now()}`,
          end: splitTime,
          label: `${baseName} (Part 1)`
        };
        const clip2 = {
          ...target,
          id: `${target.id}_p2_${Date.now()}`,
          start: splitTime,
          label: `${baseName} (Part 2)`
        };

        clips.splice(targetIdx, 1, clip1, clip2);
        setSelectedClipId(clip2.id);
        return { ...prev, [selectedTrack]: clips };
      }
      return prev;
    });

    if (selectedTrack === 'intro') {
      const intro = window.activeParticle2s?.find(p => p.type === 'Intro') || window.activeBrandingObjects?.find(b => b.type === 'Intro');
      if (intro) {
        const curCount = parseInt(intro.paragraphCount) || 1;
        intro.paragraphCount = Math.min(3, curCount + 1);
        if (typeof window.m7SyncInspectorToBranding === 'function') {
          window.m7SyncInspectorToBranding(intro);
        }
      }
    }
  };

  // Delete Selected Clip Segment or Entire Layer
  const handleDeleteElement = useCallback(() => {
    if (!selectedTrack) return;
    setTrackClips(prev => {
      const clips = prev[selectedTrack] || [];
      if (clips.length > 1 && selectedClipId) {
        const filtered = clips.filter(c => c.id !== selectedClipId);
        return { ...prev, [selectedTrack]: filtered };
      } else {
        if (typeof window.m7DeleteTrackElement === 'function') {
          window.m7DeleteTrackElement(selectedTrack);
        }
        return { ...prev, [selectedTrack]: [] };
      }
    });
    setTimeout(updateStateFromWorkspace, 50);
  }, [selectedTrack, selectedClipId, updateStateFromWorkspace]);

  // Duplicate Selected Clip Segment
  const handleDuplicateElement = () => {
    if (!selectedTrack) return;
    setTrackClips(prev => {
      const clips = [...(prev[selectedTrack] || [])];
      const target = clips.find(c => c.id === selectedClipId) || clips[clips.length - 1];
      if (target) {
        const len = target.end - target.start;
        const newStart = Math.min(duration - len, target.end);
        const clone = {
          ...target,
          id: `${target.id}_dup_${Date.now()}`,
          start: newStart,
          end: Math.min(duration, newStart + len),
          label: `${target.label} (Copy)`
        };
        clips.push(clone);
        setSelectedClipId(clone.id);
        return { ...prev, [selectedTrack]: clips };
      }
      return prev;
    });
  };

  // Keyboard shortcut for Delete key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) {
          return;
        }
        if (selectedTrack) {
          handleDeleteElement();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTrack, handleDeleteElement]);

  const selectCategoryAndTrack = (cat, trackKey) => {
    if (locked[trackKey]) return;
    setSelectedTrack(trackKey);
    if (window.m7SelectCategory) {
      window.m7SelectCategory(cat);
    }
    const def = trackDefsMapRef.current[trackKey];
    if (def) {
      if (def.category === 'fx' && typeof window.m7SelectEffectById === 'function') {
        window.m7SelectEffectById(def.id);
      } else if (def.category === 'text' && typeof window.m7SelectTextByIndex === 'function') {
        window.m7SelectTextByIndex(def.itemIndex);
      } else if (def.category === 'overlay' && typeof window.m7SelectOverlayByIndex === 'function') {
        window.m7SelectOverlayByIndex(def.itemIndex);
      } else if (def.category === 'visualizer' && typeof window.m7SelectVizByIndex === 'function') {
        window.m7SelectVizByIndex(def.itemIndex);
      } else if (def.category === 'particle' && typeof window.m7SelectParticleByIndex === 'function') {
        window.m7SelectParticleByIndex(def.itemIndex);
      } else if (def.category === 'particle2' && typeof window.m7SelectParticle2Object === 'function') {
        window.m7SelectParticle2Object(def.itemIndex);
      }
    }
    if (typeof window.m7UpdateGizmo === 'function') {
      window.m7IsGizmoSelected = true;
      setTimeout(() => {
        if (typeof window.m7UpdateGizmo === 'function') window.m7UpdateGizmo();
      }, 30);
    }
  };

  // Generate ruler tick marks
  const renderRulerTicks = () => {
    const ticks = [];
    const step = duration > 120 ? 10 : (duration > 30 ? 5 : 2);
    const totalTicks = Math.ceil(duration / step);

    for (let i = 0; i <= totalTicks; i++) {
      const t = i * step;
      if (t > duration) break;
      const leftPct = (t / duration) * 100;
      const mins = Math.floor(t / 60);
      const secs = Math.floor(t % 60);
      const label = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      ticks.push(
        <div key={i} className={styles.rulerTick} style={{ left: `${leftPct}%` }}>
          <span>{label}</span>
          <div className={styles.subTick} style={{ left: '50%' }} />
        </div>
      );
    }
    return ticks;
  };

  const playheadPct = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  // Render Track Row with Draggable / Trimmable Clip Blocks
  const renderTrackRow = (trackKey, index) => {
    const isRowLocked = locked[trackKey];
    const isRowHidden = !visibility[trackKey];
    const isTrackSelected = selectedTrack === trackKey;
    const clips = trackClips[trackKey] || [];
    const def = trackDefsMapRef.current[trackKey] || {};

    const title = def.title || trackKey;
    const icon = def.icon || '🎞️';
    const category = def.category || 'fx';
    const themeClass = def.themeClass || styles.clipVfx;

    let clipContent = null;
    if (clips.length === 0) {
      clipContent = (
        <div
          style={{ color: '#475569', fontSize: 10, padding: '0 12px', fontStyle: 'italic', cursor: 'pointer' }}
          onClick={() => selectCategoryAndTrack(category, trackKey)}
        >
          + Add {title} in Studio
        </div>
      );
    } else {
      clipContent = clips.map(clip => {
        const leftPct = (clip.start / duration) * 100;
        const widthPct = Math.max(2, ((clip.end - clip.start) / duration) * 100);
        const isClipSelected = isTrackSelected && selectedClipId === clip.id;
        const isCurrentlyDragged = dragInfo && dragInfo.clipId === clip.id;

        return (
          <div
            key={clip.id}
            className={`${styles.clipBlock} ${themeClass} ${isClipSelected ? styles.clipSelected : ''}`}
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTrack(trackKey);
              setSelectedClipId(clip.id);
              selectCategoryAndTrack(category, trackKey);
            }}
            onPointerDown={(e) => startClipDrag(e, trackKey, clip, 'move')}
          >
            {/* Left Trim Handle */}
            <div
              className={`${styles.trimHandle} ${styles.trimHandleLeft}`}
              title="Drag to trim start time"
              onPointerDown={(e) => startClipDrag(e, trackKey, clip, 'trim-left')}
            />

            <span className={styles.clipLabel}>{clip.label}</span>

            {/* Right Trim Handle */}
            <div
              className={`${styles.trimHandle} ${styles.trimHandleRight}`}
              title="Drag to trim end time"
              onPointerDown={(e) => startClipDrag(e, trackKey, clip, 'trim-right')}
            />

            {/* Floating drag badge */}
            {isCurrentlyDragged && (
              <div className={styles.dragTimeBadge}>
                {formatTimelineTime(clip.start)} → {formatTimelineTime(clip.end)} ({formatTimelineTime(clip.end - clip.start)})
              </div>
            )}
          </div>
        );
      });
    }

    return {
      header: (
        <div
          key={`head_${trackKey}`}
          className={`${styles.headerItem} ${isTrackSelected ? styles.active : ''}`}
          onClick={() => selectCategoryAndTrack(category, trackKey)}
        >
          <div className={styles.trackTitleGroup} title={title}>
            <div className={styles.reorderBtns}>
              <button
                className={styles.reorderBtn}
                title="Pindah ke Atas"
                disabled={index === 0}
                onClick={(e) => moveTrack(index, -1, e)}
              >▲</button>
              <button
                className={styles.reorderBtn}
                title="Pindah ke Bawah"
                disabled={index === tracksOrder.length - 1}
                onClick={(e) => moveTrack(index, 1, e)}
              >▼</button>
            </div>
            <span>{icon} {title}</span>
          </div>

          <div className={styles.headerControls}>
            <button
              className={`${styles.iconBtn} ${isRowHidden ? styles.hidden : ''}`}
              title={isRowHidden ? 'Tampilkan Layer di Layar' : 'Sembunyikan Layer dari Layar'}
              onClick={(e) => toggleVisibility(trackKey, e)}
            >
              {isRowHidden ? '🙈' : '👁️'}
            </button>
            <button
              className={`${styles.iconBtn} ${isRowLocked ? styles.locked : ''}`}
              title={isRowLocked ? 'Buka Kunci' : 'Kunci Track (Cegah Geser Gizmo)'}
              onClick={(e) => toggleLock(trackKey, e)}
            >
              {isRowLocked ? '🔒' : '🔓'}
            </button>
          </div>
        </div>
      ),
      row: (
        <div
          key={`row_${trackKey}`}
          className={`${styles.trackRow} ${isRowLocked ? styles.rowLocked : ''} ${isRowHidden ? styles.rowHidden : ''}`}
        >
          {clipContent}
        </div>
      )
    };
  };

  const renderedTracks = tracksOrder.map((key, idx) => renderTrackRow(key, idx));

  return (
    <div className={`${styles.timelineContainer} ${isTimelineExpanded ? styles.timelineExpanded : ''} ${isTimelineFullWidth ? styles.timelineFullWidth : ''}`}>
      {/* 1. CAPCUT-STYLE TIMELINE ACTION TOOLBAR */}
      <div className={styles.timelineToolbar}>
        <div className={styles.toolGroup}>
          <button
            className={`${styles.toolBtn} ${isTimelineFullWidth ? styles.active : styles.drawerBtn}`}
            title={isTimelineFullWidth ? 'Kembalikan Timeline ke Sisi Kanan' : 'Panjangkan Timeline ke Kiri (Full Width Bawah)'}
            onClick={toggleTimelineWidth}
          >
            <span className={styles.toolIcon}>{isTimelineFullWidth ? '▶' : '◀'}</span>
            <span>{isTimelineFullWidth ? 'Dock' : 'Panjangkan'}</span>
          </button>

          <button
            className={`${styles.toolBtn} ${isTimelineExpanded ? styles.active : styles.drawerBtn}`}
            title={isTimelineExpanded ? 'Kecilkan Tinggi Timeline (220px)' : 'Tinggikan Timeline (360px)'}
            onClick={toggleTimelineHeight}
          >
            <span className={styles.toolIcon}>{isTimelineExpanded ? '⤡' : '⤢'}</span>
            <span>{isTimelineExpanded ? 'Compact' : 'Expand'}</span>
          </button>

          <div className={styles.toolDivider} />

          <button
            className={styles.toolBtn}
            title="Bagi / Potong Klip di Posisi Playhead (Ctrl+B)"
            onClick={handleSplitClip}
            disabled={!selectedTrack}
          >
            <span className={styles.toolIcon}>✂️</span>
            <span>Split</span>
          </button>

          <button
            className={styles.toolBtn}
            title="Hapus Klip / Layer Terpilih (Delete)"
            onClick={handleDeleteElement}
            disabled={!selectedTrack}
          >
            <span className={styles.toolIcon}>🗑️</span>
            <span>Delete</span>
          </button>

          <button
            className={styles.toolBtn}
            title="Duplikat Klip Terpilih"
            onClick={handleDuplicateElement}
            disabled={!selectedTrack}
          >
            <span className={styles.toolIcon}>📋</span>
            <span>Duplicate</span>
          </button>

          <button
            className={`${styles.toolBtn} ${snap ? styles.active : ''}`}
            title="Snap to Grid (Magnet)"
            onClick={() => setSnap(!snap)}
          >
            <span className={styles.toolIcon}>🧲</span>
            <span>Snap</span>
          </button>
        </div>

        <div className={styles.timeBadge}>
          {formatTimelineTime(currentTime)} / {formatTimelineTime(duration)}
        </div>

        <div className={styles.toolGroup}>
          <div className={styles.zoomControl}>
            <span style={{ fontSize: 10, color: '#64748b' }}>🔍</span>
            <input
              type="range"
              className={styles.zoomSlider}
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
            />
          </div>
          <button className={styles.toolBtn} title="Fit to Screen" onClick={() => setZoom(1.0)}>
            <span>⛶ Fit</span>
          </button>
        </div>
      </div>

      {/* 2. TIMELINE MULTI-TRACK WORKSPACE */}
      <div className={styles.timelineBody}>
        {/* Left Track Headers */}
        <div className={styles.trackHeaders}>
          <div className={styles.rulerHeaderCorner}>
            <span>TRACKS</span>
            <span style={{ fontSize: 9, color: '#94a3b8' }}>
              {tracksOrder.length} {tracksOrder.length === 1 ? 'LANE' : 'LANES'}
            </span>
          </div>
          {tracksOrder.length === 0 ? (
            <div style={{ padding: '16px 8px', color: '#475569', fontSize: 10, fontStyle: 'italic', textAlign: 'center' }}>
              No tracks
            </div>
          ) : (
            renderedTracks.map(t => t.header)
          )}
        </div>

        {/* Right Scrollable Tracks Area */}
        <div className={styles.trackAreaWrapper}>
          <div
            ref={trackAreaRef}
            className={styles.trackAreaContent}
            style={{ width: `${100 * zoom}%` }}
            onPointerDown={handlePlayheadPointerDown}
          >
            {/* Interactive Time Ruler */}
            <div className={styles.timeRuler}>
              {renderRulerTicks()}
            </div>

            {/* Red Playhead Line & Interactive Draggable Needle Handle */}
            <div className={styles.playheadLine} style={{ left: `${playheadPct}%` }}>
              <div
                className={styles.playheadHandle}
                title={`Playhead: ${formatTimelineTime(currentTime)}`}
                onPointerDown={handlePlayheadPointerDown}
              />
            </div>

            {/* Tracks Rows in User-Defined Order */}
            {tracksOrder.length === 0 ? (
              <div className={styles.emptyTimelineNotice}>
                <span>No active tracks. Add background, audio, visualizer, or visual effects from the sidebar.</span>
              </div>
            ) : (
              renderedTracks.map(t => t.row)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
