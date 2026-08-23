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
      </div>
    </div>
  );
}
