import { CanvasSnapshot } from '../types';
import { useAdminConfigStore } from '../store/adminConfigStore';
import { useEditorStore } from '../store/editorStore';
import { useCellSelectionStore } from '../store/cellSelectionStore';
import { useUndoRedoStore } from '../store/undoRedoStore';
import { flags } from '../flags';

// Import adminConfigStore to access flushDocumentState
const getAdminConfigStore = () => useAdminConfigStore.getState();

export const createCurrentSnapshot = (): CanvasSnapshot => {
  const { textObjects, imageObjects, floorImage } = useAdminConfigStore.getState();
  const selectedObjectId = useEditorStore.getState().selectedObjectId ?? null;
  const selectedCellIds = useCellSelectionStore.getState().getSelectedCells();

  // 엑셀 셀 그룹 객체들을 스냅샷에서 제외 (undo/redo에서 제외)
  const nonExcelTextObjects = textObjects.filter(obj =>
    !obj.groupId || !obj.groupId.startsWith('excel-input-')
  );

  return {
    textObjects: JSON.parse(JSON.stringify(nonExcelTextObjects)),
    imageObjects: JSON.parse(JSON.stringify(imageObjects)),
    floorImage: floorImage ? JSON.parse(JSON.stringify(floorImage)) : null,
    selectedObjectId,
    selectedCellIds,
    timestamp: Date.now()
  };
};

let snapshotDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let snapshotLastFlush = 0;

export const queueSnapshotPush = (delayMs?: number): void => {
  const debounceMs = flags.lowLatencyMode ? flags.saveDebounceMs : (delayMs ?? 150);
  const maxWaitMs = 2000;
  if (snapshotDebounceTimer) clearTimeout(snapshotDebounceTimer);
  const now = Date.now();
  if (now - snapshotLastFlush >= maxWaitMs) {
    snapshotLastFlush = now;
    const { isRestoring } = useUndoRedoStore.getState();
    if (!isRestoring) {
      // Use integrated flush with snapshot creation
      getAdminConfigStore().flushDocumentState(true, () => {
        useUndoRedoStore.getState().pushSnapshot(createCurrentSnapshot());
      });
    }
    return;
  }
  snapshotDebounceTimer = setTimeout(() => {
    snapshotLastFlush = Date.now();
    const { isRestoring } = useUndoRedoStore.getState();
    if (!isRestoring) {
      // Use integrated flush with snapshot creation
      getAdminConfigStore().flushDocumentState(true, () => {
        useUndoRedoStore.getState().pushSnapshot(createCurrentSnapshot());
      });
    }
  }, debounceMs);
};

export const pushSnapshotImmediate = (): void => {
  const { isRestoring } = useUndoRedoStore.getState();
  if (isRestoring) return;

  // Use integrated flush with snapshot creation for immediate snapshots
  getAdminConfigStore().flushDocumentState(true, () => {
    useUndoRedoStore.getState().pushSnapshot(createCurrentSnapshot());
  });
};

// Cancel any pending debounced snapshot push to avoid trimming redo history after undo/redo
export const cancelQueuedSnapshotPush = (): void => {
  if (snapshotDebounceTimer) {
    clearTimeout(snapshotDebounceTimer);
    snapshotDebounceTimer = null;
  }
};

// flush on unload
if (typeof window !== 'undefined') {
  const flush = () => {
    if (snapshotDebounceTimer) {
      clearTimeout(snapshotDebounceTimer);
      snapshotDebounceTimer = null;
    }
    try { pushSnapshotImmediate(); } catch {}
  };
  window.addEventListener('beforeunload', flush);
}


