import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdminConfigStore } from '../../../../store/adminConfigStore';
import { useEditorStore } from '../../../../store/editorStore';
import { useCellSelectionStore } from '../../../../store/cellSelectionStore';
import { TextObject } from '../../../../types';
import { useUndoRedo } from '../../../../hooks/useUndoRedo';
import { queueSnapshotPush, pushSnapshotImmediate } from '../../../../utils/snapshot';
import { useDragState } from './useDragState';
import { useResizeState } from './useResizeState';
import { useInlineEdit } from './useInlineEdit';
import { useDeviceDetection } from './useDeviceDetection';
import { useClipboard } from './useClipboard';
import { useObjectSelection } from './useObjectSelection';
import {
  getCanvasCoordinates,
  getCanvasScale,
  applyGridSnap,
  calculateDragPosition,
  calculateResizeDeltas,
  validatePositionAndSize,
  calculateResize,
  handleContextMenu,
  handleKeyDown,
  calculateCellRange,
  handlePointerCapture
} from '../utils';
import { findSnapCandidate } from '../utils/snapV2';
import { flags } from '../../../../flags';
import { useCanvasStore } from '../../../../store/canvasStore';
import { TextObjectData } from '../types';

interface ClickState {
  clickCount: number;
  clickTimer: ReturnType<typeof setTimeout> | null;
}

