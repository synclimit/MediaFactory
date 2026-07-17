const crypto = require('crypto');

class RandomSystem {
    constructor() {
        this.seedStr = '';
        this.hashInt = 0;
    }

    setSeed(seedStr) {
        this.seedStr = seedStr;
        // Simple hash to integer
        this.hashInt = parseInt(crypto.createHash('md5').update(seedStr).digest('hex').substring(0, 8), 16);
    }

    generateSeed() {
        return crypto.randomUUID();
    }

    _next() {
        // Simple LCG for deterministic pseudo-random sequence
        this.hashInt = (this.hashInt * 9301 + 49297) % 233280;
        return this.hashInt / 233280;
    }

    next() {
        return this._next();
    }

    range(min, max) {
        return min + (this.next() * (max - min));
    }

    float(min, max) {
        return this.range(min, max);
    }

    integer(min, max) {
        return Math.floor(this.range(min, max + 1));
    }

    choice(array) {
        if (!array || array.length === 0) return null;
        const index = Math.floor(this.next() * array.length);
        return array[index];
    }

    boolean(probability = 0.5) {
        return this.next() < probability;
    }
}

module.exports = new RandomSystem();
