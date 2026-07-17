/**
 * MF-204D: Storage Driver Interface
 * 
 * Lapisan abstraksi murni yang bertindak sebagai kontrak (Interface) 
 * wajib bagi seluruh media penyimpanan di ekosistem MediaFactory.
 * (Contoh: IndexedDBDriver, FileSystemDriver, MemoryDriver, dsb).
 * 
 * Mewajibkan pengimplementasian metode asinkron (Promise) secara utuh.
 */

class StorageDriverInterface {
    
    /**
     * Menyimpan data cache ke media penyimpanan.
     * @param {string} type Tipe skema cache
     * @param {Object} cache Data cache
     * @returns {Promise<boolean>}
     */
    async save(type, cache) {
        throw new Error("StorageDriverInterface: 'save(type, cache)' method must be implemented by concrete driver.");
    }

    /**
     * Memuat data cache utuh dari media penyimpanan.
     * @param {string} type Tipe skema cache
     * @param {string} key Key identitas unik (misal: audioHash)
     * @returns {Promise<Object|null>}
     */
    async load(type, key) {
        throw new Error("StorageDriverInterface: 'load(type, key)' method must be implemented by concrete driver.");
    }

    /**
     * Menghapus sebuah entri cache dari storage.
     * @param {string} type Tipe skema cache
     * @param {string} key Key identitas unik
     * @returns {Promise<boolean>}
     */
    async remove(type, key) {
        throw new Error("StorageDriverInterface: 'remove(type, key)' method must be implemented by concrete driver.");
    }

    /**
     * Mengecek ketersediaan suatu cache di media penyimpanan tanpa payload.
     * @param {string} type Tipe skema cache
     * @param {string} key Key identitas unik
     * @returns {Promise<boolean>}
     */
    async exists(type, key) {
        throw new Error("StorageDriverInterface: 'exists(type, key)' method must be implemented by concrete driver.");
    }

    /**
     * Mengambil daftar (list) seluruh key pada tipe cache tertentu.
     * @param {string} type Tipe skema cache
     * @returns {Promise<Array<string>>}
     */
    async list(type) {
        throw new Error("StorageDriverInterface: 'list(type)' method must be implemented by concrete driver.");
    }

    /**
     * Membersihkan (wipe/purge) seluruh data untuk tipe cache tertentu.
     * @param {string} type Tipe skema cache
     * @returns {Promise<boolean>}
     */
    async clear(type) {
        throw new Error("StorageDriverInterface: 'clear(type)' method must be implemented by concrete driver.");
    }
}

export default StorageDriverInterface;
