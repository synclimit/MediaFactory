export class CrashRecoveryManager {
    constructor() {
        this.safeMode = false;
        this.autosaveInterval = null;
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.logCrash('Unhandled Error', event.error);
            });
            window.addEventListener('unhandledrejection', (event) => {
                this.logCrash('Unhandled Promise Rejection', event.reason);
            });
        }
    }

    logCrash(type, error) {
        const report = {
            type,
            message: error?.message || String(error),
            stack: error?.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        localStorage.setItem('mf_last_crash_report', JSON.stringify(report));
        localStorage.setItem('mf_safe_mode', 'true');
        console.error('[CrashRecovery] Logged crash', report);
    }

    checkRecovery() {
        const crashed = localStorage.getItem('mf_safe_mode') === 'true';
        if (crashed) {
            this.safeMode = true;
            localStorage.removeItem('mf_safe_mode');
            const report = localStorage.getItem('mf_last_crash_report');
            return {
                recovered: true,
                safeMode: true,
                report: report ? JSON.parse(report) : null
            };
        }
        return { recovered: false, safeMode: false };
    }

    generateDiagnosticPackage(projectState) {
        const system = {
            memory: performance.memory ? performance.memory.usedJSHeapSize : 'Unknown',
            userAgent: navigator.userAgent
        };
        return JSON.stringify({
            system,
            projectState,
            logs: localStorage.getItem('mf_last_crash_report')
        });
    }

    startAutosave(getProjectStateFn, intervalMs = 30000) {
        if (this.autosaveInterval) clearInterval(this.autosaveInterval);
        this.autosaveInterval = setInterval(() => {
            const state = getProjectStateFn();
            localStorage.setItem('mf_autosave', JSON.stringify(state));
            console.log('[CrashRecovery] Autosaved');
        }, intervalMs);
    }

    restoreAutosave() {
        const state = localStorage.getItem('mf_autosave');
        return state ? JSON.parse(state) : null;
    }
}

export const crashRecoveryManager = new CrashRecoveryManager();
