import { create } from 'zustand';

export interface GridStore {
  gridEnabled: boolean;
  gridSize: number;
  snapEnabled: boolean;
  setGridEnabled: (enabled: boolean) => void;
  setGridSize: (size: number) => void;
  setSnapEnabled: (enabled: boolean) => void;
}

export const useGridStore = create<GridStore>((set) => ({
  gridEnabled: false,
  gridSize: 10,
  snapEnabled: true,
  
  setGridEnabled: (enabled) => set({ gridEnabled: enabled }),
  setGridSize: (size) => set({ gridSize: size }),
  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
})); 