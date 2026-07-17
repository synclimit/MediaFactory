export class EngineRegistry {
    static _validators = new Map();

    static register(validatorClass) {
        if (!validatorClass.engineName) {
            console.error("Validator must have static 'engineName' property");
            return;
        }
        this._validators.set(validatorClass.engineName, validatorClass);
    }

    static unregister(engineName) {
        this._validators.delete(engineName);
    }

    static getValidators() {
        return Array.from(this._validators.values());
    }

    static getValidator(engineName) {
        return this._validators.get(engineName);
    }

    static getEngine(engineName) {
        return this.getValidator(engineName);
    }

    static dependencies(engineName) {
        const val = this.getValidator(engineName);
        return val ? (val.dependencies || []) : [];
    }

    static coverage() {
        const vals = this.getValidators();
        const totalExpected = 32; // Assuming 32 is the total engines expected in MediaFactory
        const implemented = vals.length;
        const missing = Math.max(0, totalExpected - implemented);
        return {
            implemented,
            missing,
            totalExpected,
            percentage: totalExpected === 0 ? 0 : Math.round((implemented / totalExpected) * 100)
        };
    }

    static statistics() {
        const vals = this.getValidators();
        const byCategory = {};
        vals.forEach(v => {
            const cat = v.category || 'Core';
            if (!byCategory[cat]) byCategory[cat] = 0;
            byCategory[cat]++;
        });
        return {
            totalRegistered: vals.length,
            byCategory
        };
    }
}
