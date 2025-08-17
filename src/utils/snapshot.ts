import { CanvasSnapshot } from '../types';
import { useAdminConfigStore } from '../store/adminConfigStore';
import { useEditorStore } from '../store/editorStore';
import { useCellSelectionStore } from '../store/cellSelectionStore';
import { useUndoRedoStore } from '../store/undoRedoStore';

export const createCurrentSnapshot = (): CanvasSnapshot => {
  const { textObjects, imageObjects, floorImage } = useAdminConfigStore.getState();
  const selectedObjectId = useEditorStore.getState().selectedObjectId ?? null;
  const selectedCellIds = useCellSelectionStore.getState().getSelectedCells();

  return {
    textObjects: JSON.parse(JSON.stringify(textObjects)),
    imageObjects: JSON.parse(JSON.stringify(imageObjects)),
    floorImage: floorImage ? JSON.parse(JSON.stringify(floorImage)) : null,
    selectedObjectId,
    selectedCellIds,
    timestamp: Date.now()
  };
};

let snapshotDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const queueSnapshotPush = (delayMs: number = 150): void => {
  if (snapshotDebounceTimer) {
    clearTimeout(snapshotDebounceTimer);
  }
  snapshotDebounceTimer = setTimeout(() => {
    const { pushSnapshot, isRestoring } = useUndoRedoStore.getState();
    if (isRestoring) return;
    pushSnapshot(createCurrentSnapshot());
  }, delayMs);
};

export const pushSnapshotImmediate = (): void => {
  const { pushSnapshot, isRestoring } = useUndoRedoStore.getState();
  if (isRestoring) return;
  pushSnapshot(createCurrentSnapshot());
};


