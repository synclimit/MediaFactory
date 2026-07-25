// verify_bug_fix.js
// Simulasi pembuktian (proof) perbaikan bug infinite reload pada React useEffect

console.log("\n=======================================================");
console.log("MENSIMULASIKAN BUG LAMA (Infinite Reload Loop)");
console.log("=======================================================\n");

let rendererInstance = null;

// Simulasi perilaku VisualizerRenderer.jsx SEBELUM diperbaiki:
// useEffect bergantung pada keseluruhan objek [config]. Setiap kali mouse digeser, objek config menjadi baru.
function simulateLegacyBehavior() {
    for (let renderKe = 1; renderKe <= 3; renderKe++) {
        console.log(`\n[Render ke-${renderKe}] User menggeser visualizer (config di-update)`);
        console.log(`  -> useEffect() terpicu karena referensi objek config berubah!`);
        console.log(`  -> runtime.load() dipanggil...`);
        
        // Di dalam runtime.load(), renderer lama langsung dihancurkan.
        rendererInstance = null; 
        console.log(`  -> ⚠️ renderer dihancurkan (this.renderer = null)`);
        
        // Simulasi fungsi asinkron (load)
        setTimeout(() => {
            rendererInstance = { id: 'BarsRenderer' };
        }, 10);
        
        // Sementara itu requestAnimationFrame tetap berjalan di belakang layar
        if (!rendererInstance) {
            console.log(`  -> ❌ requestAnimationFrame berjalan: MELEWATKAN PROSES GAMBAR (Canvas Transparan)`);
        }
    }
}

simulateLegacyBehavior();


setTimeout(() => {
    console.log("\n\n=======================================================");
    console.log("MENSIMULASIKAN SISTEM BARU (Stabil, sesudah diperbaiki)");
    console.log("=======================================================\n");

    let visualizerId = 'bars-peak-hold';
    let currentLoadedId = null;
    rendererInstance = null;

    for (let renderKe = 1; renderKe <= 3; renderKe++) {
        console.log(`\n[Render ke-${renderKe}] User menggeser visualizer (config di-update)`);
        
        // Di sistem baru, useEffect pertama HANYA memantau config.visualizerId
        if (currentLoadedId !== visualizerId) {
            console.log(`  -> ✅ useEffect(load) terpicu: Memuat plugin baru...`);
            currentLoadedId = visualizerId;
            rendererInstance = { id: 'BarsRenderer' };
        } else {
            console.log(`  -> ⏭️ useEffect(load) diabaikan: visualizerId tidak berubah.`);
        }
        
        // useEffect kedua hanya mengatur setConfig, TANPA menghancurkan renderer
        console.log(`  -> ✅ runtime.setConfig() dipanggil (warna/posisi diperbarui tanpa memuat ulang).`);
        
        // requestAnimationFrame berjalan dengan aman
        if (rendererInstance) {
            console.log(`  -> 🎨 requestAnimationFrame berjalan: MENGGAMBAR PALANG DENGAN SUKSES!`);
        }
    }

    console.log("\n=======================================================\n");
}, 50);
