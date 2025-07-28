import { create } from 'zustand';

export interface CanvasStore {
  isDragging: boolean;
  viewCam: { x: number; y: number };
  snapEnabled: boolean;
  setIsDragging: (dragging: boolean) => void;
  setViewCam: (cam: { x: number; y: number }) => void;
  setSnapEnabled: (enabled: boolean) => void;
  panCanvas: (deltaX: number, deltaY: number) => void;
  resetView: () => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  isDragging: false,
  viewCam: { x: 0, y: 0 },
  snapEnabled: true,
  
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setViewCam: (cam) => set({ viewCam: cam }),
  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
  
  panCanvas: (deltaX, deltaY) => set((state) => ({
    viewCam: {
      x: state.viewCam.x + deltaX,
      y: state.viewCam.y + deltaY
    }
  })),
  
  resetView: () => set({ viewCam: { x: 0, y: 0 } }),
})); 