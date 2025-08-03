import React, { useState, useCallback, useRef } from 'react';
import { useAdminConfigStore } from '../../store/adminConfigStore';
import { useEditorStore } from '../../store/editorStore';
import { useCheckboxStore } from '../../store/checkboxStore';
import { useCellSelectionStore } from '../../store/cellSelectionStore';
import { TextObject } from '../../types';
import { isValidPosition, isValidSize } from '../../utils/validation';
import { snapPositionToGrid, snapSizeToGrid } from '../../utils/gridUtils';

interface BaseLayerProps {
  isViewPage?: boolean;
}

const BaseLayer: React.FC<BaseLayerProps> = ({ isViewPage = false }) => {
  // Safari/iOS 감지를 위한 ref (iPad Safari 터치 이벤트 최적화)
  const isSafariRef = useRef<boolean>(false);
  const lastPointerEventTimeRef = useRef<number>(0);
  
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
    hoveredObjectId,
    currentTool,
    setSelectedObjectId,
    setHoveredObjectId,
  } = useEditorStore();
  const { 
    defaultCheckedColor,
    defaultUncheckedColor,
    checkedBackgroundColor,
    uncheckedBackgroundColor,
    checkedBackgroundOpacity,
    uncheckedBackgroundOpacity
  } = useCheckboxStore();
  
  // Safari/iOS 감지 (iPad Safari 호환성을 위한 최소한의 조건부 로직)
  React.useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    isSafariRef.current = isIOS || isSafari;
  }, []);
  
  // 셀 다중선택 관리
  // const {
  //   selectCell,
  //   selectCellsInRange,
  //   clearSelection,
  //   isSelected,
  //   startDragSelection,
  //   updateDragSelection,
  //   endDragSelection
  // } = useCellSelectionStore();

  // 드래그 상태 관리
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedObjectId: string | null;
    offset: { x: number; y: number };
    currentPosition: { x: number; y: number };
  }>({
    isDragging: false,
    draggedObjectId: null,
    offset: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 }
  });

  // 크기조절 상태 관리
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    resizedObjectId: string | null;
    resizeHandle: string | null;
    startPosition: { x: number; y: number };
    startSize: { width: number; height: number };
    startObjectPosition: { x: number; y: number };
    currentSize?: { width: number; height: number };
    currentPosition?: { x: number; y: number };
  }>({
    isResizing: false,
    resizedObjectId: null,
    resizeHandle: null,
    startPosition: { x: 0, y: 0 },
    startSize: { width: 0, height: 0 },
    startObjectPosition: { x: 0, y: 0 }
  });

  // 인라인 편집 상태
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  
  // 트리플 클릭 감지를 위한 상태
  const [clickCount, setClickCount] = useState<number>(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

  // 인라인 편집 관련 함수들 (먼저 정의)
  const startInlineEdit = useCallback((obj: TextObject) => {
    setEditingObjectId(obj.id);
    setEditingText(obj.text);
    
    // 객체를 편집 상태로 업데이트
    updateTextObject(obj.id, { isEditing: true });
    
    // ViewPage에서는 가상 키보드 활성화
    if (isViewPage) {
      setSelectedObjectId(obj.id);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('activateVirtualKeyboard', {
          detail: { objectId: obj.id }
        }));
      }, 100);
    } else {
      // AdminPage에서는 기존 방식 (textarea 포커스)
      setTimeout(() => {
        const textarea = document.querySelector('textarea[data-editing="true"]') as HTMLTextAreaElement;
        if (textarea) {
          const textLength = obj.text.length;
          textarea.setSelectionRange(textLength, textLength);
          textarea.focus();
        }
      }, 0);
    }
  }, [isViewPage, updateTextObject, setSelectedObjectId]);

  const finishInlineEdit = useCallback(async () => {
    if (editingObjectId && editingText !== undefined) {
      await updateTextObject(editingObjectId, { 
        text: editingText,
        isEditing: false 
      });
      setEditingObjectId(null);
      setEditingText('');
    }
  }, [editingObjectId, editingText, updateTextObject]);

  const cancelInlineEdit = useCallback(() => {
    setEditingObjectId(null);
    setEditingText('');
  }, []);

  // 선택된 객체 복제
  const handleDuplicateObject = useCallback(async () => {
    if (!selectedObjectId) return;
    
    // 텍스트 객체 복제
    const textObj = textObjects.find(obj => obj.id === selectedObjectId);
    if (textObj) {
      const duplicatedObj = {
        ...textObj,
        x: textObj.x + 20, // 약간 오프셋
        y: textObj.y + 20,
        isEditing: false
      };
      delete (duplicatedObj as any).id; // id 제거하여 새로 생성되도록
      await addTextObject(duplicatedObj);
      return;
    }
    
    // 이미지 객체 복제
    const imageObj = imageObjects.find(obj => obj.id === selectedObjectId);
    if (imageObj) {
      const duplicatedObj = {
        ...imageObj,
        x: imageObj.x + 20, // 약간 오프셋
        y: imageObj.y + 20
      };
      delete (duplicatedObj as any).id; // id 제거하여 새로 생성되도록
      await addImageObject(duplicatedObj);
      return;
    }
  }, [selectedObjectId, textObjects, imageObjects, addTextObject, addImageObject]);

  // 선택된 객체 삭제
  const handleDeleteObject = useCallback(async () => {
    if (!selectedObjectId) return;
    
    // 텍스트 객체 삭제
    const textObj = textObjects.find(obj => obj.id === selectedObjectId);
    if (textObj && textObj.permissions?.deletable) {
      await deleteTextObject(selectedObjectId);
      setSelectedObjectId(null);
      return;
    }
    
    // 이미지 객체 삭제
    const imageObj = imageObjects.find(obj => obj.id === selectedObjectId);
    if (imageObj && imageObj.permissions?.deletable) {
      await deleteImageObject(selectedObjectId);
      setSelectedObjectId(null);
      return;
    }
  }, [selectedObjectId, textObjects, imageObjects, deleteTextObject, deleteImageObject, setSelectedObjectId]);

  // 다중선택된 엑셀 셀들의 텍스트 내용 일괄 삭제
  const handleBulkClearCellText = useCallback(async () => {
    const { getSelectedCells } = useCellSelectionStore.getState();
    const selectedCellIds = getSelectedCells();
    
    if (selectedCellIds.length === 0) return;
    
    try {
      // 선택된 셀들의 텍스트를 빈 문자열로 변경
      for (const cellId of selectedCellIds) {
        const cellObj = textObjects.find(obj => obj.id === cellId);
        if (cellObj && cellObj.cellType === 'cell') {
          await updateTextObject(cellId, { text: '' });
        }
      }
      
      console.log(`${selectedCellIds.length}개 셀의 텍스트 내용이 삭제되었습니다.`);
    } catch (error) {
      console.error('셀 텍스트 일괄 삭제 실패:', error);
    }
  }, [textObjects, updateTextObject]);

  // 클립보드 이미지 붙여넣기 핸들러
  const handleClipboardPaste = useCallback(async () => {
    try {
      // 클립보드 API 지원 확인
      if (!navigator.clipboard || !navigator.clipboard.read) {
        console.warn('클립보드 API가 지원되지 않습니다.');
        return;
      }

      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        // 이미지 타입만 처리
        const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
        
        if (imageTypes.length > 0) {
          const imageType = imageTypes[0];
          const blob = await clipboardItem.getType(imageType);
          
          // Blob을 base64로 변환
          const reader = new FileReader();
          reader.onload = async (event) => {
            const src = event.target?.result as string;
            
            // 설정이 로드되지 않았을 때 기본값 제공
            const objectCreationPosition = settings?.admin?.objectCreationPosition ?? { x: 260, y: 950 };
            
            // 이미지 실제 크기 측정을 위한 임시 이미지 객체 생성
            const img = new Image();
            img.onload = async () => {
              try {
                // 가로 200px 고정, 세로는 비율에 맞춰 계산
                const targetWidth = 200;
                const aspectRatio = img.naturalHeight / img.naturalWidth;
                const targetHeight = targetWidth * aspectRatio;
                
                const newImageObject = {
                  x: objectCreationPosition.x,
                  y: objectCreationPosition.y,
                  width: targetWidth,
                  height: targetHeight,
                  src,
                  permissions: {
                    editable: true,
                    movable: true,
                    resizable: true,
                    deletable: true,
                  },
                  zIndex: Date.now(),
                  locked: false,
                  visible: true,
                  opacity: 1,
                  maintainAspectRatio: true, // 비율 유지 활성화
                  lastModified: Date.now()
                };

                await addImageObject(newImageObject);
                console.log('클립보드 이미지가 성공적으로 붙여넣어졌습니다.');
              } catch (error) {
                console.error('이미지 객체 생성 실패:', error);
              }
            };
            
            img.onerror = () => {
              console.error('클립보드 이미지 로드 실패');
            };
            
            img.src = src;
          };
          
          reader.onerror = () => {
            console.error('클립보드 이미지 읽기 실패');
          };
          
          reader.readAsDataURL(blob);
          break; // 첫 번째 이미지만 처리
        }
      }
    } catch (error) {
      // 사용자가 클립보드 접근을 거부했거나 다른 오류
      console.log('클립보드에서 이미지를 읽을 수 없습니다:', error);
    }
  }, [settings?.admin?.objectCreationPosition, addImageObject]);

  // 키보드 단축키 핸들러 (캔버스 포커스 시에만)
  const handleCanvasKeyDown = useCallback((e: React.KeyboardEvent) => {
    // 인라인 편집 중이면 키보드 단축키 비활성화
    if (editingObjectId) return;
    
    // Ctrl+V: 클립보드 이미지 붙여넣기 (캔버스 포커스 시에만)
    if (e.ctrlKey && e.key === 'v') {
      try {
        e.preventDefault();
      } catch (error) {
        console.debug('preventDefault failed in global keydown handler:', error);
      }
      handleClipboardPaste();
      return;
    }
    
    // ViewPage에서는 나머지 키보드 단축키 비활성화
    if (isViewPage) return;
    
    // Ctrl+D: 복제
    if (e.ctrlKey && e.key === 'd') {
      try {
        e.preventDefault();
      } catch (error) {
        console.debug('preventDefault failed in global keydown handler:', error);
      }
      if (selectedObjectId) {
        handleDuplicateObject();
      }
    }
    
    // Delete: 삭제 (엑셀 셀 다중선택 텍스트 내용 삭제 또는 일반 객체 삭제)
    if (e.key === 'Delete') {
      try {
        e.preventDefault();
      } catch (error) {
        console.debug('preventDefault failed in global keydown handler:', error);
      }
      
      // 다중선택된 엑셀 셀들이 있으면 텍스트 내용만 일괄 삭제
      const selectedCells = useCellSelectionStore.getState().getSelectedCells();
      if (selectedCells.length > 0) {
        handleBulkClearCellText();
        return;
      }
      
      // 일반 객체 삭제
      if (selectedObjectId) {
        handleDeleteObject();
      }
    }
  }, [editingObjectId, selectedObjectId, isViewPage, handleDuplicateObject, handleDeleteObject, handleClipboardPaste]);

  // 단일 포인터 다운 핸들러 - iPhone/iPad Safari 호환 (터치, 펜, 마우스 통합)
  const handlePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    // iPhone/iPad Safari에서 ghost click 방지를 위한 이벤트 타임스탬프 기록
    lastPointerEventTimeRef.current = e.timeStamp;
    
    // iPhone에서는 더 관대한 이벤트 처리 (끊김 방지)
    const userAgent = navigator.userAgent.toLowerCase();
    const isIPhone = /iphone/.test(userAgent);
    
    // 이벤트 버블링 방지 (상위 레이어로 전파 차단)
    e.stopPropagation();
    
    // iPhone에서는 preventDefault를 조건부로 적용 (호환성 개선)
    if (!isIPhone || e.pointerType !== 'touch') {
      e.preventDefault();
    }

    if (editingObjectId) {
      finishInlineEdit();
      return;
    }

    const obj = textObjects.find(o => o.id === id) || imageObjects.find(o => o.id === id);
    if (!obj) return;

    setSelectedObjectId(id);
    setHoveredObjectId(null);

    // 이동 권한이 없는 경우 드래그 시작하지 않음
    if (!obj.permissions?.movable) {
      console.log('Object not movable, skipping drag:', id);
      return;
    }

    // iPhone Safari에서 포인터 캡처 최적화
    if (isIPhone) {
      // iPhone에서는 포인터 캡처를 더 조심스럽게 적용
      setTimeout(() => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch (error) {
          // iPhone에서 포인터 캡처 실패는 무시하고 계속 진행
          console.debug('iPhone pointer capture failed, continuing without capture');
        }
      }, 0);
    } else {
      // iPad/데스크톱에서는 즉시 포인터 캡처
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (error) {
        // 포인터 캡처 실패는 무시 (일부 브라우저에서 지원하지 않음)
      }
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragState({
      isDragging: true,
      draggedObjectId: id,
      offset: { x, y },
      currentPosition: { x: obj.x, y: obj.y }
    });
    
    if (import.meta.env.DEV && isIPhone) {
      console.log(`📱 iPhone: Object drag started for ${id} with ${e.pointerType}`);
    }
  }, [editingObjectId, finishInlineEdit, textObjects, imageObjects, setSelectedObjectId, setHoveredObjectId]);

  // 크기조절 핸들 포인터 다운 - iPad Safari 호환 (터치, 펜, 마우스 통합)
  const handleResizePointerDown = useCallback((e: React.PointerEvent, handle: string, objectId: string) => {
    // 이벤트 버블링 방지 및 기본 동작 방지 (iPad Safari 호환)
    e.stopPropagation();
    e.preventDefault();

    const obj = textObjects.find(o => o.id === objectId) || imageObjects.find(o => o.id === objectId);
    if (!obj) return;

    // 크기 조절 권한이 없는 경우 리사이즈 시작하지 않음
    if (!obj.permissions?.resizable) {
      return;
    }

    setResizeState({
      isResizing: true,
      resizedObjectId: objectId,
      resizeHandle: handle,
      startPosition: { x: e.clientX, y: e.clientY },
      startSize: { width: obj.width, height: obj.height },
      startObjectPosition: { x: obj.x, y: obj.y }
    });
  }, [textObjects, imageObjects]);

  // 통합 포인터 이동 핸들러 (드래그 및 리사이즈) - iPad Safari 최적화
  const handlePointerMove = (e: React.PointerEvent) => {
    // 드래그 처리
    if (dragState.isDragging && dragState.draggedObjectId) {
      // 캔버스 컨테이너의 실제 위치 계산 (스케일 고려)
      const canvasContainer = e.currentTarget.closest('[data-canvas-container]') as HTMLElement;
      if (!canvasContainer) return;

      const rect = canvasContainer.getBoundingClientRect();
      const transform = window.getComputedStyle(canvasContainer).transform;

      let scale = 1;
      if (transform && transform !== 'none') {
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (matrix) {
          const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
          scale = values[0];
        }
      }

      const mouseX = (e.clientX - rect.left) / scale;
      const mouseY = (e.clientY - rect.top) / scale;
      
      const newPosition = {
        x: mouseX - dragState.offset.x / scale,
        y: mouseY - dragState.offset.y / scale
      };

      // 그리드 스냅 적용 (Admin 설정 확인)
      let finalPosition = newPosition;
      
      // 설정이 로드되지 않았을 때 기본값 제공
      const gridSnapEnabled = settings?.admin?.gridSnapEnabled ?? false;
      const gridSize = settings?.admin?.gridSize ?? 32;
      
      if (gridSnapEnabled) {
        finalPosition = snapPositionToGrid(newPosition.x, newPosition.y, gridSize);
      }

      // 원본 객체 찾기
      const obj = textObjects.find(o => o.id === dragState.draggedObjectId) || imageObjects.find(o => o.id === dragState.draggedObjectId);

      // 좌표 유효성 검사 (원본 객체의 좌표를 기본값으로 사용)
      let safeNewPosition = finalPosition;
      if (!isValidPosition(finalPosition) && obj) {
        safeNewPosition = { x: obj.x, y: obj.y };
      }

      setDragState(prev => ({
        ...prev,
        currentPosition: safeNewPosition
      }));
    }

    // 크기조절 처리
    if (resizeState.isResizing && resizeState.resizedObjectId) {
      const canvasContainer = e.currentTarget.closest('[data-canvas-container]') as HTMLElement;
      if (!canvasContainer) return;

      const rect = canvasContainer.getBoundingClientRect();
      const transform = window.getComputedStyle(canvasContainer).transform;

      let scale = 1;
      if (transform && transform !== 'none') {
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (matrix) {
          const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
          scale = values[0];
        }
      }

      const mouseX = (e.clientX - rect.left) / scale;
      const mouseY = (e.clientY - rect.top) / scale;

      // startPosition을 캔버스 좌표계로 변환
      const startX = (resizeState.startPosition.x - rect.left) / scale;
      const startY = (resizeState.startPosition.y - rect.top) / scale;

      const deltaX = mouseX - startX;
      const deltaY = mouseY - startY;

      let newWidth = resizeState.startSize.width;
      let newHeight = resizeState.startSize.height;
      let newX = resizeState.startObjectPosition.x;
      let newY = resizeState.startObjectPosition.y;

      // 현재 크기 조절 중인 객체가 이미지인지 확인하고 비율 유지 설정 확인
      const resizingImageObj = imageObjects.find(obj => obj.id === resizeState.resizedObjectId);
      const shouldMaintainAspectRatio = resizingImageObj?.maintainAspectRatio || false;
      const originalAspectRatio = resizingImageObj ? resizeState.startSize.width / resizeState.startSize.height : 1;

      // 핸들에 따른 크기 및 위치 계산
      switch (resizeState.resizeHandle) {
        case 'nw': // 좌상단
          newWidth = Math.max(50, resizeState.startSize.width - deltaX);
          newHeight = shouldMaintainAspectRatio 
            ? newWidth / originalAspectRatio 
            : Math.max(30, resizeState.startSize.height - deltaY);
          newX = resizeState.startObjectPosition.x + (resizeState.startSize.width - newWidth);
          newY = resizeState.startObjectPosition.y + (resizeState.startSize.height - newHeight);
          break;
        case 'ne': // 우상단
          newWidth = Math.max(50, resizeState.startSize.width + deltaX);
          newHeight = shouldMaintainAspectRatio 
            ? newWidth / originalAspectRatio 
            : Math.max(30, resizeState.startSize.height - deltaY);
          newY = resizeState.startObjectPosition.y + (resizeState.startSize.height - newHeight);
          break;
        case 'sw': // 좌하단
          newWidth = Math.max(50, resizeState.startSize.width - deltaX);
          newHeight = shouldMaintainAspectRatio 
            ? newWidth / originalAspectRatio 
            : Math.max(30, resizeState.startSize.height + deltaY);
          newX = resizeState.startObjectPosition.x + (resizeState.startSize.width - newWidth);
          break;
        case 'se': // 우하단
          newWidth = Math.max(50, resizeState.startSize.width + deltaX);
          newHeight = shouldMaintainAspectRatio 
            ? newWidth / originalAspectRatio 
            : Math.max(30, resizeState.startSize.height + deltaY);
          break;
        case 'n': // 상단
          if (shouldMaintainAspectRatio) {
            newHeight = Math.max(30, resizeState.startSize.height - deltaY);
            newWidth = newHeight * originalAspectRatio;
            newX = resizeState.startObjectPosition.x + (resizeState.startSize.width - newWidth) / 2;
          } else {
            newHeight = Math.max(30, resizeState.startSize.height - deltaY);
          }
          newY = resizeState.startObjectPosition.y + (resizeState.startSize.height - newHeight);
          break;
        case 's': // 하단
          if (shouldMaintainAspectRatio) {
            newHeight = Math.max(30, resizeState.startSize.height + deltaY);
            newWidth = newHeight * originalAspectRatio;
            newX = resizeState.startObjectPosition.x + (resizeState.startSize.width - newWidth) / 2;
          } else {
            newHeight = Math.max(30, resizeState.startSize.height + deltaY);
          }
          break;
        case 'w': // 좌측
          if (shouldMaintainAspectRatio) {
            newWidth = Math.max(50, resizeState.startSize.width - deltaX);
            newHeight = newWidth / originalAspectRatio;
            newY = resizeState.startObjectPosition.y + (resizeState.startSize.height - newHeight) / 2;
          } else {
            newWidth = Math.max(50, resizeState.startSize.width - deltaX);
          }
          newX = resizeState.startObjectPosition.x + (resizeState.startSize.width - newWidth);
          break;
        case 'e': // 우측
          if (shouldMaintainAspectRatio) {
            newWidth = Math.max(50, resizeState.startSize.width + deltaX);
            newHeight = newWidth / originalAspectRatio;
            newY = resizeState.startObjectPosition.y + (resizeState.startSize.height - newHeight) / 2;
          } else {
            newWidth = Math.max(50, resizeState.startSize.width + deltaX);
          }
          break;
      }

      // 그리드 스냅 적용 (Admin 설정 확인)
      let finalPosition = { x: newX, y: newY };
      let finalSize = { width: newWidth, height: newHeight };
      
      // 설정이 로드되지 않았을 때 기본값 제공
      const gridSnapEnabled = settings?.admin?.gridSnapEnabled ?? false;
      const gridSize = settings?.admin?.gridSize ?? 32;
      
      if (gridSnapEnabled) {
        finalPosition = snapPositionToGrid(newX, newY, gridSize);
        finalSize = snapSizeToGrid(newWidth, newHeight, gridSize);
      }

      // 좌표와 크기 유효성 검사
      if (isValidPosition(finalPosition) && isValidSize(finalSize)) {
        // 임시로 로컬 상태에 저장 (실시간 반영)
        setResizeState(prev => ({
          ...prev,
          currentSize: finalSize,
          currentPosition: finalPosition
        }));
      }
    }
  };

  // 통합 포인터 업 핸들러 - iPad Safari 최적화
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // 포인터 캡처 해제
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (error) {
      // 포인터 캡처 해제 실패는 무시
    }

    // 드래그 종료 처리
    if (dragState.isDragging && dragState.draggedObjectId) {
      const finalPosition = dragState.currentPosition;
      
      // 텍스트 객체인지 이미지 객체인지 확인
      const textObj = textObjects.find(obj => obj.id === dragState.draggedObjectId);
      const imageObj = imageObjects.find(obj => obj.id === dragState.draggedObjectId);
      
      if (textObj) {
        updateTextObject(dragState.draggedObjectId, {
          x: finalPosition.x,
          y: finalPosition.y
        }).catch(error => {
          console.error('Failed to update text object position:', error);
        });
      } else if (imageObj) {
        updateImageObject(dragState.draggedObjectId, {
          x: finalPosition.x,
          y: finalPosition.y
        }).catch((error: any) => {
          console.error('Failed to update image object position:', error);
        });
      }

      setDragState({
        isDragging: false,
        draggedObjectId: null,
        offset: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 }
      });
    }

    // 리사이즈 종료 처리
    if (resizeState.isResizing && resizeState.resizedObjectId) {
      const finalSize = resizeState.currentSize;
      const finalPosition = resizeState.currentPosition;
      
      if (finalSize && finalPosition) {
        // 텍스트 객체인지 이미지 객체인지 확인
        const textObj = textObjects.find(obj => obj.id === resizeState.resizedObjectId);
        const imageObj = imageObjects.find(obj => obj.id === resizeState.resizedObjectId);
        
        if (textObj) {
          updateTextObject(resizeState.resizedObjectId, {
            x: finalPosition.x,
            y: finalPosition.y,
            width: finalSize.width,
            height: finalSize.height
          }).catch(error => {
            console.error('Failed to update text object size/position:', error);
          });
        } else if (imageObj) {
          updateImageObject(resizeState.resizedObjectId, {
            x: finalPosition.x,
            y: finalPosition.y,
            width: finalSize.width,
            height: finalSize.height
          }).catch((error: any) => {
            console.error('Failed to update image object size/position:', error);
          });
        }
      }

      setResizeState({
        isResizing: false,
        resizedObjectId: null,
        resizeHandle: '',
        startPosition: { x: 0, y: 0 },
        startSize: { width: 0, height: 0 },
        startObjectPosition: { x: 0, y: 0 }
      });
    }
  }, [dragState, resizeState, textObjects, imageObjects, updateTextObject, updateImageObject]);

  // 텍스트 객체 클릭 핸들러 (iPad Safari 호환용 - ghost click 방지)
  const handleObjectClick = useCallback((e: React.MouseEvent, id: string) => {
    // iPad Safari에서 ghost click 방지 (포인터 이벤트 이후 300ms 내의 클릭은 무시)
    if (isSafariRef.current && e.timeStamp - lastPointerEventTimeRef.current < 300) {
      return;
    }
    
    // 셀 객체인지 확인
    const textObj = textObjects.find(obj => obj.id === id);
    const isCell = textObj?.cellType === 'cell';

    if (!isViewPage && currentTool === 'select') {
      // 셀 객체가 아닌 경우에만 일반 객체 선택
      if (!isCell) {
        // 셀 다중선택 해제
        const { clearSelection } = useCellSelectionStore.getState();
        clearSelection();
        
        setSelectedObjectId(id);
        if (e) {
          e.stopPropagation();
        }
      }
    }
  }, [currentTool, isViewPage, setSelectedObjectId, textObjects]);

  // 캔버스 빈 공간 클릭 핸들러 (선택 해제 및 드래그 선택)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // iPad Safari ghost click 방지
    if (isSafariRef.current && e.timeStamp - lastPointerEventTimeRef.current < 300) {
      return;
    }
    
    // 캔버스에 포커스 설정 (키보드 단축키 활성화용)
    const canvasContainer = e.currentTarget as HTMLElement;
    canvasContainer.focus();
    
    // 인라인 편집 중이면 편집 종료
    if (editingObjectId) {
      finishInlineEdit();
      return;
    }
    
    if (!isViewPage && currentTool === 'select') {
      // 객체가 아닌 빈 공간을 클릭했을 때만 선택 해제
      if (e.target === e.currentTarget) {
        setSelectedObjectId(null);
        // 엑셀 셀 다중선택도 해제
        const { clearSelection } = useCellSelectionStore.getState();
        clearSelection();
      }
    } else if (isViewPage) {
      // ViewPage에서는 빈 공간 클릭 시 선택 해제만 (키보드는 선택 해제 시 자동으로 숨겨짐)
      if (e.target === e.currentTarget) {
        setSelectedObjectId(null);
        // 엑셀 셀 다중선택도 해제
        const { clearSelection } = useCellSelectionStore.getState();
        clearSelection();
      }
    }
  }, [editingObjectId, finishInlineEdit, setSelectedObjectId, isViewPage, currentTool]);

  // 개선된 텍스트 박스 클릭 핸들러
  const handleTextBoxClick = (obj: TextObject, e: React.MouseEvent) => {
    if (currentTool !== 'select') return;
    
    // 다른 객체를 편집 중이라면 먼저 편집 종료
    if (editingObjectId && editingObjectId !== obj.id) {
      finishInlineEdit();
    }
    
    const isCell = obj.cellType === 'cell';
    
    // 엑셀 셀: 다중선택 지원 (Ctrl, Shift)
    if (isCell) {
      const { selectCell, selectCellsInRange, getSelectedCells } = useCellSelectionStore.getState();
      const newClickCount = clickCount + 1;
      setClickCount(newClickCount);
      
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      
      if (newClickCount === 2) {
        // 더블 클릭: 편집 시작
        startInlineEdit(obj);
        setClickCount(0);
        setClickTimer(null);
      } else {
        // 단일 클릭: 다중선택 (Ctrl, Shift 키 상태에 따라)
        const isCtrlPressed = e.ctrlKey || e.metaKey;
        const isShiftPressed = e.shiftKey;
        
        if (isShiftPressed) {
          // Shift + 클릭: 범위 선택
          const selectedCells = getSelectedCells();
          if (selectedCells.length > 0) {
            // 마지막 선택된 셀과 현재 셀 사이의 모든 셀 선택
            const lastSelectedCell = textObjects.find(cell => cell.id === selectedCells[selectedCells.length - 1]);
            if (lastSelectedCell && lastSelectedCell.cellType === 'cell' && lastSelectedCell.cellPosition && obj.cellPosition) {
              const startRow = Math.min(lastSelectedCell.cellPosition.row, obj.cellPosition.row);
              const endRow = Math.max(lastSelectedCell.cellPosition.row, obj.cellPosition.row);
              const startCol = Math.min(lastSelectedCell.cellPosition.col, obj.cellPosition.col);
              const endCol = Math.max(lastSelectedCell.cellPosition.col, obj.cellPosition.col);
              
              const rangeCellIds: string[] = [];
              textObjects.forEach(cell => {
                if (cell.cellType === 'cell' && cell.cellPosition && cell.groupId === obj.groupId) {
                  const { row, col } = cell.cellPosition;
                  if (row >= startRow && row <= endRow && col >= startCol && col <= endCol) {
                    rangeCellIds.push(cell.id);
                  }
                }
              });
              
              selectCellsInRange(rangeCellIds);
            }
          } else {
            // 첫 번째 선택이면 단일 선택
            selectCell(obj.id, false);
          }
        } else if (isCtrlPressed) {
          // Ctrl + 클릭: 토글 선택
          selectCell(obj.id, true);
        } else {
          // 일반 클릭: 새로 선택
          selectCell(obj.id, false);
        }
        
        // 일반 객체 선택도 해제 (엑셀 셀 다중선택과 구분)
        if (!isCtrlPressed && !isShiftPressed) {
          setSelectedObjectId(null);
        }
        
        const timer = setTimeout(() => {
          setClickCount(0);
          setClickTimer(null);
        }, 300);
        setClickTimer(timer);
      }
      return;
    }
    
    // 일반 텍스트 객체: 트리플 클릭으로 편집
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    
    if (clickTimer) {
      clearTimeout(clickTimer);
    }
    
    if (newClickCount === 3) {
      startInlineEdit(obj);
      setClickCount(0);
      setClickTimer(null);
    } else {
      // 1,2 클릭: 객체 선택
      handleObjectClick(e, obj.id);
      
      const timer = setTimeout(() => {
        setClickCount(0);
        setClickTimer(null);
      }, 500);
      setClickTimer(timer);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      try {
        e.preventDefault();
      } catch (error) {
        console.debug('preventDefault failed in keydown handler:', error);
      }
      finishInlineEdit();
    } else if (e.key === 'Escape') {
      try {
        e.preventDefault();
      } catch (error) {
        console.debug('preventDefault failed in keydown handler:', error);
      }
      cancelInlineEdit();
    }
  };

  // 컨텍스트 메뉴 방지 (우클릭, 터치 길게 누르기)
  const handleContextMenu = (e: React.MouseEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch (error) {
      // passive event listener에서 preventDefault() 실패 시 무시
      console.debug('preventDefault failed in context menu handler:', error);
    }
    return false;
  };

  return (
    <div 
      className="absolute inset-0"
      tabIndex={0}  // 포커스 가능하게 설정
      onClick={handleCanvasClick}
      onKeyDown={handleCanvasKeyDown}  // 캔버스 포커스 시에만 키보드 이벤트 처리
      // 통합 포인터 이벤트 (iPad Safari 최적화)
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      // 컨텍스트 메뉴 방지
      onContextMenu={handleContextMenu}
      style={{
        touchAction: 'none', // iOS Safari에서 터치 스크롤 및 줌 방지
        // iPhone/iPad에서 포인터 이벤트 처리 개선: 펜/지우개 도구 사용 시에도 객체 조작 가능
        pointerEvents: 'auto', // 모든 도구에서 포인터 이벤트 허용
        outline: 'none' // 포커스 아웃라인 제거 (시각적으로 깔끔하게)
      }}
    >
      {/* 모든 객체를 zIndex 순서대로 정렬하여 렌더링 */}
      {[...textObjects, ...imageObjects]
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
        .map((obj) => {
          // 객체 타입 확인
          const isTextObject = 'text' in obj;
          const isImageObject = 'src' in obj;
          
          // 드래그 중인 객체의 현재 위치 계산
          const isDragging = dragState.isDragging && dragState.draggedObjectId === obj.id;
          const isResizing = resizeState.isResizing && resizeState.resizedObjectId === obj.id;
          
          const currentX = isDragging ? dragState.currentPosition.x : 
                          isResizing && resizeState.currentPosition ? resizeState.currentPosition.x : obj.x;
          const currentY = isDragging ? dragState.currentPosition.y : 
                          isResizing && resizeState.currentPosition ? resizeState.currentPosition.y : obj.y;
          const currentWidth = isResizing && resizeState.currentSize ? resizeState.currentSize.width : obj.width;
          const currentHeight = isResizing && resizeState.currentSize ? resizeState.currentSize.height : obj.height;
          
          const isSelected = selectedObjectId === obj.id;
          const isHovered = hoveredObjectId === obj.id && !isViewPage;
          
          if (isTextObject) {
            // 텍스트 객체 렌더링
            const textObj = obj as typeof textObjects[0];
            
            // 엑셀 셀 다중선택 상태 확인
            const isCellSelected = textObj.cellType === 'cell' && useCellSelectionStore.getState().isSelected(obj.id);
            
            // boxStyle 기본값 설정
            const boxStyle = textObj.boxStyle || {
              backgroundColor: 'transparent',
              backgroundOpacity: 1,
              borderColor: '#000000',
              borderWidth: 0,
              borderRadius: 0
            };
            
            // textStyle 기본값 설정
            const textStyle = textObj.textStyle || {
              color: '#000000',
              bold: false,
              italic: false,
              horizontalAlign: 'left',
              verticalAlign: 'middle',
              fontFamily: 'Arial'
            };
            
            return (
              <div
                key={obj.id}
                className={`absolute select-none ${
                  isSelected ? 'ring-4 ring-blue-600' : 
                  isHovered ? 'ring-2 ring-gray-400' : ''
                }`}
                style={{
                  left: currentX,
                  top: currentY,
                  width: currentWidth,
                  height: currentHeight,
                  opacity: obj.opacity,
                  zIndex: obj.zIndex || 0,
                  cursor: editingObjectId === obj.id ? 'text' : (
                    isViewPage 
                      ? 'default' 
                      : (isDragging ? 'grabbing' : (obj.permissions?.movable ? 'grab' : 'default'))
                  ),
                  border: `${boxStyle.borderWidth}px solid ${boxStyle.borderColor}`,
                  borderRadius: `${boxStyle.borderRadius}px`,
                  transition: isDragging ? 'none' : 'all 0.1s ease',
                  // iPad Safari 최적화: 펜/지우개 도구 사용 시 포인터 이벤트 비활성화
                  pointerEvents: (currentTool === 'pen' || currentTool === 'eraser') ? 'none' : 'auto'
                }}
                onClick={(e) => {
                  // 드래그 중이 아닐 때만 텍스트 박스 클릭 처리
                  if (!isDragging) {
                    handleTextBoxClick(textObj, e);
                  } else {
                    handleObjectClick(e, obj.id);
                  }
                }}
                onPointerDown={(e) => handlePointerDown(e, obj.id)}
                onMouseEnter={() => setHoveredObjectId(obj.id)}
                onMouseLeave={() => setHoveredObjectId(null)}
              >
                {/* 배경 레이어 (투명도 별도 적용) */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: isCellSelected 
                      ? '#9ca3af'  // 다중선택된 엑셀 셀: 회색 반투명
                      : textObj.hasCheckbox && textObj.checkboxChecked 
                        ? (textObj.checkedBackgroundColor || checkedBackgroundColor)
                        : textObj.hasCheckbox && !textObj.checkboxChecked 
                          ? (textObj.uncheckedBackgroundColor || uncheckedBackgroundColor)
                          : boxStyle.backgroundColor,
                    opacity: isCellSelected 
                      ? 0.15  // 다중선택된 셀: 15% 투명도 (더 투명하게)
                      : textObj.hasCheckbox && textObj.checkboxChecked 
                        ? (textObj.checkedBackgroundOpacity ?? checkedBackgroundOpacity)
                        : textObj.hasCheckbox && !textObj.checkboxChecked 
                          ? (textObj.uncheckedBackgroundOpacity ?? uncheckedBackgroundOpacity)
                          : boxStyle.backgroundOpacity,
                    borderRadius: `${boxStyle.borderRadius}px`,
                  }}
                />
                
                {/* 텍스트 레이어 */}
                <div
                  className="relative z-10 h-full flex items-center"
                  style={{
                    justifyContent: textStyle.horizontalAlign === 'left' ? 'flex-start' : 
                                   textStyle.horizontalAlign === 'center' ? 'center' : 'flex-end',
                    alignItems: textStyle.verticalAlign === 'top' ? 'flex-start' : 
                               textStyle.verticalAlign === 'middle' ? 'center' : 'flex-end',
                    padding: '8px',
                  }}
                >
                  {editingObjectId === obj.id ? (
                    // 인라인 편집 모드
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={finishInlineEdit}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      data-editing="true"
                      className="w-full h-full bg-transparent border-none outline-none resize-none"
                      style={{
                        color: textStyle.color,
                        fontFamily: textStyle.fontFamily,
                        fontSize: `${textObj.fontSize || 16}px`,
                        fontWeight: textStyle.bold ? 'bold' : 'normal',
                        fontStyle: textStyle.italic ? 'italic' : 'normal',
                        textAlign: textStyle.horizontalAlign,
                        lineHeight: '1.2',
                        wordBreak: 'break-word',
                        cursor: 'text',
                      }}
                    />
                  ) : (
                    // 일반 표시 모드
                    <div
                      style={{
                        color: textStyle.color,
                        fontFamily: textStyle.fontFamily,
                        fontSize: `${textObj.fontSize || 16}px`,
                        fontWeight: textStyle.bold ? 'bold' : 'normal',
                        fontStyle: textStyle.italic ? 'italic' : 'normal',
                        textAlign: textStyle.horizontalAlign,
                        lineHeight: '1.2',
                        wordBreak: 'break-word',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: textStyle.verticalAlign === 'top' ? 'flex-start' : 
                                   textStyle.verticalAlign === 'middle' ? 'center' : 'flex-end',
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      {textObj.hasCheckbox && (
                        <div
                          className="checkbox-area"
                          onClick={(e) => {
                            e.stopPropagation();
                            const isChecked = !textObj.checkboxChecked;
                            updateTextObject(textObj.id, { 
                              checkboxChecked: isChecked,
                              // 체크박스 색상이 없으면 기본값 적용
                              checkboxCheckedColor: textObj.checkboxCheckedColor || defaultCheckedColor,
                              checkboxUncheckedColor: textObj.checkboxUncheckedColor || defaultUncheckedColor
                            });
                          }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '35px',
                            height: '35px',
                            backgroundColor: textObj.checkboxChecked 
                              ? (textObj.checkboxCheckedColor || defaultCheckedColor)
                              : (textObj.checkboxUncheckedColor || defaultUncheckedColor),
                            border: `2px solid ${textObj.checkboxChecked 
                              ? (textObj.checkboxCheckedColor || defaultCheckedColor)
                              : '#d1d5db'}`,
                            borderRadius: '4px',
                            marginRight: '8px',
                            transition: 'all 0.2s ease',
                            userSelect: 'none',
                            flexShrink: 0, // 체크박스 크기 고정
                            pointerEvents: 'auto', // 체크박스 클릭 가능
                            cursor: 'pointer',
                          }}
                        >
                          {textObj.checkboxChecked && (
                            <svg
                              className="checkbox-area"
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                className="checkbox-area"
                                d="M13.5 4.5L6 12L2.5 8.5"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      )}
                      <span
                        style={{
                          flex: 1, // 남은 공간 차지
                        }}
                      >
                        {textObj.text}
                      </span>
                    </div>
                  )}
                </div>

                {/* 크기조절 핸들 (선택된 객체이고 관리자 페이지이고 크기조절 권한이 있을 때) */}
                {isSelected && !isViewPage && obj.permissions?.resizable && (
                  <>
                    {/* 모서리 핸들 - iPad Safari 호환 포인터 이벤트만 사용 */}
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-nw-resize shadow-md"
                      style={{ left: -6, top: -6 }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'nw', obj.id)}
                    />
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-ne-resize shadow-md"
                      style={{ right: -6, top: -6 }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'ne', obj.id)}
                    />
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-sw-resize shadow-md"
                      style={{ left: -6, bottom: -6 }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'sw', obj.id)}
                    />
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-se-resize shadow-md"
                      style={{ right: -6, bottom: -6 }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'se', obj.id)}
                    />
                    
                    {/* 변 중앙 핸들 */}
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-n-resize shadow-md"
                      style={{ left: '50%', top: -6, transform: 'translateX(-50%)' }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'n', obj.id)}
                    />
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-s-resize shadow-md"
                      style={{ left: '50%', bottom: -6, transform: 'translateX(-50%)' }}
                      onPointerDown={(e) => handleResizePointerDown(e, 's', obj.id)}
                    />
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-w-resize shadow-md"
                      style={{ left: -6, top: '50%', transform: 'translateY(-50%)' }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'w', obj.id)}
                    />
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-e-resize shadow-md"
                      style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'e', obj.id)}
                    />
                  </>
                )}
              </div>
            );
          } else if (isImageObject) {
            // 이미지 객체 렌더링
            const imageObj = obj as typeof imageObjects[0];
            
            return (
              <div
                key={obj.id}
                className={`absolute select-none ${
                  isSelected ? 'ring-4 ring-blue-600' : 
                  isHovered ? 'ring-2 ring-gray-400' : ''
                }`}
                style={{
                  left: currentX,
                  top: currentY,
                  width: currentWidth,
                  height: currentHeight,
                  opacity: obj.opacity,
                  zIndex: obj.zIndex || 0,
                  cursor: editingObjectId === obj.id ? 'text' : (
                    isViewPage 
                      ? 'default' 
                      : (isDragging ? 'grabbing' : (obj.permissions?.movable ? 'grab' : 'default'))
                  ),
                  transition: isDragging ? 'none' : 'all 0.1s ease',
                  // iPad Safari 최적화: 펜/지우개 도구 사용 시 포인터 이벤트 비활성화
                  pointerEvents: (currentTool === 'pen' || currentTool === 'eraser') ? 'none' : 'auto'
                }}
                onClick={(e) => handleObjectClick(e, obj.id)}
                onPointerDown={(e) => handlePointerDown(e, obj.id)}
                onMouseEnter={() => setHoveredObjectId(obj.id)}
                onMouseLeave={() => setHoveredObjectId(null)}
              >
                {/* 이미지 */}
                <img
                  src={imageObj.src}
                  alt=""
                  className={`w-full h-full ${
                    imageObj.maintainAspectRatio ? 'object-contain' : 'object-fill'
                  }`}
                  draggable={false}
                  style={{
                    pointerEvents: 'none',
                  }}
                />

                {/* 크기조절 핸들 (선택된 객체이고 관리자 페이지이고 크기조절 권한이 있을 때) */}
                {isSelected && !isViewPage && obj.permissions?.resizable && (
                  <>
                    {/* 모서리 핸들 - iPad Safari 호환 포인터 이벤트만 사용 */}
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-nw-resize shadow-md"
                      style={{ left: -6, top: -6 }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'nw', obj.id)}
                    />
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-ne-resize shadow-md"
                      style={{ right: -6, top: -6 }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'ne', obj.id)}
                    />
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-sw-resize shadow-md"
                      style={{ left: -6, bottom: -6 }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'sw', obj.id)}
                    />
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-se-resize shadow-md"
                      style={{ right: -6, bottom: -6 }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'se', obj.id)}
                    />
                    
                    {/* 변 중앙 핸들 */}
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-n-resize shadow-md"
                      style={{ left: '50%', top: -6, transform: 'translateX(-50%)' }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'n', obj.id)}
                    />
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-s-resize shadow-md"
                      style={{ left: '50%', bottom: -6, transform: 'translateX(-50%)' }}
                      onPointerDown={(e) => handleResizePointerDown(e, 's', obj.id)}
                    />
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-w-resize shadow-md"
                      style={{ left: -6, top: '50%', transform: 'translateY(-50%)' }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'w', obj.id)}
                    />
                    <div 
                      className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-e-resize shadow-md"
                      style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
                      onPointerDown={(e) => handleResizePointerDown(e, 'e', obj.id)}
                    />
                  </>
                )}
              </div>
            );
          }
          
          return null;
        })}
    </div>
  );
};

export default BaseLayer;