/**
 * Base class untuk semua error terkait FX Preset
 */
export class FXPresetError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FXPresetError';
    }
}

/**
 * Error saat skema, parameter, atau format preset tidak valid
 */
export class ValidationError extends FXPresetError {
    constructor(message, details = []) {
        super(message);
        this.name = 'ValidationError';
        this.details = details; // List of specific validation failures
    }
}

/**
 * Error saat preset tidak kompatibel dengan engine saat ini
 */
export class CompatibilityError extends FXPresetError {
    constructor(message, requiredVersion, currentVersion) {
        super(message);
        this.name = 'CompatibilityError';
        this.requiredVersion = requiredVersion;
        this.currentVersion = currentVersion;
    }
}