export function useCanvasInteractions(isViewPage: boolean) {
  const {
    textObjects,
    imageObjects,
    updateTextObject,
    updateImageObject,
    deleteTextObject,
    deleteImageObject,
    addTextObject,
    addImageObject,
    settings
  } = useAdminConfigStore();

  const {
    selectedObjectId,
    // hoveredObjectId,
    currentTool,
    setSelectedObjectId,
    setHoveredObjectId,
  } = useEditorStore();

  const { updatePointerEventTime, isGhostClick, isIPhone } = useDeviceDetection();
  const { dragState, startDrag, updateDragPosition, endDrag, isDraggingObject } = useDragState();
  const { stepSnapDuringDrag, setSnapPreview, clearSnapPreview } = useCanvasStore();
  const { resizeState, startResize, updateResize, endResize, isResizingObject } = useResizeState();
  const { handleClipboardPaste } = useClipboard(addImageObject, addTextObject, settings);
  const { saveSnapshot, executeUndo, executeRedo, initializePresent } = useUndoRedo();
  const {
    editingObjectId,
    editingText,
    startInlineEdit,
    finishInlineEdit,
    cancelInlineEdit,
    updateEditingText
  } = useInlineEdit(updateTextObject, setSelectedObjectId, isViewPage);
  const {
    handleDuplicateObject,
    handleDeleteObject,
    handleBulkClearCellText
  } = useObjectSelection(
    textObjects,
    imageObjects,
    deleteTextObject,
    deleteImageObject,
    addTextObject,
    addImageObject,
    updateTextObject,
    setSelectedObjectId
  );

  const [clickState, setClickState] = useState<ClickState>({ clickCount: 0, clickTimer: null });

  // 최초 마운트 시에만 초기 스냅샷 설정 (기존 동작과 동일)
  useEffect(() => {
    const timer = setTimeout(() => {
      initializePresent();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const onCanvasKeyDown = useCallback((e: React.KeyboardEvent) => {

    // 인라인 편집 중에는 캔버스 키보드 이벤트를 처리하지 않음
    // (텍스트 편집기에서 처리하도록 함)
    if (editingObjectId) {
      // 화살표 키는 텍스트 편집기에서 처리되도록 함
      // 다른 키들도 텍스트 편집기에서 처리되도록 함
      return;
    }
    
    // 화살표 키로 객체 이동 (1px 단위)
    if (selectedObjectId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      
      const selectedTextObj = textObjects.find(obj => obj.id === selectedObjectId);
      const selectedImageObj = imageObjects.find(obj => obj.id === selectedObjectId);
      const selectedObj = selectedTextObj || selectedImageObj;
      
      if (!selectedObj || !selectedObj.permissions?.movable) return;
      
      const moveDistance = e.shiftKey ? 10 : 1; // Shift + 화살표 = 10px, 일반 화살표 = 1px
      let newX = selectedObj.x;
      let newY = selectedObj.y;
      
      switch (e.key) {
        case 'ArrowUp':
          newY -= moveDistance;
          break;
        case 'ArrowDown':
          newY += moveDistance;
          break;
        case 'ArrowLeft':
          newX -= moveDistance;
          break;
        case 'ArrowRight':
          newX += moveDistance;
          break;
      }
      
      // 경계 체크 (캔버스 밖으로 나가지 않도록)
      const minX = 0;
      const maxX = 2160 - selectedObj.width;
      const minY = 0;
      const maxY = 3840 - selectedObj.height;
      
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
      
      // 객체 업데이트
      if (selectedTextObj) {
        updateTextObject(selectedObjectId, { x: newX, y: newY });
      } else if (selectedImageObj) {
        updateImageObject(selectedObjectId, { x: newX, y: newY });
      }
      
      return;
    }
    
    if (e.ctrlKey && e.key === 'v') {
      try { e.preventDefault(); } catch (error) { console.debug('preventDefault failed in global keydown handler:', error); }
      handleClipboardPaste();
      return;
    }
    if (isViewPage) return;
    if (e.ctrlKey && e.key === 'z') {
      try { e.preventDefault(); } catch (error) { console.debug('preventDefault failed in global keydown handler:', error); }
      executeUndo();
      return;
    }
    if (e.ctrlKey && e.key === 'y') {
      try { e.preventDefault(); } catch (error) { console.debug('preventDefault failed in global keydown handler:', error); }
      executeRedo();
      return;
    }
    if (e.ctrlKey && e.key === 'd') {
      try { e.preventDefault(); } catch (error) { console.debug('preventDefault failed in global keydown handler:', error); }
      if (selectedObjectId) {
        handleDuplicateObject(selectedObjectId);
      }
    }
    if (e.key === 'Delete') {
      try { e.preventDefault(); } catch (error) { console.debug('preventDefault failed in global keydown handler:', error); }
      const selectedCells = useCellSelectionStore.getState().getSelectedCells();
      if (selectedCells.length > 0) {
        handleBulkClearCellText();
        return;
      }
      if (selectedObjectId) {
        handleDeleteObject(selectedObjectId).then(() => {
          saveSnapshot();
        });
      }
    }
  }, [editingObjectId, isViewPage, selectedObjectId, textObjects, imageObjects, updateTextObject, updateImageObject, handleDuplicateObject, handleBulkClearCellText, handleDeleteObject, saveSnapshot, executeUndo, executeRedo, handleClipboardPaste]);

  const onPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    // 제스처 시작 가드: undo/redo flush barrier 진행 중이면 차단
    const { lastFlushPromise, pendingBarrier } = useAdminConfigStore.getState() as any;
    if (pendingBarrier || lastFlushPromise) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    updatePointerEventTime(e.timeStamp);
    e.stopPropagation();
    
    // 인라인 편집 중인 경우
    if (editingObjectId) {
      // 다른 객체를 클릭한 경우에만 편집 종료
      if (editingObjectId !== id) {
        finishInlineEdit().then(() => { pushSnapshotImmediate(); });
      }
      // 같은 객체를 클릭한 경우는 편집 계속 (커서 이동 등)
      // preventDefault를 호출하지 않아서 텍스트 편집기의 기본 동작 허용
      return;
    }
    
    // iPhone 터치에서는 preventDefault를 과하게 걸면 포인터 흐름이 끊길 수 있어 마우스에만 적용
    const isIPhoneDevice = isIPhone();
    if (e.pointerType === 'mouse') {
      e.preventDefault();
    }
    
    const obj = textObjects.find(o => o.id === id) || imageObjects.find(o => o.id === id);
    if (!obj) return;
    setSelectedObjectId(id);
    setHoveredObjectId(null);
    if (!obj.permissions?.movable) {
      return;
    }
    // 터치에서도 pointer capture를 설정해 드래그 세션 안정화 (iOS에서 간헐적 move 누락 방지)
    handlePointerCapture(e, isIPhoneDevice, 'set');
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    startDrag(id, offset, { x: obj.x, y: obj.y });
    // rAF 드래그 루프를 즉시 시작해 첫 프레임부터 움직임 반영
    if (flags.useSnapRafCoalescing) {
      lastMoveRef.current = { x: e.clientX, y: e.clientY };
      prevCandidateRef.current = null;
      lastPreviewCenterRef.current = null;
      clearSnapPreview();
      if (!rafActiveRef.current) {
        rafActiveRef.current = true;
      }
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(runRafTick);
      }
    }
  }, [updatePointerEventTime, isIPhone, editingObjectId, finishInlineEdit, textObjects, imageObjects, setSelectedObjectId, setHoveredObjectId, startDrag]);

  const onResizePointerDown = useCallback((e: React.PointerEvent, handle: string, objectId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const obj = textObjects.find(o => o.id === objectId) || imageObjects.find(o => o.id === objectId);
    if (!obj || !obj.permissions?.resizable) return;
    startResize(
      objectId,
      handle as any,
      { x: e.clientX, y: e.clientY },
      { width: obj.width, height: obj.height },
      { x: obj.x, y: obj.y }
    );
  }, [textObjects, imageObjects, startResize]);

  // --- rAF coalescing state ---
  const lastMoveRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const rafActiveRef = useRef(false);
  const prevCandidateRef = useRef<{ x: number; y: number } | null>(null);
  const lastPreviewCenterRef = useRef<{ x: number; y: number } | null>(null);

  // latest refs to avoid stale closures inside rAF loop
  const dragRef = useRef(dragState);
  const resizeRef = useRef(resizeState);
  const textObjectsRef = useRef(textObjects);
  const imageObjectsRef = useRef(imageObjects);
  const settingsRef = useRef(settings);
  const stepSnapRef = useRef(stepSnapDuringDrag);

  useEffect(() => { dragRef.current = dragState; }, [dragState]);
  useEffect(() => { resizeRef.current = resizeState; }, [resizeState]);
  useEffect(() => { textObjectsRef.current = textObjects; }, [textObjects]);
  useEffect(() => { imageObjectsRef.current = imageObjects; }, [imageObjects]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { stepSnapRef.current = stepSnapDuringDrag; }, [stepSnapDuringDrag]);

  const runRafTick = useCallback(() => {
    if (!rafActiveRef.current) { rafIdRef.current = null; return; }
    rafIdRef.current = null;
    const last = lastMoveRef.current;
    if (!last) {
      // schedule next frame to keep loop alive during drag
      rafIdRef.current = requestAnimationFrame(runRafTick);
      return;
    }
    const resolveCanvasContainer = (): HTMLElement | null => {
      const qs = document.querySelector('[data-canvas-container]') as HTMLElement | null;
      return qs;
    };
    const drag = dragRef.current;
    const resize = resizeRef.current;
    const txt = textObjectsRef.current;
    const imgs = imageObjectsRef.current;
    const cfg = settingsRef.current;
    // const stepSnap = stepSnapRef.current;

    if (drag.isDragging && drag.draggedObjectId) {
      const canvasContainer = resolveCanvasContainer();
      if (canvasContainer) {
        const mousePosition = getCanvasCoordinates(last.x, last.y, canvasContainer);
        const scale = getCanvasScale(canvasContainer);
        const newPosition = calculateDragPosition(mousePosition, drag.offset, scale);
        // const gridSnapEnabled = cfg?.admin?.gridSnapEnabled ?? false;
        // const gridSize = cfg?.admin?.gridSize ?? 32;
        const obj = txt.find(o => o.id === drag.draggedObjectId) || imgs.find(o => o.id === drag.draggedObjectId);
        const sizeForSnap = obj ? { width: obj.width, height: obj.height } : undefined;
        const worldToScreen = (p: { x: number; y: number }) => ({ x: p.x * scale, y: p.y * scale });
        const anchor = sizeForSnap ? { x: newPosition.x + sizeForSnap.width / 2, y: newPosition.y + sizeForSnap.height / 2 } : newPosition;
        const candidate = findSnapCandidate(anchor as any, worldToScreen, scale, prevCandidateRef.current, 0, 1.4);
        // Preview overlay: update only on candidate change
        if (candidate && sizeForSnap) {
          const same = lastPreviewCenterRef.current && lastPreviewCenterRef.current.x === candidate.x && lastPreviewCenterRef.current.y === candidate.y;
          if (!same) {
            setSnapPreview({ center: candidate, rect: { x: candidate.x - sizeForSnap.width / 2, y: candidate.y - sizeForSnap.height / 2, w: sizeForSnap.width, h: sizeForSnap.height } });
            lastPreviewCenterRef.current = candidate;
          }
        } else {
          if (lastPreviewCenterRef.current) {
            clearSnapPreview();
            lastPreviewCenterRef.current = null;
          }
        }
        // Hysteresis tracking
        prevCandidateRef.current = candidate;
        // Position update: step mode only immediate snap (kept as existing behavior)
        // v2: 드래그 중에는 스냅하지 않고 미리보기만, 위치는 자유 이동
        const { position: finalPosition } = { position: newPosition } as any;
        const { position: safePosition } = validatePositionAndSize(finalPosition, undefined, obj ? { x: obj.x, y: obj.y } : undefined);
        updateDragPosition(safePosition);
      }
    }
    if (resize.isResizing && resize.resizedObjectId) {
      const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement | null;
      if (canvasContainer) {
        const mousePosition = getCanvasCoordinates(last.x, last.y, canvasContainer);
        const startMousePosition = getCanvasCoordinates(resize.startPosition.x, resize.startPosition.y, canvasContainer);
        const deltas = calculateResizeDeltas(mousePosition, startMousePosition);
        const resizingImageObj = imgs.find(obj => obj.id === resize.resizedObjectId);
        const shouldMaintainAspectRatio = resizingImageObj?.maintainAspectRatio || false;
        const originalAspectRatio = resizingImageObj ? resize.startSize.width / resize.startSize.height : 1;
        const resizingTextObj = txt.find(obj => obj.id === resize.resizedObjectId);
        const objectType = resizingTextObj?.hasCheckbox ? 'checkbox' : 
                          resizingTextObj ? 'text' : 'image';
        const resizeResult = calculateResize({
          handle: resize.resizeHandle as any,
          deltaX: deltas.x,
          deltaY: deltas.y,
          startSize: resize.startSize,
          startPosition: resize.startObjectPosition,
          maintainAspectRatio: shouldMaintainAspectRatio,
          originalAspectRatio,
          objectType
        });
        const gridSnapEnabled = cfg?.admin?.gridSnapEnabled ?? false;
        const gridSize = cfg?.admin?.gridSize ?? 32;
        const { position: finalPosition, size: finalSize } = applyGridSnap(
          { x: resizeResult.newX, y: resizeResult.newY },
          { width: resizeResult.newWidth, height: resizeResult.newHeight },
          gridSnapEnabled,
          gridSize
        );
        const validated = validatePositionAndSize(finalPosition, finalSize);
        if (validated.size) {
          updateResize(validated.size, validated.position);
        }
      }
    }
    // schedule next frame if still active
    if (rafActiveRef.current) {
      rafIdRef.current = requestAnimationFrame(runRafTick);
    }
  }, [dragState, resizeState, settings, textObjects, imageObjects, stepSnapDuringDrag, updateDragPosition, updateResize]);

  // removed in low-latency mode; legacy path retained for reference behind comment
  /* const onPointerMoveImpl = useCallback((e: React.PointerEvent) => {
    const resolveCanvasContainer = (): HTMLElement | null => {
      const ct = (e.currentTarget as any);
      if (ct && typeof ct.closest === 'function') {
        const el = ct.closest('[data-canvas-container]') as HTMLElement | null;
        if (el) return el;
      }
      const tg = (e.target as any);
      if (tg && typeof tg.closest === 'function') {
        const el = tg.closest('[data-canvas-container]') as HTMLElement | null;
        if (el) return el;
      }
      const qs = document.querySelector('[data-canvas-container]') as HTMLElement | null;
      return qs;
    };

    if (dragState.isDragging && dragState.draggedObjectId) {
      const canvasContainer = resolveCanvasContainer();
      if (!canvasContainer) return;
      const mousePosition = getCanvasCoordinates(e.clientX, e.clientY, canvasContainer);
      const scale = getCanvasScale(canvasContainer);
      const newPosition = calculateDragPosition(mousePosition, dragState.offset, scale);
      const gridSnapEnabled = settings?.admin?.gridSnapEnabled ?? false;
      const gridSize = settings?.admin?.gridSize ?? 32;
      const obj = textObjects.find(o => o.id === dragState.draggedObjectId) || imageObjects.find(o => o.id === dragState.draggedObjectId);
      // 객체 중심 스냅을 적용하려면 size를 함께 전달해야 함
      const sizeForSnap = obj ? { width: obj.width, height: obj.height } : undefined;
      // v2 미리보기 후보 계산 (화면 좌표 기반)
      const worldToScreen = (p: { x: number; y: number }) => ({ x: p.x * scale, y: p.y * scale });
      const anchor = sizeForSnap ? { x: newPosition.x + sizeForSnap.width / 2, y: newPosition.y + sizeForSnap.height / 2 } : newPosition;
      const candidate = findSnapCandidate(anchor as any, worldToScreen, scale, prevCandidateRef.current, 16, 1.5);
      if (candidate && sizeForSnap) {
        const same = lastPreviewCenterRef.current && lastPreviewCenterRef.current.x === candidate.x && lastPreviewCenterRef.current.y === candidate.y;
        if (!same) {
          setSnapPreview({ center: candidate, rect: { x: candidate.x - sizeForSnap.width / 2, y: candidate.y - sizeForSnap.height / 2, w: sizeForSnap.width, h: sizeForSnap.height } });
          lastPreviewCenterRef.current = candidate;
        }
      } else {
        if (lastPreviewCenterRef.current) {
          clearSnapPreview();
          lastPreviewCenterRef.current = null;
        }
      }
      prevCandidateRef.current = candidate;
      const { position: finalPosition } = (stepSnapDuringDrag || (settings?.admin?.stepSnapDuringDrag ?? false))
        ? applyGridSnap(newPosition, sizeForSnap as any, gridSnapEnabled, gridSize)
        : { position: newPosition } as any;
      const { position: safePosition } = validatePositionAndSize(finalPosition, undefined, obj ? { x: obj.x, y: obj.y } : undefined);
      updateDragPosition(safePosition);
    }
    if (resizeState.isResizing && resizeState.resizedObjectId) {
      const canvasContainer = resolveCanvasContainer();
      if (!canvasContainer) return;
      const mousePosition = getCanvasCoordinates(e.clientX, e.clientY, canvasContainer);
      const startMousePosition = getCanvasCoordinates(resizeState.startPosition.x, resizeState.startPosition.y, canvasContainer);
      const deltas = calculateResizeDeltas(mousePosition, startMousePosition);
      const resizingImageObj = imageObjects.find(obj => obj.id === resizeState.resizedObjectId);
      const shouldMaintainAspectRatio = resizingImageObj?.maintainAspectRatio || false;
      const originalAspectRatio = resizingImageObj ? resizeState.startSize.width / resizeState.startSize.height : 1;
      // 객체 타입 결정
      const resizingTextObj = textObjects.find(obj => obj.id === resizeState.resizedObjectId);
      const objectType = resizingTextObj?.hasCheckbox ? 'checkbox' : 
                        resizingTextObj ? 'text' : 'image';
      
      const resizeResult = calculateResize({
        handle: resizeState.resizeHandle as any,
        deltaX: deltas.x,
        deltaY: deltas.y,
        startSize: resizeState.startSize,
        startPosition: resizeState.startObjectPosition,
        maintainAspectRatio: shouldMaintainAspectRatio,
        originalAspectRatio,
        objectType
      });
      const gridSnapEnabled = settings?.admin?.gridSnapEnabled ?? false;
      const gridSize = settings?.admin?.gridSize ?? 32;
      const { position: finalPosition, size: finalSize } = applyGridSnap(
        { x: resizeResult.newX, y: resizeResult.newY },
        { width: resizeResult.newWidth, height: resizeResult.newHeight },
        gridSnapEnabled,
        gridSize
      );
      const validated = validatePositionAndSize(finalPosition, finalSize);
      if (validated.size) {
        updateResize(validated.size, validated.position);
      }
    }
  }, [dragState, resizeState, settings, textObjects, imageObjects, updateDragPosition, updateResize]); */

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    // Low-latency: 이벤트를 버퍼에 저장하고 rAF에서 1프레임 1회 처리
    lastMoveRef.current = { x: e.clientX, y: e.clientY };
    if (!rafActiveRef.current) {
      rafActiveRef.current = true;
      rafIdRef.current = requestAnimationFrame(runRafTick);
    } else if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(runRafTick);
    }
  }, [runRafTick]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    handlePointerCapture(e, isIPhone(), 'release');
    if (dragState.isDragging && dragState.draggedObjectId) {
      let finalPosition = dragState.currentPosition;
      // v2 전용: v1 파라미터 제거
      const objForSize = textObjects.find(obj => obj.id === dragState.draggedObjectId) || imageObjects.find(obj => obj.id === dragState.draggedObjectId);
      const sizeForSnap = objForSize ? { width: objForSize.width, height: objForSize.height } : undefined;
      // v2: 업 시점 확정 스냅 — 반경 내 후보가 있으면 스냅, 아니면 그대로
      if (flags.useCellCenterSnapV2) {
        const resolveCanvasContainer = (): HTMLElement | null => {
          const ct = (e.currentTarget as any);
          if (ct && typeof ct.closest === 'function') {
            const el = ct.closest('[data-canvas-container]') as HTMLElement | null;
            if (el) return el;
          }
          const tg = (e.target as any);
          if (tg && typeof tg.closest === 'function') {
            const el = tg.closest('[data-canvas-container]') as HTMLElement | null;
            if (el) return el;
          }
          const qs = document.querySelector('[data-canvas-container]') as HTMLElement | null;
          return qs;
        };
        const container = resolveCanvasContainer();
        if (container) {
          const scale = getCanvasScale(container);
          const worldToScreen = (p: { x: number; y: number }) => ({ x: p.x * scale, y: p.y * scale });
          const anchor = sizeForSnap ? { x: finalPosition.x + sizeForSnap.width / 2, y: finalPosition.y + sizeForSnap.height / 2 } : finalPosition;
          const c = findSnapCandidate(anchor as any, worldToScreen, scale, prevCandidateRef.current, 0, 1.4);
          if (c) {
            finalPosition = sizeForSnap ? { x: c.x - sizeForSnap.width / 2, y: c.y - sizeForSnap.height / 2 } : c;
          }
        }
      }
      clearSnapPreview();
      const textObj = textObjects.find(obj => obj.id === dragState.draggedObjectId);
      const imageObj = imageObjects.find(obj => obj.id === dragState.draggedObjectId);
      if (textObj) {
        updateTextObject(dragState.draggedObjectId, finalPosition).then(() => {
          pushSnapshotImmediate();
        }).catch(error => { console.error('Failed to update text object position:', error); });
      } else if (imageObj) {
        updateImageObject(dragState.draggedObjectId, finalPosition).then(() => {
          pushSnapshotImmediate();
        }).catch((error: any) => { console.error('Failed to update image object position:', error); });
      }
      endDrag();
    }
    if (resizeState.isResizing && resizeState.resizedObjectId) {
      const finalSize = resizeState.currentSize;
      const finalPosition = resizeState.currentPosition;
      if (finalSize && finalPosition) {
        const textObj = textObjects.find(obj => obj.id === resizeState.resizedObjectId);
        const imageObj = imageObjects.find(obj => obj.id === resizeState.resizedObjectId);
        const updateData = { x: finalPosition.x, y: finalPosition.y, width: finalSize.width, height: finalSize.height };
        if (textObj) {
          updateTextObject(resizeState.resizedObjectId, updateData).then(() => { pushSnapshotImmediate(); }).catch(error => { console.error('Failed to update text object size/position:', error); });
        } else if (imageObj) {
          updateImageObject(resizeState.resizedObjectId, updateData).then(() => { pushSnapshotImmediate(); }).catch((error: any) => { console.error('Failed to update image object size/position:', error); });
        }
      }
      endResize();
    }
    // stop rAF loop and clear session state
    if (rafActiveRef.current) {
      rafActiveRef.current = false;
    }
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    lastMoveRef.current = null;
    prevCandidateRef.current = null;
    lastPreviewCenterRef.current = null;
  }, [dragState, resizeState, textObjects, imageObjects, updateTextObject, updateImageObject, endDrag, endResize, isIPhone]);

  const onObjectClick = useCallback((e: React.MouseEvent, id: string) => {
    if (isGhostClick(e.timeStamp)) return;
    const textObj = textObjects.find(obj => obj.id === id);
    const isCell = textObj?.cellType === 'cell';
    if (!isViewPage && currentTool === 'select') {
      if (!isCell) {
        const { clearSelection } = useCellSelectionStore.getState();
        clearSelection();
        if (selectedObjectId !== id) {
          setSelectedObjectId(id);
          queueSnapshotPush(120);
        }
        if (e) { e.stopPropagation(); }
      }
    }
  }, [isGhostClick, isViewPage, currentTool, textObjects, selectedObjectId, setSelectedObjectId]);

  const onCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isGhostClick(e.timeStamp)) return;
    const canvasContainer = e.currentTarget as HTMLElement;
    canvasContainer.focus();
    if (editingObjectId) {
      finishInlineEdit();
      return;
    }
    if (!isViewPage && currentTool === 'select') {
      if (e.target === e.currentTarget) {
        if (selectedObjectId !== null) setSelectedObjectId(null);
        const { clearSelection } = useCellSelectionStore.getState();
        const hadSelection = useCellSelectionStore.getState().getSelectedCount() > 0;
        if (hadSelection) clearSelection();
        // 선택 해제만 발생한 경우는 스냅샷을 남기지 않음
      }
    } else if (isViewPage) {
      if (e.target === e.currentTarget) {
        if (selectedObjectId !== null) setSelectedObjectId(null);
        const { clearSelection } = useCellSelectionStore.getState();
        const hadSelection = useCellSelectionStore.getState().getSelectedCount() > 0;
        if (hadSelection) clearSelection();
        // View에서도 선택 해제만으로는 스냅샷 없음
      }
    }
  }, [isGhostClick, editingObjectId, finishInlineEdit, isViewPage, currentTool, selectedObjectId, setSelectedObjectId]);

  const onTextBoxClick = useCallback((obj: TextObject, e: React.MouseEvent) => {
    if (currentTool !== 'select') return;
    if (editingObjectId && editingObjectId !== obj.id) { finishInlineEdit(); }
    const isCell = obj.cellType === 'cell';
    if (isCell) {
      const { selectCell, selectCellsInRange, getSelectedCells } = useCellSelectionStore.getState();
      const newClickCount = clickState.clickCount + 1;
      if (clickState.clickTimer) { clearTimeout(clickState.clickTimer); }
      if (newClickCount === 2) {
        startInlineEdit(obj);
        setClickState({ clickCount: 0, clickTimer: null });
      } else {
        const isCtrlPressed = (e as any).ctrlKey || (e as any).metaKey;
        const isShiftPressed = (e as any).shiftKey;
        if (isShiftPressed) {
          const selectedCells = getSelectedCells();
          if (selectedCells.length > 0) {
            const lastSelectedCell = textObjects.find(cell => cell.id === selectedCells[selectedCells.length - 1]);
            if (lastSelectedCell && lastSelectedCell.cellType === 'cell' && lastSelectedCell.cellPosition && obj.cellPosition) {
              const rangeCellIds = calculateCellRange(lastSelectedCell as TextObjectData, obj as TextObjectData, textObjects as TextObjectData[]);
              const before = new Set(getSelectedCells());
              selectCellsInRange(rangeCellIds);
              const afterArr = getSelectedCells();
              const changed = afterArr.length !== before.size || afterArr.some((id) => !before.has(id));
              if (changed) queueSnapshotPush(80);
            }
          } else {
            const before = new Set(getSelectedCells());
            selectCell(obj.id, false);
            const afterArr = getSelectedCells();
            const changed = afterArr.length !== before.size || afterArr.some((id) => !before.has(id));
            if (changed) queueSnapshotPush(80);
          }
        } else if (isCtrlPressed) {
          const before = new Set(getSelectedCells());
          selectCell(obj.id, true);
          const afterArr = getSelectedCells();
          const changed = afterArr.length !== before.size || afterArr.some((id) => !before.has(id));
          if (changed) queueSnapshotPush(80);
        } else {
          const before = new Set(getSelectedCells());
          selectCell(obj.id, false);
          const afterArr = getSelectedCells();
          const changed = afterArr.length !== before.size || afterArr.some((id) => !before.has(id));
          if (changed) queueSnapshotPush(80);
        }
        if (!isCtrlPressed && !isShiftPressed) { setSelectedObjectId(null); }
        const timer = setTimeout(() => { setClickState({ clickCount: 0, clickTimer: null }); }, 300);
        setClickState({ clickCount: newClickCount, clickTimer: timer });
      }
      return;
    }
    const newClickCount = clickState.clickCount + 1;
    if (clickState.clickTimer) { clearTimeout(clickState.clickTimer); }
    if (newClickCount === 3) {
      startInlineEdit(obj);
      setClickState({ clickCount: 0, clickTimer: null });
    } else {
      onObjectClick(e, obj.id);
      const timer = setTimeout(() => { setClickState({ clickCount: 0, clickTimer: null }); }, 500);
      setClickState({ clickCount: newClickCount, clickTimer: timer });
    }
  }, [currentTool, editingObjectId, finishInlineEdit, startInlineEdit, clickState, textObjects, setSelectedObjectId, onObjectClick]);

  return {
    // states
    dragState,
    resizeState,
    editingObjectId,
    editingText,
    // helpers
    isDraggingObject,
    isResizingObject,
    updateEditingText,
    finishInlineEdit,
    cancelInlineEdit,
    // handlers
    onCanvasKeyDown,
    onPointerDown,
    onResizePointerDown,
    onPointerMove,
    onPointerUp,
    onObjectClick,
    onCanvasClick,
    onTextBoxClick,
    // passthrough utils
    handleContextMenu,
    handleKeyDown,
    setHoveredObjectId,
  };
}



