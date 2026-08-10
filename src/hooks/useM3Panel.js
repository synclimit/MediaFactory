import { useState, useEffect, useCallback } from 'react';

/**
 * Generic React Hook for MediaFactory Panels
 * 
 * @param {string} panelName - The specific panel name (e.g. 'background', 'playlist')
 * @param {string} baseRoute - The REST base route (defaults to '/api/v1/m3')
 */
export function useM3Panel(panelName, baseRoute = '/api/v1/m3') {
    const [state, setState] = useState({
        initialized: false,
        loading: false,
        saving: false,
        validating: false,
        refreshing: false,
        dirty: false,
        runtime: null,
        validation: null,
        settings: {},
        capabilities: {},
        error: null,
        _settingsHash: null
    });

    const endpoint = `${baseRoute}/${panelName.toLowerCase()}`;

    const updateState = (updates) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    const handleError = (errorObj, defaultMessage) => {
        const error = errorObj || { code: 'UNKNOWN', message: defaultMessage };
        updateState({ error });
        console.error(`[Panel Error - ${panelName}]`, error);
    };

    const initialize = useCallback(async () => {
        if (!panelName) return;
        updateState({ loading: true, error: null });

        try {
            const res = await fetch(`${endpoint}/initialize`);
            const json = await res.json();

            if (json.success) {
                updateState({
                    initialized: true,
                    loading: false,
                    settings: json.data.settings || {},
                    capabilities: json.data.capabilities || {},
                    runtime: json.data.runtime || {},
                    validation: json.data.validation || null,
                    _settingsHash: json.data.settingsHash,
                    dirty: false
                });
            } else {
                updateState({ loading: false, initialized: true });
                handleError(json.error, 'Initialization failed');
            }
        } catch (e) {
            updateState({ loading: false, initialized: true, error: null });
            console.warn(`[Panel - ${panelName}] Running in local offline mode:`, e.message);
        }
    }, [endpoint, panelName]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    const saveSettings = async (newSettings) => {
        updateState({ saving: true, error: null });

        try {
            const res = await fetch(`${endpoint}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settings: newSettings,
                    settingsHash: state._settingsHash
                })
            });
            const json = await res.json();

            if (json.success) {
                updateState({
                    saving: false,
                    settings: json.data.settings,
                    _settingsHash: json.data.settingsHash,
                    dirty: false // Backend verified save, so it's clean
                });
            } else {
                updateState({ saving: false });
                handleError(json.error, 'Save failed');
            }
        } catch (e) {
            updateState({ saving: false });
            handleError({ code: 'NETWORK_ERROR', message: e.message }, 'Network error during save');
        }
    };

    const validate = async (currentSettings) => {
        updateState({ validating: true, error: null });

        try {
            const res = await fetch(`${endpoint}/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: currentSettings })
            });
            const json = await res.json();

            if (json.success) {
                updateState({ validating: false, validation: json.data.validation });
            } else {
                updateState({ validating: false });
                handleError(json.error, 'Validation request failed');
            }
        } catch (e) {
            updateState({ validating: false });
            handleError({ code: 'NETWORK_ERROR', message: e.message }, 'Network error during validation');
        }
    };

    const refresh = async () => {
        updateState({ refreshing: true, error: null });

        try {
            const res = await fetch(`${endpoint}/refresh`, { method: 'POST' });
            const json = await res.json();

            if (json.success) {
                updateState({
                    refreshing: false,
                    settings: json.data.settings || {},
                    capabilities: json.data.capabilities || {},
                    runtime: json.data.runtime || {},
                    validation: json.data.validation || null,
                    _settingsHash: json.data.settingsHash,
                    dirty: false
                });
            } else {
                updateState({ refreshing: false });
                handleError(json.error, 'Refresh failed');
            }
        } catch (e) {
            updateState({ refreshing: false });
            handleError({ code: 'NETWORK_ERROR', message: e.message }, 'Network error during refresh');
        }
    };

    const fetchRuntime = async () => {
        try {
            const res = await fetch(`${endpoint}/runtime`);
            const json = await res.json();
            if (json.success) {
                updateState({ runtime: json.data.runtime });
            }
        } catch (e) {
            // Background fetch, maybe don't surface hard error unless required
        }
    };

    // React should strictly treat dirty as something only cleared by the backend, 
    // but the local UI can mark it dirty temporarily before calling save.
    const markDirty = (newSettings) => {
        updateState({ settings: newSettings, dirty: true });
    };

    return {
        ...state,
        saveSettings,
        validate,
        refresh,
        fetchRuntime,
        markDirty
    };
}
