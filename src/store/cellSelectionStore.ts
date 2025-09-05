import { create } from 'zustand';

export interface CellSelectionStore {
  // 선택된 셀들의 ID 목록
  selectedCellIds: Set<string>;
  
  // 드래그 선택 상태
  isDragSelecting: boolean;
  dragStartPoint: { x: number; y: number } | null;
  dragEndPoint: { x: number; y: number } | null;
  
  // 액션들
  selectCell: (cellId: string, isCtrlPressed?: boolean) => void;
  selectCellsInRange: (cellIds: string[]) => void;
  deselectCell: (cellId: string) => void;
  clearSelection: () => void;
  toggleCellSelection: (cellId: string) => void;
  
  // 드래그 선택 관련
  startDragSelection: (x: number, y: number) => void;
  updateDragSelection: (x: number, y: number) => void;
  endDragSelection: () => void;
  
  // 유틸리티
  isSelected: (cellId: string) => boolean;
  getSelectedCount: () => number;
  getSelectedCells: () => string[];
}

export const useCellSelectionStore = create<CellSelectionStore>((set, get) => ({
  selectedCellIds: new Set(),
  isDragSelecting: false,
  dragStartPoint: null,
  dragEndPoint: null,
  
  selectCell: (cellId, isCtrlPressed = false) => {
    set((state) => {
      const newSelected = new Set(state.selectedCellIds);
      
      if (isCtrlPressed) {
        // Ctrl 키를 누르고 있으면 토글
        if (newSelected.has(cellId)) {
          newSelected.delete(cellId);
        } else {
          newSelected.add(cellId);
        }
      } else {
        // Ctrl 키를 누르지 않았으면 새로 선택
        newSelected.clear();
        newSelected.add(cellId);
      }
      
      return { selectedCellIds: newSelected };
    });
  },
  
  selectCellsInRange: (cellIds) => {
    set((state) => {
      const newSelected = new Set(state.selectedCellIds);
      cellIds.forEach(id => newSelected.add(id));
      return { selectedCellIds: newSelected };
    });
  },
  
  deselectCell: (cellId) => {
    set((state) => {
      const newSelected = new Set(state.selectedCellIds);
      newSelected.delete(cellId);
      return { selectedCellIds: newSelected };
    });
  },
  
  clearSelection: () => {
    set({ selectedCellIds: new Set() });
  },
  
  toggleCellSelection: (cellId) => {
    set((state) => {
      const newSelected = new Set(state.selectedCellIds);
      if (newSelected.has(cellId)) {
        newSelected.delete(cellId);
      } else {
        newSelected.add(cellId);
      }
      return { selectedCellIds: newSelected };
    });
  },
  
  startDragSelection: (x, y) => {
    set({
      isDragSelecting: true,
      dragStartPoint: { x, y },
      dragEndPoint: { x, y }
    });
  },
  
  updateDragSelection: (x, y) => {
    set(() => ({
      dragEndPoint: { x, y }
    }));
  },
  
  endDragSelection: () => {
    set({
      isDragSelecting: false,
      dragStartPoint: null,
      dragEndPoint: null
    });
  },
  
  isSelected: (cellId) => {
    return get().selectedCellIds.has(cellId);
  },
  
  getSelectedCount: () => {
    return get().selectedCellIds.size;
  },
  
  getSelectedCells: () => {
    return Array.from(get().selectedCellIds);
  }
})); 