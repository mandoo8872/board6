import { create } from 'zustand';
import { useAdminConfigStore } from './adminConfigStore';

// perfect-freehand를 위한 포인트 타입
export interface PressurePoint {
  x: number;
  y: number;
  pressure?: number;
  tiltX?: number;
  tiltY?: number;
}

export interface DrawStore {
  currentStroke: number[];
  currentPressureStroke: PressurePoint[]; // perfect-freehand용 압력 데이터
  isDrawing: boolean;
  
  // 필기 설정
  penColor: string;
  penWidth: number;
  usePerfectFreehand: boolean; // perfect-freehand 사용 여부
  
  // 액션 추적
  lastActionTime: number;
  
  // 기본 색상 팔레트
  defaultColors: string[];
  
  // 액션들
  addPoint: (x: number, y: number, pressure?: number, tiltX?: number, tiltY?: number) => void;
  startStroke: () => void;
  endStroke: () => void;
  clearCurrentStroke: () => void;
  
  // 설정 관련
  setPenColor: (color: string) => void;
  setPenWidth: (width: number) => void;
  setUsePerfectFreehand: (use: boolean) => void;
  updateLastActionTime: () => void;
  
  // DB 설정 동기화
  syncWithDBSettings: () => void;
}

export const useDrawStore = create<DrawStore>((set) => ({
  currentStroke: [],
  currentPressureStroke: [],
  isDrawing: false,
  
  // 필기 설정
  penColor: '#000000', // 기본 검은색
  penWidth: 3,
  usePerfectFreehand: true, // 기본적으로 perfect-freehand 사용
  
  // 액션 추적
  lastActionTime: 0,
  
  // 기본 색상 팔레트 (2x5)
  defaultColors: [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#A52A2A'
  ],
  
  addPoint: (x, y, _pressure = 0.7, tiltX = 0, tiltY = 0) => set((state) => ({
    currentStroke: [...state.currentStroke, x, y],
    currentPressureStroke: [...state.currentPressureStroke, { x, y, pressure: 0.7, tiltX, tiltY }]
  })),
  
  startStroke: () => set({ 
    isDrawing: true, 
    currentStroke: [] 
  }),
  
  endStroke: () => set({ 
    isDrawing: false 
  }),
  
  clearCurrentStroke: () => set({ 
    currentStroke: [],
    currentPressureStroke: []
  }),
  
  setPenColor: (color) => set({ penColor: color }),
  setPenWidth: (width) => set({ penWidth: width }),
  setUsePerfectFreehand: (use) => set({ usePerfectFreehand: use }),
  updateLastActionTime: () => set({ lastActionTime: Date.now() }),
  
  // DB 설정과 동기화
  syncWithDBSettings: () => {
    const { settings } = useAdminConfigStore.getState();
    if (settings?.view?.usePerfectFreehand !== undefined) {
      set({ usePerfectFreehand: settings.view.usePerfectFreehand });
    }
  },
})); 