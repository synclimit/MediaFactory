/**
 * SoundPicker.jsx
 *
 * Pop-up internal untuk memilih ambient sound, menggantikan tombol "Browse"
 * lama yang membuka File Explorer Windows. Menarik daftar langsung dari
 * backend /api/sounds (soundCatalog.js).
 *
 * Sound yang file fisiknya belum ada (404 saat dicoba diputar) otomatis
 * ditandai "Belum tersedia" dan disabled -- tidak error mentah ke user.
 *
 * CSS digabung langsung di file ini (lewat tag <style>) supaya jadi satu
 * file utuh -- tinggal copy SoundPicker.jsx ke project Anda, tidak perlu
 * file .css terpisah.
 *
 * Cara pakai (di komponen tombol "Browse" Anda yang lama):
 *
 *   import SoundPicker from "./SoundPicker";
 *
 *   const [pickerOpen, setPickerOpen] = useState(false);
 *
 *   <button onClick={() => setPickerOpen(true)}>Browse</button>
 *
 *   <SoundPicker
 *     isOpen={pickerOpen}
 *     onClose={() => setPickerOpen(false)}
 *     onSelect={(sound) => {
 *       // sound = { id, titleUi }
 *       setSelectedAmbientUrl(`/api/sounds/${sound.id}/stream`);
 *       setPickerOpen(false);
 *     }}
 *   />
 */

import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = "http://localhost:3001"; // ganti kalau backend beda origin, mis. "http://localhost:3001"

const STYLES = `
.sound-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.sound-picker-modal {
  background: #1a1a1f;
  border: 1px solid #2e2e35;
  border-radius: 12px;
  width: 90%;
  max-width: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: system-ui, sans-serif;
}
.sound-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #2e2e35;
}
.sound-picker-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #f0f0f2;
  margin: 0;
}
.sound-picker-close {
  background: none;
  border: none;
  color: #9a9aa5;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.sound-picker-close:hover {
  background: #2a2a32;
  color: #fff;
}
.sound-picker-error {
  margin: 12px 20px 0;
  padding: 10px 12px;
  background: rgba(220, 60, 60, 0.12);
  border: 1px solid rgba(220, 60, 60, 0.35);
  color: #ff8a8a;
  border-radius: 8px;
  font-size: 13px;
}
.sound-picker-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 16px 20px;
  overflow-y: auto;
}
.sound-picker-item {
  display: flex;
  align-items: stretch;
  background: #232329;
  border: 1px solid #2e2e35;
  border-radius: 10px;
  overflow: hidden;
}
.sound-picker-item.is-previewing {
  border-color: #5b6cff;
}
.sound-picker-item.is-missing {
  opacity: 0.55;
}
.sound-picker-item-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  background: none;
  border: none;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
}
.sound-picker-item-main:disabled {
  cursor: not-allowed;
}
.sound-picker-item-title {
  color: #e6e6ea;
  font-size: 13px;
}
.sound-picker-badge {
  font-size: 10px;
  color: #ff9f43;
  background: rgba(255, 159, 67, 0.12);
  padding: 2px 6px;
  border-radius: 4px;
}
.sound-picker-badge-checking {
  color: #9a9aa5;
  background: rgba(154, 154, 165, 0.12);
}
.sound-picker-preview-btn {
  width: 40px;
  background: #2a2a32;
  border: none;
  border-left: 1px solid #2e2e35;
  color: #cfd0d6;
  cursor: pointer;
  font-size: 14px;
}
.sound-picker-preview-btn:hover:not(:disabled) {
  background: #33333c;
  color: #fff;
}
.sound-picker-preview-btn:disabled {
  cursor: not-allowed;
  color: #55555f;
}
.sound-picker-empty {
  padding: 24px 20px;
  text-align: center;
  color: #9a9aa5;
  font-size: 13px;
}
`;

export default function SoundPicker({ isOpen, onClose, onSelect }) {
  const [sounds, setSounds] = useState([]);
  const [availability, setAvailability] = useState({}); // { [id]: 'checking' | 'ok' | 'missing' }
  const [loadError, setLoadError] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoadError(null);

    fetch(`${API_BASE}/api/sounds`)
      .then((res) => {
        if (!res.ok) throw new Error(`Gagal memuat daftar suara (${res.status})`);
        return res.json();
      })
      .then((list) => {
        if (cancelled) return;
        setSounds(list);
        list.forEach((item) => checkAvailability(item.id));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setPreviewingId(null);
    }
  }, [isOpen]);

  const checkAvailability = useCallback((id) => {
    setAvailability((prev) => ({ ...prev, [id]: "checking" }));
    fetch(`${API_BASE}/api/sounds/${id}/stream`, { method: "HEAD" })
      .then((res) => {
        setAvailability((prev) => ({ ...prev, [id]: res.ok ? "ok" : "missing" }));
      })
      .catch(() => {
        setAvailability((prev) => ({ ...prev, [id]: "missing" }));
      });
  }, []);

  const handlePreview = (sound) => {
    if (availability[sound.id] !== "ok") return;

    if (previewingId === sound.id) {
      audioRef.current?.pause();
      setPreviewingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.src = `${API_BASE}/api/sounds/${sound.id}/stream`;
      audioRef.current
        .play()
        .then(() => setPreviewingId(sound.id))
        .catch(() => {
          setAvailability((prev) => ({ ...prev, [sound.id]: "missing" }));
          setPreviewingId(null);
        });
    }
  };

  const handleSelect = (sound) => {
    if (availability[sound.id] !== "ok") return;
    audioRef.current?.pause();
    setPreviewingId(null);
    onSelect(sound);
  };

  if (!isOpen) return null;

  return (
    <div className="sound-picker-overlay" onClick={onClose}>
      <style>{STYLES}</style>
      <div className="sound-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sound-picker-header">
          <h2>Pilih Suara Ambient</h2>
          <button className="sound-picker-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        {loadError && (
          <div className="sound-picker-error">Gagal memuat daftar suara: {loadError}</div>
        )}

        <div className="sound-picker-grid">
          {sounds.map((sound) => {
            const state = availability[sound.id] || "checking";
            const isMissing = state === "missing";
            const isPreviewing = previewingId === sound.id;

            return (
              <div
                key={sound.id}
                className={`sound-picker-item ${isMissing ? "is-missing" : ""} ${
                  isPreviewing ? "is-previewing" : ""
                }`}
              >
                <button
                  className="sound-picker-item-main"
                  onClick={() => handleSelect(sound)}
                  disabled={isMissing || state === "checking"}
                >
                  <span className="sound-picker-item-title">{sound.titleUi}</span>
                  {isMissing && <span className="sound-picker-badge">Belum tersedia</span>}
                  {state === "checking" && (
                    <span className="sound-picker-badge sound-picker-badge-checking">
                      Memeriksa...
                    </span>
                  )}
                </button>

                <button
                  className="sound-picker-preview-btn"
                  onClick={() => handlePreview(sound)}
                  disabled={isMissing || state === "checking"}
                  aria-label={isPreviewing ? "Hentikan preview" : "Dengar preview"}
                  title={isPreviewing ? "Hentikan preview" : "Dengar preview"}
                >
                  {isPreviewing ? "⏸" : "▶"}
                </button>
              </div>
            );
          })}
        </div>

        {sounds.length === 0 && !loadError && (
          <div className="sound-picker-empty">Memuat daftar suara...</div>
        )}
      </div>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} onEnded={() => setPreviewingId(null)} />
    </div>
  );
}
