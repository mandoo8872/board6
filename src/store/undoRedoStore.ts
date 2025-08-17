import { create } from 'zustand';
import { CanvasSnapshot, UndoRedoState } from '../types';

interface UndoRedoStore extends UndoRedoState {
  // 스냅샷 추가 (미래 히스토리 절단, 중복 방지)
  pushSnapshot: (snapshot: CanvasSnapshot) => void;
  // 이동
  undo: () => CanvasSnapshot | null;
  redo: () => CanvasSnapshot | null;
  // 현재 스냅샷 바로 설정(초기화 등)
  setInitialSnapshot: (snapshot: CanvasSnapshot) => void;
  // 상태 확인
  canUndo: () => boolean;
  canRedo: () => boolean;
  // 전체 초기화
  clear: () => void;
  // 복원 중 여부 (복원 중에는 push 금지)
  isRestoring: boolean;
  setRestoring: (restoring: boolean) => void;
}

// 스냅샷 동등성 비교: timestamp 등 비본질 필드는 무시
const normalizeSnapshot = (s: CanvasSnapshot) => ({
  textObjects: s.textObjects,
  imageObjects: s.imageObjects,
  floorImage: s.floorImage,
  selectedObjectId: s.selectedObjectId ?? null,
  // 선택 셀은 순서에 덜 민감하므로 정렬하여 비교 안정화
  selectedCellIds: Array.isArray(s.selectedCellIds)
    ? [...s.selectedCellIds].slice().sort()
    : [],
});

const deepEqual = (a: CanvasSnapshot, b: CanvasSnapshot) => {
  try {
    return JSON.stringify(normalizeSnapshot(a)) === JSON.stringify(normalizeSnapshot(b));
  } catch {
    return false;
  }
};

export const useUndoRedoStore = create<UndoRedoStore>((set, get) => ({
  history: [],
  cursor: -1,
  isRestoring: false,

  setInitialSnapshot: (snapshot) => {
    set({ history: [snapshot], cursor: 0 });
  },

  pushSnapshot: (snapshot) => {
    const { history, cursor, isRestoring } = get();

    if (isRestoring) return; // 복원 중에는 기록하지 않음

    // 중복 방지: 현재 스냅샷과 동일하면 무시
    if (cursor >= 0 && cursor < history.length) {
      const current = history[cursor];
      if (deepEqual(current, snapshot)) return;
    }

    // 미래 히스토리 절단 후 추가
    const trimmed = history.slice(0, cursor + 1);
    const newHistory = [...trimmed, snapshot];
    const newCursor = newHistory.length - 1;

    set({ history: newHistory, cursor: newCursor });
  },

  undo: () => {
    const { history, cursor } = get();
    if (cursor <= 0) return null; // 경계 보호

    // 초기 빈 보드로의 복원을 방지하기 위한 최소 커서 계산
    const isEmptySnapshot = (s: CanvasSnapshot) =>
      (!s.floorImage) && (s.textObjects?.length === 0) && (s.imageObjects?.length === 0);
    const firstNonEmptyIndex = history.findIndex((s) => !isEmptySnapshot(s));
    const minAllowedCursor = firstNonEmptyIndex === -1 ? 0 : firstNonEmptyIndex;

    const candidate = cursor - 1;
    if (candidate < minAllowedCursor) return null; // 초기값(컨텐츠 로드 전)로는 이동 금지

    set({ cursor: candidate });
    return history[candidate] || null;
  },

  redo: () => {
    const { history, cursor } = get();
    if (cursor < 0 || cursor >= history.length - 1) return null; // 경계 보호
    const newCursor = cursor + 1;
    set({ cursor: newCursor });
    return history[newCursor] || null;
  },

  canUndo: () => {
    const { history, cursor } = get();
    if (cursor <= 0) return false;
    const isEmptySnapshot = (s: CanvasSnapshot) =>
      (!s.floorImage) && (s.textObjects?.length === 0) && (s.imageObjects?.length === 0);
    const firstNonEmptyIndex = history.findIndex((s) => !isEmptySnapshot(s));
    const minAllowedCursor = firstNonEmptyIndex === -1 ? 0 : firstNonEmptyIndex;
    return cursor - 1 >= minAllowedCursor;
  },

  canRedo: () => {
    const { history, cursor } = get();
    return cursor >= 0 && cursor < history.length - 1;
  },

  clear: () => {
    set({ history: [], cursor: -1 });
  },

  setRestoring: (restoring) => set({ isRestoring: restoring })
}));