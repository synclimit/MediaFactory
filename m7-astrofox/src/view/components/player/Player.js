import React from 'react';
import shallow from 'zustand/shallow';
import classNames from 'classnames';
import useApp from 'actions/app';
import VolumeControl from './VolumeControl';
import ProgressControl from './ProgressControl';
import styles from './Player.less';
import PlayButtons from './PlayButtons';
import ToggleButtons from './ToggleButtons';

export default function Player() {
  const [showPlayer] = useApp(state => [state.showPlayer], shallow);

  return (
    <div className={classNames({ [styles.hidden]: !showPlayer })}>
      <div className={styles.player}>
        <PlayButtons />
        <VolumeControl />
        <ProgressControl />
        <ToggleButtons />
        <button
          id="m7-add-to-queue-btn"
          className={styles.queueBtn}
          title="Add to Render Queue / Start Render"
          onClick={() => {
            if (window.m7AddToQueueDirect) window.m7AddToQueueDirect();
          }}
        >
          <svg className={styles.queueIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span>Add to Queue</span>
        </button>
      </div>
    </div>
  );
}
