import { create } from 'zustand';

// Shared Project State for M5 (Create Mode & Editor Mode)
export const useM5EditorStore = create((set, get) => ({
  // --- PROJECT STATE ---
  projectId: null,
  isDraftReady: false,
  isEditorMode: false,
  
  // Create Mode Specifics
  sourceUrl: '',
  setSourceUrl: (url) => set({ sourceUrl: url }),
  
  // Pipeline Progress (Reader -> AI -> Visual -> Draft)
  pipelineState: 'idle', // 'idle' | 'reading' | 'ai' | 'visual' | 'complete'
  setPipelineState: (state) => set({ pipelineState: state }),

  // Global Settings
  globalDuration: '30s',
  globalLang: 'Indonesia',
  globalRes: '1080x1920',
  globalFps: '30 FPS',
  bgFolder: '',
  audioFolder: '',
  overlayFolder: '',
  setGlobalSetting: (key, value) => set({ [key]: value }),

  // --- EDITOR STATE (Card JSON) ---
  cardTheme: 'Modern',
  colorPrimary: '#ef4444',
  colorBackground: '#0f172a',
  borderRadius: 12,

  headline: 'Presiden AS Joe Biden Kunjungi Vietnam',
  headlineFont: 'Inter',
  headlineSize: 24,
  headlineColor: '#ffffff',
  
  summary: 'Kunjungan ini menandai langkah baru dalam hubungan bilateral kedua negara yang semakin erat.',
  summaryFont: 'Inter',
  summarySize: 13,
  summaryColor: '#d1d5db',
  
  sourceText: 'cnnindonesia.com',
  sourceEnabled: true,
  category: 'INTERNASIONAL',
  date: '23 Mei 2024',
  
  imageScale: 100,
  imagePosX: 50,
  imagePosY: 50,

  // Selection & Layer Management
  selectedLayerId: null,
  setSelectedLayerId: (id) => set({ selectedLayerId: id }),
  
  layers: [
    { id: 'bg', type: 'background', name: 'Background Image', locked: false, hidden: false },
    { id: 'category', type: 'badge', name: 'Category Badge', locked: false, hidden: false },
    { id: 'headline', type: 'text', name: 'Headline Text', locked: false, hidden: false },
    { id: 'summary', type: 'text', name: 'Summary Text', locked: false, hidden: false },
    { id: 'source', type: 'text', name: 'Source Text', locked: false, hidden: false },
  ],
  
  updateLayer: (id, updates) => set(state => ({
    layers: state.layers.map(l => l.id === id ? { ...l, ...updates } : l)
  })),

  // --- ACTIONS ---
  generateDraft: () => {
    // Mocking the pipeline processing
    set({ pipelineState: 'reading', isDraftReady: false });
    setTimeout(() => set({ pipelineState: 'ai' }), 1000);
    setTimeout(() => set({ pipelineState: 'visual' }), 2000);
    setTimeout(() => set({ pipelineState: 'complete', isDraftReady: true, projectId: 'PRJ-' + Date.now() }), 3000);
  },
  
  openEditor: () => set({ isEditorMode: true }),
  closeEditor: () => set({ isEditorMode: false }),
  
  updateProperty: (key, value) => set({ [key]: value }),
}));
