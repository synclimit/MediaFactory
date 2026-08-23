import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { player } from 'view/global';
import CanvasAudio from 'canvas/CanvasAudio';
import TimeInfo from 'components/player/TimeInfo';
import useSharedState from 'hooks/useSharedState';
import styles from './ProgressControl.less';

const canvasProperties = {
  width: 854,
  height: 50,
  shadowHeight: 20,
  barWidth: 3,
  barSpacing: 1,
  bars: 213,
};

const initialState = {
  progressPosition: 0,
  seekPosition: 0,
  buffering: false,
};

export default function ProgressControl() {
  const [state, setState] = useSharedState(initialState);
  const { progressPosition, seekPosition, buffering } = state;
  const duration = player.getDuration();
  const disabled = !player.hasAudio();

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);

  const { width, height, shadowHeight } = canvasProperties;

  const [baseCanvas, progressCanvas, seekCanvas] = useMemo(
    () => [
      new CanvasAudio({
        ...canvasProperties,
        color: ['#666666', '#444444'],
        shadowColor: '#222222',
      }, new OffscreenCanvas(width, height + shadowHeight)),
      new CanvasAudio({
        ...canvasProperties,
        color: ['#B6AAFF', '#927FFF'],
        shadowColor: '#554B96',
      }, new OffscreenCanvas(width, height + shadowHeight)),
      new CanvasAudio({
        ...canvasProperties,
        color: ['#8880BF', '#6C5FBF'],
        shadowColor: '#403972',
      }, new OffscreenCanvas(width, height + shadowHeight)),
    ],
    [],
  );

  const loadAudio = useCallback(() => {
    const audio = player.getAudio();
    if (audio && audio.buffer) {
      baseCanvas.render(audio.buffer);
      progressCanvas.render(audio.buffer);
      seekCanvas.render(audio.buffer);
    }
  }, [baseCanvas, progressCanvas, seekCanvas]);

  useEffect(() => {
    const handleAudioChange = () => {
      loadAudio();
      setState({ progressPosition: player.getPosition() || 0, seekPosition: 0 });
    };

    const onTick = () => {
      if (player.isPlaying() && !buffering) {
        setState({ progressPosition: player.getPosition() || 0 });
      }
    };
    const onStop = () => setState({ progressPosition: 0 });
    const handleAudioUnload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
      setState({ progressPosition: 0, seekPosition: 0 });
    };

    player.on('tick', onTick);
    player.on('stop', onStop);
    player.on('audio-load', handleAudioChange);
    player.on('audio-unload', handleAudioUnload);
    player.on('playback-change', handleAudioChange);

    loadAudio();

    return () => {
      player.off('tick', onTick);
      player.off('stop', onStop);
      player.off('audio-load', handleAudioChange);
      player.off('audio-unload', handleAudioUnload);
      player.off('playback-change', handleAudioChange);
    };
  }, [loadAudio, buffering, setState]);

  // Draw native Astrofox AudioWaveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const totalW = canvas.width;
    const totalH = canvas.height;
    const position = (progressPosition || 0) * totalW;
    const seek = (seekPosition || 0) * totalW;
    const sx = seek < position ? seek : position;
    const dx = seek < position ? position - seek : seek - position;

    context.clearRect(0, 0, totalW, totalH);

    // 1. Unplayed audio base
    context.drawImage(
      baseCanvas.getCanvas(),
      position,
      0,
      totalW - position,
      totalH,
      position,
      0,
      totalW - position,
      totalH,
    );

    // 2. Played audio progress
    if (position > 0) {
      context.drawImage(progressCanvas.getCanvas(), 0, 0, position, totalH, 0, 0, position, totalH);
    }

    // 3. Seek / Hover preview
    if (seek > 0) {
      context.drawImage(seekCanvas.getCanvas(), sx, 0, dx, totalH, sx, 0, dx, totalH);
    }
  }, [progressPosition, seekPosition, baseCanvas, progressCanvas, seekCanvas]);

  function getPosFromEvent(e) {
    const container = containerRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  }

  function handleMouseDown(e) {
    if (disabled) return;
    isDraggingRef.current = true;
    const pos = getPosFromEvent(e);
    setState({ seekPosition: pos, progressPosition: pos, buffering: false });
    player.seek(pos);

    let lastSeekTime = 0;
    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const movePos = getPosFromEvent(moveEvent);
      setState({ seekPosition: movePos, progressPosition: movePos, buffering: false });

      const now = performance.now();
      if (now - lastSeekTime > 30) {
        lastSeekTime = now;
        player.seek(movePos);
      }
    };

    const handleMouseUp = (upEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const finalPos = getPosFromEvent(upEvent);
      player.seek(finalPos);
      setState({ progressPosition: finalPos, seekPosition: 0, buffering: false });
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  return (
    <div className={styles.progress}>
      <div
        ref={containerRef}
        className={styles.waveContainer}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          if (!isDraggingRef.current) {
            const pos = getPosFromEvent(e);
            setState({ seekPosition: pos });
          }
        }}
        onMouseLeave={() => {
          if (!isDraggingRef.current) setState({ seekPosition: 0 });
        }}
        style={{ opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <canvas
          ref={canvasRef}
          className={styles.waveCanvas}
          width={width}
          height={height + shadowHeight}
        />
      </div>
      <TimeInfo currentTime={duration * (seekPosition || progressPosition)} totalTime={duration} />
    </div>
  );
}
