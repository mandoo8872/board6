import { create } from 'zustand';

export interface CanvasStore {
  isDragging: boolean;
  viewCam: { x: number; y: number };
  snapEnabled: boolean;
  stepSnapDuringDrag: boolean;
  snapPreview: { center: { x: number; y: number } | null; rect: { x: number; y: number; w: number; h: number } | null };
  setIsDragging: (dragging: boolean) => void;
  setViewCam: (cam: { x: number; y: number }) => void;
  setSnapEnabled: (enabled: boolean) => void;
  setStepSnapDuringDrag: (enabled: boolean) => void;
  setSnapPreview: (payload: { center: { x: number; y: number } | null; rect: { x: number; y: number; w: number; h: number } | null }) => void;
  clearSnapPreview: () => void;
  panCanvas: (deltaX: number, deltaY: number) => void;
  resetView: () => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  isDragging: false,
  viewCam: { x: 0, y: 0 },
  snapEnabled: true,
  stepSnapDuringDrag: false,
  snapPreview: { center: null, rect: null },
  
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setViewCam: (cam) => set({ viewCam: cam }),
  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
  setStepSnapDuringDrag: (enabled) => set({ stepSnapDuringDrag: enabled }),
  setSnapPreview: (payload) => set({ snapPreview: payload }),
  clearSnapPreview: () => set({ snapPreview: { center: null, rect: null } }),
  
  panCanvas: (deltaX, deltaY) => set((state) => ({
    viewCam: {
      x: state.viewCam.x + deltaX,
      y: state.viewCam.y + deltaY
    }
  })),
  
  resetView: () => set({ viewCam: { x: 0, y: 0 } }),
})); 