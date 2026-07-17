import StorageDriverInterface from './StorageDriverInterface';
import { storageAdapter } from './StorageAdapter';

/**
 * MF-204E: Memory Driver
 * 
 * Implementasi sementara riil pertama dari StorageDriverInterface.
 * Berfungsi untuk menampung cache pada memori RAM (hilang saat direfresh).
 * Digunakan untuk memvalidasi aliran arsitektur secara end-to-end tanpa 
 * komplikasi database persisten.
 */
class MemoryDriver extends StorageDriverInterface {
    constructor() {
        super();
        // Memetakan struktur: store[type][key] = cacheObject
        this.store = {};
    }

    /**
     * @param {string} type 
     * @param {Object} cache 
     * @returns {Promise<boolean>}
     */
    async save(type, cache) {
        if (!this.store[type]) {
            this.store[type] = {};
        }
        
        // Asumsi key primary adalah audioHash jika ada, jika tidak, tolak.
        const key = cache?.header?.audioHash;
        if (!key) {
            console.warn(`MemoryDriver: Gagal save. Objek cache tidak memiliki header.audioHash.`);
            return false;
        }

        this.store[type][key] = cache;
        return true;
    }

    /**
     * @param {string} type 
     * @param {string} key 
     * @returns {Promise<Object|null>}
     */
    async load(type, key) {
        if (!this.store[type]) return null;
        return this.store[type][key] || null;
    }

    /**
     * @param {string} type 
     * @param {string} key 
     * @returns {Promise<boolean>}
     */
    async remove(type, key) {
        if (this.store[type] && this.store[type][key]) {
            delete this.store[type][key];
            return true;
        }
        return false;
    }

    /**
     * @param {string} type 
     * @param {string} key 
     * @returns {Promise<boolean>}
     */
    async exists(type, key) {
        return !!(this.store[type] && this.store[type][key]);
    }

    /**
     * @param {string} type 
     * @returns {Promise<Array<string>>}
     */
    async list(type) {
        if (!this.store[type]) return [];
        return Object.keys(this.store[type]);
    }

    /**
     * @param {string} type 
     * @returns {Promise<boolean>}
     */
    async clear(type) {
        this.store[type] = {};
        return true;
    }
}

// Inisialisasi Singleton
export const memoryDriver = new MemoryDriver();

// Penuhi Acceptance Criteria: "Storage Adapter berhasil melakukan injeksi Memory Driver"
// Dilakukan secara otomatis saat module ini di-import.
storageAdapter.setDriver(memoryDriver);

export default MemoryDriver;
