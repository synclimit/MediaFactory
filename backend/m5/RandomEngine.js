class RandomEngine {
    constructor() {
        this.seed = 0;
    }

    setSeed(seedStr) {
        this.seed = this._hashString(String(seedStr));
        console.log(`[RandomEngine] Seed set to ${seedStr} (Hash: ${this.seed})`);
    }

    _hashString(str) {
        let h = 0xdeadbeef;
        for(let i = 0; i < str.length; i++)
            h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
        return ((h ^ h >>> 16) >>> 0);
    }

    random() {
        this.seed |= 0; this.seed = this.seed + 0x6D2B79F5 | 0;
        let t = Math.imul(this.seed ^ this.seed >>> 15, 1 | this.seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    choice(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(this.random() * array.length)];
    }

    range(min, max) {
        return min + this.random() * (max - min);
    }

    boolean(probability = 0.5) {
        return this.random() < probability;
    }
}

module.exports = new RandomEngine();
