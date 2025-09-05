import { create } from 'zustand';
import { Tool } from '../types';

export interface EditorStore {
  currentTool: Tool;
  zoom: number;
  viewOffset: { x: number; y: number }; // 캔버스 뷰 오프셋
  selectedObjectId: string | null;
  creationMode: Tool | null; // 생성 모드 상태
  hoveredObjectId: string | null; // 호버된 객체 ID
  setCurrentTool: (tool: Tool) => void;
  setZoom: (zoom: number) => void;
  setViewOffset: (offset: { x: number; y: number }) => void;
  setSelectedObjectId: (id: string | null) => void;
  setCreationMode: (mode: Tool | null) => void;
  setHoveredObjectId: (id: string | null) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomAtPoint: (delta: number, pointX: number, pointY: number, canvasRect: DOMRect) => void;
  resetZoom: () => void;
  fitToWindow: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  currentTool: 'select',
  zoom: 1.0, // 초기 줌을 1.0으로 설정 (autoScale이 자동으로 조정함)
  viewOffset: { x: 0, y: 0 },
  selectedObjectId: null,
  creationMode: null,
  hoveredObjectId: null,
  
  setCurrentTool: (tool) => set({ currentTool: tool }),
  setZoom: (zoom) => set({ zoom: Math.max(0.05, Math.min(5.0, zoom)) }),
  setViewOffset: (offset) => set({ viewOffset: offset }),
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
  setCreationMode: (mode) => set({ creationMode: mode }),
  setHoveredObjectId: (id) => set({ hoveredObjectId: id }),
  
  zoomIn: () => set((state) => ({ 
    zoom: Math.min(5.0, state.zoom + 0.1) 
  })),
  
  zoomOut: () => set((state) => ({ 
    zoom: Math.max(0.05, state.zoom - 0.1) 
  })),
  
  zoomAtPoint: (delta, _pointX, pointY, canvasRect) => {
    const state = get();
    const zoomFactor = 1.1;
    const newZoom = delta > 0 
      ? Math.min(5.0, state.zoom * zoomFactor)
      : Math.max(0.05, state.zoom / zoomFactor);
    
    if (newZoom === state.zoom) return; // 줌이 변경되지 않으면 리턴
    
    // 가용 영역(툴바 제외)의 중심점 계산
    const availableAreaCenterY = canvasRect.height / 2;
    
    // 마우스 세로 위치에서 가용 영역 중심까지의 거리만 고려
    // 가로는 항상 중앙값 유지
    const offsetFromCenterY = pointY - availableAreaCenterY;
    
    // 줌 변경 비율
    const zoomRatio = newZoom / state.zoom;
    
    // 새로운 오프셋 계산: 마우스의 세로 위치만 고정되도록 조정
    // 가로는 기존 오프셋 유지 (중앙값 유지)
    const newOffsetX = state.viewOffset.x;
    const newOffsetY = state.viewOffset.y + offsetFromCenterY * (1 - zoomRatio);
    
    set({ 
      zoom: newZoom,
      viewOffset: { x: newOffsetX, y: newOffsetY }
    });
  },
  
  resetZoom: () => set({ zoom: 1.0, viewOffset: { x: 0, y: 0 } }), // 줌과 오프셋 리셋
  fitToWindow: () => set({ zoom: 1.0, viewOffset: { x: 0, y: 0 } }), // 창맞춤 (autoScale이 여백 없이 적절히 조정)
})); 