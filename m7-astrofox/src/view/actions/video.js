import create from 'zustand';
import { videoRenderer, player } from 'global';

const initialState = {
  active: false,
  finished: false,
  status: '',
  totalFrames: 0,
  currentFrame: 0,
  lastFrame: 0,
  startTime: 0,
};

const videoStore = create(() => ({ ...initialState }));

try {
  window.__ASTROFOX_VIDEO__ = {
    videoStore,
    startRender,
    stopRender
  };
} catch(e) {}

export function startRender(props) {
  player.stop();

  setTimeout(() => {
    videoRenderer.start(props);
  }, 500);

  videoStore.setState({ ...initialState, active: true });
}

export function stopRender() {
  const { active } = videoStore.getState();

  if (active) {
    videoRenderer.stop();

    videoStore.setState(state => ({ ...state, active: false }));
  }
}

export function updateState(props) {
  videoStore.setState(state => {
    const nextState = { ...state, ...props };
    
    // Broadcast progress directly to MediaFactory Queue Manager
    try {
      if (window.parent && window.parent !== window) {
        const progress = nextState.totalFrames > 0 
          ? Math.round((nextState.currentFrame / nextState.totalFrames) * 100)
          : (nextState.status === 'Rendering audio' ? 85 : (nextState.status === 'Merging audio and video' ? 95 : (nextState.finished ? 100 : 0)));
        
        const isFinished = nextState.finished || nextState.status === 'Finished';
        const isError = nextState.status === 'Error';

        window.parent.postMessage({
          type: 'M7_RENDER_PROGRESS',
          payload: {
            progress: isFinished ? 100 : Math.max(1, progress),
            status: isFinished ? 'Completed' : (isError ? 'Failed' : 'Rendering'),
            currentFrame: nextState.currentFrame || 0,
            totalFrames: nextState.totalFrames || 0,
            stageText: nextState.status || (nextState.totalFrames ? `Frame ${nextState.currentFrame || 0} / ${nextState.totalFrames}` : 'Rendering...')
          }
        }, '*');
      }
    } catch(e) {}

    return nextState;
  });
}

export default videoStore;
