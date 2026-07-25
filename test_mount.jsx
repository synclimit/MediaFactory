import React from 'react';
import { createRoot } from 'react-dom/client';
import M3FXPresetPanel from './src/components/m3/panels/M3FXPresetPanel';
import { FXPresetController } from './src/fx/preset/FXPresetController';
import AtmosphereEngine from './src/components/m3/engines/AtmosphereEngine';
import FilmFXEngine from './src/components/m3/engines/FilmFXEngine';

try {
  const root = createRoot(document.getElementById('root'));
  root.render(
    <div>
      <M3FXPresetPanel />
      <AtmosphereEngine />
      <FilmFXEngine />
    </div>
  );
  window.__TEST_RESULTS__ = { renderSuccess: true };
} catch(e) {
  window.__TEST_RESULTS__ = { renderSuccess: false, error: e.toString() };
}

try {
  const controller = new FXPresetController();
  if (window.__TEST_RESULTS__) {
    window.__TEST_RESULTS__.controllerSuccess = true;
  }
} catch(e) {
  if (window.__TEST_RESULTS__) {
    window.__TEST_RESULTS__.controllerSuccess = false;
    window.__TEST_RESULTS__.controllerError = e.toString();
  }
}
