import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2, Pipette, Scissors, RotateCcw, Check, Sparkles, Sliders, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export default function ImageProcessorModal({ isOpen, onClose, imageSrc, assetType = 'logo', onSave }) {
    const [originalImage, setOriginalImage] = useState(null);
    const [processedDataUrl, setProcessedDataUrl] = useState(null);
    const [targetColor, setTargetColor] = useState({ r: 255, g: 255, b: 255 }); // Default white
    const [tolerance, setTolerance] = useState(25);
    const [feather, setFeather] = useState(15);
    const [isContiguous, setIsContiguous] = useState(true); // Contiguous from borders only
    const [isEyedropperActive, setIsEyedropperActive] = useState(false);
    const [isAutoTrim, setIsAutoTrim] = useState(true);
    const [zoom, setZoom] = useState(100);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activePreset, setActivePreset] = useState('none'); // 'none', 'white', 'black', 'custom'

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Load image
    useEffect(() => {
        if (!isOpen || !imageSrc) return;
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            setOriginalImage(img);
            setZoom(100);
            setActivePreset('none');
            // Initial render as clean PNG
            processImage(img, { preset: 'none', tol: 25, feat: 15, cont: true, trim: false });
        };
        img.src = imageSrc;
    }, [isOpen, imageSrc]);

    // Core Image Processing Engine
    const processImage = (imgObj, options = {}) => {
        const img = imgObj || originalImage;
        if (!img) return;

        setIsProcessing(true);
        setTimeout(() => {
            try {
                const offCanvas = document.createElement('canvas');
                offCanvas.width = img.naturalWidth || img.width;
                offCanvas.height = img.naturalHeight || img.height;
                const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
                
                // Draw original image
                ctx.drawImage(img, 0, 0);

                const width = offCanvas.width;
                const height = offCanvas.height;
                const imgData = ctx.getImageData(0, 0, width, height);
                const data = imgData.data;

                const preset = options.preset !== undefined ? options.preset : activePreset;
                const tol = options.tol !== undefined ? options.tol : tolerance;
                const feat = options.feat !== undefined ? options.feat : feather;
                const cont = options.cont !== undefined ? options.cont : isContiguous;
                const trim = options.trim !== undefined ? options.trim : isAutoTrim;
                const tColor = options.targetColor || targetColor;

                if (preset !== 'none') {
                    // Color distance helper
                    const getColorDist = (r, g, b, tr, tg, tb) => {
                        return Math.sqrt(
                            0.299 * (r - tr) ** 2 +
                            0.587 * (g - tg) ** 2 +
                            0.114 * (b - tb) ** 2
                        );
                    };

                    const maxDist = (tol / 100) * 255;
                    const featherDist = (feat / 100) * 255;

                    if (cont) {
                        // Flood Fill / Connected Component from 4 borders
                        const visited = new Uint8Array(width * height);
                        const queue = [];

                        // Add outer border pixels to queue
                        for (let x = 0; x < width; x++) {
                            queue.push(x, 0);
                            queue.push(x, height - 1);
                        }
                        for (let y = 1; y < height - 1; y++) {
                            queue.push(0, y);
                            queue.push(width - 1, y);
                        }

                        let head = 0;
                        while (head < queue.length) {
                            const x = queue[head++];
                            const y = queue[head++];
                            const idx = y * width + x;

                            if (visited[idx]) continue;
                            visited[idx] = 1;

                            const pIdx = idx * 4;
                            const r = data[pIdx];
                            const g = data[pIdx + 1];
                            const b = data[pIdx + 2];

                            const dist = getColorDist(r, g, b, tColor.r, tColor.g, tColor.b);

                            if (dist <= maxDist + featherDist) {
                                // Calculate alpha falloff
                                if (dist <= maxDist) {
                                    data[pIdx + 3] = 0; // Fully transparent
                                } else {
                                    const factor = (dist - maxDist) / (featherDist || 1);
                                    data[pIdx + 3] = Math.min(data[pIdx + 3], Math.round(factor * 255));
                                }

                                // Push neighbors
                                if (x > 0 && !visited[idx - 1]) queue.push(x - 1, y);
                                if (x < width - 1 && !visited[idx + 1]) queue.push(x + 1, y);
                                if (y > 0 && !visited[idx - width]) queue.push(x, y - 1);
                                if (y < height - 1 && !visited[idx + width]) queue.push(x, y + 1);
                            }
                        }
                    } else {
                        // Global Color Replacement
                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];

                            const dist = getColorDist(r, g, b, tColor.r, tColor.g, tColor.b);

                            if (dist <= maxDist) {
                                data[i + 3] = 0;
                            } else if (dist <= maxDist + featherDist) {
                                const factor = (dist - maxDist) / (featherDist || 1);
                                data[i + 3] = Math.min(data[i + 3], Math.round(factor * 255));
                            }
                        }
                    }

                    ctx.putImageData(imgData, 0, 0);
                }

                // Auto Trim Transparent Borders if requested
                let finalCanvas = offCanvas;
                if (trim && preset !== 'none') {
                    const trimmed = autoTrimCanvas(offCanvas);
                    if (trimmed) finalCanvas = trimmed;
                }

                const resultUrl = finalCanvas.toDataURL('image/png');
                setProcessedDataUrl(resultUrl);

                // Render to preview canvas
                const displayCanvas = canvasRef.current;
                if (displayCanvas) {
                    displayCanvas.width = finalCanvas.width;
                    displayCanvas.height = finalCanvas.height;
                    const dCtx = displayCanvas.getContext('2d');
                    dCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
                    dCtx.drawImage(finalCanvas, 0, 0);
                }
            } catch (err) {
                console.error('[ImageProcessor] Processing error:', err);
            } finally {
                setIsProcessing(false);
            }
        }, 30);
    };

    // Auto Trim empty transparent edges
    const autoTrimCanvas = (sourceCanvas) => {
        const ctx = sourceCanvas.getContext('2d');
        const width = sourceCanvas.width;
        const height = sourceCanvas.height;
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        let top = height, bottom = 0, left = width, right = 0;
        let hasContent = false;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const alpha = data[(y * width + x) * 4 + 3];
                if (alpha > 10) {
                    hasContent = true;
                    if (x < left) left = x;
                    if (x > right) right = x;
                    if (y < top) top = y;
                    if (y > bottom) bottom = y;
                }
            }
        }

        if (!hasContent) return null;

        // Add 4px padding
        left = Math.max(0, left - 4);
        top = Math.max(0, top - 4);
        right = Math.min(width - 1, right + 4);
        bottom = Math.min(height - 1, bottom + 4);

        const trimWidth = right - left + 1;
        const trimHeight = bottom - top + 1;

        const trimCanvas = document.createElement('canvas');
        trimCanvas.width = trimWidth;
        trimCanvas.height = trimHeight;
        const trimCtx = trimCanvas.getContext('2d');
        trimCtx.drawImage(sourceCanvas, left, top, trimWidth, trimHeight, 0, 0, trimWidth, trimHeight);

        return trimCanvas;
    };

    // Handle Eyedropper Color Pick from Canvas
    const handleCanvasClick = (e) => {
        if (!isEyedropperActive || !canvasRef.current || !originalImage) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);

        // Get color from original image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalImage.naturalWidth || originalImage.width;
        tempCanvas.height = originalImage.naturalHeight || originalImage.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(originalImage, 0, 0);

        const pixel = tempCtx.getImageData(x, y, 1, 1).data;
        const pickedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };

        setTargetColor(pickedColor);
        setActivePreset('custom');
        setIsEyedropperActive(false);

        processImage(originalImage, {
            preset: 'custom',
            targetColor: pickedColor
        });
    };

    const handleApplyWhiteBgRemoval = () => {
        const white = { r: 255, g: 255, b: 255 };
        setTargetColor(white);
        setActivePreset('white');
        processImage(originalImage, { preset: 'white', targetColor: white });
    };

    const handleApplyBlackBgRemoval = () => {
        const black = { r: 0, g: 0, b: 0 };
        setTargetColor(black);
        setActivePreset('black');
        processImage(originalImage, { preset: 'black', targetColor: black });
    };

    const handleReset = () => {
        setActivePreset('none');
        processImage(originalImage, { preset: 'none' });
    };

    const handleSaveResult = () => {
        if (processedDataUrl && onSave) {
            onSave(processedDataUrl);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl bg-[#12131a] border border-[#2d3142] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#161824]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                            <Wand2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-black text-[16px] tracking-wider uppercase font-['Rajdhani']">
                                    Studio Background Remover & PNG Converter
                                </h3>
                                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-mono font-bold uppercase">
                                    {assetType}
                                </span>
                            </div>
                            <p className="text-gray-400 text-xs mt-0.5">
                                Hapus latar belakang gambar dan otomatis simpan sebagai format PNG transparan berkualitas tinggi.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body - Split View */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[420px]">
                    
                    {/* Left: Interactive Canvas Preview */}
                    <div 
                        ref={containerRef}
                        className="flex-1 bg-[#0b0c10] p-6 flex flex-col items-center justify-center relative overflow-auto select-none"
                    >
                        {/* Checkerboard Pattern for Transparency */}
                        <div 
                            className="relative max-w-full max-h-[380px] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center"
                            style={{
                                backgroundImage: `
                                    linear-gradient(45deg, #1c1e29 25%, transparent 25%), 
                                    linear-gradient(-45deg, #1c1e29 25%, transparent 25%), 
                                    linear-gradient(45deg, transparent 75%, #1c1e29 75%), 
                                    linear-gradient(-45deg, transparent 75%, #1c1e29 75%)
                                `,
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                                backgroundColor: '#13151f'
                            }}
                        >
                            <canvas 
                                ref={canvasRef}
                                onClick={handleCanvasClick}
                                className={`max-w-full max-h-[360px] object-contain transition-transform ${isEyedropperActive ? 'cursor-crosshair' : 'cursor-default'}`}
                                style={{ transform: `scale(${zoom / 100})` }}
                            />

                            {/* Processing Overlay */}
                            {isProcessing && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                                    <Sparkles className="w-4 h-4 animate-spin" />
                                    <span>Memproses...</span>
                                </div>
                            )}
                        </div>

                        {/* Zoom & View Controls Floating Toolbar */}
                        <div className="absolute bottom-4 left-6 flex items-center gap-1.5 bg-[#181a24]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
                            <button 
                                onClick={() => setZoom(prev => Math.max(50, prev - 25))}
                                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-[11px] font-mono text-gray-300 w-10 text-center">{zoom}%</span>
                            <button 
                                onClick={() => setZoom(prev => Math.min(200, prev + 25))}
                                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <div className="w-[1px] h-4 bg-white/10 mx-1" />
                            <button 
                                onClick={() => setZoom(100)}
                                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
                                title="Reset Zoom"
                            >
                                <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {isEyedropperActive && (
                            <div className="absolute top-4 left-6 bg-orange-500 text-black px-3 py-1 rounded-lg text-xs font-bold shadow-lg animate-bounce flex items-center gap-1.5">
                                <Pipette className="w-3.5 h-3.5" />
                                Klik warna latar pada gambar untuk menghapusnya
                            </div>
                        )}
                    </div>

                    {/* Right: Controls & Presets Panel */}
                    <div className="w-full lg:w-80 bg-[#161824] border-t lg:border-t-0 lg:border-l border-white/10 p-5 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-4">
                            
                            {/* Quick Presets */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider font-['Rajdhani'] mb-2 block">
                                    Pilihan Cepat Hapus Background
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        type="button"
                                        onClick={handleApplyWhiteBgRemoval}
                                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                            activePreset === 'white' 
                                                ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.3)]' 
                                                : 'bg-[#1e2130] border-white/5 text-gray-300 hover:bg-[#25293d] hover:border-white/20'
                                        }`}
                                    >
                                        <span className="w-3.5 h-3.5 rounded-full bg-white border border-gray-400 shadow-xs" />
                                        <span>Hapus Putih</span>
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={handleApplyBlackBgRemoval}
                                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                            activePreset === 'black' 
                                                ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.3)]' 
                                                : 'bg-[#1e2130] border-white/5 text-gray-300 hover:bg-[#25293d] hover:border-white/20'
                                        }`}
                                    >
                                        <span className="w-3.5 h-3.5 rounded-full bg-black border border-gray-600 shadow-xs" />
                                        <span>Hapus Hitam</span>
                                    </button>
                                </div>

                                <button 
                                    type="button"
                                    onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                                    className={`w-full mt-2 px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                        isEyedropperActive 
                                            ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                                            : activePreset === 'custom'
                                                ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                                                : 'bg-[#1e2130] border-white/5 text-gray-300 hover:bg-[#25293d]'
                                    }`}
                                >
                                    <Pipette className="w-4 h-4" />
                                    <span>{isEyedropperActive ? 'Membidik Warna (Klik Gambar)...' : 'Pilih Warna dari Gambar'}</span>
                                </button>
                            </div>

                            {/* Fine-Tuning Sliders */}
                            {activePreset !== 'none' && (
                                <div className="p-3.5 rounded-xl bg-[#11121a] border border-white/5 space-y-3.5 animate-in fade-in duration-150">
                                    <div className="flex items-center gap-2 text-gray-300 text-xs font-bold font-['Rajdhani'] uppercase tracking-wider">
                                        <Sliders className="w-3.5 h-3.5 text-orange-400" />
                                        <span>Penyesuaian Detail</span>
                                    </div>

                                    {/* Tolerance Slider */}
                                    <div>
                                        <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-1">
                                            <span>Toleransi Warna</span>
                                            <span className="text-orange-400 font-bold">{tolerance}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="80" 
                                            value={tolerance}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setTolerance(val);
                                                processImage(originalImage, { tol: val });
                                            }}
                                            className="w-full h-1.5 bg-[#252838] rounded-lg appearance-none cursor-pointer accent-orange-500"
                                        />
                                    </div>

                                    {/* Feather / Edge Smoothing */}
                                    <div>
                                        <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-1">
                                            <span>Kehalusan Tepi (Feather)</span>
                                            <span className="text-orange-400 font-bold">{feather}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="40" 
                                            value={feather}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setFeather(val);
                                                processImage(originalImage, { feat: val });
                                            }}
                                            className="w-full h-1.5 bg-[#252838] rounded-lg appearance-none cursor-pointer accent-orange-500"
                                        />
                                    </div>

                                    {/* Contiguous Border Only Toggle */}
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[11px] text-gray-300 font-medium">Hanya Bagian Luar</span>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const val = !isContiguous;
                                                setIsContiguous(val);
                                                processImage(originalImage, { cont: val });
                                            }}
                                            className={`w-9 h-5 rounded-full transition-colors relative ${isContiguous ? 'bg-orange-500' : 'bg-gray-700'}`}
                                        >
                                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isContiguous ? 'left-4.5' : 'left-0.5'}`} />
                                        </button>
                                    </div>

                                    {/* Auto Trim Toggle */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-gray-300 font-medium">Pangkas Ruang Kosong (Trim)</span>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const val = !isAutoTrim;
                                                setIsAutoTrim(val);
                                                processImage(originalImage, { trim: val });
                                            }}
                                            className={`w-9 h-5 rounded-full transition-colors relative ${isAutoTrim ? 'bg-orange-500' : 'bg-gray-700'}`}
                                        >
                                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isAutoTrim ? 'left-4.5' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Reset Button */}
                            <button 
                                type="button"
                                onClick={handleReset}
                                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Kembalikan Gambar Asli</span>
                            </button>
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-4 border-t border-white/10 flex gap-2">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl bg-[#202330] hover:bg-[#2a2e40] text-gray-300 text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                type="button"
                                onClick={handleSaveResult}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-1.5 transition-all"
                            >
                                <Check className="w-4 h-4" />
                                <span>Simpan PNG</span>
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
