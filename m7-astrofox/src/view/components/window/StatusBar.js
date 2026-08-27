import React, { useState, useEffect } from 'react';
import { env, renderer } from 'view/global';
import useAppStore from 'actions/app';
import { formatSize } from 'utils/format';
import ZoomControl from 'components/window/ZoomControl';
import styles from './StatusBar.less';

const { APP_VERSION } = env;

export default function StatusBar() {
  return null;
}

function InfoItem({ value }) {
  return <span className={styles.item}>{value}</span>
}
