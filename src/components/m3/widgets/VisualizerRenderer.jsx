import React, { useRef, useEffect } from 'react';
import { VisualizerRuntime } from '../../../visualizers/runtime/VisualizerRuntime';
import { visualizerRegistry, categoryRegistry, rendererRegistry } from '../../../visualizers/registry';
import { registerBarsCategory } from '../../../visualizers/categories/bars';
import { registerWavesCategory } from '../../../visualizers/categories/waves';
import { registerCircleCategory } from '../../../visualizers/categories/circle';
import { registerRingCategory } from '../../../visualizers/categories/ring';
import { registerSpiralCategory } from '../../../visualizers/categories/spiral';
import { registerMandalaCategory } from '../../../visualizers/categories/mandala';
import { registerParticleCategory } from '../../../visualizers/categories/particle';
import { registerGalaxyCategory } from '../../../visualizers/categories/galaxy';
import { registerTunnelCategory } from '../../../visualizers/categories/tunnel';
import { registerRibbonCategory } from '../../../visualizers/categories/ribbon';
import { registerDNACategory } from '../../../visualizers/categories/dna';
import { registerGeometryCategory } from '../../../visualizers/categories/geometry';
import { registerNeonCategory } from '../../../visualizers/categories/neon';
import { registerSpeakerCategory } from '../../../visualizers/categories/speaker';
import { registerMatrixCategory } from '../../../visualizers/categories/matrix';
import { registerTerrainCategory } from '../../../visualizers/categories/terrain';
import { registerAbstractCategory } from '../../../visualizers/categories/abstract';
import { registerMinimalCategory } from '../../../visualizers/categories/minimal';
import { registerCinematicCategory } from '../../../visualizers/categories/cinematic';
import { register3DCategory } from '../../../visualizers/categories/3d';
import { registerFluidCategory } from '../../../visualizers/categories/fluid';
import { registerTextCategory } from '../../../visualizers/categories/text';
import { registerRetroCategory } from '../../../visualizers/categories/retro';
import { registerNatureCategory } from '../../../visualizers/categories/nature';
import { registerExperimentalCategory } from '../../../visualizers/categories/experimental';

// Initialize all registries
registerBarsCategory();
registerWavesCategory();
registerCircleCategory();
registerRingCategory();
registerSpiralCategory();
registerMandalaCategory();
registerParticleCategory();
registerGalaxyCategory();
registerTunnelCategory();
registerRibbonCategory();
registerDNACategory();
registerGeometryCategory();
registerNeonCategory();
registerSpeakerCategory();
registerMatrixCategory();
registerTerrainCategory();
registerAbstractCategory();
registerMinimalCategory();
registerCinematicCategory();
register3DCategory();
registerFluidCategory();
registerTextCategory();
registerRetroCategory();
registerNatureCategory();
registerExperimentalCategory();

export default function VisualizerRenderer({ config }) {
    const canvasRef = useRef(null);
    const runtimeRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        
        // 1. Initialize Runtime
        const runtime = new VisualizerRuntime(canvasRef.current, config);
        runtimeRef.current = runtime;
        
        let pluginId = config?.visualizerId || 'bars-classic-vertical';
        
        // Legacy mapping for backward compatibility during transition
        if (!config?.visualizerId && config?.visualizerStyle) {
            const style = config.visualizerStyle;
            if (style === 'Vertical') pluginId = 'bars-classic-vertical';
            if (style === 'Staggered') pluginId = 'bars-staggered-center';
            if (style === 'Mirror') pluginId = 'bars-mirror';
            if (style === 'Split') pluginId = 'bars-split-dual';
            if (style === 'Rounded') pluginId = 'bars-rounded-pill';
        }

        // 2. Load Plugin ONLY if it changed or on mount
        if (runtime.activePlugin?.metadata?.id !== pluginId) {
            runtime.load(pluginId).then(success => {
                if (success) {
                    runtime.start();
                }
            }).catch(err => {
                console.error("Failed to load plugin:", err);
            });
        }

        // 3. Handle resize (Basic, depends on parent)
        const resizeObserver = new ResizeObserver(entries => {
            if (!canvasRef.current || !canvasRef.current.parentElement) return;
            for (let entry of entries) {
                if (entry.target === canvasRef.current.parentElement) {
                    const { width, height } = entry.contentRect;
                    runtime.resize(width, height);
                }
            }
        });

        if (canvasRef.current && canvasRef.current.parentElement) {
            resizeObserver.observe(canvasRef.current.parentElement);
        }

        return () => {
            resizeObserver.disconnect();
            if (runtime) {
                runtime.stop();
                if (runtime.renderer) {
                    runtime.renderer.dispose();
                }
            }
            runtimeRef.current = null;
        };
    }, [config?.visualizerId, config?.visualizerStyle]); // Re-initialize completely if visualizer changes

    // Handle pure config updates without reloading plugin
    useEffect(() => {
        if (runtimeRef.current) {
            runtimeRef.current.setConfig(config);
        }
    }, [config]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (runtimeRef.current) {
                runtimeRef.current.dispose();
                runtimeRef.current = null;
            }
        };
    }, []);

    return (
        <div className="relative flex items-center justify-center overflow-hidden" style={{ width: config.width || 1920, height: config.height || 200 }}>
            <canvas ref={canvasRef} width={config.width || 1920} height={config.height || 200} style={{ display: 'block' }} />
        </div>
    );
}
