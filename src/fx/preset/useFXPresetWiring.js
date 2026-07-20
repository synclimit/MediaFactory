import { useMemo, useEffect } from 'react';
import { FXPresetDispatcher } from './FXPresetDispatcher.js';
import { FXPresetController } from './FXPresetController.js';
import { useFXPresetStore } from './FXPresetState.js';

export function useFXPresetWiring({
    m3BgPool, setM3BgPool,
    m3Objects, setM3Objects,
    m3Effects, setM3Effects
}) {
    // Inisialisasi dispatcher dan controller sekali saja
    const { dispatcher, controller } = useMemo(() => {
        const _dispatcher = new FXPresetDispatcher();
        const _controller = new FXPresetController(_dispatcher, useFXPresetStore);
        return { dispatcher: _dispatcher, controller: _controller };
    }, []);

    // Effect untuk mendaftarkan dan memelihara handlers 
    // agar selalu menggunakan setter terbaru (closure aman)
    useEffect(() => {
        // 1. Register Background Handler
        dispatcher.registerHandler('Background', (params) => {
            setM3BgPool(prev => {
                if (!prev || prev.length === 0) return prev;
                const newPool = [...prev];
                newPool[0] = {
                    ...newPool[0],
                    props: {
                        ...newPool[0].props,
                        ...params
                    }
                };
                return newPool;
            });
        });

        // 2. Register Visualizer Handler
        dispatcher.registerHandler('Visualizer', (params) => {
            setM3Objects(prev => {
                return prev.map(obj => {
                    if (obj.type === 'visualizer') {
                        return { ...obj, ...params };
                    }
                    return obj;
                });
            });
        });

        // 3. Register Particle Handler
        dispatcher.registerHandler('Particle', (params) => {
            setM3Objects(prev => {
                return prev.map(obj => {
                    // Assuming particles are in m3Objects for this implementation
                    if (obj.type === 'particles') {
                        return { ...obj, ...params };
                    }
                    return obj;
                });
            });
        });

        // 4. Register Subtitle Handler
        dispatcher.registerHandler('Subtitle', (params) => {
            setM3Objects(prev => {
                return prev.map(obj => {
                    if (obj.type === 'subtitle' || obj.type === 'text') {
                        return { ...obj, ...params };
                    }
                    return obj;
                });
            });
        });

        // 5. Register Effects (Global) Handler
        dispatcher.registerHandler('Effects', (params) => {
            // For now, if there's a global effect in m3Objects
            setM3Objects(prev => {
                let updated = false;
                const next = prev.map(obj => {
                    if (obj.type === 'effect') {
                        updated = true;
                        return { ...obj, ...params };
                    }
                    return obj;
                });
                
                // Jika belum ada objek efek, dan preset mencoba mengaplikasikan efek
                if (!updated && params.presetId) {
                    next.push({
                        id: `fx-${Date.now()}`,
                        type: 'effect',
                        presetId: params.presetId,
                        canvasMode: 'composer',
                        visible: true,
                        locked: false,
                        ...params
                    });
                }
                return next;
            });
        });

        // Helper to upsert engine objects
        const upsertEngineObject = (prev, type, params) => {
            let updated = false;
            const next = prev.map(obj => {
                if (obj.type === type) {
                    updated = true;
                    return { ...obj, config: { ...obj.config, ...params } };
                }
                return obj;
            });
            if (!updated && params.enabled) {
                next.push({
                    id: `${type}-${Date.now()}`,
                    type: type,
                    layer: 99, // Render on top
                    config: params
                });
            }
            return next;
        };

        dispatcher.registerHandler('Atmosphere', (params) => setM3Objects(prev => upsertEngineObject(prev, 'engine-atmosphere', params)));
        dispatcher.registerHandler('FilmFX', (params) => setM3Objects(prev => upsertEngineObject(prev, 'engine-filmfx', params)));
        dispatcher.registerHandler('Laser', (params) => setM3Objects(prev => upsertEngineObject(prev, 'engine-laser', params)));
        dispatcher.registerHandler('StageLight', (params) => setM3Objects(prev => upsertEngineObject(prev, 'engine-stagelight', params)));
        dispatcher.registerHandler('LightPulse', (params) => setM3Objects(prev => upsertEngineObject(prev, 'engine-lightpulse', params)));
        dispatcher.registerHandler('ColorGrading', (params) => setM3Objects(prev => upsertEngineObject(prev, 'engine-colorgrading', params)));

    }, [dispatcher, setM3BgPool, setM3Objects, setM3Effects]);

    // Effect untuk registrasi scope (hanya dipanggil saat mount)
    useEffect(() => {
        const store = useFXPresetStore.getState();
        store.registerCategory('Background', true);
        store.registerCategory('Visualizer', true);
        store.registerCategory('Particle', true);
        store.registerCategory('Effects', true);
        store.registerCategory('Subtitle', true);
        store.registerCategory('Atmosphere', true);
        store.registerCategory('FilmFX', true);
        store.registerCategory('Laser', true);
        store.registerCategory('StageLight', true);
        store.registerCategory('LightPulse', true);
        store.registerCategory('ColorGrading', true);
    }, []);

    // Return the controller instance so M3StudioPanel can pass it down
    return controller;
}
