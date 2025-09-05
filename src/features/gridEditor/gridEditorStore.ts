import { create } from 'zustand';

export type GridEditMode = 'off' | 'draw' | 'edit';

export interface RectPct { x: number; y: number; w: number; h: number; }

export interface GridDraft {
  rectPct: RectPct;
  rows: number;
  cols: number;
  vLinesPct: number[]; // length = cols + 1, 0..1 ascending
  hLinesPct: number[]; // length = rows + 1, 0..1 ascending
}

export const MIN_CELL_PX = 16; // at 100% scale baseline

interface GridEditorState {
  mode: GridEditMode;
  draft: GridDraft | null;
  previewCenters: boolean;
  editingId: string | null;
  viewEnabled: boolean; // 보기(표시/편집) on/off
  setMode: (m: GridEditMode) => void;
  clearDraft: () => void;
  startDraft: (rect: RectPct, rows?: number, cols?: number) => void;
  setRectPct: (r: RectPct) => void;
  setRows: (n: number) => void;
  setCols: (n: number) => void;
  moveLine: (axis: 'h' | 'v', index: number, pct: number) => void;
  clampAndSort: () => void;
  reset: () => void;
  togglePreview: () => void;
  loadFromItem: (item: { rectPct: RectPct; rows: number; cols: number; vLinesPct?: number[]; hLinesPct?: number[]; id?: string }) => void;
  setEditingId: (id: string | null) => void;
  setViewEnabled: (v: boolean) => void;
}

export const useGridEditorStore = create<GridEditorState>((set) => ({
  mode: 'off',
  draft: null,
  previewCenters: true,
  editingId: null,
  viewEnabled: false,

  setMode: (m) => set({ mode: m }),
  clearDraft: () => set({ draft: null, editingId: null }),
  startDraft: (rect, rows = 5, cols = 5) => set(() => {
    const v = Array.from({ length: cols + 1 }, (_, i) => i / cols);
    const h = Array.from({ length: rows + 1 }, (_, i) => i / rows);
    return { draft: { rectPct: rect, rows, cols, vLinesPct: v, hLinesPct: h }, editingId: null };
  }),
  setRectPct: (r) => set((s) => {
    if (!s.draft) {
      const rows = 5, cols = 5;
      const v = Array.from({ length: cols + 1 }, (_, i) => i / cols);
      const h = Array.from({ length: rows + 1 }, (_, i) => i / rows);
      return { draft: { rectPct: r, rows, cols, vLinesPct: v, hLinesPct: h } };
    }
    return { draft: { ...s.draft, rectPct: r } };
  }),

  setRows: (n) => set((s) => {
    if (!s.draft) return s;
    const rows = Math.max(1, Math.min(200, Math.floor(n)));
    const hLinesPct = Array.from({ length: rows + 1 }, (_, i) => i / rows);
    return { draft: { ...s.draft, rows, hLinesPct } };
  }),

  setCols: (n) => set((s) => {
    if (!s.draft) return s;
    const cols = Math.max(1, Math.min(200, Math.floor(n)));
    const vLinesPct = Array.from({ length: cols + 1 }, (_, i) => i / cols);
    return { draft: { ...s.draft, cols, vLinesPct } };
  }),

  moveLine: (axis, index, pct) => set((s) => {
    if (!s.draft) return s;
    if (axis === 'v') {
      const arr = [...s.draft.vLinesPct];
      if (index <= 0 || index >= arr.length - 1) return s; // keep 0,1 fixed
      arr[index] = Math.max(0, Math.min(1, pct));
      arr.sort((a, b) => a - b);
      return { draft: { ...s.draft, vLinesPct: arr } };
    } else {
      const arr = [...s.draft.hLinesPct];
      if (index <= 0 || index >= arr.length - 1) return s; // keep 0,1 fixed
      arr[index] = Math.max(0, Math.min(1, pct));
      arr.sort((a, b) => a - b);
      return { draft: { ...s.draft, hLinesPct: arr } };
    }
  }),

  clampAndSort: () => set((s) => {
    if (!s.draft) return s;
    const clamp = (arr: number[]) => arr.map((v) => Math.max(0, Math.min(1, v))).sort((a, b) => a - b);
    return {
      draft: {
        ...s.draft,
        vLinesPct: clamp(s.draft.vLinesPct),
        hLinesPct: clamp(s.draft.hLinesPct),
      },
    };
  }),

  reset: () => set({ mode: 'off', draft: null, editingId: null }),

  togglePreview: () => set((s) => ({ previewCenters: !s.previewCenters })),

  loadFromItem: (item) => set(() => ({
    draft: {
      rectPct: item.rectPct,
      rows: item.rows,
      cols: item.cols,
      vLinesPct: item.vLinesPct && item.vLinesPct.length ? item.vLinesPct : Array.from({ length: item.cols + 1 }, (_, i) => i / item.cols),
      hLinesPct: item.hLinesPct && item.hLinesPct.length ? item.hLinesPct : Array.from({ length: item.rows + 1 }, (_, i) => i / item.rows),
    },
    editingId: item.id || null,
    mode: 'edit',
  })),

  setEditingId: (id) => set({ editingId: id }),
  setViewEnabled: (v) => set((s) => ({ viewEnabled: v, mode: v ? s.mode : 'off' })),
}));


