import { useCallback } from 'react';
import { useUndoRedoStore } from '../store/undoRedoStore';
import { useAdminConfigStore } from '../store/adminConfigStore';
import { useEditorStore } from '../store/editorStore';
import { useCellSelectionStore } from '../store/cellSelectionStore';
import { CanvasSnapshot } from '../types';

export const useUndoRedo = () => {
  const { pushSnapshot, undo, redo, canUndo, canRedo, setInitialSnapshot, setRestoring } = useUndoRedoStore();
  
  const {
    textObjects,
    imageObjects,
    floorImage
  } = useAdminConfigStore();

  // 현재 캔버스 상태로 스냅샷 생성 (Draw 상태 제외)
  const createSnapshot = useCallback((): CanvasSnapshot => {
    const selectedObjectId = useEditorStore.getState().selectedObjectId ?? null;
    const selectedCells = useCellSelectionStore.getState().getSelectedCells();
    return {
      textObjects: JSON.parse(JSON.stringify(textObjects)),
      imageObjects: JSON.parse(JSON.stringify(imageObjects)),
      floorImage: floorImage ? JSON.parse(JSON.stringify(floorImage)) : null,
      selectedObjectId,
      selectedCellIds: selectedCells,
      timestamp: Date.now()
    };
  }, [textObjects, imageObjects, floorImage]);

  // 스냅샷을 캔버스에 복원 (Draw 상태 유지)
  const restoreSnapshot = useCallback(async (snapshot: CanvasSnapshot) => {
    try {
      // 기존 스냅샷 데이터 마이그레이션 처리 (drawObjects가 있을 수 있음)
      const safeSnapshot = {
        textObjects: snapshot.textObjects || [],
        imageObjects: snapshot.imageObjects || [],
        floorImage: snapshot.floorImage || null
      };

      // Firebase 리스너를 일시적으로 중단하여 무한 루프 방지
      const adminConfigStore = useAdminConfigStore.getState();
      
      // Draw 상태를 제외한 객체 상태만 복원
      adminConfigStore.textObjects = safeSnapshot.textObjects;
      adminConfigStore.imageObjects = safeSnapshot.imageObjects;
      adminConfigStore.floorImage = safeSnapshot.floorImage;
      
      // 상태 강제 업데이트 (Draw 상태 제외)
      useAdminConfigStore.setState({
        textObjects: safeSnapshot.textObjects,
        imageObjects: safeSnapshot.imageObjects,
        floorImage: safeSnapshot.floorImage
      });

      // 선택 상태 복원 (객체/셀)
      if (typeof snapshot.selectedObjectId !== 'undefined') {
        useEditorStore.setState({ selectedObjectId: snapshot.selectedObjectId ?? null });
      }
      if (Array.isArray(snapshot.selectedCellIds)) {
        const setSelection = new Set<string>(snapshot.selectedCellIds);
        useCellSelectionStore.setState({ selectedCellIds: setSelection });
      }
      
    } catch (error) {
      console.error('스냅샷 복원 실패:', error);
    }
  }, []);

  // 현재 상태를 스냅샷으로 저장
  const saveSnapshot = useCallback(() => {
    // 이벤트 연속 발생에 의한 과도한 스냅샷 방지: microtask로 모아 중복 필터만 통과
    const snapshot = createSnapshot();
    pushSnapshot(snapshot);
  }, [createSnapshot, pushSnapshot]);

  // Undo 실행
  const executeUndo = useCallback(async () => {
    setRestoring(true);
    try {
      const snapshot = undo();
      if (snapshot) {
        await restoreSnapshot(snapshot);
      }
    } finally {
      setRestoring(false);
    }
  }, [undo, restoreSnapshot, setRestoring]);

  // Redo 실행
  const executeRedo = useCallback(async () => {
    setRestoring(true);
    try {
      const snapshot = redo();
      if (snapshot) {
        await restoreSnapshot(snapshot);
      }
    } finally {
      setRestoring(false);
    }
  }, [redo, restoreSnapshot, setRestoring]);

  // 초기 상태 설정
  const initializePresent = useCallback(() => {
    const snapshot = createSnapshot();
    setInitialSnapshot(snapshot);
  }, [createSnapshot, setInitialSnapshot]);

  return {
    saveSnapshot,
    executeUndo,
    executeRedo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    initializePresent
  };
};