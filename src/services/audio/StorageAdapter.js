/**
 * MF-204C: Storage Adapter
 * 
 * Lapisan abstraksi (Interface) yang menjembatani antara Analysis Cache Manager 
 * dengan implementasi media penyimpanan aktual (Driver).
 * 
 * Sesuai kontrak Sprint 1: Adapter ini tidak menangani IndexedDB, SQLite, 
 * Memory, atau File System. Seluruh operasi dilempar (delegasi) kepada Driver
 * yang kelak akan di-inject.
 */

class StorageAdapter {
    constructor() {
        this.driver = null; // Akan disuntikkan (inject) oleh sistem di sprint selanjutnya
    }

    /**
     * Mendaftarkan atau menyuntikkan Storage Driver aktual beserta validasi ketat kontraknya.
     * (Contoh: IndexedDBDriver, CloudDriver).
     * @param {Object} driver
     */
    setDriver(driver) {
        if (!driver) {
            throw new Error("StorageAdapter: Cannot inject null or undefined driver.");
        }

        const requiredMethods = ['save', 'load', 'remove', 'exists', 'list', 'clear'];
        
        for (const method of requiredMethods) {
            if (typeof driver[method] !== 'function') {
                throw new Error(`StorageAdapter Validation Error: Injected driver is missing mandatory method '${method}'. Driver rejected.`);
            }
        }

        this.driver = driver;
    }

    /**
     * Menyimpan data cache ke media penyimpanan.
     * @param {string} type Tipe cache (contoh: 'beat_cache')
     * @param {Object} cache Data cache utuh
     * @returns {Promise<boolean>} Indikator keberhasilan penyimpanan
     */
    async save(type, cache) {
        if (!this.driver) {
            console.warn(`[StorageAdapter] Warning: Driver storage belum di-inject. Operasi save(${type}) diabaikan.`);
            return false;
        }
        // Delegasi ke driver aktual
        return this.driver.save(type, cache);
    }

    /**
     * Memuat (load) data cache utuh dari media penyimpanan.
     * @param {string} type Tipe cache
     * @param {string} key Key identitas unik (misal: audioHash)
     * @returns {Promise<Object|null>} Objek cache jika ada, null jika tidak
     */
    async load(type, key) {
        if (!this.driver) {
            console.warn(`[StorageAdapter] Warning: Driver storage belum di-inject. Operasi load(${type}, ${key}) dibatalkan.`);
            return null;
        }
        return this.driver.load(type, key);
    }

    /**
     * Menghapus secara definitif sebuah entri cache dari storage.
     * @param {string} type Tipe cache
     * @param {string} key Key identitas unik (misal: audioHash)
     * @returns {Promise<boolean>}
     */
    async remove(type, key) {
        if (!this.driver) {
            console.warn(`[StorageAdapter] Warning: Driver storage belum di-inject. Operasi remove(${type}, ${key}) dibatalkan.`);
            return false;
        }
        return this.driver.remove(type, key);
    }

    /**
     * Mengecek ketersediaan suatu cache di media penyimpanan (tanpa memuat payload penuh).
     * @param {string} type Tipe cache
     * @param {string} key Key identitas unik
     * @returns {Promise<boolean>}
     */
    async exists(type, key) {
        if (!this.driver) {
            console.warn(`[StorageAdapter] Warning: Driver storage belum di-inject. Operasi exists(${type}, ${key}) mereturn false.`);
            return false;
        }
        return this.driver.exists(type, key);
    }

    /**
     * Mengambil daftar (list) key yang terdaftar pada tipe cache tertentu di media storage.
     * @param {string} type Tipe cache
     * @returns {Promise<Array<string>>}
     */
    async list(type) {
        if (!this.driver) {
            console.warn(`[StorageAdapter] Warning: Driver storage belum di-inject. Operasi list(${type}) dibatalkan.`);
            return [];
        }
        return this.driver.list(type);
    }

    /**
     * Membersihkan (wipe/purge) seluruh data pada tipe cache tertentu.
     * @param {string} type Tipe cache
     * @returns {Promise<boolean>}
     */
    async clear(type) {
        if (!this.driver) {
            console.warn(`[StorageAdapter] Warning: Driver storage belum di-inject. Operasi clear(${type}) dibatalkan.`);
            return false;
        }
        return this.driver.clear(type);
    }
}

export const storageAdapter = new StorageAdapter();
export default StorageAdapter;
